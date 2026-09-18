# P4 Lane Handoff Contract

P4 uses a read-only transition auditor as a fail-safe around every implementation lane. It is not a
feature-writing lane and has no authority to repair, waive, or reinterpret a failed check.

## Required handoff record

Every worker handoff must identify:

- lane ID and its registry task brief;
- exact base commit and exact candidate commit;
- changed files;
- claimed acceptance IDs;
- commands actually run and their exit status;
- candidate/reference screenshots required by that phase;
- known gaps; and
- `REVIEW_READY` only when the evidence is complete.

The worker's absolute worktree must not be nested under any `node_modules/` directory. The browser
and TypeScript runners treat that location specially and may refuse to load the suite, creating a
false verification gap. A worktree-local `node_modules` symlink to the shared dependency directory is
allowed; the worktree itself must remain outside it.

The coordinator must independently run:

```bash
npm run verify:p4:lane -- --lane <lane-id> --base <base-commit> --candidate <candidate-commit>
```

The command reads `lanes.v2.json`, verifies both commits, and rejects any changed path outside that
lane's registered write boundary. A clean boundary check is necessary but not sufficient: it does not
substitute for acceptance IDs, screenshot comparison, interaction proof, or the full transition suite.

## Transition fail-safe

Before worker handoff acceptance, coordinator integration, a phase transition, Quality dispatch, or
Reviewer dispatch:

1. Run the lane-boundary command for each incoming commit.
2. Record the outcome under `lane_audits` in `P4_EXECUTION_STATE.json`.
3. Run `npm run verify:p4:governance` to validate live state and legal sequencing.
4. Run `npm run verify:p4` before changing phases. This includes the governance checks, routine
   lint/type/unit/build suite, cross-workspace acceptance, and browser tests.
5. Stop on every nonzero exit. A narrative handoff, a local preview, or a passing subset cannot
   override the command.

Quality independently replays the relevant lane and phase evidence. Reviewer receives only the
exact commit that passed Quality. This creates separation between implementation, integration, and
acceptance without adding another writer to the product surface.
