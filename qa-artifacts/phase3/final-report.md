# Phase 3 — UI alignment and border correction

## Outcome and scope

Completed a browser-based route/layout audit across Developer, Centre Admin, Manager, Teacher, Student A and Student B. Repaired four confirmed geometry issues in three small CSS batches. No business logic, role implementations, providers, authentication, permissions, records or vendor code changed. Existing compact Settings composition and the Phase 2D pointer rule remain unchanged in this phase.

This report distinguishes measured page observations from interaction tests and visual inspection. It does not claim exhaustive coverage of every possible UI state.

## Confirmed defects and corrections

| Issue | Roles/pages | Before | Smallest correction |
|---|---|---|---|
| Native outset border on primary form actions | Admin/Manager Tests & Results; shared form action buttons including admission previews | Review results computed border: ~1.67px outset, with outline:none at rest; therefore not a keyboard focus ring | Explicit 1px solid var(--accent) border on `.form-actions > button.primary-link` |
| Assessment field/label misalignment | Admin/Manager/Teacher `/tests-results` shared assessment | Inputs ~42px, picker triggers ~44.6px; normal label gaps differed. Validation aligned whole containers at their bottoms, moving input tops to different levels | Start-align the academic grid, match existing picker label size/gap, use 46px minimum control height with consistent block padding; wrapped controls can still grow |
| Uneven assessment action footer | Same assessment | Review 44px and Reset 40px; footer top padding14px, bottom4px | Reset min-height44px within assessment; padding14px top/bottom; existing primary/secondary styles and radii retained |
| Stretched mobile report status selector | Developer `/developer`, report details at320/375 | Header width226px; select125px wide and ~117px tall; title squeezed into91px | Stack only the mobile report detail header; select spans available width with min-height44px. Desktop layout retained |

Validation-state assessment geometry after correction: all four controls have the same top and ~46px height; Review/Reset have identical tops/bottoms. Keyboard focus-visible remains a solid outline. Evidence: batches/border-correction.json, batches/assessment-alignment.json, batches/developer-header.json.

The decorative lens pointer fix remains in settings-layout.css. No global outline removal, pointer-events change, z-index adjustment, transforms, negative margins or theme replacement was introduced here.

## Exact Phase 3 files

Modified application files:
- C:/Projects/ics-hansi/src/components/ics/saas-layout.css
- C:/Projects/ics-hansi/src/components/ics/demo-workspaces.css

Created browser audit helpers:
- C:/Projects/ics-hansi/scripts/phase3-ui-audit.mjs
- C:/Projects/ics-hansi/scripts/phase3-ui-states.mjs

Created evidence/docs only under C:/Projects/ics-hansi/qa-artifacts/phase3/. See files-created.txt for the exact absolute file inventory, including this report, JSON measurements, validation logs and before/after JPGs. Earlier Phase 2B/2D changes to customizer.tsx and settings-layout.css were already present and were not edited in Phase 3. No Phase 1 baseline or manifest file was changed.

## Before/after evidence

Screenshots are review evidence, not newly approved baselines. Animated scenery, chart entrances and screenshot scaling can differ; these are not pixel-diff assertions.

| View | Before | After |
|---|---|---|
| Assessment desktop1440 | [Before](C:/Projects/ics-hansi/qa-artifacts/phase3/before/admin-1440--tests-results.jpg) | [After](C:/Projects/ics-hansi/qa-artifacts/phase3/after/admin-1440--tests-results.jpg) |
| Assessment mobile320 | [Before](C:/Projects/ics-hansi/qa-artifacts/phase3/before/admin-320--tests-results.jpg) | [After](C:/Projects/ics-hansi/qa-artifacts/phase3/after/admin-320--tests-results.jpg) |
| Developer mobile320 | [Before](C:/Projects/ics-hansi/qa-artifacts/phase3/before/developer-320--developer.jpg) | [After](C:/Projects/ics-hansi/qa-artifacts/phase3/after/developer-320--developer.jpg) |
| Desktop validation state | [Before](C:/Projects/ics-hansi/qa-artifacts/phase3/before/assessment-validation-1440.jpg) | [After, Light/Regular](C:/Projects/ics-hansi/qa-artifacts/phase3/states/admin-1440-Light.jpg) |

The Tests & Results reference screenshots mentioned in the request were not attached; comparison against those references is unverified. The older approved Settings reference screenshot/video also remains unavailable. No present capture was substituted as an approved reference.

## Responsive coverage

360 successful route/identity/viewport observations, zero document-wide horizontal overflow detected. Sources: after/matrix.json (264) and records/matrix.json (96). Each requested size includes60 observations.

| Requested CSS width | Actual measured CSS width | Result |
|---|---|---|
|320|320|60 observations; no readiness/identity or document-overflow failures|
|375|375|60 observations; no failures|
|768|769|60 observations; approximate tablet coverage, NOT exact768|
|1024|1024|60 observations; no failures|
|1440|1440|60 observations; no failures|
|1920|1920|60 observations; no failures|

The existing browser scaling maps integer viewport overrides to rounded CSS widths, so exact768 could not be represented. Fractional overrides are rejected by the browser capability. A separate lower-breakpoint check measured767 CSS pixels, showed the mobile dock and a single stacked academic column, and no overflow. The complete matrix at requested768 is explicitly marked approximate-viewport. Browser zoom preferences were not changed.

Per identity: Admin24 routes (including all five fictional student profiles/edit forms); Manager22; Developer2; Teacher6; Student A3; Student B3. This covers all19 static page implementations and the existing fictional profile/edit instances reachable from the directory. Routes and section anchors are separately recorded in the audit scripts and state results.

The page geometry scan inspects visible controls, action boundaries, academic field bounds, out-of-viewport elements and small controls. It records flags for manual interpretation; intentional horizontal scrolling is not automatically classified as a defect. Representative page screenshots were visually inspected, especially assessments, Developer mobile, Teacher mobile, Student portal and preserved Settings. Not every pixel of all360 observations was manually reviewed.

## Browser interaction results

- Full existing Admin/Manager regression:165 passed,2 failed. Raw evidence retained in regression/browser-results.json.
- Targeted recheck:3 passed,0 failed (two cases plus cleanup), in recheck/browser-results.json.
- Latest result per named regression scenario:167 passed,0 failed. This consolidation does not erase the raw failures.
- Two initial timeouts: Admin desktop fee installment preview heading not observed; Admin mobile Settings navigation timeout. Both passed unchanged on recheck. Cause was not proven; transient browser timing is plausible. No application behavior was modified to force them green.
- Additional states/sections:86 passed,0 failed, in states/results.json. Includes24 Light/Dark x Clear/Regular/Frosted cases on the changed assessment and Developer layouts at320/1440, plus all Developer section links, Teacher tool links and both Students' portal links at320/1440.
- Additional shared overlay checks: calendar and batch picker fit the viewport and close with Escape at320,375,769,1024,1440,1920. See overlay-checks.json. One early tablet activation timed out before the calendar appeared; it passed on unchanged rerun. This probe failure is not included as a successful first attempt.
- Developer search empty state, temporary report status and notes were exercised, then page reload discarded drafts. No report was sent or published.
- The existing suite exercises admissions, directory tabs/search, profiles/edit validation, batches, attendance draft/reload, assessment invalid/valid results, fees, ledger, audit pagination/dialog, demo CSV, local chat previews, search/More navigation and Settings controls.
- Settings checks include appearance Apply/reload restoration, reset/discard, sources/material/accent/motion, advanced sliders/comparison scope, floating lens keyboard/pointer and Admin branding draft/reset. Saved preferences restored; no Light/Photo defaults forced.

Touch events and a physical mobile keyboard/safe-area environment are NOT exposed by this browser API and were not tested. Narrow-viewport mouse clicks do not establish touch support. Keyboard and pointer interaction were actually exercised.

## Build/static/integrity results

- npx tsc --noEmit: PASS, exit0.
- npm run lint: PASS, exit0. Final all-project lint and audit-script syntax/lint checks also passed.
- npm run build: PASS, exit0, local only.
- node scripts/verify-openglass.mjs: PASS, all12 vendor/scene hashes match4943bbfd5611fe211cccf4b50c384345468d635b.
- Node tests:146 PASS,1 FAIL out of147. The original preservation guard deliberately reports four changed protected files: earlier customizer.tsx/settings-layout.css plus the two authorized Phase3 stylesheets.118 of122 protected files retain their original hashes. Manifest unchanged; this guard is not green and has not been bypassed.
- All56 Phase1 reference screenshots match their original hashes. No baseline updated or approved.
- git diff --check: PASS.

See typescript.log, eslint.log, eslint-final.log, eslint-audit-scripts.log, node-tests.log, build.log, openglass.log, preservation.log and baselines.log.

## Remaining issues / coverage limits / approval

- Existing Student A/B portal uses the same Aarav fictional profile fixture. Recorded as an existing identity/data issue; no role/data/auth repair performed.
- Existing global custom-wallpaper cleanup risk remains unchanged. Wallpaper upload/Apply/Remove and destructive cleanup were not executed.
- No production/backend operations, authentication or permission changes; no live records modified. Demo permission checkboxes were not toggled.
- Branding Apply/logo upload, exhaustive modal variants, every combination of all filters/validation messages, browser/device differences and physical touch remain untested. These are not silently counted as covered.
- Some audit startup attempts failed due a premature readiness inspection, previous-identity render during rapid role switch, the Student dock's distinct accessible navigation label, and exact768 viewport assertions. The before matrix retains intermediate failures; the completed after matrix asserts the selected identity and distinguishes approximate widths. Two long browser calls timed out; persisted completed results were recovered, and final counts use saved evidence only.
- Scrollable tabs, chat room lists, permission matrices and result tables intentionally extend inside their own scrollers; they were preserved. A fixed dock can appear over the original viewport area in full-page screenshots; the document includes bottom clearance and relevant keyboard/pointer workflows passed.
- Baseline approval remains a separate user decision. The four refinements are within the requested scope; no unrequested redesign requiring a new design decision was introduced. Exact reference matching and exact768/touch verification are not claimed.

All work remained local. No commits, branch switches, pushes, previews, deployment, migrations, real-data edits, file deletion or Git history changes. Original Admin Settings route/identity and default viewport restored after testing.
