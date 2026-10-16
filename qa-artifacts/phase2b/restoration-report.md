# Phase 2B — Settings restoration

Implemented locally from the written layout requirements. The referenced approved screenshot and recording are not available in this conversation/workspace evidence; exact visual matching is therefore NOT verified. These captures are review evidence, not approved visual baselines.

## Files changed in this phase
- src/components/ics/appearance/customizer.tsx — retains existing control handlers and state; moves interface animation into a collapsed disclosure, places appearance actions across the card footer, and wraps the custom editor in a disclosure. Core columns remain Theme/Background Source and Glass Material/Accent/Scene Motion.
- src/components/ics/settings-layout.css — adds Settings-scoped header, compact two-column card, translucent surface and mobile rules. Existing dock rules remain unchanged.
- scripts/phase1/browser-suite.mjs — opens the new Interface animation disclosure before testing its existing controls.

No providers, defaults, branding implementation, shared dashboard components, global CSS, other roles, storage code or Supabase code changed. The original preservation manifest and all 56 Phase 1 reference screenshots remain unchanged. Of 122 protected files, 120 are byte-identical; the only differences are the two authorized Settings application files above.

## Verification
- TypeScript: npx tsc --noEmit passed, exit 0.
- ESLint: npm run lint passed, exit 0.
- Local production build: npm run build passed, exit 0. See ../phase2b-build.log.
- Node tests: 146 passed, 1 failed out of 147. The failure is the original Phase 1 hash guard, reporting exactly the two Settings files above. It was deliberately not rebaselined. See ../phase2b-node-tests.log.
- Phase 1 screenshot integrity: 56 checked, no issues; Settings visual approval remains false.
- Browser full suite: 159 passed, 8 failed (browser-results.json). Browser scaling made nominal 1440 and 320 overrides render at 1800 and 400 CSS pixels, respectively; do not interpret this initial run as exact 320px coverage.
- Corrected browser viewport recheck: actual CSS width 320 verified; Admin/Manager Settings and routes plus cleanup: 53 passed, 1 failed (css-viewport-recheck/browser-results.json).
- Layout measurements and captures at actual 1440, 1024, approximately 768 (innerWidth integer reports 767), and 320 CSS pixels. Two columns retained at desktop/tablet; one column at 320. Document width never exceeded viewport width. Advanced Glass Settings is collapsed on initial load. See layout-measurements.json.
- Separate safe custom draft check at actual 320px: finishing sliders changed, Reset background returned defaults and displayed 'Defaults previewed. Apply to save.' No horizontal overflow. Preview discarded afterwards. See custom-draft-check.json and custom-draft-320.jpg.
- Dark theme preview captured then discarded. Saved preferences were restored after appearance Apply/reload tests. No forced Light/Photo defaults were introduced.

## Browser failures, retained honestly
1. Admin/mobile floating lens pointer pause/resume: select Centre Admin, open Settings, expand Advanced Glass Settings, click Hold floating glass lens. The expected pressed=true state was not observed. Keyboard pause/resume passed. Reproduced at actual 320px. This is a pre-existing Phase 1 failure.
2. Manager/mobile lens pointer check also failed in the first run, but passed at corrected 320px. Treat as intermittent; no lens code changed.
3. Assessment validation/unpublished preview failed for both roles and sizes (four checks) because the browser automation fill operation returned an active-input target token mismatch for Marks for Aarav Example. This is an automation failure, not sufficient evidence of an application defect. The assessment implementation is unchanged.
4. Manager/mobile admission preview assertion failed after Review Admission; the preview heading was not observed. Captured in failures/manager-mobile320-valid-fictional-admission-review-and-unchanged-directory.jpg. Not confirmed as a Settings regression or app defect; implementation unchanged.
5. Manager/mobile batch validation failed because option Old General could not be located. Captured in failures/manager-mobile320-batch-catalogue-and-validation.jpg. Not confirmed as a Settings regression or app defect; implementation unchanged.

## Coverage and limitations
Verified theme preview/discard, Apply and reload restoration; all five source previews; material/accent preview; invalid custom accent; scene/interface animation; optical sliders and comparison-only controls; keyboard/pointer lens checks; unsaved Reset to Default; Admin branding text preview/reset. No application behavior was changed to make tests pass.

Not all controls were exercised end-to-end. Wallpaper file upload, Apply background and Remove background were intentionally not executed because the existing global wallpaper pruning code can delete another user's media. That risk is unchanged and remains a separate repair task. Branding Apply/logo upload and all valid color-picker combinations were not exercised in this phase. Branding access remains Admin-only as before; Manager retains its existing informational boundary.

## Visual review
- settings-1440.jpg: restored Admin composition in the existing saved System/Motion appearance.
- settings-1024.jpg and settings-768.jpg: two-column tablet composition.
- settings-320.jpg: stacked mobile composition; the fixed dock remains unchanged and can overlay content at a given scroll position, as before.
- settings-dark-1440.jpg: temporary Dark preview, discarded after capture.
- settings-desktop.jpg: initial capture before scaling correction; use settings-1440.jpg for measured-width review.

Remaining visual decisions require the original screenshot/video: exact spacing, opacity, typography, border/shadow and proportions. Additional controls are retained behind disclosures; appearance Apply/Reset/Discard stay visible in a footer. Centre Branding remains a separate existing card, with its existing informational banner. No pixel comparison against approved media was possible.

All work remained local. No commits, pushes, branch switches, deployments, real-record mutations or destructive media cleanup were performed.
