# Final shared UI refinement audit

## Changes

- `src/components/ics/picker-overlay.tsx`: measure while hidden before exposing the positioned dialog; opacity-only entrance/exit (no vertical transform inside the scrolling calendar host); initial focus uses preventScroll; nonmodal choices use explicit open/focus management instead of native show autofocus; exiting overlays are inert and hidden from assistive technology. Existing modal calendar focus containment, bounds, VisualViewport handling, safe dock clearance and compact choice positioning remain.
- `src/components/ics/appearance/customizer.tsx`: ICS-owned Background Source buttons with one shared Motion layout capsule, saved scene state as the only selection state, reduced-motion support; original Glass Material/Accent controls unchanged; SVG chevrons for both advanced disclosures.
- `src/components/ics/settings-heading.tsx`: plain sticky Settings header instead of a rounded glass title card.
- `src/components/ics/saas-layout.css`: removes shared title backplates, consistent typography with a restrained contrast shadow; compact source control; integrated Advanced Glass disclosure and comparison spacing. Native disclosure transition progressively enhances browsers supporting interpolate-size; other browsers retain functional instant expansion. All content stays mounted, preserving preview-only state.

## Diagnoses and evidence boundaries

The previous shared overlay animated its inner content by 6px inside an overflow:auto calendar. Transformed content can expand scrollable overflow during the entrance; this geometry-changing animation is removed. It is a verified code path, but the transient flash itself was not captured frame-by-frame by the browser tool, which delivers settled states.

Earlier choice scroll locking was already removed in the preceding milestone. Stable scrollbar gutter remains for modal calendars. Initial dialog coordinates are now measured before visibility, with no timeout or global overflow-x hiding.

An additional 18/36px page movement was isolated during tests. It occurred when browser automation focused the trigger, before opening. With the trigger already focused, opening and dismissal preserve page scroll. Do not attribute that observed movement conclusively to native show autofocus. Explicit nonmodal opening avoids an additional native autofocus step during measurement.

Title boxes came from later .page-heading > div background/padding rules; those are overridden centrally. Settings retains a flat sticky navigation surface so scrolled content does not obscure its heading. Background Source previously used independent upstream selected-button decoration; its ICS-owned selection now animates one shared capsule without modifying upstream assets or material controls.

## Browser checks reproduced

- 13 routes × 9 widths × 2 themes × 5 sources = 1,170 geometry cases. Widths: 320, 360, 375, 390, 430, 768, 1024, 1280, 1600. Sources: Motion, Photo, Topo, Chroma, Custom gradient. No document overflow, duplicate workspace scene or shared title backplate.
- 54 Batch/Status/DatePicker cases: no viewport/dock clipping, page width/x-position shift, geometry transform on the animated overlay, or excess dialog scroll area at 900px viewport height. Trigger-focus scroll is separate from opening.
- 36 additional pre-focused Batch/Status opening cases across both themes: page scroll/width stable, no clipping or dock collision.
- 45 Light Settings cases across all widths/sources with Advanced Glass expanded: no overflow, exactly one source capsule. Preview Lighting Angle retained across disclosure collapse/reopen.
- Five repeated calendar open/close cycles at 390px: one active dialog, no excess dialog scroll area; 20-year jump to 2006 and historical leap-day keyboard selection (29 February 2000), with focus restored to birthDate.

Custom image/video/gradient editing, local draft/Apply/Reset/Remove and IndexedDB implementation were not changed. Contact validation, operational modules, mobile dock and vendor code were not changed. Custom uploaded-media restoration and physical touch/iOS/Safari/software keyboard/safe-area behavior were not independently re-tested. OS-level reduced-motion simulation and high-speed first-frame capture were unavailable; reduced-motion code paths and existing tests are preserved. Ordinary viewport screenshots and settled DOM checks do not certify frame-perfect absence of flash.

Background Source keyboard checks also passed: ArrowRight selected Photo, End selected Custom, Home restored Motion, and Motion persisted after refresh. The control uses roving focus and does not introduce duplicate selection state.
