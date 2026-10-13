-- Legacy regression suite for migrations 001/002, BEFORE Phase 5.2 migration 003.
-- Run as a local database owner with BYPASSRLS; NEVER against a hosted project.
-- All fixture data is fictional and rolled back. ON_ERROR_STOP is required.
\set ON_ERROR_STOP on
begin;
set local search_path = ics_private, public, pg_catalog;

create function pg_temp.expect_error(statement text, expected_state text) returns void
language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_state then return; end if;
    raise;
  end;
  raise exception 'Expected SQLSTATE % for %', expected_state, statement;
end;
$$;
create function pg_temp.assert_true(ok boolean, label text) returns void
language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'Assertion failed: %', label; end if;
end;
$$;

insert into user_accounts(id) values ('10000000-0000-0000-0000-000000000001');
insert into students(id, branch_id, full_name)
select ('20000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, b.id, 'Fictional SQL Student ' || n
from branches b cross join generate_series(1, 6) n;
insert into admissions(branch_id, student_id, initial_batch_id, admission_status,
  original_admitted_at, verified_at, verified_by)
select s.branch_id, s.id, b.id, 'verified', '2026-06-01 00:00:00+05:30',
  '2026-06-01 00:00:00+05:30', '10000000-0000-0000-0000-000000000001'
from students s join batches b on b.branch_id = s.branch_id and b.name = 'New General';

create function pg_temp.register_student(student_number integer, reg_sequence bigint,
  digital_number bigint) returns void language sql as $$
  insert into student_registrations(branch_id, student_id, admission_id, initial_batch_id,
    original_admitted_at, admission_year, admission_month, counter_group, sequence,
    digital_branch_code, digital_sequence, origin, recorded_by)
  select a.branch_id, a.student_id, a.id, a.initial_batch_id, a.original_admitted_at,
    2026, 6, 'NEW', reg_sequence, b.digital_code, digital_number, 'allocated', a.verified_by
  from admissions a join branches b on b.id=a.branch_id where a.student_id =
    ('20000000-0000-0000-0000-' || lpad(student_number::text, 12, '0'))::uuid;
$$;

select pg_temp.assert_true((select count(*) = 4 from batches), 'four batches');
select pg_temp.expect_error($s$insert into batches(branch_id,name)
  select id,'Demo Batch' from branches$s$, '23514');
select pg_temp.register_student(1, 9, 1);
select pg_temp.assert_true((select canonical_registration = 'H06/26 09'
  and digital_student_id = 'IH260001' from student_registrations), 'identity format');
select pg_temp.expect_error('select pg_temp.register_student(2,9,2)', '23505');
select pg_temp.expect_error('select pg_temp.register_student(2,10,1)', '23505');
select pg_temp.expect_error('select pg_temp.register_student(2,10,0)', '23514');
savepoint expanded_ids;
select pg_temp.register_student(2,10,9999);
select pg_temp.register_student(3,11,10000);
select pg_temp.register_student(6,12,1000000);
select pg_temp.assert_true((select digital_student_id='IH269999' from student_registrations
  where digital_sequence=9999), 'four-digit boundary');
select pg_temp.assert_true((select digital_student_id='IH2610000' from student_registrations
  where digital_sequence=10000), 'five digits without truncation');
select pg_temp.assert_true((select digital_student_id='IH261000000' from student_registrations
  where digital_sequence=1000000), 'sequence grows beyond old six-digit limit');
rollback to savepoint expanded_ids;
select pg_temp.expect_error('select pg_temp.register_student(1,10,2)', '23505');
select pg_temp.expect_error('update student_registrations set sequence=10', '23514');
select pg_temp.expect_error('update student_registrations set digital_sequence=2', '23514');
select pg_temp.expect_error('delete from student_registrations', '23514');
select pg_temp.expect_error($s$update admissions set admission_status='rejected',
  verified_at=null,verified_by=null where student_id='20000000-0000-0000-0000-000000000001'$s$, '23514');
-- Canonical uniqueness is independent of full-year structured uniqueness.
update admissions set original_admitted_at='2126-06-01 00:00:00+05:30'
where student_id='20000000-0000-0000-0000-000000000004';
select pg_temp.expect_error($s$insert into student_registrations
  (branch_id,student_id,admission_id,initial_batch_id,original_admitted_at,
   admission_year,admission_month,counter_group,sequence,digital_branch_code,digital_sequence,origin,recorded_by)
  select branch_id,student_id,id,initial_batch_id,original_admitted_at,
    2126,6,'NEW',9,'H',2,'paper_import',verified_by from admissions
  where student_id='20000000-0000-0000-0000-000000000004'$s$, '23505');
-- Digital display uniqueness also protects the two-digit century boundary.
select pg_temp.expect_error($s$insert into student_registrations
  (branch_id,student_id,admission_id,initial_batch_id,original_admitted_at,
   admission_year,admission_month,counter_group,sequence,digital_branch_code,digital_sequence,origin,recorded_by)
  select branch_id,student_id,id,initial_batch_id,original_admitted_at,
    2126,6,'NEW',10,'H',1,'paper_import',verified_by from admissions
  where student_id='20000000-0000-0000-0000-000000000004'$s$, '23505');
select pg_temp.expect_error($s$insert into student_registrations
  (branch_id,student_id,admission_id,initial_batch_id,original_admitted_at,
   admission_year,admission_month,counter_group,sequence,digital_branch_code,digital_sequence,origin,recorded_by)
  select branch_id,student_id,id,initial_batch_id,original_admitted_at,
    2126,6,'NEW',10,'S',2,'paper_import',verified_by from admissions
  where student_id='20000000-0000-0000-0000-000000000004'$s$, '23503');
select pg_temp.assert_true(
  extract(month from timestamptz '2026-05-31 18:30:00+00' at time zone 'Asia/Kolkata') = 6,
  'Kolkata month boundary');
select pg_temp.assert_true(not exists (
  select 1 from generate_series(1,1000) n cross join generate_series(1,1000) o
  where '0' || n::text = '00' || o::text), 'NEW/OLD display separation sample');

-- Counter namespace constraints, NOT tests of deferred allocation RPCs.
insert into registration_counters(branch_id,period_month,counter_group,last_sequence)
select b.id,v.month,v.grp,1 from branches b cross join
  (values (date '2026-06-01','NEW'), (date '2026-06-01','OLD'),
    (date '2026-07-01','NEW'), (date '2026-07-01','OLD')) v(month,grp);
select pg_temp.assert_true((select count(*)=4 and min(last_sequence)=1
  from registration_counters), 'independent month/group counter rows');
insert into digital_id_counters(branch_id,admission_year,last_sequence)
select b.id,y,1 from branches b cross join (values(2026),(2027)) v(y);
select pg_temp.assert_true((select count(*)=2 from digital_id_counters), 'year-specific digital counters');

insert into operation_requests(branch_id,actor_id,operation,idempotency_key,request_fingerprint)
select id,'10000000-0000-0000-0000-000000000001','verify_admission',
  '30000000-0000-0000-0000-000000000001','fictional-request' from branches;
select pg_temp.expect_error($s$insert into operation_requests
  (branch_id,actor_id,operation,idempotency_key,request_fingerprint)
  select branch_id,actor_id,operation,idempotency_key,request_fingerprint
  from operation_requests$s$, '23505');

-- Student 1 progresses, Student 2 later reuses their vacant roll.
insert into batch_memberships(id,branch_id,student_id,batch_id,effective_from,reason,recorded_by)
select '40000000-0000-0000-0000-000000000001',a.branch_id,a.student_id,a.initial_batch_id,
  '2026-06-01 00:00:00+05:30','initial',a.verified_by
from admissions a where a.student_id='20000000-0000-0000-0000-000000000001';
insert into membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by)
select branch_id,id,batch_id,1,effective_from,recorded_by from batch_memberships;
select pg_temp.expect_error($s$insert into batch_memberships
  (branch_id,student_id,batch_id,effective_from,reason,recorded_by)
  select m.branch_id,m.student_id,b.id,m.effective_from,'invalid overlap',m.recorded_by
  from batch_memberships m join batches b on b.branch_id=m.branch_id and b.name='Old General'$s$, '23P01');
update membership_rolls set effective_to='2026-07-01 00:00:00+05:30';
update batch_memberships set effective_to='2026-07-01 00:00:00+05:30';
insert into batch_memberships(id,branch_id,student_id,batch_id,effective_from,reason,recorded_by)
select '40000000-0000-0000-0000-000000000002',s.branch_id,s.id,b.id,
  '2026-07-01 00:00:00+05:30','progression','10000000-0000-0000-0000-000000000001'
from students s join batches b on b.branch_id=s.branch_id and b.name='Old General'
where s.id='20000000-0000-0000-0000-000000000001';
insert into batch_memberships(id,branch_id,student_id,batch_id,effective_from,reason,recorded_by)
select '40000000-0000-0000-0000-000000000003',s.branch_id,s.id,b.id,
  '2026-07-01 00:00:00+05:30','new enrollment','10000000-0000-0000-0000-000000000001'
from students s join batches b on b.branch_id=s.branch_id and b.name='New General'
where s.id='20000000-0000-0000-0000-000000000002';
insert into membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by)
select branch_id,id,batch_id,1,effective_from,recorded_by from batch_memberships
where effective_to is null;
select pg_temp.assert_true((select count(*)=2 from membership_rolls
  where roll_number=1 and effective_to is null), 'roll 1 in different batches; vacant roll reused');
insert into batch_memberships(branch_id,student_id,batch_id,effective_from,reason,recorded_by)
select s.branch_id,s.id,b.id,'2026-07-02 00:00:00+05:30','current conflict test',
  '10000000-0000-0000-0000-000000000001'
from students s join batches b on b.branch_id=s.branch_id and b.name='New General'
where s.id='20000000-0000-0000-0000-000000000005';
select pg_temp.expect_error($s$insert into membership_rolls
  (branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by)
  select branch_id,id,batch_id,1,effective_from,recorded_by from batch_memberships
  where student_id='20000000-0000-0000-0000-000000000005'$s$, '23P01');
select pg_temp.assert_true((select canonical_registration='H06/26 09'
  and digital_student_id='IH260001' from student_registrations), 'progression preserves IDs');

-- Backdated membership permits testing conflict with closed historical roll.
insert into batch_memberships(branch_id,student_id,batch_id,effective_from,effective_to,reason,recorded_by)
select s.branch_id,s.id,b.id,'2026-06-15 00:00:00+05:30','2026-06-20 00:00:00+05:30',
  'historical test','10000000-0000-0000-0000-000000000001'
from students s join batches b on b.branch_id=s.branch_id and b.name='New General'
where s.id='20000000-0000-0000-0000-000000000003';
select pg_temp.expect_error($s$insert into membership_rolls
  (branch_id,membership_id,batch_id,roll_number,effective_from,effective_to,recorded_by)
  select branch_id,id,batch_id,1,effective_from,effective_to,recorded_by
  from batch_memberships where student_id='20000000-0000-0000-0000-000000000003'$s$, '23P01');
select pg_temp.expect_error($s$insert into membership_rolls
  (branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by)
  select branch_id,id,batch_id,2,effective_from,recorded_by
  from batch_memberships where student_id='20000000-0000-0000-0000-000000000003'$s$, '23514');
select pg_temp.assert_true(not exists (
  select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='ics_private' and c.relkind='r' and not (c.relrowsecurity and c.relforcerowsecurity)
), 'all application tables force RLS');
select pg_temp.assert_true(not exists (
  select 1 from pg_policies where schemaname='ics_private'
), 'no permissive policies');
rollback;
