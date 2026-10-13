# Fixed desktop sidebar and Settings surface verification — 13 October 2026

## Changes and causes

- `src/app/globals.css`: replaced the later grid/sticky/static sidebar block with one desktop-only fixed strategy. The previous max-height:760px rule made the sidebar static, reproducing the reported movement in a 1280x720 viewport. Removed obsolete sidebar minimum-height overrides. Shared --sidebar-width supplies both sidebar width and workspace offset (240px normally, existing 200px compact breakpoint). Sidebar is viewport-height, z-index 40, overflow-y:auto and thin scrollbar only when needed. Document remains the main workspace scroller. Mobile rules and dock are unchanged.
- `src/components/ics/saas-layout.css`: Settings heading previously explicitly used radius 0 and a rectangular negative-inset pseudo-background. Replaced that treatment with a 16px rounded, compact reading surface and restrained glass lighting; removed the pseudo-layer. Appearance card now has 18px corners and a subtle surface highlight, preserving its existing OpenGlass rendering. Draft preview has a separate 16px frame around the actual unfiltered media scene. Advanced disclosure has 16px corners, subtle depth and rounded summary states. Overflow remains visible around sticky preview containers.

No appearance state, persistence/hydration, selectors, Motion logic, media storage, backend, vendor, old project or Git changes.

## Actual browser verification

At 1280x720, all ten routes (Dashboard, Students, Batches, Fees, Attendance, Staff, Tests & Results, Homework, ICS Updates, Settings) had fixed sidebar bounds y=0..720, width=240, workspace x=240 and no document horizontal overflow.

Expanded Settings was scrolled to the document bottom. Sidebar remained y=0..viewport height; Settings heading remained below the 60px workspace header. Light/Dark desktop and mobile screenshots inspected for rounded header/card/preview/disclosure surfaces. Advanced and Custom layouts retain visible overflow for section-bounded sticky previews.

At 1280x480, sidebar scrollHeight=613 exceeded clientHeight=480. Focusing Dashboard scrolled sidebar to 0, then focusing Settings scrolled it to 133px, while document scroll remained 0. This verifies independently reachable keyboard navigation without moving the workspace. A sidebar scrollbar appears only for insufficient height; the independent document scrollbar remains available for long pages.

Responsive viewport checks: 1707x960, 1422x800, 1280x720, 1164x655, 1024x576, 768x720, 430x900, 390x900, 360x800 and 312x720. No document horizontal overflow. Desktop workspace offsets matched 240px/200px sidebar widths; mobile sidebar hidden, workspace x=0 and existing dock fixed.

## Zoom limitation

The browser API exposes viewport dimensions only, not native zoom. Keyboard zoom attempts were unsupported; reported DPR remained ~1 and visualViewport.scale=1. The desktop dimensions above approximate the CSS viewport sizes produced by 75%, 90%, 100%, 110% and 125% zoom for a 1280x720 baseline. They are NOT actual browser-zoom tests and do not verify fractional-pixel painting, Brave zoom behavior or native scrollbar rasterization. The affected Brave profile is not connected. Actual Brave screenshots at requested zoom levels remain necessary.

## Checks

TypeScript, ESLint, all 40 frontend tests, production build and all 12 OpenGlass integrity hashes passed. No dependencies installed, commits or deployment.
