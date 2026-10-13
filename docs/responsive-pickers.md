# Responsive ICS shell and canonical date picker

## Root causes and layout

The selected scene already has one correctly isolated fixed layer. Keep the
workspace transparent and retain the shared 72% OpenGlass chrome tint; opaque local
panels protect records/forms. No extra scene or fullscreen optical renderer was
introduced in this milestone.

A fixed sidebar with overflow-y:auto created an independent scroller. The shell now
uses a desktop CSS grid with a sticky, naturally sized sidebar and the document as
the ordinary page scroller. Below 768px the sidebar is hidden and bottom navigation
is used. At desktop heights below 761px the sidebar becomes static so all links
remain reachable through document scrolling. The header is sticky without a
separate scroll container. Tablet student records use cards below 1024px to avoid
cramped tables. Only constrained picker lists and overlay content scroll when needed.

The black N control was the Next.js development indicator, not an ICS navigation
item. `devIndicators:false` removes it using the documented Next.js configuration;
errors remain visible. Bottom navigation now has consistent 20px icons, 12px labels,
60px targets, safe-area padding and a matching 8px More-menu gap. Footer and focus
scroll margins reserve space for the header and navigation. Mobile controls use
readable 16px text to avoid input zoom, with consistent spacing and touch sizing.

## One chooser and one calendar

`ChoiceSelect` replaces native batch and status popups in the directory and the
admission batch field. Its native dialog is viewport constrained, with an app-owned
OpenGlass frame, a listbox, typeahead, arrow/Home/End navigation, Escape, focus return
and touch/pointer-friendly options. It does not add a second filter.

`DatePicker` is the canonical calendar for DOB/admission and future fee-payment,
attendance and exam dates. It uses the same `PickerOverlay`: an anchored desktop
modal popover and mobile bottom sheet, with browser-native focus containment,
outside/backdrop dismissal, Escape and focus restoration. The overlay responds to
visualViewport resize/scroll for software keyboards; physical-device validation
remains necessary. It copies the existing theme tokens across the portal rather
than introducing another theme provider. No third-party calendar package is used.

Props: `label`, controlled `value` (YYYY-MM-DD or empty), `onChange`, optional `id`,
`error`, `min`, `max`, `allowClear`, `showToday`. Defaults are 1900-01-01 through
2100-12-31. Invalid or reversed configuration bounds throw rather than silently
misrepresenting limits. Visible controls include previous/next month, an accessible
month chooser, directly editable year and ±10-year jumps, today/selected/disabled
states, optional Clear/Today actions and a keyboard-operable date grid.

Arrows move by day/week; Home/End move within a week; Page Up/Down change months,
and Shift + Page Up/Down changes years. Enter/Space selects a day. Focus cannot move
past configured date limits. Month transitions clamp short months and leap days.
The grid also handles the first/last supported Gregorian years without invalid
spillover dates. Restrained opacity animation is disabled by reduced-motion CSS.

`date-only.mjs` is the single arithmetic/validation layer. It strictly parses ISO
date-only strings and uses UTC only for calendar arithmetic. Selected values are
never converted to local timestamps or serialized with toISOString. Display uses
explicit day/month/year fields. Today is read client-side and on browser focus;
no unstable current-date read occurs during Next.js prerender. Device-local Today
is a UI convenience; real operational dates require the reviewed centre/server
clock policy during backend integration.

## Student workflow boundary

DOB is an optional personal detail. Admission date is optional and preview-only;
neither can be future dated, and admission date cannot precede DOB. The admission
calendar takes DOB as its minimum when supplied, with a second validation check
at preview submission. Existing
fictional profiles do not acquire fabricated birth dates. They display Not provided.
Date selection and edits remain unsaved previews. Official identifiers, admission
verification, student persistence, ledger writes and attendance are not implemented.
Future date fields must import this DatePicker rather than build module-specific
calendars. Backend auth, RLS and audited date/identity policies remain prerequisites.

## Changed files

- `next.config.ts`
- `src/app/globals.css`
- `src/components/ics/app-navigation.tsx`
- `src/components/ics/student-directory.tsx`
- `src/components/ics/students/model.ts`
- `src/components/ics/students/student-form.tsx`
- `src/components/ics/students/student-profile.tsx`
- New: `src/components/ics/choice-select.tsx`
- New: `src/components/ics/picker-overlay.tsx`
- New: `src/components/ics/date-picker.tsx`
- New: `src/components/ics/date-only.mjs`
- New: `scripts/date-picker.test.mjs`
- This document.

## Browser verification

35 ordinary page/layout checks: Dashboard, Students, Add Student, Student Profile,
Settings at 360, 375, 400, 430, 768, 1280 and 1600px. All retained one global scene,
no horizontal document overflow and no ordinary nested workspace/sidebar scroller.

26 overlay checks: batch selector/calendar at all four mobile widths in Light/Dark,
More at each mobile width, and calendars at all three tablet/desktop widths in both
themes. Every overlay fitted the viewport with no horizontal internal overflow.
More retained its active state, first-link focus, Escape return and safe gap.
A 1280×600 short-window keyboard End test scrolled the document, kept all sidebar
links accessible and retained a sticky header.

Calendar interactions verified: historical year 2008, February selection, leap-day
selection, arrow movement to 1 March, Clear, Today, minimum-date rejection, disabled
previous month at the minimum, and no invalid 29 February 2023 option. A complete
fictional admission preview included DOB and admission date and remained explicitly
unsaved. 22 frontend tests pass. Unit tests cover Gregorian boundaries, invalid strings, min/max inclusion,
month/year transitions, clearing, admission validation and UTC/local timezone safety
across UTC, Asia/Kolkata, America/Los_Angeles and Pacific/Kiritimati.

Limits: browser tests use desktop browser viewport emulation and pointer/keyboard
input, not physical-device certification. Real iOS/Android software keyboards and
live OS reduced-motion changes were not emulated; visualViewport handling and
motion suppression are implemented, with deterministic motion tests. Existing
backend files, vendor distribution and historical backend tests remain untouched.

Final validation includes TypeScript, ESLint, production build, frontend tests and
12-file OpenGlass integrity. An additional 12-case scene matrix exercised all four
sources on Dashboard/Students/Settings with no duplicate global layer or page
canvas occlusion. Actual video pause and preview animation suppression were
rechecked, followed by resumed playback. No dependencies were installed, no remote
services were connected, and no commit/push/deploy was performed.
