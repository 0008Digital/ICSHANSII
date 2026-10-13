-- REVIEW ONLY: schema foundation, not a deployable onboarding workflow.
-- No application grants, RLS policies, auth bypasses, or allocation RPCs.
begin;

create schema ics_private;
revoke all on schema ics_private from public;
-- Required for UUID/integer equality in temporal GiST exclusions.
create extension if not exists btree_gist;

create table ics_private.branches (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = 'H'),
  -- Explicit configured code, never inferred from a branch name.
  digital_code text not null unique check (digital_code ~ '^[A-Z]$'),
  name text not null,
  timezone text not null default 'Asia/Kolkata' check (timezone = 'Asia/Kolkata'),
  unique (id, digital_code)
);

create table ics_private.batches (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  name text not null check (name in ('New General', 'Old General', 'New Guarantee', 'Old Guarantee')),
  counter_group text generated always as
    (case when name in ('New General', 'New Guarantee') then 'NEW' else 'OLD' end) stored,
  unique (branch_id, name),
  unique (branch_id, id),
  unique (branch_id, id, counter_group)
);

-- Fixed branch metadata only; never seed real students or auth accounts.
insert into ics_private.branches (code, digital_code, name)
values ('H', 'H', 'ICS Coaching Centre — Hansi');
insert into ics_private.batches (branch_id, name)
select b.id, n.name from ics_private.branches b cross join
  (values ('New General'), ('Old General'), ('New Guarantee'), ('Old Guarantee')) n(name);

create table ics_private.user_accounts (
  id uuid primary key default gen_random_uuid(),
  -- Supabase Auth linkage is deferred until a reviewed auth migration.
  -- No client-selected identifier is treated as an authenticated actor.
  auth_subject uuid unique,
  enabled boolean not null default false
);

create table ics_private.role_assignments (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  account_id uuid not null references ics_private.user_accounts(id),
  role text not null check (role in ('owner_admin', 'manager', 'teacher_invigilator', 'student', 'developer')),
  granted_by uuid not null references ics_private.user_accounts(id),
  granted_at timestamptz not null default current_timestamp,
  revoked_at timestamptz,
  check (revoked_at is null or revoked_at >= granted_at)
);
create unique index current_role_grant on ics_private.role_assignments (branch_id, account_id, role)
where revoked_at is null;

create table ics_private.students (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  full_name text not null check (btrim(full_name) <> ''),
  date_of_birth date,
  phone text,
  parent_phone text,
  email text,
  address text,
  lifecycle_status text not null default 'pending'
    check (lifecycle_status in ('pending', 'active', 'inactive', 'completed')),
  created_at timestamptz not null default current_timestamp,
  unique (branch_id, id)
);

create table ics_private.admissions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  student_id uuid not null,
  initial_batch_id uuid not null,
  admission_status text not null default 'pending'
    check (admission_status in ('pending', 'trial', 'verified', 'rejected')),
  original_admitted_at timestamptz,
  verified_at timestamptz,
  verified_by uuid references ics_private.user_accounts(id),
  foreign key (branch_id, student_id) references ics_private.students(branch_id, id),
  foreign key (branch_id, initial_batch_id) references ics_private.batches(branch_id, id),
  unique (branch_id, student_id),
  unique (branch_id, id, student_id, initial_batch_id),
  check ((admission_status = 'verified' and original_admitted_at is not null
    and verified_at is not null and verified_by is not null)
    or (admission_status <> 'verified' and verified_at is null and verified_by is null))
);

create table ics_private.registration_counters (
  branch_id uuid not null references ics_private.branches(id),
  period_month date not null check (extract(day from period_month) = 1),
  counter_group text not null check (counter_group in ('NEW', 'OLD')),
  last_sequence bigint not null default 0 check (last_sequence >= 0),
  primary key (branch_id, period_month, counter_group)
);

create table ics_private.digital_id_counters (
  branch_id uuid not null references ics_private.branches(id),
  admission_year integer not null check (admission_year between 1 and 9999),
  last_sequence bigint not null default 0 check (last_sequence >= 0),
  primary key (branch_id, admission_year)
);

-- Only verified, fully resolved identities belong here. Unresolved paper entries
-- remain outside this registry; the staging/import workflow is deferred.
create table ics_private.student_registrations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  student_id uuid not null,
  admission_id uuid not null,
  initial_batch_id uuid not null,
  original_admitted_at timestamptz not null,
  admission_year integer not null check (admission_year between 1 and 9999),
  admission_month integer not null check (admission_month between 1 and 12),
  counter_group text not null check (counter_group in ('NEW', 'OLD')),
  sequence bigint not null check (sequence > 0),
  digital_branch_code text not null,
  digital_sequence bigint not null check (digital_sequence > 0),
  sequence_display text generated always as
    ((case counter_group when 'NEW' then '0' else '00' end) || sequence::text) stored,
  canonical_registration text generated always as
    ('H' || lpad(admission_month::text, 2, '0') || '/' ||
     lpad((admission_year % 100)::text, 2, '0') || ' ' ||
     (case counter_group when 'NEW' then '0' else '00' end) || sequence::text) stored,
  digital_student_id text generated always as
    ('I' || digital_branch_code || lpad((admission_year % 100)::text, 2, '0') ||
     case when digital_sequence < 10000 then lpad(digital_sequence::text, 4, '0')
          else digital_sequence::text end) stored,
  origin text not null check (origin in ('allocated', 'paper_import')),
  recorded_at timestamptz not null default current_timestamp,
  recorded_by uuid not null references ics_private.user_accounts(id),
  foreign key (branch_id, digital_branch_code) references ics_private.branches(id, digital_code),
  foreign key (branch_id, admission_id, student_id, initial_batch_id)
    references ics_private.admissions(branch_id, id, student_id, initial_batch_id),
  foreign key (branch_id, initial_batch_id, counter_group)
    references ics_private.batches(branch_id, id, counter_group),
  check (admission_year = extract(year from original_admitted_at at time zone 'Asia/Kolkata')),
  check (admission_month = extract(month from original_admitted_at at time zone 'Asia/Kolkata')),
  unique (branch_id, student_id),
  unique (branch_id, admission_id),
  unique (branch_id, canonical_registration),
  unique (branch_id, admission_year, admission_month, counter_group, sequence),
  unique (branch_id, admission_year, digital_sequence),
  unique (branch_id, digital_student_id)
);

create table ics_private.batch_memberships (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  student_id uuid not null,
  batch_id uuid not null,
  effective_from timestamptz not null check (isfinite(effective_from)),
  effective_to timestamptz check (isfinite(effective_to)),
  during tstzrange generated always as (tstzrange(effective_from, effective_to, '[)')) stored,
  reason text not null check (btrim(reason) <> ''),
  recorded_by uuid not null references ics_private.user_accounts(id),
  foreign key (branch_id, student_id) references ics_private.students(branch_id, id),
  foreign key (branch_id, batch_id) references ics_private.batches(branch_id, id),
  check (effective_to is null or effective_to > effective_from),
  unique (branch_id, id, batch_id),
  exclude using gist (branch_id with =, student_id with =, during with &&)
);

create table ics_private.membership_rolls (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null,
  membership_id uuid not null,
  batch_id uuid not null,
  roll_number integer not null check (roll_number > 0),
  effective_from timestamptz not null check (isfinite(effective_from)),
  effective_to timestamptz check (isfinite(effective_to)),
  during tstzrange generated always as (tstzrange(effective_from, effective_to, '[)')) stored,
  recorded_by uuid not null references ics_private.user_accounts(id),
  foreign key (branch_id, membership_id, batch_id)
    references ics_private.batch_memberships(branch_id, id, batch_id),
  check (effective_to is null or effective_to > effective_from),
  exclude using gist (branch_id with =, batch_id with =, roll_number with =, during with &&),
  exclude using gist (branch_id with =, membership_id with =, during with &&)
);

create table ics_private.operation_requests (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  actor_id uuid not null references ics_private.user_accounts(id),
  operation text not null,
  idempotency_key uuid not null,
  request_fingerprint text not null check (btrim(request_fingerprint) <> ''),
  result jsonb,
  completed_at timestamptz,
  unique (branch_id, operation, idempotency_key),
  unique (branch_id, id),
  unique (branch_id, id, actor_id),
  check ((completed_at is null) = (result is null))
);

create table ics_private.audit_events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references ics_private.branches(id),
  actor_id uuid not null references ics_private.user_accounts(id),
  operation_request_id uuid not null,
  action text not null check (action in ('registration.allocated', 'registration.imported',
    'student.activated', 'student.reactivated', 'membership.transferred',
    'roll.assigned', 'role.granted', 'role.revoked')),
  entity_id uuid not null,
  occurred_at timestamptz not null default current_timestamp,
  details jsonb not null default '{}'::jsonb,
  foreign key (branch_id, operation_request_id, actor_id)
    references ics_private.operation_requests(branch_id, id, actor_id)
);

-- No policies means default-deny even if a future grant is accidentally added.
do $security$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'ics_private' loop
    execute format('alter table ics_private.%I enable row level security', t.tablename);
    execute format('alter table ics_private.%I force row level security', t.tablename);
    execute format('revoke all on ics_private.%I from public', t.tablename);
  end loop;
end
$security$;
alter default privileges in schema ics_private revoke all on tables from public;
alter default privileges in schema ics_private revoke execute on functions from public;
commit;
