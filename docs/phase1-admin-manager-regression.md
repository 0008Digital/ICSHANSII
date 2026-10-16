# Phase 1 — Local Admin/Manager regression protection

This phase adds tests and evidence only. No application implementation, provider, stylesheet, role component, package, Supabase file or deployment configuration was changed. HEAD remains `1eb401870b90c3e4db134609928077b1686a6f87`. No commit, branch switch, push, reset, deletion or deployment was performed.

## Results — 14 October 2026

| Validation | Result |
| --- | --- |
| Node regression suite | 147 passed, 0 failed; 18 tests added in this phase |
| Automated browser scenarios, latest result per scenario | 166 passed, 1 failed |
| Desktop viewport | 1440 × 900, both roles |
| Mobile viewport | 320 × 740, both roles |
| Protected-file verification | 122 files unchanged |
| Screenshot inventory/integrity | 56 references, complete role/viewport matrix |
| TypeScript | `npx tsc --noEmit` passed |
| ESLint | `npm run lint` passed |
| Local production build | `npm run build` passed, including 12 OpenGlass integrity hashes |

Browser scenarios execute real UI interactions through the available Codex in-app Chromium API. They are not source-text simulations. The Node suite separately covers route, navigation, export, workflow/model and preservation contracts. No additional dependencies were installed.

### Retained failure

`admin/mobile320: floating lens pointer pause/resume` failed: after a pointer click, the moving lens did not reach `aria-pressed="true"` within the condition wait. Keyboard Space pause/resume passed. Desktop pointer tests and Manager mobile pointer tests passed.

No application fix, animation suppression, synthetic DOM click or forced passing result was introduced. A moving target/browser pointer-automation interaction is a possible contributor; the cause is not established. Confirm with real touch/pointer input before treating this as a universal browser defect. The failure is deliberately retained and the browser summary command exits nonzero.

### Initial failures and rechecks

- `browser-results-initial.json`: 84 passed / 5 failed from the initial partial run. Failures included reading the lens pressed state immediately, a fee action before an animated picker finished closing, and two direct mobile pages before the client dock mounted.
- The harness was corrected to wait for visible client navigation, picker closure and pressed state, and to select visible mobile links. No application file changed. Subsequent full-run counterparts passed except the separately recorded mobile pointer case.
- `browser-results-full-run.json`: 164 passed / 3 failed across the full matrix. Two failures were test assertions expecting desktop-only enrollment explanatory text on mobile cards.
- Those two assertions now verify the actual enrollment reference in either layout. Targeted rechecks passed for both roles. The raw full-run failures remain available; `summary.json` records which results came from the later recheck. The unrechecked lens failure remains failed.

## Coverage

- Exact Admin/Manager root landing routes and ordered navigation/command contracts, with actual App Router page existence.
- All 13 Admin and 11 Manager navigation destinations; admission, profile and edit direct routes; navigation through desktop sidebar/mobile More; Back/Forward; keyboard global search and Manager ledger exclusion.
- Directory search/empty state and all six directory views; required admission validation; valid fictional admission review with no new directory record; profile/edit navigation and validation.
- Batch catalogue selection/validation; temporary attendance marking/review and reload clearing; calendar overlay bounds and Escape; assessment validation and unpublished 75/100 review.
- Three fee tabs, required-field validation and a fictional Cash installment; Admin ledger filtered totals and audit pagination/table/dialog; demo CSV download/content; Admin chat preview and reload clearing; Manager default-deny chat state.
- Settings role sections; theme preview/discard, Apply/reload and restoration; all five background source selectors; material/accent previews; invalid hex rejection; scene/interface motion; Reset to Default; optical/frost slider boundaries; comparison sliders/material and their nonpersistent scope; keyboard/pointer lens interaction; Admin branding draft/reset without Apply.

## Baseline policy

`qa-artifacts/phase1/baselines/` contains full-page reference images for approved Admin/Manager screen scope, including student admission/profile/edit screens. There are 15 Admin and 13 Manager references per viewport: 56 total.

**Settings is not an approved visual baseline.** No Settings image is in this baseline inventory. Settings behavior and file preservation are tested to prevent accidental damage while its separate restoration is pending; those checks do not approve its current layout.

`baseline-index.json` records role, route, viewport name, selected theme/source/motion, capture time and image SHA-256. The suite refuses to overwrite existing indexed images and verifies their hashes when reused. Baseline capture is opt-in; ordinary test runs do not recapture them. Only add/replace references after explicit review.

These are reference screenshots, not automated pixel-diff tests. Motion was left enabled, no CSS was injected, and no animation was disabled for capture. Full-page screenshots show fixed navigation at the original viewport position; dates, chart entrances and animated scenery can differ on future captures. Representative dashboard images were visually inspected.

## Repeat local validation

From `C:\Projects\ics-hansi`:

```powershell
node --test scripts/*.test.mjs
node scripts/phase1/preservation.mjs
node scripts/phase1/baselines.mjs
npx tsc --noEmit
npm run lint
npm run build
node scripts/phase1/report.mjs
```

Run TypeScript and build sequentially to avoid generated-route-type races. The final report command currently exits 1 because the mobile lens failure is retained. A successful local build is not deployment permission.

The preservation manifest intentionally locks shared implementation and design assets. Future approved shared fixes must receive an explicit reviewed manifest update; never regenerate hashes simply to make a failed guard green. Dedicated Developer/Teacher/Student route/component files are excluded, but their shared providers/styles/models remain protected.

### Repeat automated browser coverage

Use the computer-use browser capability on the existing localhost application. Read its current browser/viewport documentation, bind a tab, and inject the documented tab/viewport handles into the suite. It does not launch a separate browser or require Playwright installation. Example inside the persistent `cua_repl` session, after browser initialization:

```javascript
let tab = await cua.getTab({url: 'http://localhost:3000/settings'}, {browser: 'iab'});
let browser = await cua.getBrowser({id: 'iab'});
let viewport = await browser.capabilities.get('viewport');
let module = await import('file:///C:/Projects/ics-hansi/scripts/phase1/browser-suite.mjs');
let suite = await module.createCentreRegression({
  tab, viewport,
  artifactDir: 'C:/Projects/ics-hansi/qa-artifacts/phase1',
  captureBaselines: false,
});
```

Run one method per browser-tool call to keep updates responsive:

```javascript
await suite.routes('admin', 'desktop');
await suite.workflows('admin', 'desktop');
await suite.settings('admin', 'desktop');
// Repeat those three methods for manager/desktop, admin/mobile320,
// and manager/mobile320. Do not run independent browser actions concurrently.
// Always finish, including after an interruption:
const summary = await suite.finish();
nodeRepl.write(summary);
if (summary.failed) throw new Error(`${summary.failed} browser scenarios failed; see browser-results.json`);
```

The helper allows only localhost origins. Each scenario records failures and continues; a failure screenshot is stored separately from approved baselines. `finish()` restores the original demo identity, URL and viewport override. Settings tests restore the saved theme and discard other previews; branding is never applied. Only fictional page-session draft actions are performed. If the browser itself becomes unavailable or a restoration fails, the report must not claim successful cleanup.

## Files created

Source/test/documentation additions:

- `scripts/phase1-centre-regression.test.mjs`
- `scripts/phase1/contracts.mjs`
- `scripts/phase1/preservation.mjs`
- `scripts/phase1/preservation.json`
- `scripts/phase1/browser-suite.mjs`
- `scripts/phase1/baselines.mjs`
- `scripts/phase1/report.mjs`
- `docs/phase1-admin-manager-regression.md`

Evidence additions are confined to `qa-artifacts/phase1/`: 56 baseline JPGs, failure JPGs, baseline index, raw browser run/recheck reports, consolidated summary and validation logs. `files-created.txt` lists their exact relative paths. The pre-existing QA artifacts outside that subdirectory were not edited. Local build/typecheck also regenerate ignored `.next/` output and TypeScript build metadata as expected.

## Remaining risks

- One mobile lens pointer scenario is failing; passing keyboard coverage does not resolve it.
- Browser automation requires the Codex browser session; it is repeatable but is not a headless CI job or a production/Safari/physical-device test.
- Screenshot hashes protect the references from silent replacement; they do not compare new rendered pixels against the references.
- Current Settings layout remains unapproved. Destructive custom wallpaper Apply/Remove/media cleanup was intentionally not tested because the investigation identified a cross-user cleanup risk. Uploaded media, OS preference changes, physical keyboard/safe-area behavior and backend operations remain outside this phase.
- Existing demo data inconsistencies and placeholder features were preserved, not repaired. The source-freeze guard does not establish production authorization.
- The Node suite emits an existing module-type warning for TypeScript imports; no package behavior was changed to suppress it.
