# Missing visual coverage continuation — 2026-10-15

Read AGENTS.md, tonight-audit/report.md and phase6/report.md before testing. Phase 6 and the initial audit were not repeated. Browser work used localhost:3000 only. No application, test, helper script, manifest or baseline was edited in this continuation. Source/script SHA-256 comparison against start-hashes.json found zero changes. Existing uncommitted work remains in place; see start-status.txt and end-status.txt.

## Coverage added

50 full-page captures with DOM rectangles and computed font, line-height, gap, padding, overflow, position and z-index in visual/matrix.json. These are evidence captures, not 50 visual test passes.

- All six identities: landing and Settings at 1440px in the previously missing opposite theme (Admin Dark, Manager Light, Developer/Teacher/Student A/B Dark). Identity evidence saved separately.
- All six identities: landing and Settings in Light at requested 768px; actual width 767px. Exact 768 is still unverified: integer viewport override at current scaling gives 767 or 769, and a fractional override was rejected.
- Student A and B: /student-portal at 360px Dark and 390px Light.
- Developer: /developer at 1024px Dark. Teacher: /teacher-dashboard at 1280px Light.
- Narrow Dark samples: Admin /students and /fees; Teacher /attendance, /tests-results, /homework and /chatrooms; Developer and both Students /chatrooms. The latter seven samples lack the later explicit identity assertion and must not be treated as complete role verification.
- Eleven supposed Admin 320px Dark captures were contaminated by a role-switch automation timing issue; screenshots show Manager. Excluded from Admin coverage: student detail/edit, batches, attendance, tests-results, homework, ledger, staff, audit-logs, ics-updates and chatrooms. This is an audit reliability issue, not evidence of an authorization defect. Added an in-memory identity guard for subsequent captures; no helper file was changed.

Updated 630-combination capture inventory: 177 exact-width captures available, 31 approximate-only, 11 excluded misattributed, 411 untested. A capture does not mean detailed visual approval. coverage-updated.csv and remaining-capture-gaps.csv specify every role/route/width/theme. The original report and CSV remain intact.

## Images actually reviewed

New images reviewed: Admin 320 Dark Fees; Teacher 320 Dark Tests & Results; Admin 1440 Dark dashboard; Manager 1440 Light Settings; Student B 1440 Dark portal; Student B 390 Light portal; Student A 767 Light portal; Teacher 767 Light dashboard; Developer 1024 Dark console. Also inspected Manager 320 Light Archive, Paid filter and admission-calendar viewport images. Three mislabeled Admin captures (batches/staff/updates) were inspected and excluded. An old Developer 320 Light full-page capture was reviewed but was too reduced to establish detailed typography quality.

Reviewed card grids, Settings columns, form/control wrapping and sidebar/header alignment did not establish a new reproducible application defect. No speculative CSS fix was made.

## Suspected clipping investigated

Admin 320 Dark /students: later view tabs extend outside their visible strip, but their parent uses overflow-x:auto; this is internal scrolling, not document overflow. Admin /fees status strip similarly has clientWidth 274, scrollWidth 404 and overflow-x:auto. Geometry saved in students-outliers.json and fees-outlier.json.

Manager 320 Light /students: keyboard Space on Archive brought the tab into view, marked it active and exposed archive filters. PASS for this state.
Manager 320 Light /fees: pointer click Paid brought the selected tab into view and updated its active indicator. PASS for this state. Keyboard fee-tab operation is not claimed.
Manager 320 Light /students/new: pointer click Admission Date opened a calendar within the viewport, with its close/control buttons reachable. PASS for this state. No form was submitted or record changed.
Evidence: manager-students-archive.*, manager-fees-paid.*, manager-admission-calendar.*.

Full-page images show excess right/bottom canvas and fixed navigation at the original viewport boundary. These capture artifacts cannot establish page overflow or control obstruction. Some tablet captures retain a scrolled heading beneath the translucent header despite the harness Control+Home; a top-of-page scroll assertion is still needed before classifying a sticky-heading defect. Transparency remains intentionally preserved.

## Validation and preservation

- Three targeted rendered interaction states above passed; no new confirmed application failure.
- git diff --check executed this continuation: PASS, exit 0.
- Source/scripts checksum comparison: PASS, zero changes since continuation start.
- Original theme selections restored for all six identities and verified in preferences-restored.json: Admin Dark; others System. Viewport override reset.
- Existing 56 visual baselines and preservation manifest were not edited or regenerated. No new pixel-baseline comparison was run.
- TypeScript, ESLint, build, Node and broad browser regressions were not rerun on unchanged application/test source. The prior tonight report records TypeScript/lint/build passing, Node 155 pass / 1 existing preservation-guard failure and existing browser results. Those are prior results, not new passes. The guard failure remains unresolved and was not hidden.

## Remaining gaps, prioritized

1. Reacquire the eleven excluded Admin 320 Dark route captures with an identity assertion, and inspect their expanded controls. Verify viewport scroll origin for header/heading overlap observations.
2. Exact 768px for all 45 role-route pairs in both themes; approximate samples do not close this gap.
3. Admin/Manager non-landing routes at 360/390/1024/1280 in both themes; most opposite-theme secondary-route coverage at 320/1440 remains incomplete. Exact rows are in remaining-capture-gaps.csv.
4. Developer/Teacher/Student secondary routes and Settings at remaining width/theme combinations. Existing captures still require detailed screenshot review; do not equate the 177 capture entries with visual passes.
5. Expanded menus, form validation, date/dropdown edges, long-content/error/empty states, section anchors and floating controls at all widths/themes are not exhaustively visually inspected. Phase 6 functional results remain valid prior evidence but do not fill every visual state.
6. Teacher 320 Dark absent-checkbox probe from the prior audit remains an automation uncertainty, not a confirmed app bug. Real-data/connected-backend states are outside this disconnected-demo audit.

Only new QA artifacts under this continuation directory were created. See created-files.txt for the exact inventory. No backend configuration, real data, commits, pushes, branches or deployments were changed.
