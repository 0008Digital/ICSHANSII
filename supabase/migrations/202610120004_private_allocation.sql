-- Private transactional primitives, NOT exposed application RPCs.
-- SECURITY INVOKER + no grants + default-deny RLS: Auth/server integration is deferred.
begin;
alter table ics_private.batches alter column counter_group set not null;
alter table ics_private.audit_events drop constraint audit_events_action_check;
alter table ics_private.audit_events add check(action in ('registration.allocated','registration.imported',
  'student.activated','student.reactivated','membership.transferred','membership.closed','roll.assigned',
  'role.granted','role.revoked','batch.created','batch.updated','batch.archived','batch.schedule_updated','teacher.assigned','teacher.assignment_closed'));

create function ics_private.require_operator(p_branch uuid,p_owner_only boolean default false)
returns uuid language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; begin
  select id into actor from ics_private.user_accounts
  where branch_id=p_branch and auth_subject=auth.uid() and enabled for share;
  if actor is null then raise exception 'Unauthorized' using errcode='42501'; end if;
  perform 1 from ics_private.role_assignments where branch_id=p_branch and account_id=actor
    and revoked_at is null and granted_at <= clock_timestamp()
    and (role='owner_admin' or (not p_owner_only and role='manager')) for share;
  if not found then raise exception 'Unauthorized' using errcode='42501'; end if;
  return actor;
end $$;

create function ics_private.claim_operation(p_branch uuid,p_actor uuid,p_operation text,p_key uuid,p_payload jsonb)
returns ics_private.operation_requests language plpgsql security invoker set search_path=pg_catalog as $$
declare op ics_private.operation_requests; begin
  insert into ics_private.operation_requests(branch_id,actor_id,operation,idempotency_key,request_fingerprint)
    values(p_branch,p_actor,p_operation,p_key,p_payload::text)
    on conflict(branch_id,operation,idempotency_key) do nothing;
  select * into strict op from ics_private.operation_requests where branch_id=p_branch
    and operation=p_operation and idempotency_key=p_key for update;
  if op.actor_id<>p_actor or op.request_fingerprint<>p_payload::text then
    raise exception 'Idempotency key belongs to another request' using errcode='22023';
  end if;
  return op;
end $$;

create function ics_private.finish_operation(p_operation uuid,p_result jsonb) returns jsonb
language plpgsql security invoker set search_path=pg_catalog as $$ begin
  update ics_private.operation_requests set result=p_result,completed_at=clock_timestamp()
    where id=p_operation and completed_at is null;
  if not found then raise exception 'Operation already completed' using errcode='23514'; end if;
  return p_result;
end $$;

create function ics_private.append_event(p_branch uuid,p_actor uuid,p_operation uuid,p_action text,p_entity uuid,p_details jsonb default '{}'::jsonb)
returns void language sql security invoker set search_path=pg_catalog as $$
  insert into ics_private.audit_events(branch_id,actor_id,operation_request_id,action,entity_id,details)
  values(p_branch,p_actor,p_operation,p_action,p_entity,p_details);
$$;

-- All writers use student -> batch UUID order -> annual -> monthly counter order.
-- Smallest gap can only be 1 or an occupied roll + 1: no unbounded generate_series.
create function ics_private.open_membership(p_branch uuid,p_student uuid,p_batch uuid,p_actor uuid,p_at timestamptz,p_reason text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare picked bigint; member uuid; begin
  perform 1 from ics_private.batches where branch_id=p_branch and id=p_batch and status='active' for update;
  if not found then raise exception 'Destination batch must be active' using errcode='23514'; end if;
  select min(candidate) into picked from (
    select 1::bigint candidate union
    select roll_number::bigint+1 from ics_private.membership_rolls
      where branch_id=p_branch and batch_id=p_batch and during && tstzrange(p_at,null,'[)')
  ) c where candidate<=2147483647 and not exists(
    select 1 from ics_private.membership_rolls r where r.branch_id=p_branch and r.batch_id=p_batch
      and r.roll_number=c.candidate and r.during && tstzrange(p_at,null,'[)'));
  if picked is null then raise exception 'Roll range exhausted' using errcode='22003'; end if;
  insert into ics_private.batch_memberships(branch_id,student_id,batch_id,effective_from,reason,recorded_by)
    values(p_branch,p_student,p_batch,p_at,p_reason,p_actor) returning id into member;
  insert into ics_private.membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by)
    values(p_branch,member,p_batch,picked::integer,p_at,p_actor);
  return jsonb_build_object('membership_id',member,'batch_id',p_batch,'roll_number',picked);
end $$;

-- Internal timestamp parameter is NOT a public clock override. Admission always passes DB time.
create function ics_private.next_identity_sequences(p_branch uuid,p_at timestamptz,p_group text)
returns table(digital_sequence bigint,registration_sequence bigint)
language plpgsql security invoker set search_path=pg_catalog as $$
declare yr integer; mo integer; begin
  if p_at is null or not isfinite(p_at) or p_group is null or p_group not in ('NEW','OLD') then
    raise exception 'Invalid allocation namespace' using errcode='22023';
  end if;
  yr:=extract(year from p_at at time zone 'Asia/Kolkata');
  mo:=extract(month from p_at at time zone 'Asia/Kolkata');
  insert into ics_private.digital_id_counters(branch_id,admission_year,last_sequence) values(p_branch,yr,1)
  on conflict(branch_id,admission_year) do update set last_sequence=digital_id_counters.last_sequence+1
  returning last_sequence into digital_sequence;
  insert into ics_private.registration_counters(branch_id,period_month,counter_group,last_sequence)
    values(p_branch,make_date(yr,mo,1),p_group,1)
  on conflict(branch_id,period_month,counter_group) do update set last_sequence=registration_counters.last_sequence+1
  returning last_sequence into registration_sequence;
  return next;
end $$;

create function ics_private.verify_admission(p_branch uuid,p_student uuid,p_batch uuid,p_key uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; existing ics_private.student_registrations;
  centre ics_private.branches; adm uuid; grp text; at_time timestamptz; yr integer; mo integer;
  digital_seq bigint; reg_seq bigint; reg ics_private.student_registrations; response jsonb; membership jsonb;
begin
  actor:=ics_private.require_operator(p_branch);
  op:=ics_private.claim_operation(p_branch,actor,'verify_admission',p_key,
    jsonb_build_object('student',p_student,'batch',p_batch));
  if op.completed_at is not null then return op.result; end if;
  perform 1 from ics_private.students where branch_id=p_branch and id=p_student for update;
  if not found then raise exception 'Student not in centre' using errcode='23503'; end if;
  select * into existing from ics_private.student_registrations where branch_id=p_branch and student_id=p_student;
  if found then
    if existing.initial_batch_id<>p_batch then raise exception 'Existing admission differs; use transfer' using errcode='22023'; end if;
    return ics_private.finish_operation(op.id,jsonb_build_object('registration_id',existing.id,
      'digital_student_id',existing.digital_student_id,'registration',existing.canonical_registration));
  end if;
  select counter_group into grp from ics_private.batches
    where branch_id=p_branch and id=p_batch and status='active' for update;
  if not found then raise exception 'Initial batch must be active' using errcode='23514'; end if;
  select * into strict centre from ics_private.branches where id=p_branch;
  at_time:=clock_timestamp();
  yr:=extract(year from at_time at time zone 'Asia/Kolkata');
  mo:=extract(month from at_time at time zone 'Asia/Kolkata');
  -- Current verified admissions only. Paper records must use the reviewed import path.
  insert into ics_private.admissions(branch_id,student_id,initial_batch_id,admission_status,
    original_admitted_at,verified_at,verified_by)
  values(p_branch,p_student,p_batch,'verified',at_time,at_time,actor)
  on conflict(branch_id,student_id) do update set admission_status='verified',
    original_admitted_at=excluded.original_admitted_at,verified_at=excluded.verified_at,verified_by=excluded.verified_by
  where admissions.initial_batch_id=excluded.initial_batch_id and admissions.admission_status in ('pending','trial')
    and admissions.original_admitted_at is null returning id into adm;
  if adm is null then raise exception 'Admission requires office resolution/import' using errcode='23514'; end if;
  select digital_sequence,registration_sequence into digital_seq,reg_seq
    from ics_private.next_identity_sequences(p_branch,at_time,grp);
  insert into ics_private.student_registrations(branch_id,student_id,admission_id,initial_batch_id,
    original_admitted_at,admission_year,admission_month,counter_group,sequence,digital_branch_code,
    registration_prefix,digital_sequence,origin,recorded_by)
  values(p_branch,p_student,adm,p_batch,at_time,yr,mo,grp,reg_seq,centre.digital_code,centre.code,digital_seq,'allocated',actor)
  returning * into reg;
  membership:=ics_private.open_membership(p_branch,p_student,p_batch,actor,at_time,'initial verified admission');
  update ics_private.students set lifecycle_status='active' where branch_id=p_branch and id=p_student;
  perform ics_private.append_event(p_branch,actor,op.id,'registration.allocated',reg.id);
  perform ics_private.append_event(p_branch,actor,op.id,'student.activated',p_student);
  perform ics_private.append_event(p_branch,actor,op.id,'roll.assigned',(membership->>'membership_id')::uuid,membership);
  response:=jsonb_build_object('registration_id',reg.id,'digital_student_id',reg.digital_student_id,
    'registration',reg.canonical_registration)||membership;
  return ics_private.finish_operation(op.id,response);
end $$;

-- Transfer/reactivate/depart are one transaction; no new permanent identity allocation.
create function ics_private.change_enrollment(p_branch uuid,p_student uuid,p_destination uuid,p_key uuid,p_reason text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; previous ics_private.batch_memberships;
  at_time timestamptz; response jsonb; action_name text;
begin
  actor:=ics_private.require_operator(p_branch);
  if p_reason is null or btrim(p_reason)='' then raise exception 'Reason required' using errcode='22023'; end if;
  op:=ics_private.claim_operation(p_branch,actor,'change_enrollment',p_key,
    jsonb_build_object('student',p_student,'destination',p_destination,'reason',p_reason));
  if op.completed_at is not null then return op.result; end if;
  perform 1 from ics_private.students where branch_id=p_branch and id=p_student for update;
  if not found or not exists(select 1 from ics_private.student_registrations where branch_id=p_branch and student_id=p_student) then
    raise exception 'Verified student required' using errcode='23514';
  end if;
  select * into previous from ics_private.batch_memberships
    where branch_id=p_branch and student_id=p_student and effective_to is null;
  perform 1 from ics_private.batches where branch_id=p_branch
    and (id=previous.batch_id or id=p_destination) order by id for update;
  at_time:=clock_timestamp();
  if previous.id is not null and previous.batch_id=p_destination then
    raise exception 'Student already in destination' using errcode='22023';
  end if;
  if previous.id is not null then
    update ics_private.membership_rolls set effective_to=at_time
      where branch_id=p_branch and membership_id=previous.id and effective_to is null;
    update ics_private.batch_memberships set effective_to=at_time where id=previous.id;
  end if;
  if p_destination is null then
    if previous.id is null then raise exception 'No open membership to close' using errcode='23514'; end if;
    update ics_private.students set lifecycle_status='inactive' where id=p_student;
    response:=jsonb_build_object('student_id',p_student,'closed_membership_id',previous.id);
    action_name:='membership.closed';
  else
    response:=ics_private.open_membership(p_branch,p_student,p_destination,actor,at_time,p_reason);
    update ics_private.students set lifecycle_status='active' where id=p_student;
    action_name:=case when previous.id is null then 'student.reactivated' else 'membership.transferred' end;
    perform ics_private.append_event(p_branch,actor,op.id,'roll.assigned',(response->>'membership_id')::uuid,response);
  end if;
  perform ics_private.append_event(p_branch,actor,op.id,action_name,p_student,
    jsonb_build_object('previous_membership_id',previous.id,'reason',p_reason)||response);
  return ics_private.finish_operation(op.id,response);
end $$;

create function ics_private.manage_batch(p_branch uuid,p_batch uuid,p_name text,p_group text,p_room uuid,p_status text,p_key uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; batch uuid; action_name text; begin
  actor:=ics_private.require_operator(p_branch,true);
  op:=ics_private.claim_operation(p_branch,actor,'manage_batch',p_key,
    jsonb_build_object('batch',p_batch,'name',p_name,'group',p_group,'room',p_room,'status',p_status));
  if op.completed_at is not null then return op.result; end if;
  if p_batch is null then
    insert into ics_private.batches(branch_id,name,counter_group,room_id,status)
      values(p_branch,p_name,p_group,p_room,p_status) returning id into batch;
    action_name:='batch.created';
  else
    perform 1 from ics_private.batches where branch_id=p_branch and id=p_batch and counter_group=p_group for update;
    if not found then raise exception 'Batch/group not found; group is immutable' using errcode='23514'; end if;
    if p_status='archived' and exists(select 1 from ics_private.batch_memberships
      where branch_id=p_branch and batch_id=p_batch and effective_to is null) then
      raise exception 'Close/transfer roster before archival' using errcode='23514';
    end if;
    update ics_private.batches set name=p_name,room_id=p_room,status=p_status where id=p_batch;
    batch:=p_batch; action_name:=case p_status when 'archived' then 'batch.archived' else 'batch.updated' end;
  end if;
  perform ics_private.append_event(p_branch,actor,op.id,action_name,batch);
  return ics_private.finish_operation(op.id,jsonb_build_object('batch_id',batch));
end $$;
revoke all on all functions in schema ics_private from public;
commit;
