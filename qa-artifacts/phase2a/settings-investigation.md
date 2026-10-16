# Phase 2A — Settings recovery investigation

14 October 2026 · Project: `C:\Projects\ics-hansi` · HEAD: `1eb4018`

**Status: investigation only. No application files or preferences were changed. No cleanup, upload, Apply, Remove, Git mutation, Supabase operation or deployment was performed.** Only this report, four observational screenshots and a measurement JSON were created in `qa-artifacts/phase2a/`.

## Conclusion

Settings has not lost its principal controls. Its composition has been changed through JSX regrouping and several successive stylesheet layers. The current layout is not simply the original layout with different colors: the old controls/preview grid has been replaced, the main preview is behind a disclosure, the Custom editor occupies another grid row, and later shared brand styles override the header and surfaces.

The exact current rules producing these differences can be identified. A complete, previously approved Settings implementation cannot be recovered from the available Git history. Restoring a preferred composition therefore requires design approval; it must not be presented as a verified rollback to a known approved commit.

## Current implementation and state boundaries

Route: `src/app/settings/page.tsx` → `ManagementPage(section="settings")` → `SettingsHeading` and `PersonalSettings`.

`PersonalSettings` renders the shared `AppearanceCustomizer`. Only Centre Admin receives `BrandingEditor`; other roles receive an explanatory branding boundary. This role difference is intentional, not a removed editor.

`AppearanceCustomizer` currently renders:

1. A single outer appearance-editor grid.
2. A GlassSurface containing a background group (Theme, Background source) and a glass group (material, accents, scene motion, interface motion, actions/status).
3. When Custom is selected, a `CustomEditor` directly inside that GlassSurface, **after both groups**, not inside the background group.
4. A separate, initially closed Advanced Glass Settings disclosure containing live optical/frost controls, comparison controls and an initially open scene-interaction disclosure.

Persistence and rendering are distinct:

- `src/app/providers.tsx`: persisted appearance plus a user-keyed unsaved preview; `previewSettings`, `applyPreview`, `discardPreview`; OpenGlass provider and motion policy.
- `src/app/theme-preference.ts`: per-tenant/per-demo-user localStorage records; Admin-only legacy-key compatibility; media-free SSR cookie projection.
- `src/app/appearance-bootstrap.mjs` and `src/app/layout.tsx`: first-paint reconciliation and server snapshot. They do not choose the Settings grid layout.
- Custom editor: its own local draft and separate Apply background action; Blob bytes in IndexedDB.
- Branding: separate draft/store/logo lifecycle. It must remain independent of personal appearance.

The layout restoration should retain these contracts. In particular, global Discard does not undo an already committed Apply background or Apply branding action; these are separate editing scopes.

## Exact layout-producing changes and active cascade

Relevant import order in `src/app/layout.tsx`: globals → upstream scene → vendor → mobile → Settings → interaction motion → SaaS → brand system → workspace bar → demo styles. Later rules and specificity must be considered together.

| Current change | Exact source | Effect / restoration implication |
| --- | --- | --- |
| Replace the narrow-controls/wide-preview editor | `src/app/globals.css:222` retains `minmax(270px,340px) minmax(0,1fr)`, but `src/components/ics/settings-layout.css:7` overrides the outer grid to one column | The earlier two-pane CSS no longer determines the visible editor. Removing one override alone cannot restore the old composition because the JSX has also changed. |
| Regroup ordinary controls into background and glass columns | `src/components/ics/appearance/customizer.tsx:26` onward; `settings-layout.css:8` | Theme/source occupy one group; material/accent/motion/actions another. This is the source of the large desktop card with two different control stacks. |
| Collapse controls again on medium widths | `settings-layout.css:81` | The 768–1100 px override makes the ordinary control card one column, despite an audit document describing two columns from 768 px. |
| Move material/scene content under Advanced | `appearance/customizer.tsx:36` onward | Advanced is initially closed. The old `.appearance-preview-column` selector has no matching current element. Old CSS alone cannot bring that preview column back. |
| Compact and rearrange Advanced | `settings-layout.css:29–38`; `saas-layout.css:6–15,76–96` | Live sliders are vertically stacked by the later SaaS rule. Desktop comparison uses equal columns and sticky specimens; mobile uses `display:contents` and order rules to interleave live controls, material sample, comparison controls and scene. |
| Make Custom a full-width row below both groups | `appearance/customizer.tsx:35`; `saas-layout.css:115–122` | At desktop/tablet widths the editor spans both columns, with controls and draft preview side by side. It is not immediately under the source selector within the left group as one audit description claims. On mobile its preview is positioned through grid-row/display-contents rules. |
| Replace source control markup | `appearance/customizer.tsx:14–20`; `saas-layout.css:46–69,88` | Background source uses ICS-owned buttons and a shared Motion capsule. Older `.appearance-source > .ogui-segments` rules do not target this current element. Preserve keyboard navigation and its single selected state if repositioning it. |
| Change the Settings heading repeatedly | `settings-layout.css:2`; `saas-layout.css:44,108–114`; `branding/brand-system.css:109–124` | The final header is the brand-system rounded sticky surface with underlined navigation. Earlier flat/header/card declarations are superseded. |
| Reintroduce a section-title chip and change card surfaces | `branding/brand-system.css:69,84–89,126–130` | Later brand styles restore the Appearance title backing and change appearance/Advanced surface fill, blur and shadows, overriding earlier Settings styling. |

These are verified sources of the current appearance. They cannot, by themselves, establish which visual choices the user considers unwanted without a preferred reference.

### Live measurements

Read-only DOM inspection of the existing Settings tab, unchanged Developer / Owner identity, System theme and Motion source:

| Viewport width | Ordinary control columns | Source columns | Header radius | Advanced behavior |
| --- | --- | --- | --- | --- |
| 1440 | Two, approximately 523 px each | Five | 15 px | Equal comparison columns; sticky preview; 180 px scene |
| 1024 | One, approximately 726 px | Three | 15 px | Not independently expanded at this width |
| 768 | One, approximately 470 px | Three | 15 px | Not independently expanded at this width |
| 320 | One, approximately 254 px | Three | 13 px | One comparison column; controls/preview wrappers use display:contents; 180 px scene |

The outer editor was one column at all four widths. Document horizontal overflow was not measured. Advanced was opened for inspection and returned to its original closed state. The viewport override was reset. No source, theme, accent, motion, branding or custom-media preference was selected or saved.

## Available earlier evidence

### Git

- **`1eb4018`**: current Settings, styles, state system, screenshots and audit documents all first appear in this large snapshot. Its parent does not contain an earlier operational Settings route.
- **`56a5902`**: OpenGlass foundation with `src/app/glass-demo.tsx`. It contains a material playground, theme selector, Depth slider, Pointer interaction switch and demo dialog. It does not contain the current centre workspace or a prior complete Settings page.
- **`4d3b93e` / `71d0735`**: dependency/bootstrap work, not Settings restoration candidates.
- Available branches/reflogs did not reveal additional Settings versions between the playground and the snapshot. No checkout or reset was performed.

Consequently, individual intermediate Settings changes cannot be assigned separate verified commit IDs. Audit prose records changes that were bundled into `1eb4018`, but it is not a substitute for missing source snapshots.

### Documentation and screenshots

- `docs/appearance-system.md` describes the earlier richer scene/material presentation and later legibility changes.
- `docs/appearance-control-scope.md` documents retaining comparison/scene controls inside disclosures rather than deleting them.
- `docs/settings-navigation-qa.md` records compact grouping, the Settings-specific heading, embedded Custom editor and disclosure changes.
- `docs/final-ui-refinement-audit.md` describes a flat sticky Settings header.
- `docs/sidebar-settings-polish-audit.md` subsequently describes a rounded header and preview frames.
- `branding/brand-system.css` supplies the current final rounded surface and underline treatment; the earlier flat-header description no longer describes the rendered result.
- `docs/ui-audit-2026-10-13/audit-320-_settings.jpg` shows the compact Admin layout, collapsed Advanced section and centre-branding editor. It is historical evidence, **not an approved preferred-layout reference**.
- Phase 1 deliberately created no Settings visual baseline. Its OpenGlass failure screenshots are diagnostic observations, not design approval.

There is no verified screenshot of a complete earlier desktop Settings layout or an earlier Custom-selected Settings layout among the located Settings-specific images. The surviving two-pane CSS is a reconstruction cue, not proof of a previously approved screen.

## Features to retain

All current control families can be retained while recomposing Settings:

- Light / Dark / System; Motion / Photo / Topo / Chroma / Custom.
- Clear / Regular / Frosted, including preset frost reseeding; optical intensity and frost sliders.
- Seven accent presets, custom hex validation and the existing accessible color picker.
- Scene Motion and Full / Reduced / Off interface animation, with OS reduced-motion priority.
- Comparison material/split, lighting angle/spread and scene/lens specimen. Keep specimen-only state distinct from saved workspace appearance.
- Custom gradient colors, validated local images/videos, fit/position, speed/dimming/blur, draft preview and explicit editing actions.
- Admin-only centre/branch/short-name/accent/logo branding, with draft/reset and local persistence.
- Existing IDs, labels, focus handling, hash targets, local preference keys, SSR bootstrap and branding isolation.

No functional need was found to replace vendor OpenGlass, the application providers, theme schema or the centre dashboards to achieve a Settings layout change.

## Cross-user wallpaper cleanup: source-confirmed risk

`wallpaper-storage.ts` opens one origin-wide database, `ics-hansi-wallpaper`, version 1, and one `media` store. Blob keys are UUIDs with no tenant/user owner field.

`pruneWallpapers(keep)` iterates **every record**, deleting all records whose key differs from `keep`.

Call paths:

1. `CustomEditor.apply()` saves a new Blob if needed, updates the current user's preference record, then calls `pruneWallpapers(next.mediaId)`.
2. Applying a gradient uses an empty media ID, so that successful Apply can prune every stored Blob.
3. `CustomEditor.remove()` clears the current user's custom configuration and calls `pruneWallpapers("")`, deleting every Blob.

Example reasoning only: A's saved preference references Blob A. B applies Blob B. B's pruning keeps B and deletes A, although A's separate preference still references A. A then receives the missing-media gradient fallback. A gradient Apply or Remove can affect all users sharing this browser origin. Different origins/profiles are separate; no claim of production/Supabase deletion is made.

The metadata namespace separates demo users, while cleanup still assumes one global owner. Existing tests cover metadata isolation, media validation and transaction failure behavior, but do not establish safe multi-user pruning. Same-user cross-tab races and legacy media without ownership also require consideration.

**No prune, Remove, Apply background, upload, IDB mutation or destructive reproduction was executed.**

### Proposed safety correction, separate from visual restoration

- First eliminate unconditional origin-wide pruning from normal Apply/Remove paths; do not replace it with another global sweep.
- Introduce explicit ownership/reference handling for new media, such as tenant/user/media composite keys or owner metadata.
- Preserve existing UUID-keyed Blobs and preference references. Legacy ownership must not be guessed, and unknown/shared records must not be deleted during migration.
- Prefer retaining unreferenced media initially over risking another user's wallpaper. Any later garbage collection must check ownership, all live references and cross-tab races.
- Keep the preference schema compatible and preserve the current draft/commit/fallback behavior.
- Prove these changes with in-memory/fake IndexedDB and mocked preference stores before any browser write-path test. No live browser storage needs to be cleared.

## Proposed restoration plan

### A. Approve the visual target before implementation

Evidence supports offering a controls-left / preview-right desktop composition using the existing components and the surviving 270–340 px control-column rule. **That is a proposed reconstruction, not a verified approved rollback.**

Decisions needing approval:

1. Desktop: restore narrow controls plus a wide persistent preview, or keep grouped controls and revise their arrangement?
2. Advanced: always visible, or retained as a disclosure? Should the preview remain sticky?
3. Custom: directly adjacent to Background source, or a separate full-width editing workspace?
4. Heading: flat/ordinary heading or rounded sticky heading with Appearance/Branding links?
5. Mobile: exact control/preview order, spacing and preview size. No earlier preferred mobile screenshot is verified.

Recommendation: choose one visual reference/composition first, retain every functional control, and review a Settings-only localhost result at desktop and 320 px before approving new Settings baseline images. No other role/dashboard design should be changed.

### B. Restrict the implementation surface

| File | Proposed responsibility | Boundary |
| --- | --- | --- |
| `src/components/ics/appearance/customizer.tsx` | Recompose existing control groups and preview/disclosure placement | Preserve handlers, labels, IDs, action semantics and provider API |
| `src/components/ics/settings-layout.css` | Add scoped Settings composition/breakpoints | Do not alter its shared `.ics-mobile-dock` rules |
| `src/components/ics/settings-heading.tsx` | Only if the approved heading needs a scope class or structural adjustment | Preserve section navigation and measured scroll clearance unless explicitly approved otherwise |
| `src/components/ics/appearance/custom-editor.tsx` | Optional presentation wrapper/order adjustment | Keep storage changes out of a visual-only patch |
| `src/components/ics/appearance/material-comparison.tsx` | Optional composition adjustment if existing props are insufficient | Retain specimen-only state and optical controls |
| `src/components/ics/appearance/wallpaper-storage.ts`, `custom-editor.tsx`, possibly `use-custom-media.ts` | Separate ownership/cleanup safety patch | No destructive migration; preserve other users' media and legacy references |
| Settings/ownership regression tests and the Phase 1 preservation manifest | Add safety tests; review only explicitly approved file-hash changes | Never rebaseline all shared files merely to make guards pass |

Use Settings-specific selectors/classes to override the cascade. Do not reorder global stylesheet imports or broadly revert `globals.css`, `saas-layout.css` or `branding/brand-system.css`: those files also control the approved Admin/Manager screens. Do not change root providers, navigation, dashboard components, vendor assets or Supabase.

### C. Regression gates for the later implementation

- Keep all Phase 1 Admin/Manager route, navigation, workflow, desktop and 320 px checks. Preserve the 56 existing reference images.
- Add Settings geometry checks at 320, 390, 768, 1024 and 1440 px for the approved composition, header clearance, Custom adjacency, preview bounds and no document overflow.
- Verify every Settings control remains keyboard reachable; retain Escape/focus behavior, section hashes, reduced-motion behavior and comparison-state retention through disclosure collapse/reopen.
- Retain preview/Apply/reload/Discard/Reset tests; prove unsaved previews do not persist, and applying one editing scope does not silently commit another scope's draft.
- Keep branding Admin-only and separate from personal preferences. No real branding write is required for layout regression tests.
- Add isolated A/B media tests: B Apply/gradient/Remove cannot remove A's Blob; unknown legacy media survives; Reset/Discard make no storage writes; failed transactions preserve old references; cross-tab replacement cannot delete the currently referenced media.
- Keep the known Phase 1 Admin 320 px lens pointer failure visible until independently diagnosed. Do not remove it, disable animations or freeze the lens merely to obtain green tests.
- Run relevant tests, TypeScript, lint, vendor integrity and a local production build after approved implementation. None authorize a push or deployment.
- Only after user review should Settings receive its own approved visual baselines. The current observation images remain unapproved.

## Screenshot evidence

Current images were captured from the existing Developer / Owner Settings tab without changing identity or saved appearance. This explains the absence of the Admin branding form; use the historical Admin image and current role-conditional source for that comparison. Viewports were 1440 × 900 and 320 × 900, with native smooth scrolling allowed to settle at the top before capture.

- [Current desktop, Advanced closed](./settings-current-1440-collapsed.jpg)
- [Current desktop, Advanced expanded](./settings-current-1440-expanded.jpg)
- [Current 320 px, Advanced closed](./settings-current-320-collapsed.jpg)
- [Current 320 px, Advanced expanded](./settings-current-320-expanded.jpg)
- [Read-only layout measurements](./settings-layout-measurements.json)
- [Historical Admin mobile Settings](../../docs/ui-audit-2026-10-13/audit-320-_settings.jpg)

Full-page screenshots include fixed navigation at its viewport position and are settled-state observations, not frame-by-frame compositor evidence. No preferred-layout mockup or restored implementation is represented by these images.

## Preservation verification

Read-only verification passed: all **122 protected files unchanged**, all **56 Phase 1 image references intact**, and Settings visual approval remains false. `git diff --name-only` was empty. Pre-existing untracked Phase 1/QA files were retained.

No application modifications, cleanup, commit, push, branch switch, Supabase change or deployment occurred. Implementation must wait for approval of the target layout and affected-file scope; wallpaper safety should be approved as a separate functional correction.
