"""Disposable PostgreSQL tests. No URL/existing database argument is accepted.
Python standard library only; starts its OWN initdb cluster on loopback and stops it.
The auth shim is not Supabase Auth integration. No network service is contacted.
"""
from __future__ import annotations
import argparse
import concurrent.futures
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import threading
import uuid

ROOT = Path(__file__).resolve().parents[2]
parser = argparse.ArgumentParser()
parser.add_argument('--pg-bin', type=Path, help='Existing PostgreSQL bin directory; no installation')
args = parser.parse_args()
bin_dir = args.pg_bin
if bin_dir is None:
    found = shutil.which('initdb')
    if found:
        bin_dir = Path(found).parent
    elif os.name == 'nt':
        candidates = sorted(Path(os.environ.get('ProgramFiles', 'C:/Program Files')).glob('PostgreSQL/*/bin/initdb.exe'))
        if candidates:
            bin_dir = candidates[-1].parent
if bin_dir is None:
    raise SystemExit('SKIPPED: PostgreSQL server binaries unavailable. No database tests executed.')

def executable(name):
    path = bin_dir / (name + ('.exe' if os.name == 'nt' else ''))
    if not path.is_file():
        raise SystemExit(f'Missing existing binary: {path}')
    return str(path)

ENV = {k: v for k, v in os.environ.items() if not k.upper().startswith('PG')}
ENV['PGCLIENTENCODING'] = 'UTF8'
TEMP = Path(tempfile.mkdtemp(prefix='ics-phase52-test-'))
DATA = TEMP / 'data'
with socket.socket() as sock:
    sock.bind(('127.0.0.1', 0))
    PORT = sock.getsockname()[1]
PSQL = [executable('psql'), '-X', '-h', '127.0.0.1', '-p', str(PORT), '-U', 'postgres', '-d', 'postgres',
        '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-A', '-t', '-q']
PASSED = []

def command(parts):
    if 'start' in parts and Path(parts[0]).stem == 'pg_ctl':
        with (TEMP / 'startup.log').open('w', encoding='utf-8') as output:
            result = subprocess.run(parts, env=ENV, stdout=output, stderr=subprocess.STDOUT, timeout=90)
        if result.returncode:
            raise AssertionError((TEMP / 'startup.log').read_text(encoding='utf-8'))
        return ''
    result = subprocess.run(parts, env=ENV, capture_output=True, text=True, encoding='utf-8', timeout=90)
    if result.returncode:
        raise AssertionError(result.stderr + result.stdout)
    return result.stdout.strip()

def sql(statement, error=None):
    result = subprocess.run(PSQL, input=statement, env=ENV, capture_output=True, text=True, encoding='utf-8', timeout=30)
    if error:
        assert result.returncode and error in result.stderr, (error, result.stderr, statement)
        return ''
    assert result.returncode == 0, result.stderr + '\n' + statement
    return result.stdout.strip()

def check(label, condition=True):
    assert condition, label
    PASSED.append(label)
    print('PASS:', label, flush=True)

def uid():
    return str(uuid.uuid4())

def quoted(value):
    return "'" + str(value).replace("'", "''") + "'"

started = False
try:
    command([executable('initdb'), '-D', str(DATA), '-U', 'postgres', '-A', 'trust', '--encoding=UTF8', '--no-locale'])
    # Trust is confined to this disposable cluster, bound exclusively to loopback.
    command([executable('pg_ctl'), '-D', str(DATA), '-l', str(TEMP / 'server.log'), '-o', f'-h 127.0.0.1 -p {PORT}', '-w', 'start'])
    started = True
    names = ['202610100001_identity_foundation.sql', '202610100002_integrity_guards.sql',
             '202610120003_centre_batch_foundation.sql', '202610120004_private_allocation.sql',
             '202610120005_direct_write_guards.sql', '202610120006_role_model_boundaries.sql']
    assert sorted(p.name for p in (ROOT / 'supabase/migrations').glob('*.sql')) == names
    migrations = [ROOT / 'supabase/migrations' / name for name in names]
    for migration in migrations[:2]:
        command(PSQL + ['-f', str(migration)])
    command(PSQL + ['-f', str(ROOT / 'supabase/tests/foundation.sql')])
    check('original foundation constraint suite on migrations 001/002')
    command(PSQL + ['-f', str(ROOT / 'supabase/tests/local-auth-shim.sql')])
    for migration in migrations[2:5]:
        command(PSQL + ['-f', str(migration)])
    check('all five migrations execute in order')
    branch = sql("select id from ics_private.branches where code='H';")
    batches = json.loads(sql("select jsonb_object_agg(name,id) from ics_private.batches;"))
    check('exactly four default actual batches', set(batches) == {'New General','Old General','New Guarantee','Old Guarantee'})
    ng, og, nq, oq = [batches[n] for n in ['New General','Old General','New Guarantee','Old Guarantee']]
    check('no fabricated confirmed rooms', sql('select count(*) from ics_private.rooms where confirmed;') == '0')
    sql("update ics_private.batches set status='active';", '23514')
    sql('update ics_private.rooms set confirmed=true; update ics_private.batches set status=\'active\';')
    owner_auth, manager_auth, teacher_auth, student_auth, developer_auth, disabled_auth = [uid() for _ in range(6)]
    actors = {}
    for auth, role, enabled in [(owner_auth,'owner_admin',True),(manager_auth,'manager',True),
                               (teacher_auth,'teacher_invigilator',True),(student_auth,'student',True),
                               (developer_auth,'developer',True),(disabled_auth,'manager',False)]:
        account = uid()
        sql(f"insert into auth.users values('{auth}'); insert into ics_private.user_accounts(id,branch_id,auth_subject,enabled) values('{account}','{branch}','{auth}',{str(enabled).lower()});")
        actors[role if enabled else 'disabled'] = account
    for role, account in actors.items():
        actual_role = 'manager' if role == 'disabled' else role
        sql(f"insert into ics_private.role_assignments(branch_id,account_id,role,granted_by) values('{branch}','{account}','{actual_role}','{actors['owner_admin']}');")
    owner = actors['owner_admin']
    auth_prefix = lambda auth: f"set request.jwt.claim.sub='{auth}'; "
    def as_owner(statement):
        return sql(auth_prefix(owner_auth) + statement)
    def student(centre=branch):
        ident = uid()
        sql(f"insert into ics_private.students(id,branch_id,full_name) values('{ident}','{centre}','Fictional SQL Test {ident[:8]}');")
        return ident
    def admission(ident, batch=ng, key=None, centre=branch, auth=owner_auth):
        return f"{auth_prefix(auth)}select ics_private.verify_admission('{centre}','{ident}','{batch}','{key or uid()}');"
    def enroll(ident, destination, key=None):
        dest = 'null' if destination is None else quoted(destination)
        return f"select ics_private.change_enrollment('{branch}','{ident}',{dest},'{key or uid()}','Fictional test change');"
    def count(table, where='true'):
        return int(sql(f'select count(*) from ics_private.{table} where {where};'))

    s1 = student()
    key = uid()
    first = json.loads(sql(admission(s1,key=key)))
    year_month = sql("select to_char(clock_timestamp() at time zone 'Asia/Kolkata','MM/YY');")
    check('NEW and digital allocation format', first['registration'] == f'H{year_month} 01' and first['digital_student_id'].endswith('0001'))
    check('first roll is one', first['roll_number'] == 1)
    check('idempotent exact replay', json.loads(sql(admission(s1,key=key))) == first)
    before = sql('select sum(last_sequence) from ics_private.digital_id_counters;')
    sql(admission(s1,key=uid()))
    check('different key same student consumes no counter', sql('select sum(last_sequence) from ics_private.digital_id_counters;') == before)
    sql(admission(student(),key=key), '22023')
    sql(admission(s1,key=key,auth=manager_auth), '22023')
    check('idempotency payload and actor conflicts rejected')
    for auth in [teacher_auth,student_auth,developer_auth,disabled_auth,uid()]:
        sql(admission(student(),auth=auth), '42501')
    sql("reset request.jwt.claim.sub; select ics_private.require_operator('"+branch+"');", '42501')
    check('teacher/student/developer/disabled/unlinked/anonymous allocation denied')
    sql(f"insert into ics_private.user_accounts(branch_id,auth_subject) values('{branch}','{uid()}');", '23503')
    check('Auth account linkage foreign key')
    sql(f"update ics_private.students set lifecycle_status='active' where id='{student()}';", '23514')
    sql('update ics_private.student_registrations set sequence=999;', '23514')
    sql('delete from ics_private.student_registrations;', '23514')
    sql('update ics_private.digital_id_counters set last_sequence=0;', '23514')
    sql('delete from ics_private.registration_counters;', '23514')
    sql('update ics_private.audit_events set action=\'role.granted\';', '23514')
    sql('delete from ics_private.operation_requests;', '23514')
    check('activation, identity, counter, audit and operation immutability')
    s2, s3 = student(), student()
    second = json.loads(sql(admission(s2,batch=nq)))
    old = json.loads(sql(admission(s3,batch=og)))
    check('NEW shared across two batches; OLD independent', second['registration'].endswith(' 02') and old['registration'].endswith(' 001'))
    check('roll one independent across batches', second['roll_number'] == old['roll_number'] == 1)
    check('NEW/OLD cannot collide for unpadded positive integers', sql("select bool_and(left('0'||n::text,2)<>'00') from generate_series(1,10000)n;") == 't')
    ids = sql(f"select canonical_registration||':'||digital_student_id from ics_private.student_registrations where student_id='{s1}';")
    attendance_at = sql('select clock_timestamp();')
    sql(f"insert into ics_private.attendance_records(branch_id,membership_id,student_id,batch_id,observed_at,state,recorded_by) values('{branch}','{first['membership_id']}','{s1}','{ng}','{attendance_at}','present','{owner}');")
    moved = json.loads(as_owner(enroll(s1,og)))
    check('transfer preserves identity and closes history', sql(f"select canonical_registration||':'||digital_student_id from ics_private.student_registrations where student_id='{s1}';") == ids and moved['roll_number'] == 2)
    s4 = student()
    reused = json.loads(sql(admission(s4)))
    check('smallest freed roll one reused', reused['roll_number'] == 1)
    check('attendance remains anchored to original membership', sql(f"select membership_id from ics_private.attendance_records where student_id='{s1}';") == first['membership_id'])
    sql(f"update ics_private.batch_memberships set reason='rewritten' where id='{first['membership_id']}';", '23514')
    sql(f"insert into ics_private.attendance_records(branch_id,membership_id,student_id,batch_id,observed_at,state,recorded_by) values('{branch}','{first['membership_id']}','{s1}','{ng}',clock_timestamp(),'present','{owner}');", '23514')
    check('closed history and attendance interval enforcement')
    as_owner(enroll(s1,None))
    react = json.loads(as_owner(enroll(s1,og)))
    check('reactivation retains identity and reuses vacant roll', react['roll_number'] == 2 and sql(f"select canonical_registration||':'||digital_student_id from ics_private.student_registrations where student_id='{s1}';") == ids)
    # Rolls 1 and 3 occupied, 2 vacant: explicit interior-gap test.
    gap_students = [student() for _ in range(3)]
    gap_rolls = [json.loads(sql(admission(s,batch=oq))) for s in gap_students]
    as_owner(enroll(gap_students[1],None))
    gap_new = json.loads(sql(admission(student(),batch=oq)))
    check('smallest interior gap selected', [r['roll_number'] for r in gap_rolls] == [1,2,3] and gap_new['roll_number'] == 2)

    # Add/edit/archive native actual batch, no categories or hierarchy.
    room = sql(f"select room_id from ics_private.batches where id='{ng}';")
    batch_key = uid()
    batch_sql = f"select ics_private.manage_batch('{branch}',null,'Custom Evening','NEW','{room}','active','{batch_key}');"
    custom = json.loads(as_owner(batch_sql))['batch_id']
    check('custom actual batch creation and retry', json.loads(as_owner(batch_sql))['batch_id'] == custom)
    sql(auth_prefix(manager_auth)+f"select ics_private.manage_batch('{branch}',null,'Forbidden','NEW','{room}','draft','{uid()}');", '42501')
    sql(f"insert into ics_private.batches(branch_id,name,room_id) values('{branch}','No group','{room}');", '23502')
    sql(f"insert into ics_private.batches(branch_id,name,counter_group,room_id) values('{branch}','Demo Batch','NEW','{room}');", '23514')
    as_owner(f"select ics_private.manage_batch('{branch}','{custom}','Custom Renamed','NEW','{room}','archived','{uid()}');")
    check('controlled edits and archival; manager cannot create batches', sql(f"select name||':'||status from ics_private.batches where id='{custom}';") == 'Custom Renamed:archived')
    sql(f"update ics_private.batches set status='archived' where id='{ng}';", '23514')
    sql(admission(student(),batch=custom), '23514')
    check('archival guards and inactive destination rejection')

    # Same room, weekday, validity and time overlap is rejected by GiST.
    def slot(batch,start,end,weekday=1):
        return f"insert into ics_private.batch_schedule_slots(branch_id,batch_id,room_id,weekday,valid_from,valid_to,start_minute,end_minute) values('{branch}','{batch}','{room}',{weekday},'2026-01-01','2027-01-01',{start},{end});"
    as_owner(f"select ics_private.manage_batch('{branch}','{custom}','Custom Renamed','NEW','{room}','active','{uid()}');")
    sql(slot(ng,540,600))
    sql(slot(custom,570,630), '23P01')
    sql(slot(custom,600,660))
    sql(slot(custom,540,600,2))
    sql(f"update ics_private.batches set room_id=(select room_id from ics_private.batches where id='{og}') where id='{ng}';", '23503')
    check('room conflicts, adjacent slots and controlled room changes')

    schedule_key = uid()
    schedule_call = f"select ics_private.manage_schedule_slot('{branch}','{custom}',null,3,'2026-01-01','2027-01-01',540,600,false,'{schedule_key}');"
    scheduled = json.loads(as_owner(schedule_call))['slot_id']
    check('audited schedule creation and retry', json.loads(as_owner(schedule_call))['slot_id'] == scheduled)
    as_owner(f"select ics_private.manage_schedule_slot('{branch}','{custom}','{scheduled}',3,'2026-01-01','2027-01-01',600,660,false,'{uid()}');")
    as_owner(f"select ics_private.manage_schedule_slot('{branch}','{custom}','{scheduled}',null,null,null,null,null,true,'{uid()}');")
    check('schedule edit/removal preserves audit snapshots', count('audit_events',"action='batch.schedule_updated'") == 3 and count('batch_schedule_slots',f"id='{scheduled}'") == 0)
    assignment_call = f"select ics_private.assign_teacher('{branch}','{ng}','{actors['teacher_invigilator']}',null,false,'{uid()}');"
    assignment = json.loads(as_owner(assignment_call))['assignment_id']
    sql(auth_prefix(manager_auth)+assignment_call,'42501')
    sql(auth_prefix(owner_auth)+f"select ics_private.assign_teacher('{branch}','{ng}','{actors['student']}',null,false,'{uid()}');",'42501')
    as_owner(f"select ics_private.assign_teacher('{branch}','{ng}','{actors['teacher_invigilator']}','{assignment}',true,'{uid()}');")
    check('owner-controlled teacher assignment and preserved closure history', sql(f"select effective_to is not null from ics_private.teacher_batch_assignments where id='{assignment}';") == 't')

    # Explicit invalid temporal inserts exercise constraints without allocator filtering.
    sql(f"insert into ics_private.membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by) select branch_id,id,batch_id,1,effective_from,recorded_by from ics_private.batch_memberships where id='{reused['membership_id']}';", '23P01')
    sql(f"insert into ics_private.batch_memberships(branch_id,student_id,batch_id,effective_from,reason,recorded_by) values('{branch}','{s4}','{og}',clock_timestamp(),'overlap','{owner}');", '23P01')
    check('duplicate active roll and one active membership constraints')

    # Second centre in same isolated DB proves defence-in-depth scoping.
    b2, auth2, actor2, room2, batch2 = [uid() for _ in range(5)]
    sql(f"insert into ics_private.branches(id,code,digital_code,name) values('{b2}','X','IX','Fictional Other Centre'); insert into auth.users values('{auth2}'); insert into ics_private.user_accounts(id,branch_id,auth_subject,enabled) values('{actor2}','{b2}','{auth2}',true); insert into ics_private.role_assignments(branch_id,account_id,role,granted_by) values('{b2}','{actor2}','owner_admin','{actor2}'); insert into ics_private.rooms(id,branch_id,name,confirmed) values('{room2}','{b2}','Fictional Room',true); insert into ics_private.batches(id,branch_id,name,counter_group,room_id,status) values('{batch2}','{b2}','Custom','OLD','{room2}','active');")
    other = json.loads(sql(admission(student(b2),batch2,centre=b2,auth=auth2)))
    check('independent centre counters and configured prefixes', other['digital_student_id'].endswith('0001') and other['digital_student_id'].startswith('IX') and other['registration'] == f'X{year_month} 001' and other['roll_number'] == 1)
    sql(admission(student(b2),batch2,centre=b2), '42501')
    sql(f"insert into ics_private.batches(branch_id,name,counter_group,room_id) values('{branch}','Cross centre','NEW','{room2}');", '23503')
    sql(f"insert into ics_private.role_assignments(branch_id,account_id,role,granted_by) values('{b2}','{actor2}','manager','{owner}');", '23503')
    check('wrong-centre authorization, room and actor foreign keys')

    # Real concurrent clients; each transaction holds its locks briefly before commit.
    def parallel(statements):
        barrier = threading.Barrier(len(statements))
        def worker(statement):
            barrier.wait(timeout=10)
            output = sql('begin; '+statement+' select pg_sleep(0.2); commit;')
            return json.loads(next(line for line in output.splitlines() if line.startswith('{')))
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(statements)) as pool:
            return list(pool.map(worker,statements))
    concurrent_students = [student() for _ in range(4)]
    results = parallel([admission(s) for s in concurrent_students])
    check('concurrent admissions: unique IDs, registrations and rolls', len({r['digital_student_id'] for r in results}) == len({r['registration'] for r in results}) == len({r['roll_number'] for r in results}) == 4)
    same_student, same_key = student(), uid()
    audit_before = count('audit_events')
    results = parallel([admission(same_student,key=same_key)]*2)
    check('concurrent same-key retry exactly once', results[0] == results[1] and count('audit_events') == audit_before+3)
    same_student = student()
    count_before = count('student_registrations')
    results = parallel([admission(same_student),admission(same_student)])
    check('concurrent different keys same student only one identity', results[0]['registration_id'] == results[1]['registration_id'] and count('student_registrations') == count_before+1)
    # Opposing batch transfers acquire both batch locks in UUID order.
    results = parallel([auth_prefix(owner_auth)+enroll(s2,og),auth_prefix(owner_auth)+enroll(s3,nq)])
    check('opposing transfers complete without deadlock', len(results) == 2)

    # Fault injection AFTER allocation, before audit: whole transaction must disappear.
    rollback_student = student()
    before = sql("select jsonb_build_array((select sum(last_sequence) from ics_private.digital_id_counters),(select sum(last_sequence) from ics_private.registration_counters),(select count(*) from ics_private.audit_events));")
    sql("create function ics_private.test_audit_failure() returns trigger language plpgsql as $$ begin raise exception 'injected failure' using errcode='P0001'; end $$; create trigger test_fail before insert on ics_private.audit_events for each row execute function ics_private.test_audit_failure();")
    sql(admission(rollback_student), 'P0001')
    sql('drop trigger test_fail on ics_private.audit_events; drop function ics_private.test_audit_failure();')
    after = sql("select jsonb_build_array((select sum(last_sequence) from ics_private.digital_id_counters),(select sum(last_sequence) from ics_private.registration_counters),(select count(*) from ics_private.audit_events));")
    check('failure rolls back counters, registry, membership, activation and audit', before == after and count('student_registrations',f"student_id='{rollback_student}'") == 0 and count('batch_memberships',f"student_id='{rollback_student}'") == 0 and sql(f"select lifecycle_status from ics_private.students where id='{rollback_student}';") == 'pending')
    sql(admission(rollback_student))

    # Pure internal allocator is the SAME implementation called by verified admission.
    # Controlled timestamps exist only here, not in the admission entry point.
    boundary = sql(f"begin; select digital_sequence||':'||registration_sequence from ics_private.next_identity_sequences('{branch}','2090-12-31 18:29:59+00','NEW'); select digital_sequence||':'||registration_sequence from ics_private.next_identity_sequences('{branch}','2090-12-31 18:30:00+00','NEW'); select digital_sequence||':'||registration_sequence from ics_private.next_identity_sequences('{branch}','2090-12-31 18:30:00+00','OLD'); select digital_sequence||':'||registration_sequence from ics_private.next_identity_sequences('{branch}','2091-01-31 18:30:00+00','NEW'); rollback;")
    check('Kolkata annual/monthly boundary with independent NEW/OLD namespaces', boundary.splitlines() == ['1:1','1:1','2:1','3:1'])
    sql(f"select * from ics_private.next_identity_sequences('{branch}','infinity','NEW');", '22023')
    # Overflow must fail atomically, never wrap or truncate.
    sql(f"begin; update ics_private.digital_id_counters set last_sequence=9223372036854775807 where branch_id='{branch}'; select * from ics_private.next_identity_sequences('{branch}',clock_timestamp(),'NEW'); rollback;", '22003')
    check('bigint overflow rolls back safely')
    # Check the FINAL generated columns, not just legacy expressions in foundation.sql.
    for sequence, suffix in [(9999,'9999'),(10000,'10000'),(1000000,'1000000')]:
        overflow_student = student()
        issued = json.loads(sql(f"begin; update ics_private.digital_id_counters set last_sequence={sequence-1} where branch_id='{branch}' and admission_year=extract(year from clock_timestamp() at time zone 'Asia/Kolkata'); " + admission(overflow_student) + ' rollback;'))
        check(f'digital sequence {sequence} nontruncating generated display', issued['digital_student_id'] == 'IH'+year_month[-2:]+suffix)
    # A duplicate display or structured allocation cannot enter the verified registry.
    duplicate_student, duplicate_adm = student(), uid()
    duplicate_sql = f"begin; insert into ics_private.admissions(id,branch_id,student_id,initial_batch_id,admission_status,original_admitted_at,verified_at,verified_by) select '{duplicate_adm}',branch_id,'{duplicate_student}',initial_batch_id,'verified',original_admitted_at,clock_timestamp(),recorded_by from ics_private.student_registrations where student_id='{s1}'; insert into ics_private.student_registrations(branch_id,student_id,admission_id,initial_batch_id,original_admitted_at,admission_year,admission_month,counter_group,sequence,digital_branch_code,registration_prefix,digital_sequence,origin,recorded_by) select branch_id,'{duplicate_student}','{duplicate_adm}',initial_batch_id,original_admitted_at,admission_year,admission_month,counter_group,sequence,digital_branch_code,registration_prefix,digital_sequence+100000,'paper_import',recorded_by from ics_private.student_registrations where student_id='{s1}'; rollback;"
    sql(duplicate_sql,'23505')
    check('final-schema duplicate registration rejected')
    # Roll reuse must not erase a historical conflict.
    historical_member = uid()
    sql(f"begin; insert into ics_private.batch_memberships(id,branch_id,student_id,batch_id,effective_from,effective_to,reason,recorded_by) select '{historical_member}',branch_id,'{s4}',batch_id,effective_from,effective_to,'historical conflict test',recorded_by from ics_private.batch_memberships where id='{first['membership_id']}'; insert into ics_private.membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,effective_to,recorded_by) select branch_id,id,batch_id,1,effective_from,effective_to,recorded_by from ics_private.batch_memberships where id='{historical_member}'; rollback;", '23P01')
    check('historical roll ownership overlap rejected after reuse')
    future_member = uid()
    future_student = gap_students[1]  # inactive, no open membership
    reserved = json.loads(sql(f"begin; insert into ics_private.batch_memberships(id,branch_id,student_id,batch_id,effective_from,reason,recorded_by) values('{future_member}','{branch}','{future_student}','{custom}',clock_timestamp()+interval '1 year','future test','{owner}'); insert into ics_private.membership_rolls(branch_id,membership_id,batch_id,roll_number,effective_from,recorded_by) select branch_id,id,batch_id,1,effective_from,recorded_by from ics_private.batch_memberships where id='{future_member}'; "+admission(student(),batch=custom)+' rollback;'))
    check('open-ended allocation skips future reserved roll', reserved['roll_number'] == 2)
    # Concurrent admissions to OLD and two NEW batches share only the intended counters.
    old_results = parallel([admission(student(),batch=og),admission(student(),batch=oq)])
    check('concurrent OLD group allocation distinct across batches', len({r['registration'] for r in old_results}) == 2 and all(r['registration'].split(' ')[1].startswith('00') for r in old_results))
    new_results = parallel([admission(student(),batch=ng),admission(student(),batch=nq)])
    check('concurrent NEW group allocation distinct across batches', len({r['registration'] for r in new_results}) == 2)
    # Role revocation is checked for a subsequent operation, including a replay.
    revocation_key, revocation_student = uid(),student()
    sql(admission(revocation_student,key=revocation_key,auth=manager_auth))
    sql(f"update ics_private.role_assignments set revoked_at=clock_timestamp() where account_id='{actors['manager']}';")
    sql(admission(revocation_student,key=revocation_key,auth=manager_auth),'42501')
    check('revoked Manager cannot replay prior authorized operation')

    # Non-owner denial tested both with normal grants (none) and accidental table grants.
    sql('set role anon; select * from ics_private.students;', '42501')
    sql('set role authenticated; select * from ics_private.students;', '42501')
    sql(f"set role authenticated; {admission(student())}", '42501')
    sql('begin; grant usage on schema ics_private to authenticated; grant select,insert,update,delete on all tables in schema ics_private to authenticated; set local role authenticated; select count(*) from ics_private.students; rollback;')
    check('RLS remains empty after hypothetical accidental table read grant', sql('begin; grant usage on schema ics_private to authenticated; grant select on ics_private.students to authenticated; set local role authenticated; select count(*) from ics_private.students; rollback;') == '0')
    sql(f"begin; grant usage on schema ics_private to authenticated; grant insert on ics_private.students to authenticated; set local role authenticated; insert into ics_private.students(branch_id,full_name) values('{branch}','Forbidden'); rollback;", '42501')
    check('anonymous/authenticated cannot read, mutate or invoke allocators')
    check('all private tables force RLS and no policies', sql("select not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ics_private' and c.relkind='r' and not(c.relrowsecurity and c.relforcerowsecurity)) and not exists(select 1 from pg_policies where schemaname='ics_private');") == 't')
    check('no PUBLIC function execute', sql("select not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='ics_private' and a.grantee=0 and a.privilege_type='EXECUTE');") == 't')
    sql(f"insert into ics_private.paper_import_staging(branch_id,source_reference,source_row,raw_record,issue_notes) values('{branch}','fictional-paper','1','{{\"registration\":null}}','Missing date and identifier');")
    check('unresolved imports retained without inventing identifiers', count('paper_import_staging') == 1)
    legacy = sql("select jsonb_agg(to_jsonb(r) order by id) from ics_private.role_assignments r;")
    command(PSQL + ['-f', str(migrations[5])])
    check('006 preserves exact legacy evidence', legacy == sql("select jsonb_agg(to_jsonb(r) order by id) from ics_private.role_assignments r;"))
    check('006 maps all nondeveloper history exactly', sql("select not exists(select 1 from ics_private.role_assignments r full join ics_private.centre_role_grants g on g.legacy_role_assignment_id=r.id where (r.role<>'developer' and (g.id is null or (to_jsonb(g)-'role'-'legacy_role_assignment_id') is distinct from (to_jsonb(r)-'role') or g.role<>case r.role when 'owner_admin' then 'admin' when 'teacher_invigilator' then 'teacher' else r.role end)) or (r.role='developer' and g.id is not null));") == 't')
    def role_call(account, role='manager', grant=None, revoke=False, auth=owner_auth, centre=branch, key=None):
        return auth_prefix(auth)+f"select ics_private.manage_centre_role('{centre}','{account}',{quoted(role)},{quoted(grant) if grant else 'null'},{str(revoke).lower()},'test approval','{key or uid()}');"
    for mutation in ["update ics_private.role_assignments set revoked_at=clock_timestamp()", "delete from ics_private.role_assignments", "truncate ics_private.role_assignments cascade"]:
        sql(mutation, '23514')
    check('legacy grants frozen against mutation and truncate')
    for auth in [manager_auth, teacher_auth, student_auth, developer_auth, disabled_auth, auth2]:
        sql(role_call(actors['student'],auth=auth), '42501')
    for role in ['admin','platform_owner','developer','owner_admin']:
        sql(role_call(actors['student'],role), '42501')
    sql(role_call(owner), '42501')
    sql(role_call(actor2), '42501')
    check('escalation, self-grants, cross-centre and unauthorized actors denied')
    platform_auth=uid()
    sql(f"insert into auth.users(id) values('{platform_auth}'); insert into ics_private.platform_role_grants(auth_subject,granted_by_auth_subject) values('{platform_auth}','{platform_auth}');")
    sql(auth_prefix(platform_auth)+f"select ics_private.require_operator('{branch}');", '42501')
    # Even a centre account with a retired developer grant gains nothing from platform membership.
    sql(f"insert into ics_private.platform_role_grants(auth_subject,granted_by_auth_subject) values('{developer_auth}','{platform_auth}');")
    sql(auth_prefix(developer_auth)+f"select ics_private.require_operator('{branch}');", '42501')
    check('Platform Owner never inherits private centre authority')
    key=uid()
    grant=json.loads(sql(role_call(actors['manager'],key=key)))['grant_id']
    check('Admin grant retry idempotent', json.loads(sql(role_call(actors['manager'],key=key)))['grant_id']==grant)
    sql(admission(student(),auth=manager_auth))
    sql(role_call(actors['manager'],grant=grant,revoke=True))
    sql(admission(student(),auth=manager_auth),'42501')
    new_grant=json.loads(sql(role_call(actors['manager'])))['grant_id']
    check('revocation and regrant preserve separate grant history', new_grant!=grant and count('centre_role_grants',f"id='{grant}' and revoked_at is not null")==1)
    sql(f"update ics_private.centre_role_grants set revoked_at=null where id='{grant}';",'23514')
    sql(f"update ics_private.centre_role_grants set role='admin' where id='{new_grant}';",'23514')
    sql(f"delete from ics_private.centre_role_grants where id='{grant}';",'23514')
    sql('truncate ics_private.platform_role_grants;','23514')
    sql(f"update ics_private.platform_role_grants set auth_subject='{student_auth}';",'23514')
    check('role history cannot be rewritten, resurrected or deleted')
    sql(auth_prefix(owner_auth)+f"select ics_private.require_operator('{b2}');",'42501')
    sql(auth_prefix(teacher_auth)+f"select ics_private.require_operator('{branch}');",'42501')
    sql(auth_prefix(student_auth)+f"select ics_private.require_operator('{branch}');",'42501')
    check('centre Admin, Teacher and Student boundaries enforced')
    for table in ['centre_role_grants','platform_role_grants']:
        check(table+' accidental SELECT grant remains empty',sql(f"begin; grant usage on schema ics_private to authenticated; grant select on ics_private.{table} to authenticated; set local role authenticated; select count(*) from ics_private.{table}; rollback;")=='0')
    sql(role_call(actors['student'],auth=manager_auth),'42501')
    check('active Manager cannot administer roles')
    sql(role_call(actors['disabled']),'42501')
    sql(f"update ics_private.user_accounts set enabled=false where id='{actors['manager']}';")
    sql(admission(student(),auth=manager_auth),'42501')
    sql(f"update ics_private.user_accounts set enabled=true where id='{actors['manager']}';")
    check('disabled actor and disabled target denied')
    # Concurrent same-key role grants produce one grant and one audit event.
    role_key=uid()
    results=parallel([role_call(actors['student'],'teacher',key=role_key)]*2)
    check('concurrent role grant retry exactly once',results[0]==results[1] and count('centre_role_grants',f"account_id='{actors['student']}' and role='teacher'")==1)
    teacher_grant=sql(f"select id from ics_private.centre_role_grants where account_id='{actors['teacher_invigilator']}' and role='teacher' and revoked_at is null;")
    sql(role_call(actors['teacher_invigilator'],'teacher',grant=teacher_grant,revoke=True))
    sql(auth_prefix(owner_auth)+f"select ics_private.assign_teacher('{branch}','{ng}','{actors['teacher_invigilator']}',null,false,'{uid()}');",'42501')
    check('revoked Teacher cannot receive new assignment')
    future_grant=uid()
    sql(role_call(actors['manager'],grant=new_grant,revoke=True))
    sql(f"insert into ics_private.centre_role_grants(id,branch_id,account_id,role,granted_by,granted_at) values('{future_grant}','{branch}','{actors['manager']}','manager','{owner}',clock_timestamp()+interval '1 day');")
    sql(admission(student(),auth=manager_auth),'42501')
    sql(role_call(actors['manager'],grant=future_grant,revoke=True))
    check('future grants confer no authority and can be cancelled')
    sql(f"begin; grant usage on schema ics_private to authenticated; grant insert on ics_private.centre_role_grants to authenticated; set local role authenticated; insert into ics_private.centre_role_grants(branch_id,account_id,role,granted_by) values('{branch}','{owner}','admin','{owner}'); rollback;",'42501')
    check('RLS blocks direct grant escalation despite accidental INSERT grant')
    check('all 21 tables still FORCE RLS without policies',sql("select count(*)=21 and bool_and(relrowsecurity and relforcerowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='ics_private' and c.relkind='r';")=='t' and sql("select count(*) from pg_policies where schemaname='ics_private';")=='0')
    check('all helpers remain invoker and PUBLIC execution revoked', sql("select not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='ics_private' and p.prosecdef) and not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where n.nspname='ics_private' and a.grantee=0 and a.privilege_type='EXECUTE');")=='t')
    print(f'RESULT: {len(PASSED)} groups passed. Disposable cluster: {TEMP}', flush=True)
finally:
    if started or (DATA / 'postmaster.pid').exists():
        command([executable('pg_ctl'), '-D', str(DATA), '-m', 'fast', '-w', 'stop'])
    # Keep logs and stopped disposable data for review; never delete existing data.
    print(f'Stopped disposable cluster; artifacts retained at {TEMP}', flush=True)
