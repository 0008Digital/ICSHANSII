# Phase 2D — floating lens pointer fix

## Exact implementation change
Only src/components/ics/settings-layout.css changed during this phase: one explanatory comment and one rule:

```css
.appearance-settings .appearance-preview .landing-shape--clear { pointer-events:none; }
```

This selects only the aria-hidden decorative clear shape inside Settings' preview. It does not select the interactive spectral lens, preview pane, backdrop, application scene outside Settings, or any dashboard. No z-index, hover/focus rules, animation definitions, layout or optical style changes. The decorative shape retains its rendered style and animation; as intended, it no longer captures pointer hover/click events. Interactive lens hover and keyboard focus remain active.

No other source or test harness files changed in Phase 2D. Earlier Phase 2B/2C changes remain present; they were not reverted or rebaselined.

## Validation results
- Settings browser suite: 43 passed, 0 failed. Includes 42 Settings checks across Centre Admin / Manager at actual 320x740 and 1440x900 CSS pixels, plus successful identity/viewport cleanup. See browser-results.json.
- Pointer and keyboard checks pass for BOTH roles at 320px and desktop.
- Other Settings checks pass: role sections, theme preview/discard/Apply-reload-restore, all five background source previews/discard, material/accent preview, invalid accent validation, Scene Motion and interface animation preview, optical intensity/Frost sliders, comparison split/lighting/material controls with comparison-only persistence boundary, unsaved Reset to Default, and Admin branding draft/reset.
- Additional fresh-focus cases: 4 passed, 0 failed. For each role/size, fresh page load, no prior keyboard focus on the lens, three pointer pause/resume cycles followed by one Space pause/resume cycle. Total 12 pointer cycles plus 4 keyboard cycles. See fresh-pointer-keyboard-results.json.
- Fresh checks confirm clear shape computed pointer-events:none, lens and live preview pane pointer-events:auto, lens animation remains landing-morph-b, keyboard focus-visible is true with solid outline, and animation pauses while held. All 320px checks verify actual innerWidth=320, compensating for the browser's existing scaling rather than changing browser zoom preferences.
- An initial extra probe clicking the non-button preview pane timed out in browser automation before scrolling. It was a probe-positioning failure, not a regression-suite failure. Using the visible preview surface to bring the scene into view allowed all fresh pointer cases to pass. No application changes were made in response to this probe.
- TypeScript: npx tsc --noEmit passed, exit 0 (typescript.log).
- ESLint: npm run lint passed, exit 0 (eslint.log).
- Local production build: npm run build passed, exit 0 (build.log).
- Node tests: 146 passed, 1 failed of 147 (node-tests.log). The sole failure remains the original preservation manifest's hash guard for the authorized Phase 2B customizer and Settings CSS modifications; manifest deliberately unchanged. Of 122 protected files, 120 match their original hashes. This is not a failing lens behavior test.
- All 56 original screenshot baseline hashes match. No visual baseline or preservation manifest update.
- git diff --check passed.

## Evidence files created in this phase
- browser-results.json
- fresh-pointer-keyboard-results.json
- admin-mobile320-lens.jpg
- manager-mobile320-lens.jpg
- admin-desktop-lens.jpg
- manager-desktop-lens.jpg
- typescript.log
- eslint.log
- node-tests.log
- build.log
- results.md (this report)
- files-created.txt (absolute inventory)

These screenshots are test evidence, not newly approved visual baselines. Appearance defaults and saved preferences were preserved/restored. Admin Settings identity/route and original viewport restored after testing.

Existing wallpaper Apply/Remove cleanup risk remains outside this fix. No wallpaper cleanup, file uploads, Supabase mutations, commits, pushes, deployments or branch changes were performed.
