-- Additional direct-write guards; privileged infrastructure owners still remain trusted.
begin;
create function ics_private.guard_batch_archive() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if new.status='archived' and exists(select 1 from ics_private.batch_memberships
    where branch_id=new.branch_id and batch_id=new.id and effective_to is null) then
    raise exception 'Cannot archive an enrolled batch' using errcode='23514';
  end if;
  return new;
end $$;
create trigger archive_roster before update on ics_private.batches
for each row execute function ics_private.guard_batch_archive();
create function ics_private.guard_membership() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  perform 1 from ics_private.batches where branch_id=new.branch_id and id=new.batch_id
    and status='active' for update;
  if not found then raise exception 'Membership requires active batch' using errcode='23514'; end if;
  if not exists(select 1 from ics_private.student_registrations
    where branch_id=new.branch_id and student_id=new.student_id) then
    raise exception 'Membership requires verified identity' using errcode='23514';
  end if;
  return new;
end $$;
create trigger verified_membership before insert on ics_private.batch_memberships
for each row execute function ics_private.guard_membership();
create function ics_private.guard_counter() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if tg_op='DELETE' then raise exception 'Issued counter namespace is permanent' using errcode='23514'; end if;
  if new.last_sequence < old.last_sequence or
    (to_jsonb(new)-'last_sequence') is distinct from (to_jsonb(old)-'last_sequence') then
    raise exception 'Counter cannot be rewound or reassigned' using errcode='23514';
  end if;
  return new;
end $$;
create trigger permanent_annual_counter before update or delete on ics_private.digital_id_counters
for each row execute function ics_private.guard_counter();
create trigger permanent_monthly_counter before update or delete on ics_private.registration_counters
for each row execute function ics_private.guard_counter();

-- Owner-controlled scheduling. Deletion/replanning retains before/after audit snapshots.
create function ics_private.manage_schedule_slot(p_branch uuid,p_batch uuid,p_slot uuid,
  p_weekday integer,p_from date,p_to date,p_start integer,p_end integer,p_remove boolean,p_key uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; room uuid; previous jsonb; current_slot jsonb; slot uuid;
begin
  actor:=ics_private.require_operator(p_branch,true);
  op:=ics_private.claim_operation(p_branch,actor,'manage_schedule_slot',p_key,
    jsonb_build_object('batch',p_batch,'slot',p_slot,'weekday',p_weekday,'from',p_from,
      'to',p_to,'start',p_start,'end',p_end,'remove',p_remove));
  if op.completed_at is not null then return op.result; end if;
  select room_id into room from ics_private.batches where branch_id=p_branch and id=p_batch
    and status='active' for update;
  if not found then raise exception 'Active batch required' using errcode='23514'; end if;
  if p_slot is not null then
    select to_jsonb(s) into previous from ics_private.batch_schedule_slots s
      where branch_id=p_branch and batch_id=p_batch and id=p_slot for update;
    if not found then raise exception 'Slot not in batch' using errcode='23503'; end if;
  end if;
  if p_remove then
    if p_slot is null then raise exception 'Slot required' using errcode='22023'; end if;
    delete from ics_private.batch_schedule_slots where id=p_slot;
    slot:=p_slot;
  elsif p_slot is null then
    insert into ics_private.batch_schedule_slots(branch_id,batch_id,room_id,weekday,valid_from,valid_to,start_minute,end_minute)
      values(p_branch,p_batch,room,p_weekday,p_from,p_to,p_start,p_end) returning id into slot;
  else
    update ics_private.batch_schedule_slots set weekday=p_weekday,valid_from=p_from,valid_to=p_to,
      start_minute=p_start,end_minute=p_end where id=p_slot;
    slot:=p_slot;
  end if;
  select to_jsonb(s) into current_slot from ics_private.batch_schedule_slots s where id=slot;
  perform ics_private.append_event(p_branch,actor,op.id,'batch.schedule_updated',p_batch,
    jsonb_build_object('before',previous,'after',current_slot));
  return ics_private.finish_operation(op.id,jsonb_build_object('slot_id',slot,'removed',p_remove));
end $$;

create function ics_private.assign_teacher(p_branch uuid,p_batch uuid,p_teacher uuid,p_assignment uuid,p_end boolean,p_key uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; assignment uuid; at_time timestamptz; begin
  actor:=ics_private.require_operator(p_branch,true);
  op:=ics_private.claim_operation(p_branch,actor,'assign_teacher',p_key,
    jsonb_build_object('batch',p_batch,'teacher',p_teacher,'assignment',p_assignment,'end',p_end));
  if op.completed_at is not null then return op.result; end if;
  perform 1 from ics_private.batches where branch_id=p_branch and id=p_batch for update;
  if not found then raise exception 'Batch not in centre' using errcode='23503'; end if;
  at_time:=clock_timestamp();
  if p_end then
    update ics_private.teacher_batch_assignments set effective_to=at_time
      where branch_id=p_branch and batch_id=p_batch and account_id=p_teacher and id=p_assignment
        and effective_to is null returning id into assignment;
    if assignment is null then raise exception 'Open assignment not found' using errcode='23503'; end if;
  else
    if p_assignment is not null then raise exception 'New assignment has no existing ID' using errcode='22023'; end if;
    perform 1 from ics_private.user_accounts where branch_id=p_branch and id=p_teacher and enabled for share;
    if not found then raise exception 'Enabled teacher required' using errcode='42501'; end if;
    perform 1 from ics_private.role_assignments where branch_id=p_branch and account_id=p_teacher
      and role='teacher_invigilator' and revoked_at is null and granted_at<=at_time for share;
    if not found then raise exception 'Teacher role required' using errcode='42501'; end if;
    perform 1 from ics_private.batches where id=p_batch and status='active';
    if not found then raise exception 'Active batch required' using errcode='23514'; end if;
    insert into ics_private.teacher_batch_assignments(branch_id,account_id,batch_id,effective_from)
      values(p_branch,p_teacher,p_batch,at_time) returning id into assignment;
  end if;
  perform ics_private.append_event(p_branch,actor,op.id,
    case when p_end then 'teacher.assignment_closed' else 'teacher.assigned' end,assignment,
    jsonb_build_object('batch_id',p_batch,'teacher_account_id',p_teacher));
  return ics_private.finish_operation(op.id,jsonb_build_object('assignment_id',assignment));
end $$;

revoke all on all functions in schema ics_private from public;
commit;
