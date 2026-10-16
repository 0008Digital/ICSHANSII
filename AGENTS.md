<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Permanent ICS Hansi development standards

These standards apply to all future Codex work in this project. Keep changes scoped to the authorized task and preserve existing valid instructions.

### Preserve approved behavior and design

- Preserve the approved OpenGlass visual design, existing Centre Admin and Manager functionality, and restored Settings UI.
- Never modify protected UI components, global styles, navigation, or animations during unrelated feature tasks. A task requiring such changes must explicitly authorize that scope; use the smallest necessary change.
- Preserve existing visual baselines unless the user explicitly approves the corresponding UI change. Do not automatically regenerate screenshot baselines or update preservation manifests to make checks pass.
- Preserve Git history, existing project assets, and unrelated work already present in the working tree. Do not delete, reset, overwrite, or replace them as a shortcut.

### Implementation boundaries and quality

- Keep Developer / Platform Owner, Centre Admin, Manager, Teacher, and Student features appropriately isolated. Preserve Student A/B identity separation when working on Student features.
- Reuse existing shared components rather than generating parallel versions. Before modifying a shared component, inspect its consumers and assess effects on all affected roles.
- Avoid duplicated components, conflicting CSS, dead code, unnecessary dependencies, temporary hacks, and abandoned debugging work. Do not leave task-created debugging scaffolding or unused implementations behind.
- Do not conduct broad codebase cleanup until all five roles are stable. Fix only issues necessary for the authorized task; propose unrelated cleanup separately.

### Required regression verification

- After relevant changes, perform targeted browser interaction and responsive regression tests, including desktop and 320px mobile coverage for affected UI. Verify actual interaction and resulting state, not only rendering or URL changes.
- Test navigation changes across all five roles: Developer / Platform Owner, Centre Admin, Manager, Teacher, and Student, including both Student A and Student B. Include rapid successive clicks, repeated activation, role switches, active indicators, mobile More menus, direct navigation, reloads, and browser Back/Forward where relevant.
- Run the existing Admin/Manager preservation checks when changes can affect their shared dependencies. Preserve OpenGlass animation and Settings interaction coverage when those areas are affected.
- Report exact changes, passing and failing checks, and remaining risks honestly. If browser interaction is unavailable, state that limitation; do not claim browser verification. Do not change application behavior or approved baselines merely to make tests pass.

### Strict local development and deployment freeze

- Keep development, recovery, rebuilding, and testing local. Use localhost for browser testing. Local development servers, tests, linting, TypeScript checks, and production build validation are allowed; a local production build is not a deployment.
- Without explicit user authorization for the specific action, never create commits, push to GitHub or another remote, switch branches, deploy to Vercel or any other hosting provider, or create preview deployments.
- Without explicit user authorization for the specific action, never run production Supabase migrations, modify live Supabase data or policies, change real records, or change production environment variables, DNS, or hosting settings.
- Do not infer authorization for any restricted action from a successful build, passing tests, or approval of an implementation plan. Final release deployment requires explicit user approval.
