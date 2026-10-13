# ICS Hansi — transferred private database foundation

Status: **transferred into C:\Projects\ics-hansi; NOT applied to Supabase,
NOT connected to the application, NOT ready for real student data**.
The existing OpenGlass interface is preserved; no old frontend was transferred.

## Transfer provenance and validation status

The ten approved files were SHA-256 hashed in C:\Projects\icshansi BEFORE copying.
Every destination matched its source immediately after copying. See
`transfer-manifest.json` for full source/copy hashes and subsequent documentation
hashes. The five historical migrations and SQL fixtures remain byte-for-byte unchanged.
The disposable runner is intentionally extended for additive migration 006.
This README is intentionally updated after the verified copy.

The old project's Supabase directory was untracked. Its Git HEAD is contextual
provenance only; the recorded file hashes identify the transferred snapshot.

- **Historical evidence:** the old README and `tests/allocation-review.md` report
  52 assertion groups passing on disposable PostgreSQL 18 in the OLD project.
  The unchanged acceptance review is inherited evidence, not a new execution log.
- **NEW project reproduction:** all 52 assertion groups passed using Python 3.12.0
  and PostgreSQL 18.6. The new-project disposable cluster was stopped successfully.
- **Not verified:** actual Supabase Auth/JWT/PostgREST, hosted compatibility,
  production policies, recovery, financial authorization, or real student data.

See [backend architecture and proposed permissions](../docs/backend-architecture.md).
The five-role matrix is a DESIGN TARGET. Migration 006 separates Platform Owner from centre Admin, Manager, Teacher and
Student grants. The detailed permission matrix remains a design target: no
application policies, grants or endpoints are enabled.

## Tenancy and centre configuration

Use a separate Supabase project per centre. Every business relationship also keeps
`branch_id` as defence in depth. The inherited table name `branches` represents a
centre here; there is no new organization/category/sub-batch hierarchy.

`branches.code` is the paper-register prefix (`H` for Hansi).
`branches.digital_code` is the COMPLETE assigned website ID prefix (`IH` for Hansi),
not an inferred first letter or an implicit `I` concatenation. Codes are immutable
provisioning configuration. Their database uniqueness applies only inside that
project. A platform-controlled allocation registry/policy must approve prefixes;
separate databases cannot enforce global uniqueness. No unapproved centre is seeded.
The inherited baseline uses explicitly configured complete prefixes and four
DEFAULT batches, while allowing additional actual batches. See the new backend
architecture document for reconciled requirements; the old AGENTS.md was not copied.

## Migration order and execution boundary

Apply in lexical order, ONLY to a new disposable database during review:

1. `202610100001_identity_foundation.sql` — original private tables, four Hansi seeds,
   structured/display uniqueness, temporal exclusions and default-deny RLS.
2. `202610100002_integrity_guards.sql` — original immutable history/registration,
   verified admission and roll-containment guards.
3. `202610120003_centre_batch_foundation.sql` — configurable full prefixes, dynamic
   actual batches, rooms/schedules, branch-scoped Auth linkage, teacher/student
   links, import staging, historical attendance and activation/idempotency guards.
4. `202610120004_private_allocation.sql` — private transactional admission,
   enrollment, batch management, idempotency and audit primitives.
5. `202610120005_direct_write_guards.sql` — monotonic counter guards, verified
   membership and archive guards, audited schedule and teacher-assignment operations.

6. `202610120006_role_model_boundaries.sql` � immutable legacy evidence, separate
   platform/centre grants, private audited role administration and updated checks.

001/002 are preserved. 003 refuses an existing populated student/account/registration
foundation; it is NOT an in-place conversion plan for issued identities. Never run
these files against production, a shared/staging database or an existing populated
instance. A reviewed data-conversion migration is required for such an instance.

Prerequisites: PostgreSQL 15+ (historically validated on 18), `btree_gist`, and actual Supabase
`auth.users` / `auth.uid()` before 003. Plain PostgreSQL tests use the explicitly
isolated `tests/local-auth-shim.sql`; NEVER apply that shim to Supabase. The shim does
not validate passwords, JWTs, invitations, refresh, MFA or PostgREST authorization.

## Database model

All 21 private tables have ENABLE + FORCE RLS, no policies and no application grants.
No cascade deletes of issued identities or enrollment history are configured.

| Tables | Responsibility / constraints |
| --- | --- |
| `branches` | Immutable configured prefixes; centre timezone Asia/Kolkata. |
| `rooms` | One centre-owned room record; confirmation required for active batches. |
| `batches` | Dynamic actual batches, explicit immutable NEW/OLD group, one required room FK, draft/active/archived status; unique name within centre. |
| `batch_schedule_slots` | Weekly ISO weekday, local minute interval, half-open validity dates; GiST excludes same-room/weekday/date/time overlap. |
| `students` | Permanent internal UUID, contact/parent fields, lifecycle; active requires verified permanent identity. |
| `admissions` | One original admission per student; verified time/actor required, immutable after registration. |
| `digital_id_counters` | Centre + full admission year PK; bigint watermark, cannot rewind/delete. |
| `registration_counters` | Centre + Kolkata month + NEW/OLD PK; bigint watermark, cannot rewind/delete. |
| `student_registrations` | One permanent row per student/admission; full-year structured and canonical-display uniqueness; branch-consistent initial batch/group/prefix. |
| `batch_memberships` | Student/batch/time history; GiST excludes ALL overlapping student membership intervals. |
| `membership_rolls` | Positive integer per actual batch; GiST excludes overlapping ownership and overlapping rolls within one membership; contained in parent membership. |
| `attendance_records` | Composite student/batch/membership FK and observation-time containment; current roll is never historical ownership proof. Minimal foundation, no attendance write API. |
| `user_accounts` | Own immutable UUID, centre, enabled flag (default false), unique FK to `auth.users.id`; no passwords. |
| `role_assignments` | Centre-scoped account/granting actor; one unrevoked grant of each role per account. No self-service grant API. |
| `student_account_links` | One student/account mapping, composite centre FKs; does not by itself grant access. |
| `teacher_batch_assignments` | Centre/account/actual batch with nonoverlapping assignment intervals; close-only history. |
| `operation_requests` | Unique centre/operation/key; actor + canonical JSON payload binding; completed result immutable. |
| `audit_events` | Append-only, actor/centre/operation FK, action/entity reference and details; private workflows append in the same transaction. |
| `paper_import_staging` | Restricted raw source values, provenance/row deduplication, office issue notes and unresolved status. |

Relationship overview:

```text
centre -> rooms -> actual batches -> weekly schedule slots
centre -> students -> original admission -> permanent registration
centre -> annual digital / monthly NEW+OLD counters
student -> membership history -> roll history
membership + student + batch -> historical attendance
Auth user -> centre account -> roles / student link / teacher-batch assignments
centre + actor -> idempotent operation -> append-only audit events
paper staging -> optional office-resolved student (no automatic issuance)
```

## Batches, rooms and schedules

The four Hansi seeds are actual batches: New General, Old General, New Guarantee,
Old Guarantee. Additional named actual batches are allowed; each must explicitly
choose NEW or OLD. Demo/trial remains an admission status, not an official batch.
No parent/category table exists. Names, room and status may change through controlled
operations; batch UUID/centre/group cannot be relabelled. Existing registration
history therefore cannot be changed by renaming a batch.

Physical room information was not supplied. Each seed has its own clearly named
**unconfirmed provisioning placeholder**, and remains draft. These are not claims
that four physical rooms exist. Office must configure/confirm actual rooms before
activating batches or admitting students. Several batches may reference one room
if their schedules do not conflict. A batch never has multiple assigned rooms.

Schedule slots redundantly store the batch's single room for the exclusion index;
a composite FK enforces that it is the SAME room. Room changes with existing slots
are rejected: explicitly remove/replan the slots through the audited operation,
change the room, then add validated slots in one transaction. Audit keeps before/
after snapshots. Slots are weekly Kolkata local minutes, with exclusive end dates
and times. Overnight sessions need split slots. Same room/different weekday or
adjacent times are allowed. The date-range/weekday exclusion is deliberately
conservative for very short overlapping validity windows that contain no shared
occurrence of that weekday; such special scheduling needs a reviewed occurrence
model, not weakening conflict checks. Holiday exceptions are not implemented.

Archival requires closing/transferring the open roster. It never deletes memberships,
rolls, attendance or identifiers. Closing teacher assignments/schedule management
before archive is an office workflow; archive grants no future enrollment access.

## Identity allocation and permanence

Website ID: complete assigned centre code + two-digit original admission year +
annual integer sequence padded to a MINIMUM of four digits. Examples: IH260001,
IH269999, IH2610000. Values above four digits are never truncated. Counters are
independent per centre/full year; previous namespaces and issued rows are retained.
The website ID is distinct from student UUID, account UUID and Auth subject UUID.

Paper registration: configured prefix + MM/YY + one space + group sequence.
NEW is literal `0` + positive unpadded integer; OLD is literal `00` + integer.
Examples H06/26 01, H06/26 010, H06/26 001, H06/26 0010. NEW is shared across NEW
batches; OLD across OLD batches. Both start at 1 in each Kolkata calendar month.
Positive unpadded sequences start 1–9: NEW's second character is nonzero, whereas
OLD's second character is zero, so these two formats cannot collide with each other.

Both identifiers are assigned once at verified original admission. They remain
unchanged through progression, paid upgrade, departure, archival and reactivation.
Uniqueness applies to centre/canonical display AND structured allocation. Two-digit
year repetition after a century is intentionally rejected by display uniqueness;
a future approved format is needed before that boundary. Bigint exhaustion fails,
never wraps. Missing paper values must not be invented or reissued.

`verify_admission(branch, student, batch, key)`:

1. Resolve `auth.uid()` to enabled centre account; lock current Owner/Admin or Manager
   role. Claim unique operation key, bind actor and canonical payload; identical
   completed retry returns its stored response. Conflicting actor/payload fails.
2. Lock student then actual batch. Existing issued identity is returned without
   consuming either counter; a different initial batch requires transfer instead.
3. Take database time (no public clock override), derive Kolkata year/month. Verify
   a new/pending/trial admission. Evidence-bearing historical dates require import
   review, not overwriting by this current-admission workflow.
4. Atomically UPSERT/increment annual counter then monthly group counter, RETURNING
   allocated integers. Insert permanent registration and initial membership/roll,
   activate student, append registration/activation/roll audits, complete operation.
5. Any error rolls back EVERYTHING. No separate counter commit or partial activation.

`next_identity_sequences` accepts a timestamp only as a PRIVATE internal primitive
so its actual boundary arithmetic can be tested; `verify_admission` passes DB time.
No caller-facing time override or grants exist.

## Roll allocation, transfers and reactivation

`open_membership` selects the smallest available positive integer for the entire
proposed `[start,infinity)` interval, including future reservations. Candidates are
1 or an occupied overlapping roll + 1; no unbounded numeric scan. Integer exhaustion
fails safely. A batch-row lock serializes assignments; temporal exclusions remain
the final integrity boundary. Roll 1 may independently exist in every actual batch.

`change_enrollment` locks student, then source/destination batch UUIDs in sorted
order. Close old roll before old membership; insert destination membership/roll and
trusted audit in the same transaction. Null destination means departure; a verified
inactive student may reactivate without a new identity. Historical ranges are
half-open so a vacant roll can be reused at the exact end boundary. Closed history
cannot be rewritten. Attendance remains linked to its original membership, and
closing a membership cannot invalidate recorded attendance.

No financial approval is implied by these private enrollment primitives. Before
application access is enabled, paid General -> Guarantee upgrades require the
configured/approved fee-ledger workflow. No charge amount is invented here.

## Security boundary and deferred application integration

All workflow/helper functions are SECURITY INVOKER, with `search_path=pg_catalog`,
fully qualified object names and revoked PUBLIC execute. No SECURITY DEFINER
entry point, application grant, permissive policy, credential or Auth UI is added.
They currently execute only within a deliberately privileged local test context.
A future authenticated API cannot work by simply granting these invoker functions:
RLS and narrowly reviewed server/RPC authorization must be designed together.

Owner/Admin and Manager may verify/transfer in the tested private workflows;
only Owner/Admin may manage batches, schedules or teacher assignments. Teacher,
Student, Developer, disabled/revoked and wrong-centre actors are rejected. Teacher
assignment requires an enabled account and an actual current teacher role. These
records do not implement a Teacher portal or authorize student data reads.

The platform owner has no ordinary student-data access policy. Infrastructure
superuser/BYPASSRLS credentials remain separately privileged. Tests confirm ordinary
roles are denied; they cannot prove a hostile infrastructure owner cannot modify
its database. Direct privileged SQL can bypass workflow auditing; production server
roles must never receive unrestricted table DML. Role bootstrap/grants/revocations,
student-account linking approval and correction tools remain an Auth milestone.
`auth_subject` must be supplied correctly at provisioning; it cannot later be
silently rebound to another account. No live account is created by these migrations.

## Paper import and future scope

Staging preserves raw identifiers, unknown fields and conflicting paper rows without
creating a verified registration. Office must resolve provenance, exact original
date precision, original NEW/OLD group, duplicate students and canonical duplicate
registrations. Never infer original group from current batch. Unknown/date-only
admissions need an approved representation before promotion; this phase does not
invent timestamps. Staging supports review storage, not a finished import UI/API.
A future import transaction must use the same locks, preserve supplied identifiers,
reconcile annual/monthly watermarks upward, and audit promotion. Closed-history
correction and century-format policy also require review.

Fees, results, notices, reports, QR onboarding, file storage, backup/recovery and
application Auth/RLS policies remain future work. The new project's OpenGlass
interface is intentionally not connected to this database foundation.
No subscriptions, payment enforcement or billing implementation is introduced.

## NEW-project reproduced validation

Executed in `C:\Projects\ics-hansi` using existing Python 3.12.0 and PostgreSQL
18.6 binaries; no dependency installation and no existing database connection.

```powershell
python -E supabase/tests/run_disposable.py --pg-bin "C:\Program Files\PostgreSQL\18\bin"
```

`-E` ignores Python environment flags, keeping the runner's assertions enabled.
Process-local TEMP/TMP were set to this project's `.next/supabase-disposable`.
Result: **52 assertion groups passed; exit code 0**. Exact sequence:
001 -> 002 -> rollback-only foundation.sql -> local Auth shim -> 003 -> 004 ->
005 -> final behavior/security/concurrency assertions. The five SQL migrations
and all tests were run unchanged. The shim ran ONLY inside this fresh local cluster.

The runner stopped its own cluster in finally. Ignored execution log:
`.next/supabase-foundation-test.log`; stopped cluster and PostgreSQL logs:
`.next/supabase-disposable/ics-phase52-test-pzp6l2l2/`. These are local test outputs,
not application data or files to commit. No required local test prerequisites were
missing. This reproduction does not validate real Supabase Auth/JWT/PostgREST,
remote migration execution or any production access policy.

## Historical OLD-project validation record

The following environment observations and result were inherited from the old
project. They are historical evidence, independent of the new run above.

Existing PostgreSQL 18 binaries were found on disk at
`C:\Program Files\PostgreSQL\18\bin` even though psql was not on PATH.
An existing PostgreSQL Windows service was left untouched. Docker/Supabase CLI were
not found in the inspected PATH/common install locations; WSL reports not installed.
No software was installed and no existing/hosted database was contacted.

Run with an existing Python 3 and PostgreSQL installation:

```powershell
python supabase/tests/run_disposable.py --pg-bin "C:\Program Files\PostgreSQL\18\bin"
```

The runner accepts NO connection URL/database target. It clears inherited PG
connection variables, initializes a new OS-temp cluster, binds exclusively to
127.0.0.1 on a dynamically selected port, runs psql with ON_ERROR_STOP, and stops
its own cluster in finally. Local trust auth is confined to this disposable
loopback instance. Stopped files/logs are retained in OS temp, not committed. Do
not substitute the existing Windows service database. Port collisions fail safely.

Execution order: 001 -> 002 -> legacy rollback-only `foundation.sql` -> local Auth
shim -> 003 -> 004 -> 005 -> new behavior/concurrency/security assertions.
The original test suite runs before 003 because its fixed-batch/one-letter schema
assertions intentionally describe the old foundation, not the revised final model.
The new runner tests the FINAL generated columns and actual allocation functions.

Historical OLD-project result: **52 assertion groups passed on local PostgreSQL 18**, covering original
constraints, five-migration execution, four default seeds, custom/edit/archive,
room confirmation/conflicts, audited scheduling/teacher assignments, independent
centres, Kolkata month/year boundaries, NEW/OLD sharing, duplicate registrations,
9999/10000/1000000 IDs, bigint failure, smallest-gap and future-safe roll reuse,
transfers/reactivation, historical attendance/roll integrity, rollback fault
injection, idempotency and current role checks. Separate real concurrent psql
clients tested admissions, both groups, same/different operation keys and opposing
transfers. Non-owner anon/authenticated roles were tested with normal no-grant
access and hypothetical accidental table grants; FORCE RLS kept reads empty and
writes denied. PUBLIC has no private-function execute permission.

Supabase JWT validation/Auth service/PostgREST, actual hosted-version compatibility,
real RLS role policies, large-volume performance, disaster recovery and paper-import
promotion are NOT tested. PostgreSQL 15+ is a compatibility target, not an executed
version matrix. UI builds do not validate SQL and were not required for this
SQL-only phase. See `tests/allocation-review.md` for remaining acceptance gates.

## Future persistent student sessions (design only)

Students will enter Digital Student ID and password after office-approved identity
verification and a secure short-lived, single-use invitation. The invitation must
be bound to the verified student, stored hashed, expire, and be consumed atomically;
an ID alone is never proof of ownership. Account linking and password setup must
use supported Supabase Auth flows. No passwords belong in application tables/logs.

Supabase password login needs a supported Auth identity (email/phone); Digital ID
is an application login alias, not a native arbitrary Auth username. The Auth
milestone must design protected alias resolution, generic errors/rate limiting,
recovery and account linking without exposing private email/phone mappings.

Use supported persistent session storage and refresh-token rotation, with the
appropriate Next.js server/browser clients and server-validated authorization.
Persistence should survive reload, browser closure and device restart when browser
storage is retained. Here "storage" means persistent storage/cookies, not the
browser sessionStorage API, which cannot guarantee survival across browser closure.
Do not invent never-expiring application tokens. Sessions can end on explicit
logout, revocation, suspension, security events, configured expiry or data deletion.
Never place passwords or privileged/service credentials in client-accessible
storage. Ordinary Auth session material needs the supported client storage model,
XSS protections and redaction from logs; cookie/storage details remain deferred.

Students can access only their office-linked records through RLS and server checks.
Admin/Manager require stricter policies (MFA, inactivity limits and reauthentication
for sensitive actions), with exact enforcement/configuration decided at Auth time.
Account suspension must be checked on protected operations rather than assuming
an issued access token immediately disappears. No application login, invitation activation or persistent Auth session
has been implemented or verified in this phase.

## References

- PostgreSQL row security: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- PostgreSQL ranges/exclusions: https://www.postgresql.org/docs/current/rangetypes.html
- Supabase functions: https://supabase.com/docs/guides/database/functions
- Supabase persistent sessions: https://supabase.com/docs/guides/auth/sessions

## Role-boundary validation (new project)

On 2026-10-12, **71 assertion groups passed** on Python 3.12.0/PostgreSQL
18.6 (52 baseline + 19 role-boundary groups). The disposable cluster stopped
successfully. Log: `.next/supabase-role-model-test.log` (ignored local evidence).
ESLint, TypeScript, Next.js production build and the 12-file OpenGlass integrity
check also passed. These application checks do not establish production SQL safety.

The extended runner applies named migrations 001/002, the rollback-only foundation
fixture, the LOCAL Auth shim, then 003�005 and all 52 baseline assertion groups.
Only then does it apply 006 and test exact history mapping, role transitions,
escalation/self-grant rejection, centre boundaries, Platform Owner isolation,
revocation/regrant, disabled/future grants, concurrent same-key role grants,
teacher-role revocation, accidental-grant RLS denial and private helper privileges.

No real Supabase authorization is reproduced by this local superuser suite.
Admin/Platform Owner provisioning, production RLS/read/write policies, student
linking, MFA, financial approvals and deterministic simultaneous role-revocation/
assignment/session races remain required security gates. Existing teacher assignment
history is retained on role revocation; future academic access must check both a
current Teacher grant and a current assignment on every request.

Keep disposable PostgreSQL data outside `.next`: Next.js builds clean that directory.
