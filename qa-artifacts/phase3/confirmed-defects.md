# Confirmed Phase 3 defects before application edits

1. Form action primary buttons (confirmed Admin/Manager Tests & Results and admission family): computed browser-default 1.66667px outset border, not a focus outline. Review results has outline-style:none at rest. Fix only .form-actions > button.primary-link to use an explicit token-based solid border; preserve focus outline.
2. Assessment action row: Review results 44px, Reset 40px; uneven top/bottom bounds. Action footer has 14px top padding versus 4px bottom. Align within the assessment component, preserving primary/secondary hierarchy.
3. Assessment fields: normal controls differ in height (~42px inputs vs ~44.6px picker triggers). After empty Review, controls in the same desktop row have tops around 238.5, 267.1, 285.4, 288.1px because align-items:end aligns entire containers including variable validation text. Match label gaps and minimum control geometry; align field containers at start.
4. Developer report detail at 320px: status select stretches to 116.99px, squeezes title to 91.22px. Stack the report header and status select on mobile; retain desktop layout.

Evidence: before/matrix.json, before/admin-320--tests-results.jpg, before/admin-1440--tests-results.jpg, before/assessment-validation-1440.jpg, before/developer-320--developer.jpg. Initial role-switch captures include some transient previous identities; corrected identity-asserted audit captures supersede them.

Not defects by geometry alone: horizontally scrollable directory/fee tabs, chat room strips, permission matrix and result tables; legitimate focus-visible outlines; fixed dock overlay in an unscrolled full-page capture. Student A/B shared fictional fixture is an existing data issue outside UI refinement.
