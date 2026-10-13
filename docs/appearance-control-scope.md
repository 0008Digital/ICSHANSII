# Appearance control scope

The primary panel keeps Theme, Background source, Glass material, Accent and Scene motion. Custom Background remains directly below its source selector with its existing draft/Apply workflow and IndexedDB media storage.

Advanced Glass Settings is a native disclosure; closing it does not unmount controls or reset their state.

| Controls | Scope | Persistence |
| --- | --- | --- |
| Theme, source, material, accent, optical intensity, frost, scene motion | Live workspace appearance through the appearance store, provider, shared GlassSurface and scene; readable record surfaces retain their contrast | Local appearance store |
| Custom background | Draft preview until Apply; applied media stays local | Settings metadata locally; media in IndexedDB |
| Comparison material, comparison split, lighting angle, lighting spread | Actual OpenGlass comparison specimens only; not global settings | Local component state, retained while disclosure closes; resets on remount |
| Scene interaction preview | Mirrors live scene/material/frost/intensity; lens hold pauses only the preview lens | Lens hold is local component state |

All comparison controls and the optional scene interaction demonstration remain available. The oversized demonstration is tucked into a secondary disclosure instead of deleting its interactions. No provider, persistence schema, media storage, renderer or vendor code was changed.
