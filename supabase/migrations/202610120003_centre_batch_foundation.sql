-- Phase 5.2 LOCAL REVIEW ONLY. Requires 001/002 and Supabase auth.users/auth.uid().
-- Intentionally refuses populated identity registries: never rewrite issued IDs.
begin;
do $$ begin
  if exists (select 1 from ics_private.student_registrations)
    or exists (select 1 from ics_private.students)
    or exists (select 1 from ics_private.user_accounts) then
    raise exception 'Populated foundations require a separately reviewed migration';
  end if;
end $$;

alter table ics_private.branches drop constraint branches_code_check;
alter table ics_private.branches add check (code ~ '^[A-Z]{1,8}$');
alter table ics_private.branches drop constraint branches_digital_code_check;
update ics_private.branches set digital_code='IH' where code='H';
alter table ics_private.branches add check (digital_code ~ '^[A-Z]{2,12}$');
alter table ics_private.branches add unique (id,code);
-- Codes are deployment configuration, not inferred names or globally unique claims.
create trigger permanent_centre_codes before update of id,code,digital_code or delete
on ics_private.branches for each row execute function ics_private.reject_history_mutation();

alter table ics_private.student_registrations drop column canonical_registration;
alter table ics_private.student_registrations drop column digital_student_id;
alter table ics_private.student_registrations add column registration_prefix text not null;
alter table ics_private.student_registrations add foreign key (branch_id,registration_prefix)
  references ics_private.branches(id,code);
alter table ics_private.student_registrations add column canonical_registration text generated always as
  (registration_prefix || lpad(admission_month::text,2,'0') || '/' ||
   lpad((admission_year % 100)::text,2,'0') || ' ' ||
   case counter_group when 'NEW' then '0' else '00' end || sequence::text) stored;
alter table ics_private.student_registrations add column digital_student_id text generated always as
  (digital_branch_code || lpad((admission_year % 100)::text,2,'0') ||
   case when digital_sequence < 10000 then lpad(digital_sequence::text,4,'0')
        else digital_sequence::text end) stored;
alter table ics_private.student_registrations add unique (branch_id,canonical_registration);
alter table ics_private.student_registrations add unique (branch_id,digital_student_id);

create table ics_private.rooms (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  name text not null check (btrim(name) <> ''),
  confirmed boolean not null default false,
  unique(branch_id,id), unique(branch_id,name)
);
drop trigger fixed_batches on ics_private.batches;
alter table ics_private.batches drop constraint batches_name_check;
alter table ics_private.batches add check (btrim(name) <> '' and lower(btrim(name)) not in ('demo','demo batch','trial','trial batch'));
alter table ics_private.batches alter column counter_group drop expression;
alter table ics_private.batches add check(counter_group in ('NEW','OLD'));
alter table ics_private.batches add column room_id uuid;
alter table ics_private.batches add column status text not null default 'draft' check(status in ('draft','active','archived'));
-- Honest provisioning placeholders, NOT asserted physical rooms. Office must confirm.
insert into ics_private.rooms(branch_id,name)
select branch_id,'Unconfirmed room for ' || name from ics_private.batches;
update ics_private.batches b set room_id=r.id from ics_private.rooms r
where r.branch_id=b.branch_id and r.name='Unconfirmed room for ' || b.name;
alter table ics_private.batches alter column room_id set not null;
alter table ics_private.batches add foreign key(branch_id,room_id) references ics_private.rooms(branch_id,id);
alter table ics_private.batches add unique(branch_id,id,room_id);
create trigger permanent_batch_key before update of id,branch_id,counter_group or delete
on ics_private.batches for each row execute function ics_private.reject_history_mutation();

-- Weekly local-time slots; the batch's ONE room is redundantly indexed, not a room mapping.
-- Half-open date/time ranges allow adjacent sessions. Overnight sessions must be split.
create table ics_private.batch_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  batch_id uuid not null,
  room_id uuid not null,
  weekday integer not null check(weekday between 1 and 7), -- ISO Monday=1
  valid_from date not null check(isfinite(valid_from)),
  valid_to date not null check(isfinite(valid_to) and valid_to > valid_from),
  start_minute integer not null check(start_minute between 0 and 1439),
  end_minute integer not null check(end_minute between 1 and 1440 and end_minute > start_minute),
  dates daterange generated always as(daterange(valid_from,valid_to,'[)')) stored,
  minutes int4range generated always as(int4range(start_minute,end_minute,'[)')) stored,
  foreign key(branch_id,batch_id,room_id) references ics_private.batches(branch_id,id,room_id),
  exclude using gist(branch_id with =,room_id with =,weekday with =,dates with &&,minutes with &&)
);
-- Room moves with existing slots must be explicitly replanned; FK rejects silent moves.
create function ics_private.validate_batch_room() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if new.status='active' and not exists(select 1 from ics_private.rooms
    where branch_id=new.branch_id and id=new.room_id and confirmed for share) then
    raise exception 'Active batch requires office-confirmed room' using errcode='23514';
  end if;
  return new;
end $$;
create trigger confirmed_batch_room before insert or update on ics_private.batches
for each row execute function ics_private.validate_batch_room();
create function ics_private.preserve_room() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if new.confirmed=false and exists(select 1 from ics_private.batches
    where branch_id=old.branch_id and room_id=old.id and status='active') then
    raise exception 'Cannot unconfirm an active batch room' using errcode='23514';
  end if;
  return new;
end $$;
create trigger preserve_confirmed_room before update on ics_private.rooms
for each row execute function ics_private.preserve_room();

-- The account UUID is independent of both student UUID and website Student ID.
alter table ics_private.user_accounts add column branch_id uuid references ics_private.branches(id);
update ics_private.user_accounts set branch_id=(select id from ics_private.branches where code='H');
alter table ics_private.user_accounts alter column branch_id set not null;
alter table ics_private.user_accounts add unique(branch_id,id);
alter table ics_private.user_accounts add foreign key(auth_subject) references auth.users(id);
create trigger permanent_account_link before update of id,branch_id,auth_subject or delete
on ics_private.user_accounts for each row execute function ics_private.reject_history_mutation();
alter table ics_private.students add column father_name text;
alter table ics_private.students add column mother_name text;
create table ics_private.student_account_links (
  branch_id uuid not null,
  student_id uuid not null,
  account_id uuid not null,
  primary key(branch_id,student_id), unique(account_id),
  foreign key(branch_id,student_id) references ics_private.students(branch_id,id),
  foreign key(branch_id,account_id) references ics_private.user_accounts(branch_id,id)
);
create table ics_private.teacher_batch_assignments (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null,
  account_id uuid not null, batch_id uuid not null,
  effective_from timestamptz not null check(isfinite(effective_from)),
  effective_to timestamptz check(isfinite(effective_to) and effective_to > effective_from),
  during tstzrange generated always as(tstzrange(effective_from,effective_to,'[)')) stored,
  foreign key(branch_id,account_id) references ics_private.user_accounts(branch_id,id),
  foreign key(branch_id,batch_id) references ics_private.batches(branch_id,id),
  exclude using gist(branch_id with =,account_id with =,batch_id with =,during with &&)
);
create trigger preserve_teacher_assignment before update or delete on ics_private.teacher_batch_assignments
for each row execute function ics_private.close_history_only();
-- Scope every stored actor, not just the student/batch relationships.
do $$ declare t text; c text; begin
  for t,c in select * from (values
    ('role_assignments','account_id'),('role_assignments','granted_by'),
    ('admissions','verified_by'),('student_registrations','recorded_by'),
    ('batch_memberships','recorded_by'),('membership_rolls','recorded_by'),
    ('operation_requests','actor_id'),('audit_events','actor_id')) v(t,c)
  loop execute format('alter table ics_private.%I add foreign key(branch_id,%I) references ics_private.user_accounts(branch_id,id)',t,c); end loop;
end $$;

-- Staging keeps missing/duplicate paper values unchanged and unverified.
create table ics_private.paper_import_staging (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null references ics_private.branches(id),
  source_reference text not null check(btrim(source_reference) <> ''),
  source_row text not null check(btrim(source_row) <> ''),
  raw_record jsonb not null check(jsonb_typeof(raw_record)='object'),
  issue_notes text not null,
  review_status text not null default 'pending' check(review_status in ('pending','resolved','rejected')),
  resolved_student_id uuid,
  foreign key(branch_id,resolved_student_id) references ics_private.students(branch_id,id),
  unique(branch_id,source_reference,source_row),
  check((review_status='resolved')=(resolved_student_id is not null))
);

-- Future attendance ownership anchor: membership, never a current-roll lookup.
-- Minimal storage foundation only, no attendance entry RPC/UI in this phase.
alter table ics_private.batch_memberships add unique(branch_id,id,student_id,batch_id);
create table ics_private.attendance_records (
  id uuid primary key default gen_random_uuid(), branch_id uuid not null,
  membership_id uuid not null, student_id uuid not null, batch_id uuid not null,
  observed_at timestamptz not null check(isfinite(observed_at)),
  state text not null check(state in ('present','absent','late','excused')),
  recorded_by uuid not null,
  foreign key(branch_id,membership_id,student_id,batch_id)
    references ics_private.batch_memberships(branch_id,id,student_id,batch_id),
  foreign key(branch_id,recorded_by) references ics_private.user_accounts(branch_id,id),
  unique(branch_id,membership_id,observed_at)
);
create function ics_private.validate_attendance_membership() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  perform 1 from ics_private.batch_memberships where branch_id=new.branch_id
    and id=new.membership_id and during @> new.observed_at for share;
  if not found then raise exception 'Attendance outside membership' using errcode='23514'; end if;
  return new;
end $$;
create trigger historical_attendance before insert or update on ics_private.attendance_records
for each row execute function ics_private.validate_attendance_membership();
-- Closing membership cannot invalidate already recorded attendance.
create function ics_private.preserve_attendance_interval() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if exists(select 1 from ics_private.attendance_records where membership_id=old.id
    and not (tstzrange(new.effective_from,new.effective_to,'[)') @> observed_at)) then
    raise exception 'Closure would invalidate attendance history' using errcode='23514';
  end if;
  return new;
end $$;
create trigger attendance_closure before update on ics_private.batch_memberships
for each row execute function ics_private.preserve_attendance_interval();

create function ics_private.require_verified_student() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if new.lifecycle_status='active' and not exists(select 1 from ics_private.student_registrations
    where branch_id=new.branch_id and student_id=new.id) then
    raise exception 'Activation requires permanent verified registration' using errcode='23514';
  end if;
  return new;
end $$;
create trigger verified_activation before insert or update on ics_private.students
for each row execute function ics_private.require_verified_student();

-- Completed idempotency results are immutable; they cannot be reassigned/replayed for another actor.
create function ics_private.preserve_operation() returns trigger language plpgsql
set search_path=pg_catalog as $$ begin
  if tg_op='DELETE' then raise exception 'Operation history is permanent' using errcode='23514'; end if;
  if old.completed_at is not null or new.completed_at is null or
    (to_jsonb(old)-'result'-'completed_at') is distinct from (to_jsonb(new)-'result'-'completed_at') then
    raise exception 'Only completing an open operation is permitted' using errcode='23514';
  end if;
  return new;
end $$;
create trigger permanent_operations before update or delete on ics_private.operation_requests
for each row execute function ics_private.preserve_operation();

-- Non-owner roles receive NO schema/table/function grants and NO RLS policies.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='ics_private' loop
    execute format('alter table ics_private.%I enable row level security',t.tablename);
    execute format('alter table ics_private.%I force row level security',t.tablename);
    execute format('revoke all on ics_private.%I from public',t.tablename);
  end loop;
end $$;
revoke all on all functions in schema ics_private from public;
commit;
