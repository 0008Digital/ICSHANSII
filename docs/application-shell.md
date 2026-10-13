# ICS Coaching application shell

The shell is a presentation-only foundation. No authentication, Supabase client,
role impersonation, writes, payment collection or upload endpoints are connected.
Only the Students route contains fictional example records, with DEMO identifiers.
The four batch names describe planned structure, not live enrollment.

## Canonical locations

- `/`: Dashboard overview and navigation only.
- `/students`: student directory and future single student-management workflow.
- `/batches`: batch structure, membership and future assignment workflow.
- `/fees`: receipts, balances and approved financial workflows.
- `/attendance`: registers and audited corrections.
- `/staff`: staff records and approved role administration. Batch teacher assignment
  belongs to Batches; Staff can link there rather than duplicate its editing flow.
- `/tests-results`: tests, marks and published results.
- `/homework`: homework and submissions.
- `/ics-updates`: centre notices, WhatsApp-style photo statuses, pinned current
  timetable images and accessible dated history. No standalone timetable module.
- `/settings`: the sole appearance control and future centre configuration.

One management workflow per entity/task. Dashboard has no editing controls.
Keep simple search and relevant filters only; do not duplicate forms between pages.

## Implementation boundaries

`src/components/ics/` owns the shell, navigation, headings, data surface and theme
control. Upstream Glass is reserved for navigation chrome; tables use opaque,
high-contrast surfaces. Reuse these app-owned boundaries; never edit vendor files
for app styling. Server-rendered layout/pages wrap narrow client islands for
navigation, local fictional filtering and the theme control. All ten destinations
are statically generated. No external images/fonts or new dependencies are used.
Mobile navigation offers four common destinations and a native keyboard-accessible
More disclosure for the remainder. Theme preference remains in the existing single
store; OpenGlass retains system/reduced-motion/capability behavior.

## Remaining implementation

Reviewed authentication, centre-scoped RLS/APIs and role provisioning precede real
records. Finance, assignment authorization and audited writes require their own
security gates. Photo statuses require private media authorization, safe uploads,
text alternatives, publication/expiry rules and retained timetable history. No
placeholder button suggests that these capabilities work today.

## Students and admissions preview milestone

Dashboard is a compact navigation overview with no invented statistics. Students
has one directory (name/demo ID/phone search, batch/status filters), desktop table
and mobile record list. `/students/new` is the sole admission preview form.
`/students/[studentId]` is the fictional profile, and its `/edit` route is the sole
personal-details edit form. Shared fields and validation live in ICS-owned student
components. All fixtures, phone numbers and custom-batch approval are fictional.

Forms never save, persist records or generate official identifiers. Batch/status
changes are not personal-detail edits. Profiles link to Fees, Attendance and Tests
& Results for their management workflows; those modules remain disconnected.
Authenticated centre-scoped authorization/RLS, approved batch data, audited
idempotent admissions with backend ID/counter/roll allocation, private-data
validation and protected finance/academic APIs are prerequisites for real records.
