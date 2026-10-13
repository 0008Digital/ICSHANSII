# Role Workspace and Motion Audit

Updated 2026-10-13 for the ICS Hansi presentation layer.

## Shared workspace

`src/components/ics/workspace-roles.ts` is the single presentation map for role labels, navigation features, scopes, and unavailable dashboard summaries. `navigation.ts` derives the existing centre route catalogue from this map. `AppShell` and `AppNavigation` accept role and tenant-brand props; the default app remains the visibly labeled Centre Admin demo. `RoleDashboard` shares the operational summary layout while showing only unavailable values. There is no login, session inference, role switcher, or client-side authorization claim.

Admin and Manager preserve the ten existing demo routes. The Platform Owner map is a separate platform workspace with no centre-record links. Teacher features are limited to assigned teaching workflows, and Student features are limited to self-service workflows. Non-admin roles are represented as planned, unlinked entries because the scoped routes and policies do not exist. The mapping and required server-side boundaries are also recorded in `backend-architecture.md`.

## Sidebar and navigation

The fixed desktop sidebar keeps the ICS mark, centre name, Hansi Branch label, grouped Overview/Academics/Operations links, bottom Settings, and a compact `Centre Admin · Demo UI preview · No session` identity. The active row uses one shared Motion capsule with a restrained glass fill and accent edge. Links use brief hover/press feedback. Existing mobile dock and More popover remain shared; the More destinations preserve Fees, Staff, Tests & Results, Homework, ICS Updates, Settings order.

At viewport heights above 440px, only `.sidebar-navigation` scrolls when its links overflow; its scrollbar is hidden and the identity footer stays visible. At 440px and below, the fixed sidebar itself becomes the sole scroll host so the brand and footer remain reachable without nested scrollers. Keyboard focus styling is retained. The live check is reusable in `scripts/sidebar-regression.mjs`, with geometry and overflow regression cases in `scripts/sidebar-regression.test.mjs`.

## Motion audit

The installed package is Motion for React 14.1.0. Existing bounded interactions use it for the desktop active sidebar capsule and hover/press response, the five-item mobile selection capsule, the Appearance source selector, calendar view/date highlights, and picker/choice overlays. These interactions call `useReducedMotion` where the movement is spring-based or animated. CSS also disables disclosure, overlay, and decorative scene transitions under `prefers-reduced-motion`. Static text, dashboard summaries, and data-entry values do not receive entrance animation. No second animation library or dependency was added.

## Refresh appearance investigation

The reported flash was **not reproduced** in the available Codex in-app Chromium profile. The user previously identified Brave as the affected browser; Brave is not exposed to this task's browser controls.

For a controlled check, Appearance was set to Dark + Photo in the persistent localhost:3000 profile. The cookie mirror and local preference trace both reported Dark + Photo. A normal Settings reload's earliest sampled animation frame (about 248 ms after navigation) had the root and provider set to Dark, the Appearance controls set to Dark and Photo, and the Photo scene mounted. Sampled frames 1–8 remained consistent; hydration completed at frame 27 without a theme/source transition. This shows that the earlier cookie and bootstrap path is consistent in this browser run, but it does not establish why Brave displays a flash or prove compositor pixels before the first sampled animation frame.

The production build succeeded, but the in-app browser could not reach the separately started localhost:3001 production server (connection timed out); production first-frame behavior was therefore not captured. Hard refresh, a new browser tab with a new storage context, IndexedDB custom-media restoration, actual Brave, and other browser engines were not verified in this run. The temporary frame logger was removed, and `src/app/layout.tsx` was restored byte-for-byte to its pre-diagnostic contents. No appearance initialization code was changed in this audit. The cause of the user's Brave flash remains undetermined, and it is not reported as fixed.

## Browser checks

The live centre routes `/`, `/students`, `/batches`, `/attendance`, `/tests-results`, `/homework`, `/fees`, `/staff`, `/ics-updates`, and `/settings` were checked at widths 320, 360, 390, 430, 768, 1024, and 1600px. The browser reported no document-width overflow or sidebar/workspace overlap. At 1280×900, all ten routes had a fixed viewport-height sidebar and an aligned workspace offset. At 1280×480, navigation overflowed its own hidden-scrollbar region while the footer remained in view. At 1280×420, the sidebar became the single hidden-scrollbar scroll host and its content remained available beyond the viewport. At 390×844, the More menu showed all six destinations, stayed inside the viewport and above the dock; Escape closed it and returned focus to More. Selecting ICS Updates navigated to its existing route.

The measured Appearance refresh used the current System+Motion default after the original preference was restored. Light/Dark/System code paths and all five scene sources have focused bootstrap tests, but browser visual coverage in this run only included System+Motion and Dark+Photo. Reduced-motion behavior is covered by existing code paths and checks; OS-level motion emulation was not available.
