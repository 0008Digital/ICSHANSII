# ICS Hansi browser QA — 14 October 2026

Tested the existing website at **http://localhost:3000** using direct browser interaction in the Codex in-app Chromium browser. No application code was edited and no real records were changed. Findings below describe observed demo behavior, not a production security assessment.

## Environment and scope

- Project: `C:\Projects\ics-hansi`; Next.js 16.4.0, React 19.3.0.
- An existing server served port 3000. The initial request for port 3001 failed; a second Next.js server was blocked by the existing instance. The subsequent user request specified port 3000, which was tested successfully.
- Desktop: 1440 × 900. Mobile: 390 × 844 across Centre Admin navigation and all five role layouts. Additional Student checks: 320 × 740 and 768 × 1024; Settings also checked at 768 px.
- UI explicitly reports that the backend is not connected. Placeholder pages, unavailable metrics, disabled live actions, and unsaved preview behavior were not counted as bugs.
- Only fictional input and local preview actions were used. Centre Admin dark-mode persistence was verified, then restored to System. Student B scene/interface motion was temporarily disabled for comparison, then restored to enabled/Full. Branding edits were draft-only and reset. Browser viewport override was reset.
- Temporary attendance, payment, chat, developer notes/status and report drafts were discarded by navigation/reload. No payment was confirmed, announcement delivered, admission saved, or real permission changed.

## Confirmed findings

### QA-01 — Report filters leave an unrelated editable detail panel visible

**Priority:** P2 · **Role:** Developer / Owner · **Page:** `/developer#bug-reports`

1. Select Developer / Owner and open Bug Reports.
2. Keep DEMO-BUG-001 selected.
3. Set Severity to Critical, or type `zzzzqa` in Search.

**Actual:** The list says “No matching fictional reports,” but DEMO-BUG-001's detail panel, Report status selector, and Developer notes remain available. Reproduced on desktop and mobile.

**Expected:** Clear the detail selection when excluded by filters, or explicitly identify the retained selection as outside the current results. The empty result state should not imply that an unrelated detail belongs to those results.

Evidence: [desktop screenshot](./developer-empty-filter-desktop.jpg).

### QA-02 — Student B shows Student A's welcome identity

**Priority:** P2 · **Role:** Student B · **Page:** `/student-portal`

1. Select Student A and observe “Good morning, Aarav” and New General.
2. Select Student B and allow the role change/navigation to complete.
3. Open Home again, or navigate away and return.

**Actual:** The selector is Student B, but Home still says “Good morning, Aarav,” with the same New General welcome details and preview figures. Reproduced on desktop and mobile, including a fresh navigation.

**Expected:** Reflect the selected fictional student identity, or clearly label this as a shared generic specimen instead of an identity-specific greeting. This is a demo identity inconsistency; no real student data exposure was observed.

Evidence: [Student B desktop screenshot](./student-b-aarav-desktop.jpg).

### QA-03 — A student's batch roll differs between directory/attendance and profile

**Priority:** P2 · **Role:** Centre Admin · **Pages:** `/students`, `/students/DEMO-001`, `/attendance`

1. Open Students and inspect Aarav Example: “Batch roll: 101.”
2. Open Aarav's profile and inspect Current batch enrollment.
3. Optionally open Attendance, keep New General, and search roll `101`.

**Actual:** The profile says “Batch roll number — Not issued,” while the directory shows 101 and Attendance matches Aarav using 101. The directory CSV also exports 101. The Enrollments directory view reports “Not issued” as well.

**Expected:** Use one consistent fictional enrollment/roll assignment across directory, profile, enrollment view, attendance and export, or distinguish legacy fixture rolls from current enrollment rolls explicitly.

Evidence: [directory](./directory-roll-101.jpg), [profile](./profile-roll-not-issued.jpg). Both CSV downloads were inspected and labeled DEMO DATA.

### QA-04 — Teacher assessment tool contradicts the no-assignment/no-roster state

**Priority:** P2 · **Role:** Teacher / Staff · **Pages:** `/teacher-dashboard`, `/attendance`, `/tests-results`

1. Select Teacher / Staff.
2. Observe Dashboard: assignments are not connected, Students says “Roster unavailable.”
3. Open Rapid Attendance: the page blocks the roster because no verified teacher-to-batch assignment exists.
4. Return to Teacher Dashboard and use **Teacher tools → Tests & Results**.

**Actual:** The assessment tool provides a New General selector and an editable “Marks for Aarav Example” field despite the role's no-assignment state.

**Expected:** Apply the same assignment-state behavior to teacher tools, or explicitly identify this assessment as a separate unrestricted fictional sandbox. This finding concerns inconsistent preview behavior; it does not establish an authorization vulnerability or exposure of real records.

Evidence: [Teacher dashboard](./teacher-no-roster.jpg), [Teacher assessment roster](./teacher-assessment-roster.jpg).

### QA-05 — Motion-enabled mobile rendering shows horizontal washed-out bands

**Priority:** P2 · **Role:** Student B · **Page:** `/student-portal` · **Viewport:** 320 × 740

1. Use System theme, Motion background, Clear glass, Scene Motion enabled, and Full interface animation.
2. Open Student Home at 320 × 740.
3. Inspect the heading/welcome/Fees portion and capture the view again without changing the page.
4. For comparison, disable Scene Motion and select Off for interface animation, apply, and reopen Home at the same size.

**Actual:** Repeated motion-enabled screenshots show broad pale horizontal bands and blurred/washed-out portions of headings/cards. The comparison with both motion settings disabled removes the prominent bands. No document-level horizontal overflow was measured.

**Expected:** Text/cards remain readable without rectangular rendering bands while the scene is enabled.

**Scope:** Confirmed visually in this in-app browser only. The responsible layer and behavior in other browsers/devices remain unverified. The browser also logged a reduced-motion preference warning; no runtime error was captured in the inspected warning/error log.

Evidence: [motion enabled](./student-mobile-320.jpg), [motion disabled comparison](./student-mobile-320-motion-off.jpg).

### QA-06 — Expired Fees empty-state text repeats “fee”

**Priority:** P3 · **Role:** Centre Admin · **Page:** `/fees`

1. Open Fees.
2. Select **Expired Fees 0 connected**.

**Actual:** “No connected expired fees fee records.”

**Expected:** For example, “No connected expired fee records.”

Evidence: [Fees screenshot](./expired-fees-copy.jpg).

## Coverage and successful checks

| Area / role | Directly exercised |
| --- | --- |
| Developer | Console; all nine section links/targets; report search, severity/status filtering, selection, temporary status/notes; disabled notifications; chat-permission entry and denied message access; Appearance Settings and discard; Quick actions and bug-report preview. |
| Centre Admin | Dashboard; Students; Batches; Attendance; Tests & Results; Homework; Fees; Ledger; Staff; Audit Logs; ICS Updates; Chatrooms; Settings. All these destinations also opened through mobile navigation. |
| Manager | Dashboard, Students through keyboard search, Batches, Attendance, Tests & Results, Homework, Fees, Staff, ICS Updates, Chatrooms, Settings. Search excluded Ledger; mobile More excluded Ledger/Audit Logs. |
| Teacher | Dashboard; Assigned Students/Batches, Tests/Homework section links; Rapid Attendance; separate Homework and Tests & Results tool routes; Chatrooms; Settings; mobile dashboard/More menu. |
| Student | Student A and B; Home; all seven portal sections; Chatrooms; Settings; mobile section menu, narrow mobile and tablet layout. |
| Students | All six directory views; matching/no-match search; advanced filter disclosure; By Batch selector; inline admission and separate `/students/new` via global Add Student; profile `/students/DEMO-001`; edit form `/students/DEMO-001/edit`; transfer/conduct disclosures and fields. |
| Admission / edit | Empty required-field validation; fictional valid admission review; overpayment rejection; computed remaining fees; approved batch picker; edit required-field validation. No save performed. |
| Batches / attendance | Catalogue switch and validation; attendance lookup by roll, Present draft, register totals/review; mobile admission calendar, previous-month navigation and close. Future navigation was correctly disabled for admission date. |
| Assessments | Missing-field and marks-over-maximum errors; date picker; valid 75/100 proposed result review. No publication performed. |
| Fees / finance | Three fee-status views; collection missing-field validation; fictional ₹1,000 balance / ₹250 Cash installment preview yielding ₹750 remaining; ledger no-match search and zero filtered totals; ledger CSV download. |
| Audit | Timeline/table switch, second page, event-detail dialog and close. |
| Chat | All four Admin rooms; local preview message; report/hide controls; incident status; local role-access toggles. Manager/Teacher/Student defaults deny rooms; Developer sees configuration without centre messages. |
| Settings / OpenGlass | Light/Dark/System controls; all built-in backgrounds and Custom gradient editor; Clear/Regular/Frosted; accent preset and invalid custom hex validation; scene motion; Full/Reduced/Off; all five advanced sliders; keyboard min/max for optical intensity/frost; material comparison; floating lens keyboard control; discard; appearance apply/reload/restore; unsaved branding draft/reset. |
| Shared controls | Global search and keyboard Enter navigation; Quick actions; standalone Add Student; Export Centre report-type switch; directory and ledger CSV downloads and DEMO DATA content inspection; bug-report empty/valid preview and close. |

## Limits and observations excluded from bugs

- This is a broad interactive pass, not exhaustive testing of every input combination, matrix cell, date boundary, or repeated instance of a shared control. Individual file upload paths, invalid media files, all export types, every student record, and all optional transfer/conduct submissions were not exhaustively exercised.
- No real authentication, backend persistence, payment, message delivery, authorization enforcement, or production telemetry was available to validate. No real-data mutation was attempted.
- No Safari/Firefox/physical touch-device testing, screen-reader audit, production build test, load testing, or automated regression suite was performed.
- Homework, Staff, ICS Updates, published leaderboards and several live actions are expressly unavailable placeholders; they are product-completeness limits rather than confirmed defects.
- Early navigation sometimes retained the prior page during route compilation. Ledger/Audit Logs initially showed a generic title but later resolved to the correct titles; these transient observations were excluded.
- Browser interaction briefly timed out and recovered after reload. A restart attempt reported port 3000 already in use. This is not attributed to a website defect.
- Only QA Markdown/screenshots were added under `qa-artifacts/`; application source remained unchanged.
