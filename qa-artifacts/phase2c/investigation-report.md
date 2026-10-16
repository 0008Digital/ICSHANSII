# Phase 2C — uncertain regression investigation

Local browser reproduction and test-harness corrections only. No application code changes, visual baseline updates, preservation manifest updates, Supabase changes, commits, pushes or deployment.

## Exact final results
The eight originally failing scenarios were rerun twice after the automation corrections. Each run: SIX PASS, TWO FAIL.

PASS: Manager/mobile320 admission preview and unchanged directory; Manager/mobile320 Old General batch selection and validation; Admin/desktop assessment; Admin/mobile320 assessment; Manager/desktop assessment; Manager/mobile320 assessment.
FAIL: Admin/mobile320 floating lens pointer pause/resume; Manager/mobile320 floating lens pointer pause/resume.

Each run also includes four supporting passes (OpenGlass sliders/comparison scope and keyboard lens activation for each role) plus one cleanup pass. Thus each complete focused report records 11 passed and 2 failed. See verified/browser-results.json and repeat/browser-results.json. The repeat run additionally asserts actual CSS innerWidth matches the requested viewport. Mobile is 320x740 CSS pixels and desktop is 1440x900. Caller compensates for browser scaling; no browser zoom preference was changed.

## Admission
Direct original pointer workflow succeeded at exactly 320px: filled fictional fields, selected New General, clicked Review Admission, and observed Admission preview / Nothing is saved. The directory remained five fictional students, without the proposed student. No application defect was reproduced. The prior failed snapshot had the optional promised-payment date section unexpectedly open; that could prevent review without a promised date. Evidence does not prove why it was opened. Incorrect pointer targeting during scrolling is plausible, not established.

Corrected test uses keyboard entry/activation and waits for the preview heading. It retains assertions for valid admission preview, unsaved status and unchanged directory. This is a keyboard regression workflow; it must not be mistaken for exhaustive pointer coverage. The independent direct pointer reproduction also passed.

Two intermediate development runs failed only because a new helper tried to compare the phone's value, which the browser connector redacts even during evaluation. These reports remain at browser-results.json and final/browser-results.json. The final helper omits direct value comparison for the fictional phone and verifies acceptance through the admission validator. Other entered values are asserted. No redaction bypass was attempted.

## Batches
At 320px, the native dialog contained Old General. Direct pointer selection succeeded and Validate preview displayed Date preview checked / no batch dates saved. No missing option or application defect reproduced. The selector itself was valid. Corrected tests activate the trigger and option by keyboard, explicitly wait for the dialog, then verify validation and Reset. They pass twice. The exact cause of the old missing-option timeout remains unproven; unopened/closed picker or interaction timing is more consistent with current evidence than a missing implementation.

## Assessment input-target mismatch
A focused raw fill attempt succeeded, so the clipboard target mismatch is intermittent. It came from the browser connector's clipboard/focus targeting, not an application validation error. The harness now uses Control+A followed by pressSequentially, verifies the resulting non-redacted value, and activates buttons by Enter. All four role/viewport tests pass twice, including invalid score 101 rejection and valid score 75 producing the unpublished 75.00% preview. Tests still assert validation and unsaved publication boundaries. Subject's accessible name includes its validation error after empty review; the existing /^Subject/ selector correctly handles this. Exact 'Subject' would be an incorrect selector after validation.

## Lens: confirmed existing application pointer obstruction
Independently reproduced for Admin and Manager at actual 320px. With the preview visible and the lens not keyboard-focused, document.elementFromPoint at the interactive spectral lens's centre identifies the decorative span .landing-shape--clear. The clear shape has pointer-events:auto and hover z-index:5, while the button has z-index:2. A pointer click leaves aria-pressed=false. Keyboard Space toggles the button successfully.

Both shapes share .landing-shape:hover styling. Hover/focus/pressed states raise shapes, explaining why prior tests could pass after keyboard focus and fail when the decorative shape receives hover. Scroll timing can also cause the connector's first automatic scroll/click attempt to miss; the settled in-viewport obstruction was independently captured, so this is not solely a connector issue.

Admin was already failing in Phase 1. Manager has the same pre-existing shared markup/CSS; neither scene.tsx nor upstream-scene.css changed during Settings restoration. No evidence identifies this as a new Settings-restoration regression.

Evidence: admin-lens-hit-test.json, manager-lens-hit-test.json, admin-lens-obstruction-320.jpg, manager-lens-obstruction-320.jpg. Both JSON records show the decorative clear shape at centre, z-index 5 vs lens 2, pointer-events auto, and unchanged false pressed state after click.

PROPOSED MINIMAL FIX, NOT APPLIED: add `.appearance-preview .landing-shape--clear { pointer-events: none; }` in src/components/ics/settings-layout.css. This makes only the aria-hidden decorative clear shape transparent to pointer input within the Settings preview. Preserve visual rendering, animations, preview pane and interactive lens. After approval, rerun both roles at 320px and desktop with fresh focus and after keyboard use. No application file will be changed until approval.

## Files changed or created
Modified existing test harness only: scripts/phase1/browser-suite.mjs (keyboard text helper, value checks with documented phone redaction exception, explicit picker/preview waits, keyboard activation for affected form scenarios, and CSS viewport assertion).
Created this report and JSON/JPG evidence under qa-artifacts/phase2c; earlier failed helper attempts retained separately, not overwritten by final passing workflow results. No application source file changed in this phase.

## Preservation / checks
node --check scripts/phase1/browser-suite.mjs passed.
ESLint for scripts/phase1/browser-suite.mjs passed.
git diff --check passed.
Original preservation manifest still reports only the same two Phase 2B Settings files; 120 of 122 protected files match. All 56 screenshot baseline hashes match. No baseline recapture or manifest update.

TypeScript and production build were not rerun: this phase only changed an external .mjs browser test harness, and prior Phase 2B application validation passed. Focused browser runs are the relevant validation here.

Admin Settings role, route and original viewport restored after testing. All previews remained unsaved or were discarded. No wallpaper Apply/Remove cleanup was executed.
