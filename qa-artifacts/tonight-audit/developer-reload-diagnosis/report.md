# Developer Settings reload diagnosis — 2026-10-15

## Conclusion
No hydration-induced displacement reproduced at a fixed, measured 320×900 CSS viewport. The prior 1882px target offset was reproduced exactly by resizing from desktop back to mobile BEFORE reload. Reload then preserved that already displaced scroll position. No application fix is warranted from this evidence.

## Controlled browser evidence
Local in-app browser, Developer identity, /developer#developer-settings. DOM geometry recorded in geometry.json. The viewport capability required 256×720 override to produce measured innerWidth=320 and innerHeight=900 on this display; all comparisons use measured CSS dimensions.

| State | Scroll Y | Settings document top | Settings viewport top | Document height |
| --- | ---: | ---: | ---: | ---: |
| More → Developer Settings, 320×900 | 2860 | 3532.109 | 672.109 | 3760 |
| Reload immediate, hydrated and later, fixed 320×900 | 2860 | 3532.109 | 672.109 | 3760 |
| Direct hash entry from /settings, 320×900 | 2860 | 3532.109 | 672.109 | 3760 |
| Resize to 1440×900 | 1650 | 2384.127 | 734.128 | 2550 |
| Resize back to 320×900, BEFORE reload | 1650 | 3532.109 | 1882.109 | 3760 |
| Reload and settled hydration after resize | 1650 | 3532.109 | 1882.109 | 3760 |
| Repeat More → Settings, then reload at fixed 320×900 | 2860 | 3532.109 | 672.109 | 3760 |

Mobile header bottom stayed 57.995px. The Settings heading was below the header and above the mobile navigation in successful fixed-size entry/reload. All measured section heights and Settings document position remained unchanged across mobile hydration samples. More became active after hydration without moving the page. Settings is near document end, so scrolling clamps at the document bottom rather than placing its heading at the header offset.

## Mechanism
Desktop reflow reduces document height to 2550px; the browser clamps scroll Y to its maximum 1650px (2550−900). Returning to mobile expands the document but keeps that scroll Y. Thus Settings moves to 3532.109−1650=1882.109px in viewport coordinates. The displacement exists before reload, and the browser restores it after reload. This isolates the observed problem to viewport-resize scroll retention/restoration, not a hydration shift at constant dimensions.

The section-navigation implementation uses immediate scrollIntoView on section activation and no deferred request. Its hydration subscription updates active state; it does not re-scroll on hydration. Repeated activation correctly returns Settings to view, and a subsequent fixed-width reload remains stable.

## Verification and limitations
- Hands-on More → Settings → reload at measured 320×900: passed, including hydrated/later samples and a repeat activation/reload.
- Direct hash entry from another route: matched the successful mobile geometry.
- Desktop/mobile resize control: reproduced the exact previous suspicious offset before reload; settled reload retained it.
- Raw evidence includes an invalid early direct-entry attempt labelled direct-observed (hash empty); excluded from conclusions. A later cross-route direct entry succeeded.
- git diff --check run in this session; result recorded in final response.
- No application changes; TypeScript, ESLint, build and broad regressions were not rerun. Existing Node preservation-guard failure remains outside this focused diagnosis; no manifest changes.
- Evidence is limited to this local browser and current preferences. No cross-browser/OS claim.
- JPEG captures are supplemental only: the browser capture showed scaling/framing artifacts, so DOM geometry is the authoritative position evidence, not a new visual baseline.

## Files created this session
Only qa-artifacts/tonight-audit/developer-reload-diagnosis/:
- report.md
- geometry.json
- observed.jpg (resize/reload state)
- fixed-mobile-reload.jpg (fixed-width repeat reload; capture framing limitation above)

All prior uncommitted work, preservation manifest and 56 visual baselines were left untouched. Original Teacher demo identity restored; temporary viewport reset and agent tab closed. No backend changes, commits, pushes or deployments.

## Resume guidance
Do not add forced hash scrolling during hydration based on the old 1882px evidence. If a real user still encounters the issue without resizing, reproduce in that browser at a fixed viewport and record scroll Y, document height and target document position both before reload and after hydration. Treat resizing while an anchor is selected as a separate behavior/design question if automatic re-anchoring is desired.
