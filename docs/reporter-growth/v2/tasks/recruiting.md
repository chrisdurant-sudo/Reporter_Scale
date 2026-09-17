# V2 Recruiting workspace — recruiting

## Purpose

Implement acquisition lifecycle, cohorts/sources, screening, onboarding, readiness transitions, and
the Recruiting workspace after explicit P2 authorization.

## Write boundary

- Allowed: `src/logic/recruiting/`, `src/features/recruiting/`, including colocated tests.
- Forbidden: other logic/features, `src/data/`, `src/contracts/`, `src/logic/shared/`,
  `src/integration/`, source barrels, root tooling/dependencies, `.codex/`, and instructions.

## Required reading

Read `AGENTS.md`, `../P1_SOURCE_CONTRACT.md`, `../DATA_CONTRACT.md`,
`../METRICS_AND_EVIDENCE.md` (M04-M09), `../SCREEN_CONTRACTS.md` (Recruiting),
`../DEMO_STORY.md`, `../scenario_contract.json`, `../ACCEPTANCE.md`, `../LANES.md`,
`../lanes.v2.json`, and frozen V2 people/work/evidence/workspace/command contracts plus
`src/logic/shared/` as read-only authority.

## Deliverables and checks

- Current-stage/action projections from complete known events and real open work; no stock-as-funnel
  confusion or fabricated intermediate history.
- Cohort progression, source outcomes, mature/observing 14-day results, and globally unique first-job
  attribution with explicit windows and market basis.
- Evidenced screening/onboarding/readiness actions and prepared Recruiting views; task completion
  alone cannot record readiness or an outcome.
- Cover S07, M03-M06, W01, and W02 with boundary/negative tests and run relevant typecheck/lint/test
  commands.

## Non-negotiable product rules

Unknown stays unknown; readiness is not acceptance or completion; demand remains request-slot based;
shared `EvidenceBundle` powers `Why this?` and `Open the work`; scenario expected facts are never
runtime data; no automatic rejection, real policy/API, or real message.

## Escalation and handoff

Stop on a missing shared or cross-domain contract and return a contract-change request. Do not edit
shared contracts, Team's canonical work implementation, or another lane. Do not spawn children.
Commit only allowed files, stop editing, and report REVIEW_READY with base/candidate SHA, changed
files, tests/commands and exit codes, acceptance coverage, and gaps.
