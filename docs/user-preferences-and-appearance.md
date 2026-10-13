# Personal appearance preferences

Theme, accent, scene, glass and motion controls update a live preview and save it only when the user chooses **Apply appearance**. The custom wallpaper editor retains its separate **Apply background** action. The current app has no authenticated sessions: Developer/Owner, Centre Admin, Manager, Teacher/Staff and Student are presentation previews. Development builds also expose Student A and Student B as distinct demo identities so preference isolation can be verified. These local records are not secure account sync and must never be treated as authorization.

The local demo record is namespaced by both `demo-centre-hansi` and a demo identity in `localStorage` (`ics-hansi.demo-user-preferences.v1.<tenant>.<user>`). Existing legacy appearance keys are read and mirrored for the demo Centre Admin only. Other demo identities neither read nor overwrite those keys. The active identity and media-free appearance snapshot are mirrored to the existing appearance cookie for first-paint SSR; uploaded media bytes and IndexedDB media IDs are excluded. Custom wallpaper bytes remain local in IndexedDB and are not uploaded. Scene choice, custom appearance, accent, glass settings and animation preference travel together in each local preference record. Centre branding remains in its separate branding store and is shown as a management control only in the Centre Admin preview; role preview is not access control.

## Future `user_preferences` model

The backend implementation should use one row per authenticated user and applicable centre, for example:

| Column | Contract |
| --- | --- |
| `user_id uuid` | Foreign key to `auth.users`; part of the primary key. |
| `centre_id uuid` | Required for centre users; null only for an explicitly modeled platform-level personal preference. Part of the primary key. |
| `preferences jsonb` | Allowlisted theme, accent, scene, glass and motion values only. Reject media bytes, credentials and arbitrary CSS. |
| `updated_at timestamptz` | Server-maintained update time. |

Row-level policy must bind reads and writes to `auth.uid()` and validate centre membership server-side. A Platform Owner's personal preference row must not grant access to centre data. Centre branding belongs to a separate centre-scoped record and Admin-granted workflow; it must not be stored in or overwritten by personal preferences. Resolve the active tenant from verified membership, never from a client-supplied preference key. Custom uploads remain in browser storage unless a separately authorized upload feature is designed.

## Motion and charts

Full motion replays modest chart entrances and respects the operating-system reduced-motion preference. Reduced motion suppresses entrance motion and keeps transitions short. Off disables nonessential animation, including the glass scene. Charts are live SVG/Motion or CSS geometry, use semantic category colors plus text and values, and currently read fictional fixtures only. They do not imply connected financial, attendance, academic or monitoring data.
