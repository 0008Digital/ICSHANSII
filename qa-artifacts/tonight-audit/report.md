# Visual alignment audit — local handover, 15 October 2026

Phase 6 report and created-files inventory were read; completed fixes were preserved. This is a partial visual audit, not full-site visual approval. No commit, push, branch switch, deployment, backend change, manifest rewrite or baseline update was performed.

## Confirmed defect fixed

Admin and Manager, `/students/new`, 320px and 1440px: Admission Batch, Batch Duration and Admission Date required marks appeared on separate lines. Parent grid/flex-column label rules turned the mark into a separate layout item; labels measured approximately 38–41px instead of one text line. This also disrupted date-row alignment.

Reproduce: select either identity, open Students → Add Student, inspect the required labels. Expected: required mark beside its label; actual before: mark below label. The single scoped rule in `src/components/ics/saas-layout.css` sets direct ChoiceSelect/DatePicker labels inside `.student-form` to `display:block`. Shared control implementation, global CSS, navigation, Settings, animations and data behavior were unchanged.

After: 8/8 geometry checks passed (both roles × 320/1440 × Light/Dark); labels have block flow and heights below 24px. See `admission-label-results.json`, `admission-labels-before.jpg` and eight `admission-after-*.jpg` screenshots. The Manager 320px Dark after screenshot was visually inspected. Admission Batch pointer opening worked and exposed all five demo options including Old General (`admission-dropdown.txt`). Initial combobox selector failed because this control is a button; corrected selector opened it. Escape on the trigger failed with browser “Element is not focused” while the dialog held focus; calendar check did not run. These are incomplete automation checks, not confirmed application defects. No admission was submitted.

## Rendered coverage and evidence

`visual/matrix.json` records 184 route captures with DOM rectangles and computed typography, padding, gap, overflow, positioning and z-index. 150 matched requested width; 34 tablet attempts rendered 767px or 769px rather than exactly 768px. There are no failed route captures. Capture success is not a visual pass. `coverage.csv` enumerates every role/route/width/theme combination and explicitly marks untested cases.

All 45 role-route pairs were captured at 320px and 1440px in one theme: Admin 16 Light, Manager 14 Dark, Developer 3 Light, Teacher 6 Light, Student A 3 Light and Student B 3 Light. Landing and Settings were additionally captured for all identities at 320px in the opposite theme, 360px Light, 390px Dark, 1024px Light and 1280px Dark. Tablet Dark captures include Admin/Manager landing and Settings plus every route for the other four identities; these are approximate widths only. Intermediate widths and opposite themes on other routes remain incomplete.

Routes: Admin `/`, `/students`, `/students/new`, `/students/DEMO-001`, `/students/DEMO-001/edit`, `/batches`, `/attendance`, `/tests-results`, `/homework`, `/fees`, `/ledger`, `/staff`, `/audit-logs`, `/ics-updates`, `/chatrooms`, `/settings`. Manager same except `/ledger` and `/audit-logs`. Developer `/developer`, `/chatrooms`, `/settings`. Teacher `/teacher-dashboard`, `/attendance`, `/tests-results`, `/homework`, `/chatrooms`, `/settings`. Each Student identity `/student-portal`, `/chatrooms`, `/settings`.

Screenshots actually visually reviewed: Admin 320 Light admission and chatrooms; Developer 1440 Light console; Teacher 320 Light dashboard; Student B tablet Dark portal; Manager 320 Dark dashboard; Admin 360 Light Settings; Student A 390 Dark portal; Admin 1440 Light dashboard; Manager 1440 Dark admission; Student B 1024 Light portal; Teacher 1280 Dark dashboard; Manager 320 Dark corrected admission. Remaining captures have geometry evidence but have not all received detailed visual inspection.

## Other observations and remaining mismatch investigation

- No document horizontal overflow was measured in captured states. Element outliers do exist; do not classify them all as defects. Chatroom permission tables and room navigation use intentional internal horizontal scrolling (source checked). Student section tabs also scroll horizontally. Keyboard reachability of every off-screen table action remains unverified.
- Admin/Manager `/students` and `/fees` at 320px have element outliers requiring further ancestor clipping/scrollability inspection. Exact affected elements are retained in `visual/matrix.json`. No speculative CSS change was made.
- Full-page captures show fixed backgrounds and navigation only at the capture viewport position, sometimes with blank space below/right. This is not confirmed as a live rendering defect; compare viewport screenshots while scrolling before changing layout.
- Student A `/student-portal` 390px Dark uses narrow two-column cards, while 320px uses one column. Reviewed text remained readable; no approved-design change proposed.
- Preserve intentional translucent-header content visibility. No newly confirmed hidden-heading or inaccessible floating-control defect was found in the targeted checks.
- Exhaustive expanded dialogs, all form validation states, all section tabs at every width/theme, Back/Forward and rapid-navigation matrices were not repeated in this visual audit. Refer to Phase 6 for its completed functional coverage; prior results are not new runs.

## Browser regression results

50/50 targeted checks passed across all six identities at 320px and 1440px (`chrome/results.json`): Settings Appearance anchor, Admin Branding anchor, Quick actions bounds and pointer hit target, command palette access, floating-lens pointer toggling and keyboard Space toggling. These ran before the admission-only CSS change; the changed selectors do not match Settings controls. Admission alignment after the change passed 8/8 combinations.

A small functional probe started before the user clarified Phase 6 was complete: 10 passed and 1 Teacher 320 Dark attendance checkbox assertion failed (`functional/results.json`). It was not investigated or repaired here and must not be reported as a confirmed defect or a successful Phase 6 rerun. The existing Phase 6 full results remain separate.

## Validation actually run

Both before and after the scoped CSS change: TypeScript passed; ESLint passed; local production build passed; `git diff --check` passed (initial AGENTS line-ending warning only). After-change logs use `validation/*-after.log`.

Node suite after change: 156 tests, 155 passed, 1 failed. Failure is the existing preservation manifest guard listing the same 21 previously modified protected files, including saas-layout.css; the list already existed before this audit and in earlier reports. This audit added one scoped rule to that already-modified stylesheet. Manifest was deliberately not changed. Baseline inventory check: 56 expected files, no issues; this verifies inventory, not pixel similarity.

## Exact changes and safety

Existing application file modified this audit: `src/components/ics/saas-layout.css` (one rule). New reusable QA helper: `scripts/tonight-visual-audit.mjs`. New findings, screenshots, measurements, logs and inventories: `qa-artifacts/tonight-audit/` (see `created-files.txt`). `changed-since-start.json` checks existing source/scripts against initial hashes. Initial and final Git status plus initial diff were saved; pre-existing changes were preserved. Build generated local ignored build artifacts.

All six original System theme preferences were restored through Settings; viewport override reset; Centre Admin Settings left open (`restored-preferences.txt`). No custom-wallpaper cleanup, real-record mutation or backend connection was attempted. Disconnected backend workflows remain unavailable by design.

Next safe work: review remaining screenshot/geometry outliers, obtain exact 768px rendering, then complete combinations marked untested in coverage.csv. Do not expand CSS scope based solely on capture artifacts or geometry outliers.

Cross-role repair follow-up: see cross-role-repair/report.md for scoped header/content fixes, 36 rendered-content passes, 64 protected-route passes, preservation guard failure and unresolved breakpoint/direct-entry findings.
