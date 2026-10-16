# Section rendering and shared header diagnosis

Local verification completed 2026-10-15. Required Phase 6, tonight-audit and continuation reports were read before work. No repeat full visual audit was performed.

## Findings and changes

The original repeated-content defect was a rendering contract problem: Teacher and Student navigation used section hashes while the dashboard rendered the overview cards without selecting the requested section. The existing uncommitted recovery already connects the section store to conditional card rendering and page titles. This continuation preserved that implementation rather than overwriting it. In the current application, the requested Teacher and both Student sequences show distinct intended existing content. Disconnected roster, assignment and messaging states remain honest; no backend or new features were introduced.

A further shared header defect was reproduced at a fractional CSS viewport between 767 and 768px (browser override 614px at current display scaling). Both max-width:767px and min-width:768px were false. Neither shell layout applied: workspace top padding was 0px, the desktop sidebar remained visible, the expanded top tools competed for space, and the page heading appeared at y=32 beneath the fixed header. This affected shared layout across roles.

Only three existing media-query boundaries were changed from max-width:767px to width < 768px: two in workspace-bar.css and one in demo-workspaces.css. They now complement min-width:768px without a fractional gap. Existing integer-width styling, glass material, animations and control sizing are unchanged. Afterward all six identities have 58px shell offset at the fractional viewport, headings below the header, and no document horizontal overflow.

Application files modified during this continuation:
- src/components/ics/workspace-bar.css
- src/components/ics/demo-workspaces.css

New test helper: scripts/section-diagnosis-browser.mjs. No existing tests, baseline images or preservation manifest were edited. start-hashes.json and changed-this-turn.txt distinguish these changes from the substantial pre-existing dirty tree recorded in start-status.txt / end-status.txt.

## Browser evidence

- verified/results.json: 98 passed, 0 failed. Teacher and Student A/B at measured 320px and 1440px; selected main h1, rendered main text, visible section IDs and active navigation checked together. Each section hash must render only its matching existing card. Includes direct entry, refresh, Back/Forward, repeated/rapid activation and role switches across six identities. Switch checks assert identity and landing URL and record main content; they do not exhaustively assert every role's dashboard content.
- Teacher sequence: Dashboard, Assigned Students, Assigned Batches, Rapid Attendance, Tests & Results, Homework, Chatrooms. Existing /attendance and /chatrooms route views remain separate from hash sections.
- Student A and B: Home, Classes/Batch, Attendance, Results, Fees, Profile, Homework, ICS Updates, Chatrooms. Overview is allowed only at Home.
- centre/browser-results.json: 64 passed, 0 failed. Admin and Manager actual navigation destinations, page headings, responsive geometry, and direct student add/profile/edit routes at desktop1440 and mobile320. Admin additionally Ledger and Audit Logs. Common routes: Dashboard, Students, Batches, Attendance, Tests & Results, Homework, Fees, Staff, ICS Updates, Chatrooms, Settings. Workflow mutation scenarios were not rerun in this continuation.
- developer-sections.json: 18 actual anchor interactions at 1440/320 with target content, active-link evidence, hash and bounding rectangles. Overview, Bug Reports, Application Errors, System Health, Release Updates, Feedback, Chatroom Moderation, Centre Overview, Developer Settings. Developer intentionally retains a long console with scrolling anchors; unrelated overview cards are not substitute content. Target sections were below the fixed header; last sections cannot always align to the top because document scrolling reaches its end. These observations are not counted as assertion-suite passes.
- header-after.json: 24 role/width observations (six identities, 320, fractional767-768, 769 and1440). All headings below header and no document horizontal overflow. Theme preferences were not changed: current saved appearances were used. This is not a new full Light/Dark or seven-width visual audit.
- before.jpg / header-before.json show the confirmed fractional breakpoint failure. after-same-section.jpg shows the same Teacher Students section after correction; after.jpg is a separate dashboard view. Screenshots were visually inspected.

Initial test failures are retained. navigation/results.json and initial-selector-failures.json contain failures caused by using unsupported heading-level filtering in the browser connector. initial-timing-results.json and final/results.json retain later failures: the harness clicked before role-switch router replacement completed, read before hydration, or expected a closed mobile More item to remain visible. The new helper uses main h1, waits for the role landing transition, observes rendered content, and recognizes the active More trigger. These were harness corrections, not application behavior changes. Final evidence is verified/results.json.

## Validation actually run

- TypeScript: exit0 (typescript.log).
- Full ESLint: exit0 (eslint.log); final new helper ESLint: exit0 (helper-eslint.log).
- Local production build: exit0 (build.log).
- Node section-navigation and Phase1 centre-regression tests: 26 passed, 1 failed (node-tests.log). Failure is the existing protected-file hash guard, listing22 accumulated changed protected files, including the two shared CSS files above. It remains visible and the manifest was not rewritten.
- git diff --check: exit0 (diff-check.log).

## Remaining gaps and risks

This focused diagnosis does not certify every feature or appearance. Developer sidebar/More/history combinations were not exhaustively rerun; the 18 interactions use its visible console section navigation. Admin/Manager workflow forms, all Settings optical interactions and all theme/viewport permutations were not rerun. Existing continuation remaining-capture-gaps.csv remains applicable to broader visual coverage. Unknown/invalid hashes and authenticated connected-backend states are not covered by the new browser suite. Browser connector telemetry produced unrelated Statsig403 noise; localhost interactions and evidence capture succeeded.

All pre-existing Phase6 fixes and uncommitted application changes were preserved. No baseline regeneration, manifest changes, backend configuration/data operations, commits, branch switches, pushes or deployments were performed. Stop for review.
