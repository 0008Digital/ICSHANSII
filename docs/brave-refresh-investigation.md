# Brave refresh flash investigation — 13 October 2026

## Result

The reported System/Motion -> saved appearance flash was NOT reproduced. No appearance runtime fix was made. The user confirmed the affected browser is Brave. Browser inventory exposes only Codex In-app Browser and Codex MCP Apps, not Brave. The in-app profile is persistent Chromium but is not the user's affected profile.

## Investigation performed

Temporarily injected a head diagnostic ahead of the existing bootstrap. It recorded only appearance metadata from the specific appearance cookie/localStorage keys (preference, scene, custom media kind), root/body computed colors, provider appearance/hydrated flag, selected Theme/Background Source controls, source-layer classes, capsule geometry and custom blob/video readiness. MutationObserver tracked transitions; requestAnimationFrame sampled state before frames. It did not change appearance or delay rendering. All instrumentation was removed; layout restored byte-for-byte against its backup SHA-256.

Traces include the actual running application through React hydration, unlike the previous SSR-only proxy. They are DOM/pre-paint traces, not GPU/compositor screenshots for each frame. Screenshots were captured separately after reload. No before/after fix comparison exists because the failure was not reproduced and no fix was applied.

## Observed evidence (milliseconds relative to each navigation)

| Case | First recorded application state | Later state |
| --- | --- | --- |
| Dark + Custom gradient, 3 consecutive normal refreshes | 236 / 385 / 258 ms: dark root/provider, Dark/Custom controls, custom scene, hydrated=false | Remained Dark/Custom during the recorded hydration interval |
| Light + Photo normal refresh | 170 ms: light root/provider, Light/Photo controls, photo scene, hydrated=false | At frame 22: same selection, hydrated=true |
| Light + Photo Students direct-route refresh | 172 ms: light root/provider and photo scene, hydrated=false | At frame 24: same scene, hydrated=true; Settings controls absent as expected |
| Dark + Motion | 351 ms: dark root/provider, Dark/Motion controls | Same after hydration; Motion was deliberately selected |
| System + Topo | 302 ms: light root/provider per current OS, System/Topo controls | Same after hydration |
| Light + Chroma | 161 ms: light root/provider, Light/Chroma controls | Same after hydration |
| Dark + Custom image | 206 ms: dark root/provider, Dark/Custom controls and custom gradient fallback | At frame 25: custom image blob restored; no Motion layer |
| Dark + Custom video | 192 ms: dark root/provider, Dark/Custom controls and custom gradient fallback | At frame 24: custom video blob restored; no Motion layer |
| New Settings tab, Dark + Custom video | Frame 1, 183 ms: dark root/body while application markup not yet present. Frame 2, 392 ms: Dark/Custom controls/provider/scene, hydrated=false | Frame 17: Dark/Custom, video readyState=2, blob=true, playing |

Head logs agreed with localStorage and the mirror cookie for each saved combination. In the recorded Custom/Photo first frames, capsule geometry matched the selected button. No default System/Motion transition was observed in those traces.

An initial trace showing System/Motion had matching System/Motion localStorage/cookie; that was the starting preference before the test selected Dark/Custom, not a reproduced refresh bug. Later user-test clicks are not classified as hydration transitions.

Custom uploads used only repository fixture image/MP4 via the browser file chooser. They were applied locally. Starting selected System/Motion preference was restored afterward; test media remains local. No student/private data or environment secrets were accessed.

## Limits and conclusions

- Brave's actual cookies, localStorage, Shields behavior, cache and compositor were not accessible. No causal claim is made about any of these.
- Control+Shift+R through the in-app browser did not cause navigation; cache-bypassing hard refresh was NOT tested. Browser capabilities expose neither recording/tracing nor cache-bypass controls.
- DOM rAF observations are stronger than settled screenshots but do not prove every compositor frame is correct, and instrumentation can affect timing.
- No exact component/state transition causing the Brave flash was identified. Why the earlier changes failed in Brave remains unknown; their passing tests never established Brave first-frame behavior.
- Next necessary evidence: trace or recording from the affected Brave profile during the failing refresh, with appearance-only storage/cookie metadata and hydration state. Do not infer a fix from this different profile's results.

## Files and validation

Only this report is retained from the investigation. Temporary layout changes and diagnostic scripts were removed. No vendor, backend, legacy-project, unrelated UI, Git, dependency or deployment changes.

Validation: production build and all 12 vendor hashes passed; all 40 frontend tests passed. Standalone TypeScript initially raced the concurrent build while .next/types/routes.js was being regenerated, then passed when rerun after the build. ESLint result is recorded after completion. Final browser reload confirmed the diagnostic script and trace attribute are absent. Restored layout SHA-256: 49E3B0FBDD9D99CE26512FAE33DD00A29FB1AF099D15D1B375429A52ADE9DE3C.
ESLint completed successfully (exit 0). All requested automated checks pass.

## Local Brave diagnostic procedure

1. In the affected Brave profile, open DevTools → **Performance**, enable **Screenshots**, then record a normal reload and a hard reload with **Network** open. Repeat once for Dark + Motion and once for Light + Photo.
2. Compare the first screenshots with the Theme and Background Source controls. In Elements, check `document.documentElement.dataset.appearance`, the selected `[aria-pressed="true"]` controls in Settings, and the `.landing-backdrop` class. If these disagree and later converge, the wrong frame is a preference/snapshot transition.
3. If the root and controls already agree with the selected source, inspect Network for `architectural-contrast.jpg` and `motion-source.mp4`, including request start, priority, cache status and completion. A correct Photo scene with a pending image, or a correct Motion scene still showing its poster before video data is ready, indicates media readiness.
4. If the selected asset is already complete but the first screenshot still differs, compare computed `opacity`, `visibility`, `transition`, `background-color`, and bounds for `.landing-backdrop`, its `img` or `video`, plus `html[data-appearance]`. That points to CSS/compositor first paint. Capture the Performance screenshots and the appearance-only values; do not copy cookies or unrelated localStorage values.

Do not treat a settled screenshot or a post-hydration console inspection as first-frame evidence. The current Codex browser cannot produce this Brave trace.
