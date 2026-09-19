# V2 lane ownership and sequencing

> **September 18 interview amendment:** Read [P4_INTERVIEW_IMPROVEMENT_PLAN.md](P4_INTERVIEW_IMPROVEMENT_PLAN.md) and [ASTRA_COORDINATOR_HANDOFF.md](ASTRA_COORDINATOR_HANDOFF.md) first. The amendment supersedes conflicting presentation requirements below (including Overview KPIs, filter behavior, Team management and pilot details) and adds blocking IP01–IP12 acceptance. This update authorizes planning/model configuration only; new implementation and revised visual proof remain pending. Earlier proof and status statements describe historical scope.

Status: **P4 ROUTING READY — IMPLEMENTATION INACTIVE**

This document and [`lanes.v2.json`](lanes.v2.json) are the active routing authority. They configure
roles and ownership but do not authorize implementation. P4 requires a separate explicit user gate.
The P2/P3 seven-lane presentation fan-out is historical and inactive; its routing record remains in
[`P1_5_AGENT_ROUTING.md`](P1_5_AGENT_ROUTING.md).

## P4 execution model

P4 uses serial gates followed by one bounded parallel presentation wave:

1. `data` alone adds the approved 50-person synthetic sample.
2. The coordinator integrates and freezes a verified baseline.
3. `experience` alone acts as Experience Lead, builds the shared system plus Overview/Funnel, and
   stops at the visual proof gate.
4. After proof acceptance, the coordinator freezes the shared presentation baseline.
5. The Lead remains design steward while `experience_reporters`, `experience_team`, and
   `experience_programs` implement their single feature paths concurrently.
6. The Lead reviews each specialist's candidate/reference screenshots; the coordinator integrates
   exact commits sequentially and fixes one integrated candidate.
7. `quality` tests that candidate and reports defects without production repairs.
8. `reviewer` inspects the exact Quality-passed commit read-only.

Capacity, Recruiting, Network, Team, and Programs roles are not scheduled implementation lanes. One
may run only after Experience returns a concrete missing-interface request and the coordinator
dispatches a bounded logic-only repair.

## Active ownership

| Role | Exclusive write paths | Active brief | Schedule |
|---|---|---|---|
| Data | `src/data/` and colocated data tests | `tasks/data-expansion-p4.md` | First, serial |
| Experience Lead | `src/ui/`, `src/shell/`, `src/styles/`; presentation files/tests under `src/features/markets/` and `src/features/recruiting/` | `tasks/experience-redesign.md` | Serial proof, then design steward during P4.2 |
| Reporters Experience | presentation files/tests under `src/features/reporters/` | `tasks/experience-reporters.md` | P4.2 after proof |
| Team Experience | presentation files/tests under `src/features/team/` | `tasks/experience-team.md` | P4.2 after proof |
| Programs Experience | presentation files/tests under `src/features/programs/` | `tasks/experience-programs.md` | P4.2 after proof |
| Capacity | `src/logic/capacity/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Recruiting | `src/logic/recruiting/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Network | `src/logic/network/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Team | `src/logic/team/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Programs | `src/logic/programs/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Quality | `tests/acceptance/`, `tests/e2e/` | `tasks/quality-redesign.md` | After one fixed integrated candidate |
| Reviewer | None; read-only | `tasks/reviewer.md` | After Quality passes without waiver |

The Lead is the only shared-system writer. Each specialist is the only writer for its named feature
path. Specialists must reuse the frozen shared components, route component questions to the Lead,
and receive Lead screenshot review before integration. Domain roles may not edit feature JSX/CSS,
shared UI, shell, styles, or another domain. The coordinator alone owns contracts, integration,
shared logic, dependencies, configuration, instructions, routing, source entry points, merges, and
unassigned paths.

## Runtime roles

| Role | Model | Reasoning | Requested service tier |
|---|---|---|---|
| Experience Lead | GPT-6 Astra | high | `default` |
| Reporters Experience | GPT-6 Astra | high | `default` |
| Team Experience | GPT-6 Astra | high | `default` |
| Programs Experience | GPT-6 Astra | high | `default` |
| Data | GPT-6 Astra | high | `default` |
| Capacity | GPT-6 Astra | high | `default` |
| Recruiting | GPT-6 Astra | high | `default` |
| Network | GPT-6 Astra | high | `default` |
| Team | GPT-6 Astra | high | `default` |
| Programs | GPT-6 Astra | high | `default` |
| Quality | GPT-6 Astra | xhigh | `default` |
| Reviewer | GPT-6 Astra | xhigh | `default` |

All roles use Standard/default processing. The coordinator remains selected interactively. The
zero-inheritance policy requires every routed probe and worker spawn to use the named role with
`fork_turns="none"`; `all` and bounded-history forks are forbidden. Workers receive only their
explicit dispatch packet plus repository instructions, do not spawn children, and do not change their
model, reasoning effort, or service tier.

Astra/high is the implementation baseline; Quality and Reviewer use Astra/xhigh. The coordinator selects Astra/xhigh interactively. Fresh runtime probes are required; static configuration alone is not a runtime verification.

## Concurrency and communication

- P4.0b Data and P4.1 visual proof each allow one lane worker only.
- P4.2 allows at most four concurrent workers: the Lead plus three specialists.
- The Lead and specialists may communicate about component contracts and screenshot fidelity. That
  communication never expands a write path.
- The Lead alone changes shared components and broadcasts the exact change to all specialists.
- Specialists do not edit each other's paths, copy shared primitives, or create local design systems.
- Integration, Quality, and Reviewer are serial; no domain support role overlaps a presentation
  worker unless the coordinator explicitly pauses the affected work and dispatches a bounded repair.

## Handoff and gates

- Run `node scripts/verify-p4-readiness.mjs` before every phase transition.
- Immediately before the first Data worker, run the required read-only runtime routing probe and
  verify its observable role/model/reasoning metadata.
- Before P4.2, probe the Lead and all three specialist roles, verify their model/reasoning metadata,
  and confirm the frozen shared-presentation commit in every dispatch.
- One worker owns one verified worktree and one exact commit. A separate task is not a separate
  checkout.
- Workers stop editing before handoff and return base SHA, candidate SHA, changed paths, actual checks,
  acceptance coverage, and remaining gaps.
- A missing shared interface produces a contract-change request. It does not authorize copied types,
  local calculations, shadow records, or expanded paths.
- The coordinator integrates exact commits sequentially and reruns required checks.
- No specialist commit may integrate without the Lead's recorded candidate/reference fidelity review.
- Quality failure returns to the owning production lane. Any repair invalidates the prior Quality
  result and must be retested before Reviewer.

Path ownership is an enforceable review rule, not an operating-system sandbox. The coordinator must
reject out-of-bound changes even when the filesystem technically permits them.
