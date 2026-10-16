# ICS Hansi Phase 6 report

Local verification and scoped repairs completed on 15 October 2026. AGENTS.md and Phase 4B/5 reports were inspected first. Browser interaction used the computer-use skill and Codex in-app browser on localhost:3000.

## Confirmed bugs repaired

1. Developer / Owner, /developer: type a note for report 001, then select report 002. Before: the same note appeared in both reports because one string state backed every report. Expected: independent report drafts. Fix: keep draft notes keyed by report ID with a functional state update. Switching back restores the correct draft; reload still clears unsaved drafts as before. Verified in all six width/theme combinations.
2. Student A and Student B, /student-portal: select each demo identity and open Student Home. Before: both greeted Aarav regardless of selected identity. Expected: the selected demo identity. Fix: derive the greeting from the existing identity model and workspace identity context. Both identities now display their own labels, including after switching/reload. No backend records or fictional dashboard metrics were replaced.

## Exact source and test changes

- src/components/ics/developer-console.tsx: report-ID-keyed note drafts only.
- src/components/ics/student-portal.tsx: existing demo identity lookup for greeting only.
- scripts/phase6-role-browser.mjs: new browser workflow checks for the four target identities; existing tests were not rewritten.
- qa-artifacts/phase6/: new local evidence, raw results, logs and this report. created-files.txt lists each artifact path.

A SHA256 comparison of all 119 source files against phase-start hashes found exactly the two source changes above (source-hash-differences.json). Existing unrelated working-tree changes were preserved. Global CSS, shared providers/navigation, Settings, lens implementation, Admin and Manager components were not changed. All 56 existing visual baseline hashes pass verification. Preservation manifest and baseline files were not updated.

## Browser results

| Area | Passed | Failed | Scope |
|---|---:|---:|---|
| Final role workflows | 114 | 0 | Developer 36, Teacher 30, Student A 24, Student B 24 |
| Route/layout scan | 114 | 0 | Four identities, 320/1024/1440px, Light/Dark; includes repeated exploratory scans |
| Navigation regression | 144 | 0 | Four target identities at 320/1440px; role switches include all six identities |
| Admin/Manager routes and Settings | 106 | 0 | Both roles at desktop and exactly 320px |
| Preservation harness cleanup | 1 | 1 | One initial cleanup passed; a later immediate identity-restoration assertion failed |

Final workflow matrix: Developer report drafts, search/no-match, status/severity/role/centre filters, status changes and reload reset, unavailable notification service, denied chat, keyboard palette and Quick Actions. Teacher tool links, disconnected attendance/homework, assessment validation/marks/review/reset, Old/New General draft isolation, absent student state, leaderboard filters/empty states, denied chat and palette/menu. Student A/B greeting, all seven section tabs, View Homework, denied chat, keyboard palette/menu.

Navigation checks exercised actual pointer destinations, active indicators, mobile More menus, rapid/latest-click behavior, repeated activation, keyboard, Back/Forward, direct anchors, reload and stale-navigation replay prevention. Tablet core workflows and route scans passed; the dedicated navigation stress suite ran only at 320/1440px.

Admin/Manager checks covered existing routes and navigation, Settings draft/apply/discard/reset, branding draft boundaries, preview controls and floating lens pointer/keyboard. The broader admission/payment/export/assessment workflow suite was not rerun in Phase 6; no shared application source changed.

The cleanup failure expected demo-student-b immediately after selecting it and navigating, but observed demo-manager. Explicit selection followed by a fresh DOM observation successfully restored Student B; all dedicated role-switch checks passed. This is retained as a harness timing/restoration failure, not counted as an application pass or a confirmed new application bug. Final appearance themes were restored to the original System selection for the four audited identities; viewport override was reset.

## Earlier raw failures and limitations

Raw pre-fix and exploratory failures remain in before, audit-before, pre-fix, confirmed-before and functional directories. Notes and greeting failures were genuine defects fixed above. Other initial failures involved exact-label selectors after validation, input-target/fill mismatch, dropdown transition timing, and automatic scrolling before a mobile tool-link click. Keyboard input or explicit page-end scrolling reproduced the intended behavior and the final matrix passed. No application behavior was changed to accommodate these automation issues.

The Developer native date filter remains unverified: native fill changed its DOM value without committing the React input state. It is excluded from the successful filter claims despite the raw scenario name saying all report filters. Report-a-bug submission/upload, permission mutations, Teacher export activation, all possible malformed input combinations, OS-motion emulation and other browser engines were not exhaustively tested. Custom wallpaper destructive operations were not executed.

Real rosters, assignments, homework synchronization, messages, publications, service health and private student records remain blocked by the intentionally disconnected backend. Fictional readonly previews and temporary local drafts are not evidence of backend functionality. No permission changes or misleading connection-success behavior was introduced. Student A/B now have distinct greetings; shared fictional metrics remain preview data, and production identity/data isolation cannot be established without a connected authorized test backend.

## Command validation

- TypeScript: passed (typescript.log).
- ESLint: passed (eslint.log).
- Local production build: passed, exit 0 (build.log); no deployment.
- Node tests: 155 passed, 1 failed, 156 total (node-tests.log).
- The Node failure is the existing preservation guard: the same 21 protected file hash differences documented in Phase 5. Neither Phase 6 source file is among those 21. It was not hidden, reset or approved by rewriting the manifest.
- Visual baseline integrity: 56 checked, 56 expected, zero issues; Settings remains explicitly unapproved as a visual baseline.

Evidence: developer-notes-before.jpg, student-identities-before.json, final/results.json, route-audit/results.json, navigation/results.json, admin-manager/final-results.json and student-b-after.jpg. Screenshots are evidence only, not new approved baselines.

No commits, pushes, branch switches, deployments, Supabase operations or real-record changes were performed. Stop here for review.
