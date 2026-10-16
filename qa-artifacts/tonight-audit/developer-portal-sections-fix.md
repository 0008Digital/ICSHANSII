# Developer Portal section rendering — targeted fix
Date: 2026-10-16 (Asia/Calcutta)

## Confirmed bug and cause
At /developer, select Developer / Owner, then Feedback in the sidebar. Before the fix the hash became #feedback but main h1 remained Developer Console, all nine section IDs remained rendered, and overview metrics/severity chart and Bug Reports were still present. Appearance Settings worked independently at /settings.

DeveloperConsole never subscribed to selected hash state: it rendered a fixed PageHeading and every section unconditionally. Existing navigation already committed hash/history and notified subscribers correctly; the missing subscriber/visibility logic was inside DeveloperConsole, not a route fallback or backend problem. Previous tests inspected hash/scroll/active items without requiring isolated Developer content.

## Minimal fix
Modified src/components/ics/developer-console.tsx only in application source:
- Reuse useRoleSection (already used by Teacher/Student), and resolve valid Developer hashes against existing roleFeatures labels/IDs.
- Set the main title to the selected section label; retain Developer Console for default/overview.
- Mark existing sections data-role-section and hide inactive sections; hide overview severity chart outside overview.
- Inactive display:none is scoped directly to these elements because existing display:grid rules override native hidden display. No global CSS change.
- Keep sections mounted so report filters/status/notes survive navigation; preserve all existing controls and disconnected-service notices.
- Reuse existing section navigation handling: marked hidden targets remain discoverable, intent updates hash/history and scrolls to the top. No shared navigation/router/provider/permissions change.
- Appearance remains its existing /settings route and implementation. Existing hashes, including #overview, are retained. Unknown hashes retain the existing default overview fallback; every valid menu hash resolves to its own section.

## Verified browser results
66/66 automated checks passed using the actual local in-app browser:
- Measured 1440×900 and 320×900 CSS viewports (viewport overrides compensate for this display's scaling; recorded dimensions in results.json).
- At each width: click, direct entry and reload for Developer Console, Bug Reports, Application Errors, System Health, Release Updates, Feedback, Chatroom Moderation, Centre Overview, Developer Settings and Appearance Settings (30 checks).
- Back, Forward and rapid/repeated selections at each width (3 checks).
- Assertions verify h1, destination, unique visible section ID, section-specific body text and absence of overview chart on non-overview sections. Mobile tests use primary dock/More menu.
- Cross-route direct entry is performed from /settings, not accepted merely because a hash changes.
- Separately observed all six demo identities switching to their proper settled landing route/heading on desktop and mobile (12 observations). Admin/Manager main title is Dashboard; Teacher is Teacher Dashboard; both students are Student Home; Developer is Developer Console.
- Developer notes retained through Bug Reports → Feedback → Bug Reports; temporary text cleared afterward. Original Teacher identity restored; viewport reset; agent tab closed.

Sections remain honest previews where services are unavailable. No fake backend functionality added.

## Evidence and reusable test
Created scripts/developer-portal-sections-browser.mjs, an injected-tab browser regression runner (no separate browser launch). Artifacts under qa-artifacts/tonight-audit/developer-portal-sections/:
- before.json: actual pre-fix heading and all visible section IDs at #feedback.
- results.json: 66 passing checks and visible content/dimensions.
- after-desktop.jpg: Feedback heading and only Feedback body, visually inspected.
- after-mobile.jpg: Developer Settings selected on mobile.
- role-switches.json: early immediate samples captured before route transitions committed; these are not failures or passing evidence.
- role-switches-settled.json and role-switches-mobile-settled.json: correct post-navigation landing content.

An initial browser harness used deepStrictEqual on cross-realm arrays, producing a harness assertion error despite identical values. Corrected to primitive section-ID comparison and reran the complete matrix; only the corrected 66-run result is counted.

## Other checks actually run
- TypeScript npx tsc --noEmit: passed; rerun after final source edit also passed.
- npm run lint (full ESLint): passed.
- Targeted ESLint on changed component and new browser runner: passed.
- node --test scripts/section-navigation.test.mjs scripts/phase1-centre-regression.test.mjs: 26 passed, 1 failed.
- The failure is the existing Phase 1 preservation guard listing 22 previously modified protected files. The Developer component changed here is not in that failure list. No manifest updated.
- Phase 1 all 56 visual reference hashes: passed in the above Node run; no baseline update.
- git diff --check: passed (existing LF/CRLF advisory warnings only).
- Production build not run in this targeted phase; user requested relevant tests/TypeScript/ESLint/diff where practical.

## Scope and remaining gaps
No shared dependencies changed, so full Admin/Manager browser workflows were not repeated; their existing Node route/contracts and six-identity landing checks were run. All-role rapid/back/forward interaction matrices, alternate browser engines, both themes and exhaustive existing Developer form behavior were not repeated. This is a targeted rendered-section regression, not a broad UI audit. Appearance entry/reload was checked; all appearance controls were not retested because implementation is unchanged.

Exact task changes: developer-console.tsx (application fix), scripts/developer-portal-sections-browser.mjs (new regression runner), this report and the evidence directory above. All accumulated prior uncommitted changes remain. No preservation manifest, visual baseline, Supabase/backend configuration, business permission, global styling or other role implementation changed. No commits, branch switches, pushes or deployments. Stop for review.
