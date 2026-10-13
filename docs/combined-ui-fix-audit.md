# Combined UI fix verification — 13 October 2026

## Implemented scope

- Shared StudentForm/model/profile: one required guardian contact, strict 10 digits beginning 6–9; optional student contact follows the same rule only when supplied. Student, father and mother names remain required. Red required markers, existing date/batch validation and unsaved-only previews remain. Existing unclassified demo contacts stay explicitly legacy; no legacy contact is substituted for guardian contact. Separate legacy father/mother contact slots are retained for deliberate future classification.
- PickerOverlay: all choices/calendars center in the visible main workspace (excluding the sidebar), or mobile VisualViewport. Both use measured height with a 6px trigger gap, below-first/above fallback, bounded to viewport/dock. Removed the calendar's artificial 480px placement allowance. Hidden measurement precedes visibility; opacity-only animation, keyboard, focus return and modal calendar behavior remain.
- Advanced Glass: controls left and simultaneous comparison/scene lens previews right; section-bounded sticky preview at >=1024px and >=700px height. Header offsets are measured together. Mobile previews stack near controls without sticky positioning. Source capsule corners corrected centrally. Light settings panels use stronger translucent fills without altering user Frost/Intensity.
- Live settings remain theme/material/accent/source/motion/intensity/frost and persist. Comparison material/split/lighting and lens interaction remain local preview-only settings.
- Appearance SSR: localStorage remains canonical. A bounded non-sensitive cookie projection mirrors visual settings for request-rendered HTML/provider hydration. It excludes media IDs, bytes and filenames. Uploaded media stays in IndexedDB; Custom media initially uses its own configured gradient until the blob resolves, rather than rendering Motion. Request-time cookies require dynamic routes; cacheComponents/partial prefetch configuration was disabled. No auth or backend reads were introduced.

## Checks reproduced

TypeScript, ESLint, 35 frontend tests, production build and all 12 vendor hashes passed. Regression tests cover guardian validation, optional phone isolation, retained legacy contacts, SSR projection and bootstrap metadata migration.

Real in-app Chromium browser: admission/calendar and expanded Settings measured at 320, 360, 375, 390, 430, 768, 1024, 1280 and 1600px; no document horizontal overflow in those checks. Calendar fits above the mobile dock. Desktop workspace centering, historical DOB 2005/month selection, required validation, New General selection and unsaved preview verified. Mobile status Escape and student profile legacy contact labels verified. Expanded desktop previews and live/preview sliders inspected; CSS sticky/static modes checked across breakpoints.

Saved refresh combinations verified after settling: Light+Photo, Dark+Motion, System+Topo, Light+Chroma, Dark+Custom. Local repository image and MP4 were selected through the file chooser, applied and restored after reload; restored blob elements verified. Scene Motion actually paused/resumed all restored video elements. No hydration errors observed; Next emitted an existing photo LCP eager-loading recommendation.

## Evidence limits

Browser automation captures settled states, not a frame-by-frame refresh or popup entrance trace. No frame-perfect no-flash claim is made. Existing users with only localStorage and no appearance cookie require their first visit to populate the mirror; the server cannot access localStorage on that initial request. Cookies blocked/cleared or another browser/profile likewise cannot provide server preferences. System OS changes between request and hydration may briefly differ from the last mirrored resolved mode. IndexedDB media decoding remains asynchronous and uses a same-mode gradient fallback. Real iOS keyboard/safe-area, storage-denial behavior and reduced-motion OS emulation were not re-tested this turn. No production/backend/vendor/old-project changes, installs or commits.

## Exact files edited in this task

- next.config.ts
- src/app/layout.tsx
- src/app/providers.tsx
- src/app/theme-preference.ts
- src/components/ics/students/model.ts
- src/components/ics/students/student-form.tsx
- src/components/ics/students/student-profile.tsx
- src/components/ics/choice-select.tsx
- src/components/ics/picker-overlay.tsx
- src/components/ics/appearance/customizer.tsx
- src/components/ics/appearance/material-comparison.tsx
- src/components/ics/settings-heading.tsx
- src/components/ics/saas-layout.css
- scripts/students.test.mjs
- scripts/date-picker.test.mjs
- scripts/theme-preference.test.mjs
- docs/combined-ui-fix-audit.md

Direct raw HTTP server-response probing from the sandbox was unavailable due local socket restrictions. Server initialization is covered by projection tests and the successful dynamic production build; browser refresh evidence above is settled-state evidence.
