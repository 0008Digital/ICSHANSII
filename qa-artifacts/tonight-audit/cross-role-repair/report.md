# Cross-role repair — 15 October 2026

Status: partial repair, stopped for review. Earlier Phase 6 fixes and reports retained. No backend, Git history, deployment, preservation manifest or baseline changes.

## Verified causes and scoped changes

- Teacher navigation changed hash/active state but the server-rendered dashboard always rendered the same six overview cards and fixed title. Teacher now subscribes to section location and shows the selected existing card with its corresponding title. Home retains the overview. Student had the same all-sections rendering pattern; selected hash sections now show their own existing content and hide Home overview. No backend functionality added.
- Shared header grid and shrinking tools flex item compressed the demo selector to about 35px near tablet width, while the visible label wrapped and the 32px select differed from adjacent 40px controls. Search/tools overlapped by about 10px. Shared grid now reserves intrinsic tools space, permits search shrinkage, gives selector a stable width/height, and uses icon-only Quick Actions at tablet widths. Accessible role label remains available.
- Section commit recognizes intentionally hidden role section targets in the active main and scrolls selected views to the page top. Existing ordinary Developer section anchors retain scroll behavior.

## Exact application/test files changed this session

- src/components/ics/workspace-bar.css — shared header sizing/grid.
- src/components/ics/demo-workspaces.css — selector sizing/accessible label and Student Home wrapper spacing; existing edits retained.
- src/components/ics/teacher-dashboard.tsx — hash-dependent title and selected section visibility.
- src/components/ics/student-portal.tsx — selected section visibility/title and active in-page links; Phase 6 greeting retained.
- src/components/ics/use-role-section-navigation.ts — reactive hash subscription.
- src/components/ics/section-navigation.mjs — scoped hidden-target handling.
- scripts/rendered-section-browser.mjs — new browser assertions checking actual visible sections and overview absence.

All evidence/report files are within this cross-role-repair directory. changed-existing-files.txt compares session-start SHA256 inventory; start-status.txt and final-status.txt record the pre-existing and final uncommitted tree. No unrelated source files changed this session.

## Browser coverage actually completed

- New rendered-content suite: 36 passed / 0 failed. Teacher Assigned Students, Assigned Batches, Tests & Results, Homework at 320 and 1440. Student A and B Classes & Batch, Attendance, Tests & Results, Fees, Profile, Homework, ICS Updates at 320 and 1440. Teacher mobile used direct hash entry rather than desktop sidebar clicks; Student used in-page links. Results in sections-final/results.json.
- Existing Admin/Manager route suite: 64 passed / 0 failed, both roles desktop1440 and mobile320, navigation lists, all contracted routes and three student detail routes. Includes dashboard, Students, Batches, Attendance, Tests & Results, Homework, Fees, Staff, ICS Updates, Chatrooms, Settings; Admin also Ledger and Audit Logs. Exact results in admin-manager/results-current.json. No visual baseline capture enabled. These are route/geometry checks, not all business workflows.
- Shared header: six identities (Developer, Admin, Manager, Teacher, Student A/B), Light requested320/360/390/768/1024/1280/1440 and Dark320/1440. 54 geometry/computed-style records in header-matrix.json, summary CSV and 30 representative header screenshots. Requested768 produced767 CSS pixels; exact768 is NOT verified. Extra769 observation showed h1 top98px at scroll0. Search/actions no longer overlapped in the recorded matrix. Original per-identity themes restored through Settings UI (original-themes.json); final role restored to Manager and viewport override reset.
- Teacher click changes and browser Back/Forward selected exactly one corresponding card in teacher-history.json.

## Remaining defects / uncertainty / gaps

1. Teacher direct hash entry/reload remains uncertain: immediate DOM readings show Teacher Dashboard and all six cards even after heading wait, while click-driven selection and the 320 direct-entry suite passed. The browser wait returned despite contradictory DOM state. Raw teacher-history.json, teacher-direct-settled.json and teacher-reload-final.json are retained. Do not call direct/reload behavior resolved; independently reproduce with settled screenshots and hydration timing before more changes.
2. Near requested768/actual767, header brand compressed to its icon and h1 top was about32px beneath the fixed header in multiple home-route records. Extra769 reading was normal. Breakpoint-boundary layout remains unresolved; do not extrapolate the successful320/1440 checks to exact768.
3. Teacher Assigned Students uses existing section title Students rather than the sidebar wording Assigned Students. Teacher tools also expose existing separate Tests/Homework routes alongside hash previews. Consistency review remains; no invented routes.
4. Browser document title on hash sections may retain landing-page title; only rendered h1/content covered.
5. Developer individual console anchors, Teacher Rapid Attendance/Chatrooms, Student Chatrooms/Help & Settings, rapid successive clicks/repeated activation, Student Back/Forward/reload and role-switch state clearing have not all been retested after this repair. Header role switching was exercised, but this is not comprehensive navigation regression coverage.
6. Expanded search, Quick Actions, dropdowns, forms and floating controls were not exhaustively checked at every width/theme. Dark section-content combinations and all sections at360/390/768/1024/1280 remain gaps. Settings interaction/lens suite was not rerun this session; Settings implementation untouched.
7. Intentional disconnected backend previews remain unavailable. No real records were changed.

## Validation

- TypeScript: passed, final exit0 (typescript-final.log).
- Targeted ESLint for changed TypeScript/new browser test: passed, final exit0 (eslint-final.log). Earlier full lint also passed (eslint.log).
- Local production build: passed, final exit0 (build-final.log).
- git diff --check: passed; Git emitted line-ending notices only.
- Node section-navigation and Phase1 centre regression: 26 passed / 1 failed of27 (node-tests.log). Failure is preservation hash guard: 21 already modified protected files plus this session's authorized workspace-bar.css =22 mismatches. Manifest was not changed. This failure is separate from browser interaction results.
- All56 indexed visual baseline image SHA256 hashes matched. No baseline updates.
- Initial new browser harness had four false failures from cross-realm array deep equality; corrected comparison to joined IDs. Initial output preserved in sections/initial-harness-failures.json. Two suite invocation errors (missing await on async factory; wrong mobile size key) occurred before affected checks and were corrected; not application failures.

## Evidence

Before: teacher-before.jpg, header-tablet-before.jpg, header-before.json.
After: teacher-desktop-after.jpg, teacher-tablet-after.jpg, studentB-320-after.jpg and role/width/theme header images.
These are investigation evidence, not approved visual baselines. Full-site coverage is NOT claimed.
