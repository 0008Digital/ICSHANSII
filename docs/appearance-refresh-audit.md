# Appearance refresh initialization audit — 13 October 2026

## Verified defects and scope

Controlled HTTP requests with a valid Dark+Photo cookie already returned Dark+Photo before this change; the valid-cookie source path was not proven to be the cause of the user's System/Motion flash. The previous implementation nevertheless left reproducible gaps:

- `<html>` had neither a server-rendered appearance attribute nor application accent variables. Those came from a head script and a post-hydration effect, respectively.
- Missing/stale mirror cookies produced default server controls/scene. The old bootstrap wrote the mirror for the next request, but did not correct the current server HTML.
- Immediate cookie updates resolved explicit Light/Dark preferences from the OS, creating inconsistent metadata (especially relevant when returning to System).
- Cross-tab storage changes notified React but did not synchronously update the mirror.
- The global client store used default settings when storage was unavailable, rather than preserving the request's server snapshot.

## Changes

- `src/app/layout.tsx`: emit resolved root appearance, color-scheme and matching upstream-derived accent/focus variables in server HTML. Serialize the request snapshot into the head bootstrap.
- `src/app/appearance-bootstrap.mjs`: synchronous, tested pre-body reconciliation. Parse bounded, whitelisted local preferences; compare with the server snapshot; update the media-free cookie. If mismatched and cookies/sessionStorage work, make one corrective same-URL request before body parsing. A guard prevents loops and clears after successful reconciliation. No timer, hidden page, loader or artificial delay. A stale/missing cookie costs one additional request. No navigation when snapshots match.
- `src/app/theme-preference.ts`: explicit preferences determine resolved cookie appearance; cross-tab changes mirror immediately; unavailable localStorage preserves the server fallback; serialize the same testable bootstrap implementation.
- `src/app/providers.tsx`: per-provider stable store seeded with the server snapshot, retaining useSyncExternalStore hydration semantics. Upstream GlassSystemProvider, custom media hook and theme effects remain.
- `scripts/theme-preference.test.mjs`: five additional regressions for synchronization, matching/stale SSR snapshots, blocked-cookie loops and unavailable storage.

## Browser and HTTP evidence

Persistent original localhost browser: Dark+Photo survived three reloads. Other theme/source combinations were exercised on reload. Dark+Custom was rechecked after explicitly waiting for interactive hydration (one initial automated click before hydration was not applied). Direct Students navigation and a new Settings tab retained the applied custom source. These normal screenshots/DOM checks are settled-state evidence.

A temporary localhost-only HTTP proxy forwarded the browser's cookie to the real application and removed React scripts. Actual browser screenshots then showed server-rendered controls/background with `data-ogui-theme-hydrated="false"`, no script sources, and correct Dark+Photo, Light+Chroma, System+Topo, Dark+Custom source/appearance. Custom correctly used its own gradient while IndexedDB had not restored media. This isolates pre-hydration rendering; it is not a real full-speed production refresh video. Proxy and temporary tabs are stopped/closed after inspection.

Raw local HTTP: corrected dark root, root accent before body, Photo present, Motion absent, reconciliation script before body all verified. The deliberate cookie used an inconsistent resolved=light with preference=dark, and the server now selected dark correctly.

## Verification and limits

TypeScript, ESLint, 40 frontend tests, production build and 12 vendor hashes pass. No vendor, migration, unrelated UI, glossy selector, admission or picker changes. No installs, Git operations or deployment.

A true cache-bypassing hard-refresh filmstrip with React running, real mobile OS changes and Safari/iOS were not captured by the available browser API. Raw browser cookies/localStorage were not dumped; cookie receipt was checked via server-rendered output and synchronization via regression tests. Full-speed first-frame absence of all flashes remains unverified. Cookie/sessionStorage denial disables corrective navigation safely; saved local preferences may then differ until hydration. Async custom media uses a gradient, so media itself can still appear after decoding. The exact cause of the user's particular existing-browser cookie state was not conclusively reproduced.
