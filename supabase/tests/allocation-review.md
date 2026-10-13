# Phase 5.2 allocation acceptance and remaining gates

Executed locally: `run_disposable.py` initializes its own PostgreSQL 18 cluster,
uses real psql connections and stops that cluster. No hosted database is accepted.
52 assertion groups passed; original foundation tests are included before 003.
The local Auth shim is explicitly NOT Supabase Auth integration.

## Verified locally

- Exactly four DEFAULT actual batch seeds; additional actual batches explicitly
  choose NEW/OLD and one room. No category/sub-batch hierarchy.
- Seed room placeholders remain unconfirmed/draft; activation requires office
  confirmation. Same-room weekday/date/time conflicts fail, adjacent times work.
- Owner-controlled batch create/edit/archive, schedule changes and teacher
  assignments append audits; retries do not create duplicate rows/events.
- Hansi complete centre code IH; separate test centre IX independently starts
  annual/monthly sequences and per-batch rolls at 1.
- NEW shared across NEW batches, OLD shared across OLD batches; canonical and
  structured registration uniqueness. Positive unpadded formats cannot collide.
- Kolkata year/month boundary tested using the SAME private counter primitive
  called by verified admission, not a duplicated date calculation.
- Digital display 9999, 10000, 1000000 is nontruncating. Bigint overflow aborts.
- Atomic verified admission; identical key/payload/actor returns stored result.
  Different actor/payload conflicts; different keys same student issue once.
- Permanent identity/registration/counters/history/operations/audit guards.
- Smallest free roll 1 or interior gap; future reservations considered for the
  entire open-ended interval. Closed historical overlap remains rejected.
- Transfers and reactivation keep both identities and preserve roll intervals.
  Attendance references original membership and enforces observation containment.
- Real concurrent clients: NEW and OLD admissions across batches, simultaneous
  same-key retry, different keys for same student, opposing transfers. Thread
  barriers launch clients together; transaction sleeps keep locks held briefly.
- Failure injected at audit insertion AFTER counter/identity/membership changes:
  no partial registry, counters, activation, membership or audit survives.
- Wrong-centre actor/room relationships and authorization fail.
- Teacher/Student/Developer/disabled/unlinked/anonymous actor denial; Manager
  revocation prevents later replay. Role claims are read from database records.
- anon/authenticated role access denied; accidental read grants still yield no
  rows under FORCE RLS; writes fail. No PUBLIC function execution grants.
- Missing paper identifiers preserved as raw staging values; no fabricated ID.

## Before application access / Phase 5.3

1. Test against an approved disposable REAL Supabase environment/version, with
   actual auth.uid/JWT validation, PostgREST, supported sessions and token refresh.
   The shim only supplies a subject for privileged algorithm tests.
2. Design narrow server/RPC entry points and table grants/RLS together; invoker
   primitives are not production RPCs. Never grant broad table DML to make them work.
3. Secure owner bootstrap, role grants/revocations, student-account linking,
   invitation/recovery/MFA, teacher-assigned and student-own read policies. Test
   role-race cases and forged/expired/disabled identities against real Auth.
4. Confirm physical rooms and schedule rules. Current weekly exclusions are
   conservative for short validity windows without a shared weekday occurrence;
   holiday/overnight exception support requires review. Replanning room changes
   must retain audit snapshots. Add representative-volume query/locking tests.
5. Approve centre code registry and future century-format strategy. Separate
   projects cannot enforce globally unique prefixes. Never reuse issued IDs.
6. Complete paper-import promotion with evidence, duplicate office resolution,
   date-precision representation, original group verification, counter watermark
   reconciliation and atomic audit. Do not use new-admission allocation for imports.
7. Integrate paid General -> Guarantee upgrade authorization with an approved
   financial ledger before exposing enrollment operations to application users.
8. Implement backup/recovery verification, audited correction tools and operational
   failure monitoring. Direct infrastructure owner writes remain privileged.

No UI connection, live Auth, finance collection, hosted migration or billing work
was performed. Existing app fixtures/routes and AGENTS.md are preserved.
