# ICS Hansi backend foundation

## Current boundary

This is an offline, private database foundation. The five inherited migrations remain unchanged. The disposable runner now tests
the baseline before applying additive migration 006. No application connection, live
Auth, production migration, financial module or backend endpoint exists here.
OpenGlass remains presentation-only. Do not provide UI components with database
credentials, session objects or records beyond authorized display props.

## Centre isolation

Use a separate Supabase project per centre. Retain `branch_id` on business tables
and composite foreign keys as defence in depth; the inherited `branches` table
means centres. Never accept client-supplied roles or centre ownership as authority.
A platform-controlled registry must approve globally distinct prefixes: separate
databases cannot enforce their global uniqueness. Hansi's configured paper prefix
is `H` and complete digital prefix is `IH`. Prefixes are immutable once configured.
Platform Owner infrastructure access is distinct from ordinary application access.

## Batches and identity

- Four default actual batches: New General, Old General, New Guarantee, Old
  Guarantee. Additional actual batches require explicit NEW/OLD grouping. Trial
  is an admission status, never a fifth default batch. Seeds have unconfirmed
  room placeholders and remain draft until office provisioning is complete.
- Student UUID, permanent Student ID, Registration Number and batch Roll Number are
  separate identifiers. The first three remain permanent; membership/roll changes
  insert history rather than overwrite identity. Cross-centre transfer is not an
  implemented workflow and must not silently rewrite `branch_id` or issued IDs.
- Digital ID: complete centre prefix + original admission year's final two digits
  + annual sequence padded to at least four digits, e.g. IH260001, IH2610000.
  Store full year and enforce structured and display uniqueness. Never truncate
  an overflow; century-format collisions require an approved future format.
- Registration Number convention: `HMM/YY NUMBER`. Monthly NEW and OLD counters are independent;
  NEW is shared across NEW batches, OLD across OLD batches. Use Asia/Kolkata and
  literal `0` + integer for NEW, `00` + integer for OLD, without extra padding.
  Examples: H06/26 01, H06/26 010, H06/26 001. Progression, paid upgrade and
  reactivation retain the original registration. Historical imports need their
  own evidence/reconciliation workflow; do not allocate replacements for missing
  paper values.

## Allocation and history

Verified admission atomically allocates annual/monthly counters, permanent
registration, membership and smallest free positive batch roll, then appends audit
events. All writes roll back together. Unique centre/operation/idempotency keys
bind the actor and canonical payload; authorization is checked before replay.

Student locks, sorted batch locks and consistent counter ordering serialize
operations. Half-open membership/roll intervals allow reuse exactly when previous
ownership ends; future reservations are considered. Exclusion constraints remain
the final overlap boundary. Attendance references the original membership, not a
current-roll lookup. Direct privileged writes remain outside workflow guarantees.

## Default-deny security

All 21 private tables ENABLE and FORCE RLS. No policies or application grants
exist. Private helpers use SECURITY INVOKER, qualified names, restricted
`search_path` and revoked PUBLIC execution. They are not production RPCs. Do not
grant broad DML or disable RLS to make them callable. Design reviewed server/RPC
entry points and narrowly scoped grants/policies together, with current enabled
account, centre, role and assignment checks. Superuser/BYPASSRLS credentials remain
infrastructure privileges, never application identities.

## Proposed five-role permission matrix

This is a least-privilege DESIGN TARGET, not implemented authorization. Unless a
permission is explicit, deny it. A Platform Owner grant does not imply Admin rights.

| Role | Student records | Operational writes | Sensitive authority |
| --- | --- | --- | --- |
| Platform Owner | No automatic private-record access in any centre; sanitized platform health/provisioning metadata only | Centre/prefix provisioning through a separate control plane | No automatic centre role grants, finance or teacher-assignment authority. Any separate centre Admin access requires an explicit approved, scoped, revocable and audited grant. |
| Admin | Authorized records within their explicitly assigned centre only | Admissions, batches, rooms, schedules, transfers and oversight within centre | Audited centre role administration, teacher assignments and configured financial approvals; cannot grant Platform Owner or self-escalate. Admin bootstrap/peer Admin grants need a separate approved provisioning path. |
| Manager | Centre records needed for office operations; no other-centre access | Pending student intake, verified admission, routine progression, departure/reactivation and attendance corrections through approved workflows | May record receipts against approved fees once a ledger exists. No role grants, teacher assignments, fee-policy changes, waivers, refunds, reversals or unaudited edits. Paid upgrades require approved financial authorization. |
| Teacher | Minimum roster identity and academic data for currently assigned centre/batches; no unnecessary contacts or finance | Assigned-batch attendance, homework and marks; direct marks confirmation without Manager approval, with audited corrections | No role administration, teacher assignment, admission/ID allocation, transfers or financial operations. Revocation/assignment expiry removes access. |
| Student | Only office-linked own profile, fees, attendance and published results/notices | Explicitly permitted self-service requests; no authoritative record mutations | No access to other students, role administration, assignments, fee configuration, marking or identity allocation. ID alone cannot activate an account. |

Role administration, financial operations and teacher assignments require server
authorization on every request, current centre/role validation, strict input
allowlists, atomic idempotency, actor/reason and before/after audit records. Apply
MFA/reauthentication to sensitive staff actions and test simultaneous revocation.
Financial records must use append-only ledger entries and controlled reversals,
not overwrite/delete. These capabilities remain disabled until implemented and
tested; the inherited enrollment helper does not authorize paid upgrades.

## Implemented role boundary (006)

Legacy `role_assignments` is frozen, including revoked and future grants. New
`centre_role_grants` copies all non-developer history with original IDs, actors,
timestamps and source references: owner_admin maps to admin and
teacher_invigilator maps to teacher. Developer evidence remains only in the legacy
table and confers no business authority. No Platform Owner grants are inferred.
`platform_role_grants` is a separate control-plane membership with no implicit
centre rights. Both new tables retain FORCE RLS with no policies or app grants.

Private invoker helpers use current enabled centre accounts and current new grants.
Admin-only `manage_centre_role` grants/revokes Manager, Teacher and Student roles,
rejects self-administration, checks centre scope before mutation, and records
idempotent actor/reason/before/after audit evidence. Grants are immutable except
one-time revocation. A revoked role requires a new grant, preserving history.
Admin/Platform Owner bootstrap, peer grants and revocation need a separately
reviewed provisioning workflow; there is intentionally no such application API.
Teacher assignment checks the new Teacher role; invigilation remains a future
explicit assignment capability, not an automatic permission.

Authorization takes shared account/grant locks; revocation takes a conflicting
row lock. An already-authorized transaction may finish before revocation commits;
subsequent operations must reauthorize. Database owners/BYPASSRLS can bypass RLS
and create grants directly: infrastructure credentials remain outside the app trust
boundary. Never expose these private invoker helpers with broad table grants.

## Canonical management workflows

Use one canonical management workflow per task. Do not introduce duplicate
management forms or reproduce old UI patterns. Provide simple search and only
filters relevant to the task. UI visibility is never an authorization boundary.

## Validation boundaries

The disposable runner accepts no database URL. Exact sequence:
001 -> 002 -> rollback-only `foundation.sql` -> `local-auth-shim.sql` ->
003 -> 004 -> 005 -> baseline behavior/security/concurrency assertions ->
006 -> role boundary/security assertions.
The Auth shim is local-only and must NEVER run on actual Supabase. Test assertions
must remain enabled (use Python without optimization). The runner names every migration explicitly and rejects an unexpected migration
list, keeping legacy assertions at the correct schema version.

See `supabase/README.md` for new-project execution evidence. PostgreSQL 15+ is a
target, not a tested version matrix. Real JWT/Auth/PostgREST, financial upgrade
authorization, paper-import promotion, load/role-race testing, backup/recovery and
operational alerts remain unresolved acceptance gates.

## Role-aware presentation workspace (UI preview)

The default running app is an explicitly labeled Centre Admin demo UI with no authenticated session. `workspace-roles.ts` is the canonical presentation feature map; `navigation.ts` derives existing module links/descriptions from it. `AppShell` accepts a presentation role and tenant branding props, and `RoleDashboard` renders role-specific unavailable summaries in one shared visual system. There is no client role switcher, session inference, permission enforcement or new role page.

| Role | Planned navigation and dashboard scope | Implementation boundary |
| --- | --- | --- |
| Platform Owner | Platform overview, centres, provisioning, branding, centre administrators, future subscriptions/modules | Separate platform workspace; no centre student/attendance/fee links and no automatic private-data access. No platform routes or provisioning implemented. |
| Admin | Centre Dashboard, Students/admissions, Batches, Attendance, Tests & Results, Homework, Fees, Staff, ICS Updates, Settings | Existing fictional/demo routes preserved. Sensitive administration and financial writes remain disabled. |
| Manager | Daily centre operations, admissions, batches, attendance, financial follow-ups, academic oversight and updates | Existing demo routes only. Staff coordination needs explicit grants; role changes, assignments, refunds/waivers and fee-policy controls are not authorized by this UI mapping. Settings currently means personal appearance. |
| Teacher | Assigned students/batches, attendance marking, tests/marks, homework assignment/physical checking, relevant updates and personal preferences | All scoped-workflow routes remain unlinked/planned. Do not reuse unrestricted directory or finance routes. Require current assignment-scoped queries and revocation tests. |
| Student | Own profile/batch, attendance, fee/payment information, published results, homework status, relevant updates and personal preferences | All personal routes remain unlinked/planned. Require office-linked identity and self-only RLS. Never use centre student-directory routes as the student portal. |

Client navigation filtering is presentation only. Every eventual request must derive verified identity, centre and capabilities server-side, with default-deny RLS and explicit tested policies. Platform registry access must not imply student-record access. Role administration, financial operations and teacher assignments require independent capability checks, audit records and concurrency/revocation coverage. Preserve one canonical management workflow per entity. Non-admin/manager mobile navigation is intentionally not activated before scoped routes exist; no fake role portals or login flows are provided.

## Enrollment lifecycle, audit and ledger design (UI preview only)

The frontend demonstrates date-only enrollment periods, an unsaved renewal preview,
a demo batch schedule, fictional audit events and fictional ledger rows. These
fixtures are labelled and live only in source code; forms do not save, allocate
identifiers, confirm payments, or append local records. The demo role is Centre
Admin only as a presentation default. Manager ledger/audit views remain hidden
until explicit centre capabilities exist. This does not enforce security.

The target relationship graph is centre-scoped throughout:

```text
tenant/centre -> students -> batch_enrollments -> enrollment_periods
                                  |                    |
                                  |                    +-> renewals (append-only)
                                  +-> batch -> teacher_assignments
students -> invoices -> fee_payments -> receipts -> ledger_transactions
tenant/centre -> ledger_categories -> ledger_transactions
tenant/centre -> audit_events (actor, action, target, outcome)
users -> centre_role_grants / scoped_user_permissions
```

Each centre-owned row carries the tenant/centre key and uses composite foreign
keys for tenant-consistent references. Batch membership and validity dates belong
to an enrollment period, not to the student or batch row. Renewals and transfers
insert a new period and retain prior batches and roll-number intervals. A server
transaction locks the student and relevant batches, checks current role and
teacher assignment grants, rejects overlapping periods, allocates the smallest
free roll, and appends renewal, audit and idempotency records together. Student
IDs and registration counters remain server-allocated and permanent. Date-only
expiry is evaluated in the centre's configured timezone.

Audit events are append-only, with server-generated IDs/timestamps, centre scope,
verified actor and role, action/module/target, minimized before/after changes,
required reason and success/failure outcome. Failed security-sensitive attempts
are also captured. Corrections append events; normal application roles cannot
update or delete history. Browser-generated events are never authoritative.

An optional personal ledger is a separate future private workspace. It must use
its own owner-only data boundary, balances, exports and audit trail; centre
Managers, Teachers and Students receive no access, and its entries must never
join or aggregate into a centre ledger or centre financial report. It is not
implemented in the demo. Any delegated support must use a distinct, explicit,
time-bounded grant and be audited separately.

The ledger is a separate append-only transaction journal. Posted fee income comes
only from confirmed payment transactions; an unpaid invoice is not income. Store
money as integer minor units with an explicit currency/scale (or an equivalently
exact database decimal), and calculate reporting totals from posted entries.
Refunds, reversals and corrections append signed adjustment entries linked to the
original transaction. They never erase or rewrite the source. Unique idempotency
keys prevent duplicate posting. Payment, receipt, ledger and audit rows must be
created atomically by a trusted backend workflow. Demo browser summaries use
integer paise only to illustrate this rule.

Centre Admin has centre-scoped audit and ledger permissions only. Manager access
is independently grantable by centre and capability; this preview grants none.
Teachers receive no general financial ledger or audit access, students receive no
administrative views, and Platform Owner has no automatic access to private
centre records. A support grant must be explicit, scoped, expiring/revocable and
audited. Role administration, financial operations and teacher assignments remain
separate security-sensitive capabilities. Frontend route hiding is not an
authorization boundary; implement server-verified permissions and default-deny
RLS policies with tests before connecting any of these modules.

CSV examples in the Export Centre cover fictional directory, batch and enrollment
rows, audit examples, and ledger-derived statements. Formula-leading cells are
escaped. Student fee collections, renewal collections and outstanding-fee
reports remain disabled because no invoice/payment source exists. Excel and PDF
remain disabled. Export audit records must be written server-side once connected.
