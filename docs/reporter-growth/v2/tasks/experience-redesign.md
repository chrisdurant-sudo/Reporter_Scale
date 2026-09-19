# P4 unified experience implementation brief

> September 18 amendment: read `../P4_INTERVIEW_IMPROVEMENT_PLAN.md` and `../ASTRA_COORDINATOR_HANDOFF.md` before dispatch. IP01–IP12 supplement acceptance; changed presentation requirements supersede older instructions here. The completed 50-person expansion is not repeated. The new pass requires its own recorded implementation start and revised visual proof. Model routing comes from the current registry.

## Purpose

Act as the P4 Experience Lead and design-system authority after explicit P4 authorization. Read
`docs/reporter-growth/v2/P4_DESIGN_LOCK.md`,
`docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`docs/reporter-growth/v2/design-lock/reference-manifest.md`, its interactive reference and
screenshots, `docs/reporter-growth/v2/P4_EXPERIENCE_REDESIGN.md`,
`docs/reporter-growth/v2/P4_ACCEPTANCE.md`, the original V2 product/screen/evidence contracts, and the
frozen source contracts before editing. The design lock and versioned visual package govern
presentation when older documents differ.

## Write boundary

Allowed for P4:

- `src/ui/`
- `src/shell/`
- `src/styles/`
- presentation files and colocated presentation tests in:
  - `src/features/markets/`
  - `src/features/recruiting/`

Forbidden: `src/data/`, `src/logic/`, `src/contracts/`, `src/integration/`, root tooling,
dependencies, instructions, scenario facts, and other lane paths.

## Execution rule

You are the only writer for the shared presentation system, Overview, and Funnel. Build shared
primitives first, then Overview and Funnel as a real-data visual proof. Stop and return
`P4_VISUAL_PROOF_READY` with screenshots, checks, remaining gaps, and an exact commit. The Reporters,
Team, and Programs Experience specialists cannot start until the coordinator confirms this proof and
freezes the shared-presentation baseline.

After the proof gate, remain the design steward while those three specialists work in parallel. They
send component-contract questions and screenshot checkpoints to you. You alone make approved shared
component changes and broadcast them; do not edit their feature paths. Review each candidate directly
against the locked reference and return precise fidelity findings to its owner. Communication does not
expand any write boundary.

If a prepared view or command cannot support a required interaction, return a specific
contract-change request; do not calculate business values or create local shadow data in JSX.

Start only from the coordinator-frozen baseline containing the approved 50-person expansion. Consume
the canonical prepared views; do not add placeholder people, duplicate candidates, or local chart
series to make the screens look populated.

## Non-negotiable results

- one coherent visual and interaction system that the three specialist workspaces must reuse;
- the exact shell, label-only navigation, workspace compositions, editable grids, SLA behavior,
  charts, and exclusions in `docs/reporter-growth/v2/P4_DESIGN_LOCK.md`;
- a side-by-side match to `docs/reporter-growth/v2/design-lock/reference-manifest.md` for composition,
  hierarchy, component treatment, density, open-control states, and responsive behavior; canonical
  values may differ, but unexplained visual reinterpretation is a defect;
- no step labels, question/intro/review/mission/progress block, repeated workspace-purpose prose, or
  canvas-only feedback form;
- real source-backed charts required by XR09–XR14;
- one contextual drawer and one selected-context evidence path;
- no page-level evidence wall, repeated generic disclaimers, raw metric IDs, or technical filter-count
  prose in default views;
- all existing safe commands connected to visible, understandable controls;
- concise default copy, working filters/search/sort, focus return, and responsive behavior without a
  mobile waiver;
- no readiness, coverage, acceptance, completion, program, or rollout outcome created by presentation
  state.

## Handoff

At the proof gate, commit only allowed paths, stop editing, and report the base/candidate SHA,
Overview/Funnel screenshots, changed files, commands with exit codes, XR coverage, original acceptance
coverage, and all remaining gaps. Include Funnel SLA-editor comparisons. After the proof is accepted,
shared-component repairs follow the same exact-commit handoff. Do not self-approve, merge, spawn
children, or edit a specialist's workspace.
