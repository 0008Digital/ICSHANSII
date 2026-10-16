# Phase 5 — Settings & OpenGlass functional verification

Local hands-on browser verification on localhost:3000. No application changes or fixes were made. Original saved appearance preferences were restored and independently read again for all six demo identities. No Custom Apply/Remove, real records, Supabase operations, commits, pushes, deployments, manifest changes or visual baseline updates were performed.

## Results and exact coverage

| Verification | Latest result |
| --- | --- |
| Advanced glass / animation / source / save-discard-reset controls | 258 passed, 0 unresolved failures after 3 targeted rechecks |
| Saved Full / Reduced / Off behavior in actual role workspaces | 36 passed |
| Motion / Photo / Topo / Chroma individually saved and reloaded | 24 passed |
| Existing Admin/Manager Settings regressions, including cleanup | 43 passed |
| TypeScript | Passed |
| Full ESLint and final new-harness ESLint | Passed |
| Local production build, including 12 OpenGlass vendor hashes | Passed |
| Node tests | 155 passed, 1 failed: existing preservation hash guard |
| Preservation manifest | 122 files checked, 21 earlier-phase differences; failed honestly, manifest unchanged |
| Approved screenshot baseline integrity | 56 checked, unchanged |
| Application source hashes against Phase 5 start | 119 checked, 0 changed |
| Git diff whitespace check | Passed |

The latest browser result comprises 361 checks, not 361 distinct controls. Checks include multiple roles, widths and modes. Machine-readable observations and latest targeted rechecks are in `latest-results.json`; original raw results remain intact.

Developer, Centre Admin, Manager, Teacher, Student A and Student B were each tested at actual CSS widths 1440 in Light and 320 in Dark. Each received 10 advanced checks at both widths, 9 desktop motion/save checks and 8 mobile motion checks. Representative tablet coverage: Centre Admin at 1024 Light and Student B at 1024 Dark, each with 10 advanced and 8 motion checks. This is 258 control scenarios across 14 role/width/theme contexts; it is not every theme at every width for every identity. Widths were verified from rendered `innerWidth`; IAB viewport override inputs require scale compensation.

Saved workspace modes were tested for all six identities at 1440 Light and 320 Dark: Apply, reload, role landing, two navigation destinations, active indicators and usable search. The four safe sources were individually saved/reloaded for every identity at 1440 Light. Existing Settings regressions ran for Admin/Manager at desktop and 320, including branding draft/reset without branding submission. Full site workflows were not rerun or claimed.

## Control-by-control findings

| Control | Classification and initial/change/restore evidence | Result |
| --- | --- | --- |
| Theme | Live unsaved workspace preview. Light/Dark changed rendered root appearance; saved Dark survived reload. Discard restored saved theme. | Pass |
| Clear / Regular / Frosted | Live workspace preview, saved by Apply appearance. Pane filters differed: clear blur 1.92px, regular 11.76px, frosted 37.8px at observed presets. Saved Frosted reloaded. | Pass |
| Interface animation Full | Live unsaved preview until Apply saves. Video timestamps and morph border radius changed; menu entry and action-button transforms observed. Saved Full survived reload in each workspace. | Pass |
| Interface animation Reduced | Video paused and decorative lens paused; menu/button nonessential transforms absent. A 0.14s feedback transition remained, consistent with reduced rather than zero motion. Saved Reduced reloaded. | Pass |
| Interface animation Off | Lens animation-name became none, video paused, menu/button transforms absent and feedback transition duration 0s. Navigation/search and pointer/keyboard interactions remained usable. Saved Off reloaded. | Pass |
| Scene Motion | Native switch initially on in saved preferences. Off stopped media with identical timestamps across spaced observations and paused the lens; on resumed changing timestamps. Search remained usable. Saved off persisted in the saved preference bundle; originals restored. Full/Reduced/Off policy also governs effective scene motion. | Pass |
| Motion source | Actual video ready state, changing time under Full/on, paused state under off/reduced verified; independently saved/reloaded. | Pass |
| Photo source | Actual image completed loading with nonzero intrinsic dimensions; saved/reloaded for all identities. | Pass |
| Topo / Chroma | Distinct actual scene source and rendered gradient background; stable saved gradient/source after reload. | Pass |
| Custom source / custom draft | Custom backdrop rendered on source selection. Background blur changed draft paint filter while the live custom paint filter stayed unchanged until its separate apply action. Reset background and Discard exercised safely. Custom Apply/Remove and uploads excluded. | Limited safe preview pass |
| Optical Intensity | Live workspace preference: Admin original 79, other identities 78. Changed to lower bound 35; real header/pane box shadows changed (Admin inset optical span about 16.20px to 7.18px). Discard restored original. Saved lower intensity survived reload. | Pass |
| Frost | Live workspace preference: original 4; changed to 100. Actual pane backdrop blur 1.92px to 48px, header blur 1.95px to 19.5px. Explicit comparison specimen remained independent. Saved frost persisted; original restored. | Pass |
| Compare Regular / Frosted | Preview-only specimen material. Initial Regular; Frosted changed actual comparison blur; switched back to Regular. Live header unchanged, Apply remained disabled. Reload returned Regular. | Pass |
| Material Comparison | Preview-only. Initial 50, keyboard increment to 51 changed actual clip-path inset from 50% to 51%; restored 50. Did not dirty appearance or alter header. Reload default 50. | Pass |
| Lighting Angle | Preview-only. Initial 30 degrees, increment 31 changed rim conic-gradient and directional optical shadow; restored 30. Header unchanged; reload default 30. | Pass |
| Lighting Spread | Preview-only. Initial 90 degrees, increment 91 changed rim conic-gradient arc; restored 90. Header unchanged; reload default 90. | Pass |
| Scene Interaction Preview disclosure | Local preview disclosure collapsed/expanded; scene remains interactive. Not a saved workspace appearance preference. | Pass |
| Floating Lens | Preview-only hold state: initially released, real pointer click held/paused, keyboard Space toggled, release resumed. Decorative clear shape pointer-events none; actual lens retained pointer/keyboard access. Tested all covered contexts and existing Admin/Manager 320 regressions. | Pass |
| Apply appearance | Commits personal preview. Dark/Chroma/Frosted/lower intensity/frost100/Reduced/Scene Motion off bundle survived reload with matching rendered header filter/shadow. Each mode and four safe sources also separately saved/reloaded. | Pass |
| Discard preview | Restored saved selections and actual optics; unsaved mode changes were lost on reload. Did not persist comparison-only controls. | Pass |
| Reset to Default | Created an unsaved System/Motion/Clear/Full/intensity78/frost4 preview. Discard restored saved state, including Admin intensity79. Reset preview was not committed, avoiding replacement of custom configuration. | Preview pass; committed reset untested |

All comparison controls are local specimen state, not saved preferences. They changed actual rendered CSS, left Apply disabled, and returned to their initial defaults after reload. Hover-related action feedback was sampled after real pointer clicks; a separate exhaustive hover-only inventory was not performed.

## Evidence and persistence

`final/results.json`, `workspace/results.json` and `background-persistence/results.json` retain before/after rendered effects, timestamps, computed styles and reload states. `frost-visual-evidence.json` records the screenshot experiment and restoration. Screenshots `frost-4-desktop.jpg` and `frost-100-desktop.jpg` show original versus unsaved maximum frost; `settings-glass-mobile320.jpg` shows the mobile preview controls. These are QA evidence, not approved baselines. Moving background frames differ, and IAB screenshot scaling/background canvas means screenshot pixel dimensions are not the CSS viewport width.

Final saved preferences (`final-preferences.json`): all six identities System theme, Motion background, Clear glass, Full animation, Scene Motion on, frost4. Admin intensity79, remaining identities78. Resolved theme Light and OS reduced motion false. Accent and stored custom configuration were not saved over. Returned browser to Centre Admin Settings with no dirty preview and reset the viewport override.

## Failed attempts, diagnosis and limitations

No new application defect was confirmed by these tests. Initial raw automation attempts were retained rather than overwritten:

- Main matrix: 255 passed, 3 failed initially. Developer desktop Photo was asserted before image load; targeted intrinsic-image readiness recheck passed. Developer mobile Scene Motion interaction initially raced the exiting Search modal and then sampled within a single video frame; waiting for modal hidden and spacing frames passed. Teacher mobile Full used monotonic video time despite a four-second loop; loop-aware timestamp comparison plus changing morph radius passed. Successful rechecks are in `photo-recheck`, `scene-recheck-frames` and `full-recheck`.
- Earlier `controls` run: 2 passed/8 failed due to harness state-reading errors; `verified`: 9 passed/1 failed due to disclosure readiness. Restoration exceptions were corrected by reading native checkbox/pressed-group state and waiting for expanded disclosures. Intermediate `scene-recheck` and `scene-recheck-final` each retain one failed automation attempt. None establish an application regression.
- One workspace batch timed out after its Developer checks had already been saved. Reconnected, verified saved results, completed restoration and continued one context per call. An invalid internal role key on one Student A setup was corrected before any Student A scenario ran.
- Node failure is `Phase 1: preservation boundary includes Settings without approving its layout`: 21 protected source files differ from the old manifest due to earlier work already present at Phase 5 start. Independent Phase 5 start/end source hashes show zero application modifications. This guard remains failed; neither manifests nor baselines were changed.
- OS prefers-reduced-motion was false. The positive OS-reduce branch was reviewed in existing CSS/hooks/provider but could not be emulated with available browser capabilities; browser verification of that branch remains untested.
- No generic animated page-transition wrapper exists to verify. Actual chart entrances, navigation indicators, menu entry, decorative morph/video and feedback transitions were inspected. Frame-perfect animation duration/interpolation and every possible hover target were not exhaustively measured.
- Custom wallpaper Apply/Remove, custom file uploads and committed Reset-to-Default were intentionally excluded. Existing cross-user storage cleanup code prunes shared keys without adequate owner isolation; no cleanup was executed. A separate approved owner-aware cleanup fix remains necessary before destructive Custom testing.
- Representative tablet coverage covers two identities, not all six. Browser engine coverage is the available local in-app browser only; no external browser/device claim.

## Files created in this phase

- `scripts/phase5-settings-browser.mjs`: reusable injected-CUA verification harness; no application/storage injection.
- `qa-artifacts/phase5/`: raw and latest browser results, saved-preference audit, screenshots, source-hash snapshot, validation logs and this report. `latest-results.json` consolidates latest targeted rechecks without rewriting raw failures.

No existing application files, tests, protected components, styles, providers, navigation, preservation manifests or visual baselines were modified in this phase. Existing uncommitted earlier-phase changes were preserved.
`files-created.txt` lists the exact artifact paths and harness path created in this phase.
