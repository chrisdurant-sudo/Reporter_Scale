# P4 Visual Proof Gate

This file is the executable evidence contract for the P4.1 presentation gate. It closes the gap
between a compiling implementation and a visually accepted implementation. Passing unit tests or
serving a local preview does not satisfy this gate.

## Current disposition

- The coordinator candidate at `ea99c859a02eb3580cdfc6d05dccf0fd5d493f20` is **not accepted**.
- `http://127.0.0.1:5174/` is a repair preview, not a completed P4 experience.
- P4.2 specialist work, Quality, and Reviewer remain blocked.
- The active defect register is `docs/reporter-growth/v2/P4_VISUAL_PROOF_DEFECTS.md`.

## Evidence required for acceptance

The Experience Lead must capture the exact candidate commit against the references in
`docs/reporter-growth/v2/design-lock/reference-manifest.md`. The candidate evidence must include:

1. Overview at 1440×900, 1024×768, 768×1024, and 390×844.
2. Funnel People/SLA at all four required viewports.
3. Funnel Bottlenecks at all four required viewports.
4. Funnel SLA editor with the applicable market/default values and visible edit controls.
5. A short interaction record proving market selection, time range, tab selection, status filters,
   bottleneck mode, and immediate SLA edit/recompute behavior without changing lifecycle facts.
6. The exact Git commit, viewport, route, selected state, and SHA-256 checksum for every image.
7. A comparison result for each applicable XR01–XR11 requirement and every defect in the active
   defect register.

Candidate images belong under
`docs/reporter-growth/v2/design-lock/candidate/<commit>/`. A `manifest.json` in that directory must
map every artifact ID in `P4_EXECUTION_STATE.json` to its file, checksum, route, viewport, and UI
state. Unversioned screenshots, screenshots from a dirty worktree, and screenshots from a different
commit are not admissible.

## Acceptance sequence

1. `npm run verify:p4:governance` passes with `fanout_authorized: false` while repair is active.
2. The Data gate is reverified and recorded as passed in `P4_EXECUTION_STATE.json`.
3. The Experience Lead resolves the active defects and records a clean implementation commit.
4. Candidate evidence is captured from that exact commit and independently compared with the locked
   reference package.
5. The full `npm run verify:p4` transition check passes, including lint, types, unit, build,
   cross-workspace acceptance, and browser suites.
6. The coordinator records `visual_proof.status: accepted`, the exact accepted commit, and the full
   artifact manifest.
7. Only then may the coordinator set `fanout_authorized: true` and transition to
   `P4.2_workspace_wave`.

`scripts/verify-p4-phase-gate.mjs` enforces the state transitions. It must refuse fan-out without an
accepted exact commit and a complete, checksum-valid screenshot matrix.

Every worker handoff also runs `scripts/verify-p4-lane-boundary.mjs` against its exact base and
candidate commits. The handoff contract is `P4_LANE_HANDOFF_CONTRACT.md`. This read-only transition
control is deliberately not another feature-writing lane: it cannot repair or approve its own
findings, and the coordinator must record failures in the execution ledger.

## No-waiver rules

- Responsive acceptance includes 390×844; a mobile waiver is not permitted.
- Visual similarity is not inferred from component names, DOM assertions, or a passing build.
- A control that is visible but does not change state is a failed interaction, not a cosmetic gap.
- The locked reference can be superseded only by a new explicit user-approved design lock.
