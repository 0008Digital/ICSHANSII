# Compact Settings and sliding navigation QA

## Findings and implementation

- The Custom editor was the last child of the appearance grid, after the entire preview column. A measured mobile layout placed it more than 1,000 px below Background Source. It now lives immediately inside the background group, 12–14 px below the selector.
- Repeated large preview areas, 18–24 px control gaps and a one-column settings breakpoint made the page unnecessarily long. Settings now uses two balanced control columns from 768 px, one compact column below that, and a native disclosure for the complete scene/material comparison. No settings were removed. On 360 px, with disclosures closed, measured document heights are 999 px for Motion and 1,581 px for Custom (800 px viewport, including navigation clearance).
- The former ordinary page heading was not sticky. The compact Settings heading now measures the existing app header with ResizeObserver, sticks directly below it, and retains an Appearance section link. The large Appearance heading scrolls normally. Settings controls have extra scroll clearance for keyboard focus.
- The dock previously painted each active item separately. One aria-hidden capsule now moves across five equal tracks with a 440 ms spring-like cubic-bezier transition. Its target derives from the current pathname and existing More-open state; there is no second route-selection state or animation library. Reduced motion disables the transition.
- Expanded comparison sliders retained an upstream minimum width and overflowed at 320 px. ICS-owned overrides allow slider shrinking and header wrapping; segmented indicators are clipped to their own rounded control during resize.
- No persistent duplicate gradient or placeholder element was reproduced inside the original Custom preview. The editor's extra nested glass surface was removed, and the draft preview now has explicit paint containment, isolation, rounded clipping and paint/dim layer ordering. It contains one shared CustomBackdrop, using the same rendering component as the applied scene. No persistent overlap or flicker was observed in tested gradient, JPG and MP4 previews. This is not a guarantee against device-specific compositor artifacts.

## Files changed in this task

- `src/app/layout.tsx` — load the ICS-owned settings stylesheet after vendor/mobile styles.
- `src/components/ics/settings-layout.css` — compact settings, preview containment, responsive controls and shared dock capsule.
- `src/components/ics/settings-heading.tsx` — compact sticky heading and measured app-header offset.
- `src/components/ics/management-page.tsx` — use the Settings-specific heading.
- `src/components/ics/appearance/customizer.tsx` — source/editor grouping, balanced control columns and preview disclosure.
- `src/components/ics/appearance/custom-editor.tsx` — plain embedded editor, nearby draft preview, collapsible finishing controls and media limits.
- `src/components/ics/app-navigation.tsx` — one route-driven shared selection capsule.
- `docs/settings-navigation-qa.md` — this report.

The existing dirty working tree predates this task. Vendor files, backend migrations/tests, wallpaper storage and the old project were not changed.

## Browser checks

Actual Chromium in-app browser, using viewport overrides and DOM geometry rather than screenshots alone:

- 28 Settings cases: 320, 360, 375, 390, 430, 1280 and 1600 px; Light/Dark; Motion/Custom. Checked document width, adjacent editor placement, desktop columns and sticky-heading geometry after scrolling. Sticky offset matched the app-header bottom when scrolled; short desktop pages need no scrolling.
- 70 expanded-preview cases at those same widths: both themes and Motion, Photo, Topo, Chroma, Custom. After fixing slider sizing, no document-width overflow or horizontally clipped control panels was found.
- Four additional tablet cases: 768/1024 px, Light/Dark. Two control columns fit; mobile dock is hidden.
- Twenty Dashboard/directory/admission/profile cases at all five mobile widths, using Dark: no document overflow; one fixed dock and one selection capsule. Both themes were separately tested on Settings.
- Direct routes, Dashboard → Students → Batches → Attendance, Back/Forward and rapid successive navigation: selection target follows the route. Intermediate computed transforms confirm movement rather than independent item fading. More takes the fifth target while open; Escape returns focus, outside click closes it, and all six secondary links remain available. At 320 px the menu stays within the viewport above the dock.
- Local JPG and MP4 uploads decoded in the draft preview; media rectangles match its clipped bounds. MP4 `paused` changed false → true → false with Scene Motion; gradient animation state changed running → paused → running.
- Changed gradient color, maximum blur and speed using keyboard controls: draft changed while applied scene remained unchanged. Reset restored the default draft. Applied default gradient restored after refresh. IndexedDB/file lifecycle logic is unchanged; uploads in this task were previewed without applying media.
- Student search for Diya and New General filtering each returned one of five fictional records. Admission and profile navigation worked. At 320 px the existing DOB calendar was 296 × 447.5 px, entirely within the viewport, 10 px above the dock; Escape returned focus to `birthDate`.

## Validation and limits

TypeScript (`tsc --noEmit`), ESLint, all 29 frontend tests, production build and all 12 OpenGlass SHA-256 integrity checks passed. Existing Node module-type warnings are non-failing. No dependencies were installed and no commit, push or deployment was performed.

Physical iPhone safe areas, Safari compositing, real touch gestures, software keyboards and OS reduced-motion emulation were not available in this browser runner. Reduced-motion CSS and existing runtime tests were checked, but the OS preference was not changed. The sliding motion is spring-like easing, not a physics simulation. Expanded advanced settings necessarily add page height; controls remain reachable rather than removed.
