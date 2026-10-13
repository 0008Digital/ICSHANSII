# SaaS layout, contacts and overlay audit

## Scope and causes

- The form alone had `max-width:820px` with no auto inline margins; its heading and notice were outside that constraint. Shared content-container variants now center complete form (900px maximum) and profile (1100px maximum) compositions inside the existing wide workspace. Directories/dashboard retain their wider containers.
- ChoiceSelect used the calendar's modal overlay, full mobile width and document scroll lock. In the browser, opening Batch changed document client width from 499px to 514px. Compact nonmodal choice dialogs now retain page scrolling and scrollbar width; modal calendars retain scroll locking with a stable scrollbar gutter.
- Dark popup surfaces were already dark in the audited browser, so the reported white-panel screenshot cause could not be conclusively reproduced. Choice surfaces now explicitly use the shared theme surface, text and accent variables. No claim that a particular unobserved theme race was found.
- Choice lists are measured relative to their trigger, flipped above it when needed, clamped inside the visual viewport and above the mobile dock, and repositioned on scroll/resize. Only the option list scrolls. Native dialog Escape, pointer/focus-out dismissal and focus restoration are handled separately for nonmodal choices. Motion entrance/exit stays small and respects reduced motion.

## Canonical contact contract

`StudentDetails` now contains `name`, `fatherName`, `motherName`, `fatherPhone`, `motherPhone`, `studentPhone`, `address`, and optional date-only `birthDate`. The first three names are required (2–100 characters). At least one valid parent phone is required; each other supplied phone must also be valid. Student phone never satisfies parent contact.

The country-specific `normalizeMobile` adapter currently supports IN: ten national digits starting 6–9, optional 91/+91 country code, spaces, parentheses and hyphens; preview values normalize to +91 E.164 syntax. This checks syntax only, not ownership or reachability. Future countries need explicit validators. Blank parent information stays blank; legacy non-dialable fixture contacts remain explicitly unclassified, searchable and read-only; they are never automatically assigned to a parent or student phone input. Edit validation requires new explicitly supplied parent details. No contact facts were inferred from legacy guardian labels.

Add and Edit share fields and validation. Profiles show the same individual fields and honest missing states. Directory search considers all three phone fields, with parent-first contact display. No new workflow, official allocation, persistence or backend writes.

## Backend integration pending

Before real admissions: design an additive migration for distinct parent names/phones and optional student phone, a reviewed legacy guardian/contact mapping with explicit missing-data handling, country/E.164 storage rules and server-side enforcement of required names and at-least-one-parent contact. Do not infer two parents from one legacy guardian. Apply the same optional DOB/address and date-only admission rules on the server. Review database column names before writing that migration; no existing SQL was changed here.

Authentication, centre isolation, the five-role boundaries, reviewed RLS/policies, audited concurrent identifier/registration/roll allocation and transactional authorized admission/edit operations remain required. UI validation provides no authorization.

## Reproduced verification

- 33 frontend tests cover parent alternatives, student-only rejection, malformed/unsupported numbers, normalization, fixture omissions and existing date/appearance/student behavior.
- Browser geometry: 13 routes × 9 widths × Light/Dark = 234 cases. Widths: 320, 360, 375, 390, 430, 768, 1024, 1280, 1600. No document overflow; form/profile containers centered within 1 CSS pixel; desktop Add/Edit widths 900px.
- Batch/Status: 36 cases across the same widths/themes. No clipping, dock collision, scroll locking or page width/x-position changes. Menu fills followed Light/Dark.
- Actual browser admission rejected student-only contact, accepted mother-only contact, normalized preview values and displayed explicit unsaved status. Keyboard option selection, outside dismissal into search, Escape, profile/edit navigation and completed Back/Forward verified.
- Browser engine: desktop in-app Chromium with viewport overrides. Physical touch/iOS Safari, software keyboard/safe areas, OS reduced-motion emulation and previously uploaded media restoration were not independently re-tested in this audit. Existing unit tests cover reduced-motion gating and custom storage failure behavior.
