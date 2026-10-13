# Mobile layout architecture and QA

## Implementation

Mobile navigation is rendered through a body-level React portal. It retains the existing OpenGlass context and copies its current CSS theme tokens. It is independent of grid/layout ancestors, so ancestor filters/transforms cannot change its fixed containing block. `mobile-layout.css`, imported after the upstream stylesheet, owns the new `ics-mobile-dock` class instead of inheriting the legacy full-width mobile-navigation rules. A small viewport hook observes visual viewport resize/scroll and supplies docking/menu coordinates. Safe-area clearance and last-content padding use the same dock geometry. No development-indicator setting was changed.

Intrinsic widths are bounded throughout mobile content; metric labels can wrap. Dashboard uses two `minmax(0,1fr)` columns at 360–430px and one below 341px. Student records remain readable, and management forms use one column on mobile. No document-level overflow hiding is used to conceal layout errors.

The existing shared DatePicker remains canonical. Its month/year/navigation controls share one row, year entry and decade jumps remain available, and keyboard instructions are screen-reader accessible without consuming visible space. Only the four/five/six calendar weeks needed for the month are rendered. Native dialog focus containment, Escape, dismissal, bounds, clearing and date-only arithmetic are retained. The dialog observes its size and visual viewport and positions above the dock. In short viewports it scrolls internally rather than clipping controls.

## Verified browser results

- 576 layout cases: all 12 requested routes × 320/360/375/390/400/430px × Light/Dark × Motion/Photo/Topo/Chroma. Document scroll width was compared with document client width; key panels were inspected for viewport overflow. No final failures.
- Top/middle/bottom keyboard scrolling and dock-position checks on every route/width/theme with Motion, including settled bottom-content clearance. Some early keyboard measurements were rechecked after scrolling completed; final dock drift was zero.
- 48 overlay/focus cases across all widths and both themes: batch chooser, More placement and six links, Escape focus return, and the shared calendar. All remained inside the viewport and above the dock.
- Calendar at 320px: approximately 448px tall, down from the reproduced 714px; width 296px to preserve 12px side gaps. Wider mobile widths cap the calendar at 330px. Current October uses five weeks, plus its weekday heading.
- Historical year entry, February 29 2000 selection, clearing/focus return, keyboard input search, batch filtering, outside-click More dismissal and More destination highlighting were verified.
- At 320×400, picker and More menu remain bounded above the dock and use internal scrolling only as necessary.
- Dashboard/Students/Settings checked at 768/1280/1600px with no overflow and no visible mobile dock. Desktop calendar is 330px wide and approximately 438px tall for the current month.
- Custom appearance checked at 320/360/430px in both themes without changing its storage implementation.

## Limits

Card clipping and a non-fixed dock were not reproduced in the starting desktop browser at 320px; the new intrinsic sizing constraints and portal remove the corresponding architectural risks. The tall calendar was reproduced directly. The tool exposes viewport and visibility capabilities, not browser/pinch zoom or OS keyboard emulation. Physical mobile Safari, nonzero iPhone safe areas and real keyboard viewport transitions still require device QA. This is a demo application without authorized backend connectivity; no records were saved.

Run TypeScript, ESLint, `node --test scripts/*.test.mjs`, `npm run build` and `node scripts/verify-openglass.mjs`. Vendor and Supabase files are outside this change.
