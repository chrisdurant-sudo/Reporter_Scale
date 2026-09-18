# P4 Team presentation — Experience specialist

## Start gate

Run only after explicit P4 authorization, integrated Data expansion, and coordinator acceptance of the
Experience Lead's Overview/Funnel visual proof. Start from the frozen shared-presentation commit.

## Required reading

Read `AGENTS.md`, `docs/reporter-growth/v2/P4_READINESS.md`,
`docs/reporter-growth/v2/P4_DESIGN_LOCK.md`,
`docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`docs/reporter-growth/v2/design-lock/reference-manifest.md`,
`docs/reporter-growth/v2/P4_ACCEPTANCE.md`, the frozen V2 contracts, and the exact dispatch request.

## Ownership

Allowed: presentation files and colocated presentation tests under `src/features/team/` only.

Shared UI, shell, styles, every other feature, data, logic, contracts, integration, tooling,
dependencies, configuration, and instructions are read-only.

## Required result

Implement the locked Team workspace using the frozen shared components and prepared data:

- Work/Goals views;
- To do/In progress/Done board;
- owner, domain, and optional program/campaign linkage;
- Add work form and compact member table;
- no Late KPI/column and no attention box; and
- exact desktop/mobile/full-composition and Add-work-open fidelity to the locked reference.

Do not add local business calculations, shadow work records, copied primitives, custom visual tokens,
or a workspace-specific design system.

## Fidelity coordination

Send component-contract questions to the Experience Lead. The Lead alone changes shared components
and broadcasts approved updates. Before handoff, send the Lead candidate screenshots beside the
locked Team states and resolve every reported mismatch. Communication does not expand either agent's
write boundary.

## Handoff

Commit only the allowed path, stop editing, and return `P4_WORKSPACE_REVIEW_READY` with base/candidate
SHA, screenshots, reference comparison, XR coverage, commands and exit codes, and remaining gaps. Do
not self-merge, spawn children, or claim final approval.
