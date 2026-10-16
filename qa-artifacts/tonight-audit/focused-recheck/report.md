# Focused recheck: Teacher hashes, tablet overlap and Developer navigation

2026-10-15. Read AGENTS.md, section-diagnosis/report.md, current Git status and continuation capture gaps. No broad audit repeated. No application or test files changed.

## Verified existing fixes

Teacher /teacher-dashboard direct hashes #assigned-students, #assigned-batches, #tests and #homework were checked on direct entry and reload at measured CSS widths320,767 (fractional media width below768),769 and1440: 32/32 checks passed. Each check read the actual main h1 and required exactly one visible data-role-section, heading below the fixed header and no document horizontal overflow. Evidence: teacher.json and visually inspected teacher-tablet.jpg. This confirms the persistent direct-hash/reload inconsistency and fractional tablet overlap did not reproduce after hydration. Exact768 was not achieved by the current display-scaled viewport override; the two sides of the boundary were checked.

The first fresh-tab accessibility capture initially showed Teacher Dashboard and all six cards, then a later hydrated snapshot showed Students and only its card. Source explains this: useRoleSection uses an empty server snapshot, because URL fragments are not sent to the server. Thus the persistent mismatch is resolved in these checks, but a transient pre-hydration overview remains possible. Its visual duration was not measured. No speculative hydration redesign was made.

## Highest-priority gap checked

Developer /developer sidebar and mobile More navigation were the highest-priority remaining navigation coverage gap. At320 and1440, clicked Bug Reports, Application Errors, System Health, Release Updates, Feedback, Chatroom Moderation, Centre Overview and Developer Settings, then Back, Forward and reload. developer.json contains22 checks of target text, hash and target position: all passed at those immediate observation points. Click/Back/Forward active indicators corresponded to the hash, or mobile More was active after its dialog closed. The console intentionally retains a long document; its h1 stays Developer Console.

However, reload measurements require qualification: immediate captures can precede hydration. Two explicit settled reload checks in developer-reload-settled.json verified the correct active indicator after hydration. Desktop Developer Settings was visible at y734. Mobile320 Developer Settings was then at y1882, outside the900px viewport, despite the earlier immediate reload check placing it inside the viewport. This is an unresolved mobile reload scroll-position observation, not a verified successful settled layout. Reproduction to investigate: select Developer; at320 use More > Developer Settings; reload; wait for More active indicator and inspect section bounds. Likely timing/reflow or browser scroll restoration needs further isolation, including direct-entry versus reload and a production-mode check. No minimal responsible code change was established, so no scroll/CSS workaround was introduced. Preserve the raw contradictory evidence; do not count this as a fully passing reload experience.

No additional high-priority persistent Teacher defect reproduced. The Developer mobile settled-reload observation is the remaining priority; broader page/theme gaps were deliberately not reopened.

## Validation run this time

- TypeScript npx tsc --noEmit: passed exit0.
- npm run lint: passed exit0.
- npm run build: passed exit0, local only.
- node --test scripts/section-navigation.test.mjs scripts/phase1-centre-regression.test.mjs:26 passed,1 failed. Existing preservation guard still lists22 accumulated changed protected files. Manifest unchanged; not hidden.
- node scripts/phase1/baselines.mjs:56/56 checked,0issues.
- git diff --check:passed exit0 (existing CRLF warnings only).

Admin/Manager browser route regressions were not repeated: no shared/application source changed, and the prior report already records64 passes. Settings optics, forms and all Light/Dark permutations remain outside this focused recheck. Saved appearance preferences were not changed. Backend remains intentionally disconnected.

## Files and safety

Only new evidence/report files under qa-artifacts/tonight-audit/focused-recheck/ were created: report.md, teacher.json, teacher-tablet.jpg, developer.json, developer-reload-settled.json, validation logs/exit files, baseline verification JSON, start/end status and source hash snapshots. source-changes.json and final comparison confirm0changed existing src/scripts files. All pre-existing uncommitted work remains. No manifest/baseline rewrite, backend configuration/data operations, commits, pushes, branch switches or deployments. Temporary browser tab closed and viewport reset; original Teacher identity restored. Stop for review.
