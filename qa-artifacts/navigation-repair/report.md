# Cross-role navigation reliability repair

Local project: `C:\Projects\ics-hansi`. Tested on localhost:3000 through the Codex in-app browser. No commits, pushes, deployments, Supabase operations, role deletion, CSS changes, or baseline updates were performed in this task.

## Confirmed before/after behavior

| Reproduction | Before | After |
| --- | --- | --- |
| Developer, 1440px: select Developer, click System Health from the sidebar | URL became `/developer#system-health` and the section scrolled into view, but both navigation indicators retained Console, even after settling. | URL, section and both indicators select System Health on the first click. |
| Teacher, 320px: select Teacher and click Homework | URL became `#homework`; navigation retained Dashboard. Clicking More could leave it closed; a later interaction refreshed only some indicators. | Homework is selected immediately and More opens on its first click. |
| Student A, 320px: click Results, Home, then Attendance | The URL and indicators disagreed: Results URL with Home in the dock, then Home URL with Results selected. | Both indicators follow each current destination. Repeated activation rescrolls without adding duplicate history entries. |
| Student A/B, 320px: visit ICS Updates, use More to open Chatrooms, then click More for Settings | More remained closed after the first click. This reproduced for both identities, including when the test waited for Chatrooms' heading. | More opens on its first click and Settings opens. Both complete mobile destination sweeps pass. |
| Student A Profile, then rapid Developer → Teacher → Student A → Student B switching | Student B landed at the base Home URL with scroll zero, but the old Profile indicator remained selected. | Final identity is Student B, Home URL, Home indicators and scroll zero. |
| Search palette: keyboard Enter on a role section | Imperative router navigation used the same incomplete location-notification path. | Palette section activation uses the same synchronous section commit as pointer navigation; all four identities pass at both widths. |

Initial sampled browser run: **10 passed, 12 failed**. These are checks, not 12 independent defects; stale indicators and a failed More open caused related assertions to fail. See `before/tests/results.json` and `before/reproductions.json`. Student B was verified in subsequent role-switch and destination investigations, not in that initial sampled run.

The broader report of a previous request executing much later was not independently reproduced as a queued server/route request. No such replay occurred in the final rapid-click, cross-route-return, Home, history or role-switch checks. The confirmed stale indicators and first-click failures above are repaired; this does not establish that every possible intermittent navigation symptom had the same cause.

## Root causes and scoped repair

`AppNavigation` observed only `hashchange`. Next.js history changes can change a hash without that event, so the sidebar, dock and More scope could retain different snapshots. The More handler also captured its location scope during rendering; a subsequent Next URL commit could make the first click save an obsolete scope and immediately invalidate its own open state. Waiting for a heading alone did not resolve the latter failure; the initial timing-only explanation was ruled out.

Same-document navigation for Developer, Teacher and Student now commits through the documented Next-integrated History API, emits an owned location event and scrolls the current visible target. Subscribers also observe Back/Forward. There are no new timers, deferred section requests or retries. Repeated clicks scroll again without duplicate history entries. Hidden cached targets cannot win a duplicate-id lookup. Modified clicks, external links, skip links and cross-page links retain their existing behavior.

The existing always-mounted mobile navigation instance owns one capture listener, cleaned up on role changes. Section links in navigation, palette results and student cards are covered. Keyboard palette Enter shares the same commit. Same-path identity switches clear the old section and notify indicators. More reads the actual location at interaction time for these three roles. Admin and Manager retain their original More handler scope and Next navigation behavior. OpenGlass transitions, keyboard interaction, CSS, providers and Settings implementation were not changed.

Pointer hit-testing found no intercepting transparent overlay at the tested navigation links. Investigation found no application navigation timer or delayed callback requiring removal. Local Next Link/router/history documentation and installed router source were inspected before implementation.

## Exact implementation files

Modified:

- `src/components/ics/app-navigation.tsx`: location subscription, scoped section-navigation hook and current-location More scope.
- `src/components/ics/smart-workspace-bar.tsx`: palette section commit and same-path demo identity section reset.

Created:

- `src/components/ics/section-navigation.mjs`: synchronous section/history/location helpers.
- `src/components/ics/use-role-section-navigation.ts`: role-scoped click listener with cleanup.
- `scripts/section-navigation.test.mjs`: nine unit tests covering ordering, repetition, latest intent, missing/hidden targets, untouched navigation, subscriptions, palette and identity reset.
- `scripts/cross-role-navigation-browser.mjs`: injected local browser regression runner with rapid/history scenarios and every navigation destination sweep.

All current-task evidence and logs are under `qa-artifacts/navigation-repair/`; this report is also new. The four other pre-existing modified application files (`appearance/customizer.tsx`, `demo-workspaces.css`, `saas-layout.css`, `settings-layout.css`) were left untouched by this repair. Existing unrelated untracked files were preserved.

## Final validation

| Check | Result | Evidence |
| --- | --- | --- |
| Cross-role scenarios, four identities × actual 1440/320 CSS pixels plus rapid switches | **68 passed, 0 failed** | `verified/results.json` |
| Every available navigation destination, all four identities, desktop/mobile | **76 passed, 0 failed** | `destinations-final/results.json` |
| Admin/Manager routes, workflows and Settings at desktop/320px, rerun after final fix | **167 passed, 0 failed** | `admin-manager-final/browser-results.json` |
| Node: `node --test scripts/*.test.mjs` | **155 passed, 1 failed**, 156 total | `node-tests.log` |
| TypeScript: `npx tsc --noEmit` | Passed | `typescript.log` |
| ESLint: `npm run lint` | Passed | `eslint.log` |
| Local production build: `npm run build` | Passed; 12 OpenGlass vendor hashes verified | `build.log` |
| Original screenshot integrity | **56 checked, no changes** | `baseline-integrity.log` |
| Protected-file integrity | **116/122 unchanged; 6 differences** | `preservation-integrity.log` |
| `git diff --check` | Passed | Terminal verification |

The one Node failure is the original Phase 1 hash-preservation assertion. It reports the two shared files intentionally changed here plus the four earlier-phase files listed above. It is a real failing guard, not a passing suite. Its manifest was not updated. Runtime regression tests passed, but do not waive review of those protected-file changes. An attempted `npm test` also failed because this project has no `test` script; the actual Node command above was then run.

Coverage includes pointer and keyboard activation, active indicators, More open/close, role section tabs, cross-page navigation and return, rapid consecutive clicks, repeated clicks, scroll targets, Back/Forward, direct section URLs, reloads, palette and rapid identity changes. Destination sweeps assert section existence and visibility, not just URL changes. Motion remained enabled. Browser automation uses the documented CUA API; viewport requests were calibrated to verify actual `innerWidth` 1440 and 320. No physical-device or additional-browser-engine coverage is claimed.

Earlier failed destination runs remain in `destinations/`, `destinations-settled/` and `destinations-trace/`. The repeated Student More failures in them were genuine and led to the final scoped More fix. Intermediate successful runs in `after/`, `final/` and `admin-manager/` are retained; the final results are the three files listed in the table above.

## Screenshots and remaining issues

- Before: `before/developer-sidebar-health-1440.jpg`, `before/teacher-homework-320.jpg`, `before/student-a-results-320.jpg`.
- After: `after/developer-system-health-1440.jpg`, `after/student-a-results-320.jpg`; final Home/role-switch captures in `verified/`.
- Sticky overlap: `sticky-header-overlap-1440.jpg` and `sticky-header-overlap.json`. In Student B at 1440px, scroll from Profile using PageDown: the fixed header spans y=0–70 while a paragraph spans approximately y=-7–30 underneath it. Mobile header height is approximately 58px. This existing overlap is documented and not redesigned. No supplied reference screenshots were available in this task to establish an exact match to the user's screenshots.
- Existing demo limitations, including Student A/B sharing the fictional displayed student profile and denied Chatrooms access, remain outside this navigation repair. Real identity/data isolation is not established by these local navigation tests.
- A missing same-page target is consumed without scheduling a future navigation; all currently available navigation targets passed the destination sweep. Future section additions should retain this regression coverage.

The final browser was returned to Centre Admin `/settings`, with the temporary viewport override reset and regression-test appearance changes restored. No screenshot is promoted to an approved baseline.
