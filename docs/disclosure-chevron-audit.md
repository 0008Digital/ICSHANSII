# Disclosure chevron consistency audit — 13 October 2026

## Scope audited

Searched ICS-owned frontend routes, shared components and CSS for details/summary, expanded-state controls, accordion/disclosure imports, triangle glyphs and generated-marker patterns. This includes Dashboard, Students/admission/profile, Batches, Fees, Attendance, Staff, Tests & Results, Homework, ICS Updates and Settings. Five native disclosures exist: Settings Local media limits, Animation & finishing, Advanced Glass Settings, Scene interaction preview, plus the shared DatePicker's Jump to year. No additional native disclosure markers or solid triangle glyph implementations were found outside the protected vendor distribution.

Local media limits, Animation & finishing and Jump to year had native browser markers. Advanced Glass and Scene preview already used the existing chevron; they now share the same component and styling. ChoiceSelect, calendar month/year mode selectors and More navigation are existing picker/popover controls rather than native accordions. Their current icons, calendar arrows, navigation icons and back links were intentionally preserved.

## Changes

- src/components/ics/disclosure-summary.tsx: reusable native summary with a text span and existing Icon chevron-down (16px CSS size, inherited 1.6 rounded SVG stroke). No JavaScript state or nested interactive controls.
- src/components/ics/appearance/custom-editor.tsx: replace two native-marker summaries.
- src/components/ics/appearance/customizer.tsx: use shared summary for Advanced Glass and Scene preview.
- src/components/ics/date-picker.tsx: use shared summary for optional Jump to year disclosure; other calendar controls unchanged.
- src/components/ics/saas-layout.css: centralized marker suppression via list-style:none, empty ::marker and hidden ::-webkit-details-marker. Right-aligned chevron, 160ms rotation from down to up via native open attribute, visible focus and reduced-motion transition:none. Removed redundant Advanced-specific arrow styling. Existing padding, glass surfaces and disclosure sizing remain.

## Real browser verification

In the persistent in-app Chromium browser, all five disclosures were opened and closed with Enter/Space at 390px and 1280px in Light, Dark and System themes. Local media limits and Jump to year also tested with pointer clicks. Native open attributes changed correctly; labels remained intact. Every checked summary had exactly one aria-hidden SVG, list-style:none and empty marker content. The four Settings headers retained 44px height; calendar disclosure retains its existing compact sizing. Settled expanded chevron matrix(-1,0,0,-1,0,0) confirms 180deg rotation. Screenshots inspected Settings examples and the expanded mobile calendar. No document horizontal overflow. At 390px calendar bounds were x=30..360 and bottom=806, above the dock.

An early rapid automation sequence attempted to focus Scene preview while Advanced Glass was still closing. After explicitly opening the parent and waiting for its visible content, nested keyboard tests passed across all six theme/width combinations. No application workaround was introduced for that automation timing issue.

## Accessibility and limits

Retains actual details/summary semantics, Enter/Space activation, native expanded state and screen-reader behavior. SVGs are decorative; focus outlines remain. OS reduced-motion is handled by the shared CSS media query; real OS toggling was not emulated in this browser session. Firefox, Safari, real assistive technology and physical touchscreen gestures were not available for runtime verification. No intentional remaining default markers in ICS-owned disclosures; vendor components untouched.

No appearance persistence/hydration, backend, old-project, unrelated functionality, dependency or Git changes.
Validation: standalone TypeScript, ESLint, 40 frontend tests, production build and all 12 OpenGlass integrity checks passed.
