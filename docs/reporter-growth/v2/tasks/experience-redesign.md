# P4 unified experience implementation brief

## Purpose

Implement the P4 redesign as the single presentation owner after explicit P4 authorization. Read
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
  - `src/features/reporters/`
  - `src/features/team/`
  - `src/features/programs/`

Forbidden: `src/data/`, `src/logic/`, `src/contracts/`, `src/integration/`, root tooling,
dependencies, instructions, scenario facts, and other lane paths.

## Execution rule

You are the only P4 presentation writer. Do not spawn children and do not split the five feature
screens among other agents. Build shared primitives first, then Overview and Funnel as a real-data
visual proof. Stop and return `P4_VISUAL_PROOF_READY` with screenshots, checks, remaining gaps, and an
exact commit. Do not proceed to the remaining workspaces until the coordinator confirms the proof gate.

After the proof gate, use the same primitives for Reporters, Team, and Programs. If a prepared view or
command cannot support the required interaction, stop and return a specific contract-change request;
do not calculate business values or create local shadow data in JSX.

Start only from the coordinator-frozen baseline containing the approved 50-person expansion. Consume
the canonical prepared views; do not add placeholder people, duplicate candidates, or local chart
series to make the screens look populated.

## Non-negotiable results

- one coherent visual and interaction system across all five workspaces;
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

Commit only allowed paths, stop editing, and report the base/candidate SHA, screenshots, changed files,
commands with exit codes, XR coverage, original acceptance coverage, and all remaining gaps. Do not
self-approve or merge. Include candidate/reference comparisons for every completed workspace and the
Funnel SLA editor and Team Add work states when applicable.
