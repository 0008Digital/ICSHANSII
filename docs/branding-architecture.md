# Centre branding architecture

## Current frontend demo

Branding is represented by one validated `CentreBranding` configuration keyed to the current `ics-hansi-demo` tenant. The Centre Admin editor is a frontend preview, not an authorization boundary: this project has no authenticated session and does not save changes to a backend. Name, branch, optional short name and mark accent metadata are stored in this browser's local storage. One optional PNG, JPG or WebP logo (up to 1 MB and 4096 × 4096 pixels) is stored in IndexedDB and is never uploaded. The sidebar, workspace header, document title and preview read from the shared provider. Applying changes updates this browser's demo identity; Reset restores the currently applied draft. Removing a logo is applied before its local IndexedDB object is deleted.

The branding key is explicitly tenant-scoped. A future multi-centre workspace must resolve the selected, authorized `centre_id` from the server session; it must not trust a browser-provided tenant key or a role selector. This demo's local key is not proof of centre membership.

## Production design to implement with the backend

- Store centre identity metadata in a tenant-scoped `centre_branding` record keyed by `centre_id`, with constrained display names, short name and validated accent.
- Centre Admin updates must be authorized against their authenticated membership and active centre on the server. Manager, Teacher and Student roles receive no branding write by default.
- Platform Owner access should be a separate platform capability limited to provisioning and branding metadata. It must not grant access to private student, fee, attendance or result records across centres.
- Store logos in a private object-storage bucket under an immutable centre prefix. Enforce centre authorization, MIME/signature checks, size/dimension limits and safe image decoding on upload and download.
- Record each branding change in an append-only audit trail with actor, centre, timestamp and before/after metadata. Role administration and cross-centre changes require stronger authorization and audit review.
- Centre provisioning creates the initial centre record, branding metadata, default batches and centre admin membership in one trusted server-side workflow. Branding must not be editable until membership is verified.
- Propagate branding through an authorized centre-scoped API or server component. Invalidate per-centre cache entries after committed changes; avoid a global cache that can mix tenant logos or names.
- Have the same tenant branding service feed the desktop/mobile workspace, student and teacher portals, the public centre website, and eligible receipts and documents. Each consumer must resolve branding only for its authorized centre.
- Receipts and other records should snapshot the legally relevant issuer identity at issuance. Later branding edits must not rewrite historical documents.
- Design and test RLS and storage policies before enabling writes. Until then, retain default-deny data policies and use this editor only as a local visual preview.
