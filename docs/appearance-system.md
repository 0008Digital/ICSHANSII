# ICS Coaching Centre appearance system

## Upstream inspection and reused work

Reference: https://moelueker.com/liquid-glass. Local source pin:
4943bbfd5611fe211cccf4b50c384345468d635b. The inspected showcase implementation is
`apps/showcase/src/landing-page.tsx` (`LandingBackdrop`, `LandingControls`,
`HeroRuntimeReadout`) with `landing-page.css`, plus `packages/core/src/materials.ts`.
The existing vendored UI distribution remains unchanged.

`public/open-glass-scenes/` contains byte-identical architectural-contrast.jpg and
motion-source.mp4, MIT LICENSE, original CREDITS and a SHA-256 provenance manifest.
CREDITS identifies the image as an original generated architectural scene and the
video as an original procedural H.264 light field, not a third-party photograph.
Selected scene/shape CSS is scoped in the ICS appearance directory, with its MIT
copyright notice. No upstream header, marketing copy, build tools or research
scripts were transferred.

## Canonical state and rendering

The existing `createThemeStore` now owns the entire appearance object. Theme keeps
its existing key for compatibility; visual settings use a versioned key with strict
allowlists/range validation. There is one store and one GlassSystemProvider.
Blocked storage falls back to memory. Cross-tab changes notify subscribers. SSR and
initial hydration use a stable default snapshot; the existing pre-paint theme
bootstrap stays intact. Visual settings restore after hydration, so a brief default
scene/accent may appear before restoration on a cold load.

Controls use the actual upstream SegmentedControl, Slider and Switch. Materials
use Glass material presets; Frost uses optics.frost. Selecting a material reseeds
frost (clear 4%, regular 24%, frosted 66%), matching upstream. Frost and intensity
remain independent after selection. Intensity retains upstream 35–100% scene
saturation/contrast/glow mapping and additionally changes supported GlassLook
lensing/highlight multipliers (intensity / 78). Provider blur multiplier is
0.6 + frost/100 for shared recipes. These are CSS-first supported OpenGlass
parameters; this is not a claim of physical ray-traced refraction or pixel parity.

Upstream has six swatches: Neutral #f4f3ee, Cobalt #7896ff, Teal #43d6b0,
Violet #aa92ff, Coral #ff8a76, Amber #f1c75b. ICS labels these Blue/Purple/Yellow
as requested. The seventh Periwinkle uses upstream's custom-picker initial
#7896ff (same as Cobalt); there is no distinct seventh upstream preset.
Custom colors use the upstream palette's contrast-correct accent/ink/focus tokens.

Motion uses the original video, Topo the original repeating contour gradients,
Photo the original image/crop, and Chroma the original static coral/teal gradients
with floating morphing lenses in the preview. Chroma was not a separate upstream
video. Floating shapes are the original CSS approximation; the central pane is
actual OpenGlass. The preview is adapted to a management workspace, not a copy of
the promotional homepage. No screenshot or fake blur replaces Glass.

Video playback pauses when motion is off or the document is hidden. Runtime system
reduced-motion preference is authoritative; CSS animations pause or disable too.
The scene does not introduce pointer polling or requestAnimationFrame loops.
Selected backgrounds are visible behind chrome; dense module content is opaque.
The sidebar, header and mobile navigation use the shared 72% surface tint over actual Glass.
The workspace itself is transparent; dense data is protected by local opaque panels.
Mobile fixed chrome is mounted outside that filtered sidebar to avoid creating an
incorrect fixed-position containing block.
Light/Dark/System remains upstream-controlled, including live OS color-scheme
updates. Heavy optical/media rendering is never placed behind tables/forms.

## Mobile navigation

The controlled upstream Popover supplies a portal, viewport clamping, outside
pointer dismissal, Escape and focus return. Opening More changes its visual active
state without navigation and suppresses primary active highlights until closed.
Links close it and navigate normally. Focus moves to the first link on opening.
The existing current route is retained behind the nonmodal menu. Safe-area padding
and constrained scrolling protect small screens. The mobile portal is anchored
above the 68px navigation plus an 8px gap and safe area, avoiding upstream
measurement drift during the opening animation. Resizing to desktop closes it. Sidebar and all existing module
routes remain unchanged in purpose.

## Limits and verification

No new dependencies, external assets/requests, backend connections, database edits
or real records. License/provenance remains in source and documentation; user-facing
branding is ICS Coaching Centre. Browser renderer/capability/accessibility fallbacks
remain upstream behavior. The adaptation has not established pixel-perfect fidelity,
WebGL refraction equivalence or a full cross-browser/device certification.

## Files in this milestone

Modified: `src/app/theme-preference.ts`, `src/app/providers.tsx`,
`src/app/layout.tsx`, `src/app/globals.css`,
`src/components/ics/app-navigation.tsx`, `src/components/ics/glass.tsx`,
`src/components/ics/shell.tsx`, `src/components/ics/management-page.tsx`.

Created: `src/components/ics/appearance/customizer.tsx`, `scene.tsx`,
`upstream-scene.css`; `scripts/appearance.test.mjs`; this document;
`public/open-glass-scenes/architectural-contrast.jpg`, `motion-source.mp4`,
`LICENSE.txt`, `CREDITS.md`, `provenance.json`.

## Validation evidence

16 frontend tests passed: appearance/storage validation, copied asset hashes,
reduced-motion/hidden-document suppression, legacy theme persistence and Students
regressions. The unchanged disposable PostgreSQL runner passed 71 groups and its
cluster was stopped. No hosted database was contacted.

Browser checks exercised every source and swatch, custom color input, material
preset/frost reseeding, independent sliders, video pause/resume, theme selection,
refresh restoration, module navigation, mobile More on Dashboard/Students/Batches/
Fees, outside click/Escape/focus return, menu selection, desktop resize dismissal,
360px and 1280px layouts, and absence of hydration errors. Actual OS reduced-motion
emulation is not exposed by the available browser tooling; that path was checked
through runtime source inspection and deterministic unit tests rather than a live
OS setting change. No pixel-perfect or cross-browser certification is claimed.

## Workspace visibility correction

Root cause verified in a real browser: one global fixed scene already existed in
an isolated shell at z-index -1. A solid `--canvas` background on `.workspace-main`
covered its entire content area, while the inline sidebar tint was 92% opaque.
This was content occlusion, not a missing scene or an incorrect z-index.

The correction preserves that one global scene (the Settings preview is a separate
local visualization), removes the page-wide canvas, and shares `--chrome-fill` at
72% surface tint between sidebar/header/mobile navigation. Dashboard navigation
and appearance controls use actual OpenGlass through the ICS GlassSurface wrapper.
The original cinematic vignette is reduced to 40% opacity only on the global scene;
the preview retains the original styling. No fullscreen optical renderer was added.

Headings and footer have restrained readable backing. Student directories/cards,
admission/edit forms, profile sections, financial/attendance empty states and
unsaved previews retain opaque local panels. Small text on translucent navigation
uses full foreground color; the current desktop item has an opaque selection fill.
Only the document scrolls in ordinary content; existing narrow-table overflow and
constrained More-menu scrolling remain intentional accessibility accommodations.

Changed files: `src/components/ics/shell.tsx`,
`src/components/ics/app-navigation.tsx`, `src/components/ics/appearance/customizer.tsx`,
`src/app/page.tsx`, `src/app/globals.css`, and this document.

Validation: 48 real-browser combinations across Dashboard, Settings and Students,
all four scene sources, Light/Dark, 1280×900 desktop and 360×800 mobile. All retained
one global scene, the intended theme/source, transparent workspace canvas and no
horizontal document overflow. Student panels remained opaque in both themes.
Screenshots visually inspected Motion/Photo/Topo/Chroma in workspace contexts,
including Dashboard navigation, Settings controls and mobile student cards.
Video currentTime advanced after resume; both videos paused and preview shape
animation stopped when motion was disabled. More remained 8px above mobile chrome,
focused its first link and closed on Escape. Frontend tests, TypeScript, ESLint,
production build and vendor integrity passed; no backend files were changed.

Limits: dense data intentionally covers the scene where necessary. Motion may
briefly show its poster until playback starts, and remains static when disabled or
reduced-motion is requested. Photo/Topo/Chroma remain their original static scene
compositions outside the animated preview objects. Live OS reduced-motion switching
was not emulated by the available browser tools; suppression has deterministic
unit coverage and uses the unchanged upstream runtime. No cross-browser visual
certification or pixel-perfect fidelity is claimed.
