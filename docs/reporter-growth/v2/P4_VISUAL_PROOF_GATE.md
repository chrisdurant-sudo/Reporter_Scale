# P4 Visual Proof Gate

This file is the executable evidence contract for the P4.1 presentation gate. It closes the gap
between a compiling implementation and a visually accepted implementation. Passing unit tests or
serving a local preview does not satisfy this gate.

## Current disposition

- The coordinator accepted exact candidate `e33ee8d1a70a7f103eaf67354aa98139c1fd20a7`
  for P4.1 after the Experience Lead returned `P4_VISUAL_PROOF_READY` and the coordinator completed
  an independent comparison with the locked interactive and screenshot references.
- SD01–SD07 remain integrated and passed. The accepted proof contains all 13 required artifacts,
  captured from the clean exact commit at `http://127.0.0.1:5174/` in Playwright Chromium
  153.0.8010.12.
- The manifest is
  `docs/reporter-growth/v2/design-lock/candidate/e33ee8d1a70a7f103eaf67354aa98139c1fd20a7/manifest.json`;
  its image checksums were independently verified.
- Market selection, Overview controls, workspace navigation, Funnel range/status controls, status
  filtering, Bottlenecks mode, per-market immediate SLA recomputation, and synthetic disclosure all
  passed. Browser console and page error lists are empty.
- The 390×844 Overview, Funnel People, and Funnel Bottlenecks artifacts are real captures; mobile was
  not waived.
- The shared presentation baseline is frozen at the accepted commit and the bounded P4.2 workspace
  wave is authorized. Quality and Reviewer remain blocked until their ordered phases.
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
5. `npm run verify:p4:visual` passes. The Experience-owned checks and production build must be green;
   browser interaction and screenshot evidence are supplied by the exact-commit artifact matrix.
   The Quality-owned cross-workspace and browser suites remain registered preflight findings until
   the post-P4.2 Quality phase; they do not authorize Quality to start early.
6. The coordinator records `visual_proof.status: accepted`, the exact accepted commit, and the full
   artifact manifest.
7. Only then may the coordinator set `fanout_authorized: true` and transition to
   `P4.2_workspace_wave`.

`scripts/verify-p4-phase-gate.mjs` enforces the state transitions. It refuses fan-out without an
accepted exact commit, a complete checksum-valid screenshot matrix, clean-worktree interaction
evidence, all required interaction passes, empty browser error lists, and real 390×844 artifacts.
The stale Quality-owned browser-suite waiver text remains a mandatory post-P4.2 Quality repair; it
cannot block the ordered P4.1 transition after independent real mobile proof, and the verifier
rejects it at the Quality phase.

The full `npm run verify:p4` command is the post-integration Quality/Reviewer gate. It intentionally
includes the Quality-owned cross-workspace and browser suites and must be fully green before Reviewer.

Every worker handoff also runs `scripts/verify-p4-lane-boundary.mjs` against its exact base and
candidate commits. The handoff contract is `P4_LANE_HANDOFF_CONTRACT.md`. This read-only transition
control is deliberately not another feature-writing lane: it cannot repair or approve its own
findings, and the coordinator must record failures in the execution ledger.

## No-waiver rules

- Responsive acceptance includes 390×844; a mobile waiver is not permitted.
- Visual similarity is not inferred from component names, DOM assertions, or a passing build.
- A control that is visible but does not change state is a failed interaction, not a cosmetic gap.
- The locked reference can be superseded only by a new explicit user-approved design lock.
