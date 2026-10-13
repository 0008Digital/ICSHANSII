# Student admission, enrollment and fee boundary

This frontend is a fictional preview. It does not admit students, issue permanent IDs or roll numbers, confirm payments, create receipts, post ledger entries, archive students, or write attendance.

## Enrollment dates

Admission duration uses calendar months. A due date is the same calendar day after the selected number of months; if that day does not exist, it clamps to the last day in the target month. For example, 31 January plus one month is 28 February in a common year and 29 February in a leap year. The inclusive enrollment period ends one day before the renewal due date. Thus 1 November plus three months is due 1 February, and the original period ends 31 January.

Renewal and enrollment statuses remain separate from fee follow-up. `Renewal Due` is an enrollment nearing its end. `Expired Enrollment` begins after the inclusive enrollment end date. Expiring or expired enrollment never moves a student to another batch, deletes a profile, or archives the student. Renewing or rejoining must append an enrollment period to the existing student identity.

## Fee status and payment history

Fee status is derived from a fee obligation's remaining amount and promised payment date. A non-zero balance is `Pending` through the promised date; it becomes `Expired Fees` on the following date if unpaid. A zero balance is `Paid`. This status does not depend on enrollment expiry, and changing a promise must be audited without erasing its prior value.

Money in calculation helpers is integer paise. Future payment history is append-only per enrollment/fee obligation and must retain permanent student ID, obligation reference, amount, payment date, server recorded timestamp, payment mode, transaction reference, receipt number, recorded-by staff identity, and correction/reversal links. A repeated request must be idempotent. Trusted server transactions must verify centre and branch scope, authorization, balance, assignment/grant requirements, and audit events before confirming a payment or posting its matching ledger entry. Receipt numbers and actor identity are server-owned.

## Current preview boundary

Admission and Fees screens calculate unsaved scenarios only. Payment previews are separate page-session drafts; no confirmed transaction list exists. Student profiles therefore show fee totals and payment history as unavailable. Demo CSVs explicitly state that balances are not connected and do not invent payment rows. The current role navigation and disabled controls are presentation hints, never authorization.

Student Archive and rejoin remain unavailable because the fictional records contain no `Left` or `Completed` archive events. Expired enrollment and unpaid-fee examples cannot populate an archive. Attendance preview data is likewise unsaved; teacher-to-batch assignments and issued roll numbers are not connected, so a roll-number lookup cannot identify a student.

## Backend work required

Implement centre-scoped authentication and row-level authorization, permanent identity and batch-roll history, append-only enrollment periods, archive/rejoin history, fee obligations and promises, atomic idempotent payment/ledger posting, receipt allocation, immutable correction/reversal events, teacher assignments, attendance register transactions, export authorization, and audit logging before exposing these operations as real workflows.
