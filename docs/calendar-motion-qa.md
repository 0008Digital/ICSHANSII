# Shared calendar and spring navigation

## Implementation

The project had neither `motion` nor `framer-motion` installed. The user's animation-library update explicitly authorized `npm install motion`; this added Motion 14.1.0 and its three animation dependencies. The lockfile records exact versions and integrity hashes. Installed peer ranges include React/React DOM 19. No other package versions changed.

The existing shared DatePicker remains the canonical calendar. Its year button opens a four-column scrollable year list, highlights the current calendar year, scrolls it into view and focuses it. Twenty-year jump buttons move focus without requiring typing. An optional Find year disclosure supports very distant years. Arrow keys navigate the list; Page Up/Down jumps twenty years, and Home/End reaches its bounds. Selecting a year returns focus to the year trigger.

The month button opens a compact twelve-month grid inside the same dialog. Arrow keys and native button keyboard activation work. Months outside the field's inclusive date bounds are disabled. Month/year selection preserves the cursor day when valid, clamps leap days to the destination month's length, and applies the original field bounds. Only choosing a date, Today or Clear calls the existing value callback.

Motion's AnimatePresence gives calendar months and selector views 140 ms slide/fade transitions; outgoing panels are inert, hidden from accessibility and removed from layout during exit. The native modal retains its focus containment, outside dismissal, Escape and focus restoration. The popup itself fades/slides over 120 ms. Keyboard cursor and selected-date highlights use small shared-layout spring layers. Motion's `useReducedMotion` disables translation, scale animation and animated transitions when requested. No large page layouts animate.

The mobile dock retains one shared capsule, now driven by Motion's physical spring (stiffness 520, damping 44, mass 0.8). A ResizeObserver measures the five real navigation tracks; route state and existing More-open state determine its target. There is no second selection state, CSS transform transition, new navigation system or animation library beyond Motion. The measured first target is rendered without an entrance slide.

Fast browser QA exposed a delayed toolbar movement when an outgoing year panel temporarily retained layout height. Exiting panels now leave layout immediately. The popup positioner also reserves an external 480 px placement envelope for calendars, bounded by available viewport space. This keeps the toolbar stationary across day/month/year views without inserting blank space inside shorter views. Taller optional content remains clamped to the viewport. Generic batch/appearance selectors retain their existing placement.

Implementation uses the documented [Motion React animation API](https://motion.dev/docs/react-animation). OpenGlass rendering, licensing, appearance preferences, wallpaper storage, backend files and the old project were not changed.

## Changed files

- `package.json`, `package-lock.json` — authorized Motion dependency.
- `src/app/layout.tsx` — import final ICS interaction styles.
- `src/components/ics/app-navigation.tsx` — measured, shared spring capsule.
- `src/components/ics/date-picker.tsx` — integrated selector views, accessibility/focus and Motion transitions.
- `src/components/ics/picker-overlay.tsx` — small popup entry/exit animation and stable calendar placement.
- `src/components/ics/date-only.mjs` — day-preserving bounded month/year changes.
- `src/components/ics/interaction-motion.css` — compact selectors, layering and removal of competing CSS animations.
- `scripts/calendar-selection.test.mjs` — leap/day preservation, historical DOB years, inclusive bounds and Gregorian extremes.
- `docs/calendar-motion-qa.md` — this report.

## Browser verification

Actual Chromium in-app browser, DOM geometry plus visual inspection:

- Final 36 calendar cases: 320, 360, 390, 430, 768 and 1280 px, Light/Dark, day/month/year views. Each selector view was asserted present before measuring. No document horizontal overflow, viewport clipping or dock collision. Toolbar top-coordinate spread across the three views was zero in each case.
- Picker widths were 296 px at 320 px and 330 px at larger widths. Normal year view height was approximately 454 px. At 320×400 the dialog was constrained to 296×294 px, with internal scrolling and a 10 px dock gap.
- DOB years 1990, 2005, 2010 and leap day 29 February 2000 were selected through the actual UI. Twelve final width/theme sequences selected the leap day and returned focus to the DOB trigger. The final visible value was `29 February 2000`. Browser tooling redacts hidden DOB input values, so exact date-only storage semantics were verified by the pure date tests instead of bypassing that redaction.
- Selected year was visible and focused after opening. Twenty-year jumps, year Page Up, staged Escape (selector → calendar → closed), day Arrow Left and Shift+Page Down, optional typed Find year, disabled future DOB months, Clear and focus restoration were checked.
- The dock retained exactly one capsule. Measurements after resizing at all four mobile widths and after navigation settled within one CSS pixel of target position and width. Rapid taps, direct Settings loading, Back/Forward and More open/close followed the actual current route. More Escape returned focus to its trigger.
- Final browser console inspection reported no errors or warnings.

## Validation and limitations

TypeScript, ESLint, all 31 frontend tests, production build and all 12 upstream SHA-256 integrity checks passed. No commit, push, deployment or backend operation was performed.

Reduced-motion paths were reviewed and use Motion's live preference hook; the runner cannot force the OS setting, so physical preference switching, Safari compositing, real touch/keyboard behavior and nonzero iPhone safe areas remain device QA. The selector list is bounded by each field's date range and is not virtualized; current fields use ordinary coaching/student ranges. Very short viewports necessarily permit scrolling inside the overlay.

The authorized install's audit reported five high-severity package entries rooted in the existing `braces` stack-exhaustion advisory, propagated through `micromatch` → `fast-glob` → `@next/eslint-plugin-next` → `eslint-config-next`. All five versions match the pre-install Git lockfile; Motion is not listed in this report. This remains unresolved and was not addressed with an unrelated downgrade or force-fix. See [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
