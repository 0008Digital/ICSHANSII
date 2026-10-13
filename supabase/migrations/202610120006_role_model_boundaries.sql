-- Additive role boundary. No application grants, policies or SECURITY DEFINER RPCs.
begin;
lock table ics_private.role_assignments in access exclusive mode;

create table ics_private.centre_role_grants (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  account_id uuid not null,
  role text not null check (role in ('admin','manager','teacher','student')),
  granted_by uuid not null,
  granted_at timestamptz not null default clock_timestamp() check (isfinite(granted_at)),
  revoked_at timestamptz check (isfinite(revoked_at) and revoked_at >= granted_at),
  legacy_role_assignment_id uuid unique references ics_private.role_assignments(id),
  foreign key (branch_id,account_id) references ics_private.user_accounts(branch_id,id),
  foreign key (branch_id,granted_by) references ics_private.user_accounts(branch_id,id)
);
create unique index current_centre_role_grant
  on ics_private.centre_role_grants(branch_id,account_id,role) where revoked_at is null;

-- Copy grant history, including revoked/future/disabled grants; never reactivate it.
-- Original rows, actors, timestamps, IDs and audit references remain untouched.
insert into ics_private.centre_role_grants
  (id,branch_id,account_id,role,granted_by,granted_at,revoked_at,legacy_role_assignment_id)
select id,branch_id,account_id,
  case role when 'owner_admin' then 'admin' when 'teacher_invigilator' then 'teacher' else role end,
  granted_by,granted_at,revoked_at,id
from ics_private.role_assignments where role <> 'developer';

-- Separate control-plane membership: no branch permissions and no implicit Admin.
-- Intentionally no provisioning API or initial platform grants.
create table ics_private.platform_role_grants (
  id uuid primary key default gen_random_uuid(),
  auth_subject uuid not null references auth.users(id),
  role text not null default 'platform_owner' check (role='platform_owner'),
  granted_by_auth_subject uuid not null references auth.users(id),
  granted_at timestamptz not null default clock_timestamp() check (isfinite(granted_at)),
  revoked_at timestamptz check (isfinite(revoked_at) and revoked_at >= granted_at)
);
create unique index current_platform_owner_grant
  on ics_private.platform_role_grants(auth_subject) where revoked_at is null;

create trigger legacy_roles_frozen before insert or update or delete
  on ics_private.role_assignments for each row execute function ics_private.reject_history_mutation();
create trigger legacy_roles_no_truncate before truncate
  on ics_private.role_assignments for each statement execute function ics_private.reject_history_mutation();

create function ics_private.preserve_role_grant() returns trigger
language plpgsql security invoker set search_path=pg_catalog as $$ begin
  if tg_op <> 'UPDATE' then
    raise exception 'Role grant history cannot be removed' using errcode='23514';
  end if;
  if old.revoked_at is not null or new.revoked_at is null or
    (to_jsonb(new)-'revoked_at') is distinct from (to_jsonb(old)-'revoked_at') then
    raise exception 'Only one-time revocation of a role grant is permitted' using errcode='23514';
  end if;
  return new;
end $$;
create trigger preserve_centre_role before update or delete
  on ics_private.centre_role_grants for each row execute function ics_private.preserve_role_grant();
create trigger preserve_platform_role before update or delete
  on ics_private.platform_role_grants for each row execute function ics_private.preserve_role_grant();
create trigger centre_roles_no_truncate before truncate
  on ics_private.centre_role_grants for each statement execute function ics_private.reject_history_mutation();
create trigger platform_roles_no_truncate before truncate
  on ics_private.platform_role_grants for each statement execute function ics_private.reject_history_mutation();
create function ics_private.guard_new_role_source() returns trigger
language plpgsql security invoker set search_path=pg_catalog as $$ begin
  if new.legacy_role_assignment_id is not null then
    raise exception 'Legacy references are migration-only' using errcode='23514';
  end if;
  return new;
end $$;
create trigger new_role_source before insert on ics_private.centre_role_grants
  for each row execute function ics_private.guard_new_role_source();

-- Preserve signature used by admission/batch/schedule workflows; owner_only now means Admin.
create or replace function ics_private.require_operator(p_branch uuid,p_owner_only boolean default false)
returns uuid language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; begin
  select id into actor from ics_private.user_accounts
    where branch_id=p_branch and auth_subject=auth.uid() and enabled for share;
  if actor is null then raise exception 'Unauthorized' using errcode='42501'; end if;
  perform 1 from ics_private.centre_role_grants
    where branch_id=p_branch and account_id=actor and revoked_at is null
      and granted_at <= clock_timestamp()
      and (role='admin' or (not p_owner_only and role='manager'))
    order by id limit 1 for share;
  if not found then raise exception 'Unauthorized' using errcode='42501'; end if;
  return actor;
end $$;

-- Private, audited centre administration. Admin/Platform Owner provisioning remains
-- a separately reviewed infrastructure operation, never a peer/self-service grant.
create function ics_private.manage_centre_role(p_branch uuid,p_account uuid,p_role text,
  p_grant uuid,p_revoke boolean,p_reason text,p_key uuid)
returns jsonb language plpgsql security invoker set search_path=pg_catalog as $$
declare actor uuid; op ics_private.operation_requests; grant_id uuid;
  before_state jsonb; after_state jsonb; response jsonb;
begin
  actor:=ics_private.require_operator(p_branch,true);
  if p_account is null or p_account=actor or p_role is null
    or p_role not in ('manager','teacher','student') or p_revoke is null
    or p_reason is null or btrim(p_reason)='' then
    raise exception 'Invalid or privileged role administration' using errcode='42501';
  end if;
  op:=ics_private.claim_operation(p_branch,actor,'manage_centre_role',p_key,
    jsonb_build_object('account',p_account,'role',p_role,'grant',p_grant,'revoke',p_revoke,'reason',p_reason));
  if op.completed_at is not null then return op.result; end if;
  perform 1 from ics_private.user_accounts where branch_id=p_branch and id=p_account for share;
  if not found then raise exception 'Account not in centre' using errcode='42501'; end if;
  if p_revoke then
    select to_jsonb(g) into before_state from ics_private.centre_role_grants g
      where branch_id=p_branch and account_id=p_account and role=p_role and id=p_grant
        and revoked_at is null for update;
    if not found then raise exception 'Current grant not in centre/account/role' using errcode='42501'; end if;
    update ics_private.centre_role_grants set revoked_at=greatest(clock_timestamp(),granted_at)
      where id=p_grant returning id into grant_id;
  else
    if p_grant is not null then raise exception 'New grant requires a new ID' using errcode='22023'; end if;
    perform 1 from ics_private.user_accounts where id=p_account and enabled;
    if not found then raise exception 'Enabled account required' using errcode='42501'; end if;
    insert into ics_private.centre_role_grants(branch_id,account_id,role,granted_by)
      values(p_branch,p_account,p_role,actor) returning id into grant_id;
  end if;
  select to_jsonb(g) into after_state from ics_private.centre_role_grants g where id=grant_id;
  perform ics_private.append_event(p_branch,actor,op.id,
    case when p_revoke then 'role.revoked' else 'role.granted' end,grant_id,
    jsonb_build_object('reason',p_reason,'before',before_state,'after',after_state));
  response:=jsonb_build_object('grant_id',grant_id,'revoked',p_revoke);
  return ics_private.finish_operation(op.id,response);
end $$;
create or replace function ics_private.assign_teacher(p_branch uuid,p_batch uuid,p_teacher uuid,p_assignment uuid,p_end boolean,p_key uuid)
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
    perform 1 from ics_private.centre_role_grants where branch_id=p_branch and account_id=p_teacher
      and role='teacher' and revoked_at is null and granted_at<=at_time for share;
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


alter table ics_private.centre_role_grants enable row level security;
alter table ics_private.centre_role_grants force row level security;
alter table ics_private.platform_role_grants enable row level security;
alter table ics_private.platform_role_grants force row level security;
revoke all on ics_private.centre_role_grants, ics_private.platform_role_grants from public;
revoke all on all functions in schema ics_private from public;
commit;
