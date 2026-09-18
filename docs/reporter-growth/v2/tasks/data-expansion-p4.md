# P4 synthetic sample expansion — data

## Purpose

After explicit P4 implementation authorization, add the 50 canonical fictional people defined in
`docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`. This is a serial data-preparation step
before the Experience worker starts.

## Required reading

Read `AGENTS.md`, `docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`docs/reporter-growth/v2/P4_DESIGN_LOCK.md`, `docs/reporter-growth/v2/P4_ACCEPTANCE.md`,
`docs/reporter-growth/v2/DATA_CONTRACT.md`, `docs/reporter-growth/v2/METRICS_AND_EVIDENCE.md`,
`docs/reporter-growth/v2/DEMO_STORY.md`, the frozen V2 contracts, and the exact dispatch baseline.

## Write boundary

Allowed: `src/data/` and colocated data tests only.

Forbidden: `src/features/`, `src/ui/`, `src/shell/`, `src/styles/`, `src/logic/`, `src/contracts/`,
`src/integration/`, dependencies, configuration, instructions, scenario contracts, and every other
path. Do not spawn children.

## Required result

- exactly 50 new unique canonical people and acquisition cases, ten per market;
- the exact per-market funnel/network/activity/SLA/credential/compliance mix in the addendum;
- complete, ordered, referentially valid histories with synthetic provenance;
- deterministic reset and no duplicate identities;
- unchanged named scenario anchors, checkpoint facts, and existing cohort membership; and
- no stored KPI totals, SLA outcomes, churn claims, compliance conclusions, or chart series; and
- SD06 record-derived Overview and Funnel variation for every market plus All, using the exact
  thresholds in the sample addendum; and
- SD07 unique human-readable invented names for all 50 P4 identities, with no fixture-style market,
  `Fictional`, `Sample`, `Test`, `Person`, or numeric suffix in the visible name.

Add focused tests for SD01–SD07. Include per-market counts, unique natural-looking names, current stage distribution, activity
windows, credentials/compliance evidence, SLA-age coverage inputs, Overview rise/fall/range and
gap-recovery checks, Funnel R28 reversal checks, record integrity, reset, and named scenario
protection.

## Handoff

Run focused data tests plus typecheck, lint, the full unit suite, build, and `git diff --check`.
Commit only allowed paths, stop editing, and return `REVIEW_READY` with base/candidate SHA, changed
files, commands and exit codes, SD coverage, exact added counts, and remaining gaps. Do not self-merge.
