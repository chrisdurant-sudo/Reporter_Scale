# V2 lane ownership and sequencing

Status: **P4 ROUTING READY — IMPLEMENTATION INACTIVE**

This document and [`lanes.v2.json`](lanes.v2.json) are the active routing authority. They configure
roles and ownership but do not authorize implementation. P4 requires a separate explicit user gate.
The P2/P3 seven-lane presentation fan-out is historical and inactive; its routing record remains in
[`P1_5_AGENT_ROUTING.md`](P1_5_AGENT_ROUTING.md).

## P4 execution model

P4 is strictly serial, with at most one lane worker active at a time:

1. `data` adds the approved 50-person synthetic sample.
2. The coordinator integrates and freezes a verified baseline.
3. `experience` builds the shared system plus Overview/Funnel and stops at the visual proof gate.
4. After proof acceptance, the same `experience` owner completes Reporters, Team, and Programs.
5. `quality` tests one fixed integrated candidate and reports defects without production repairs.
6. `reviewer` inspects the exact Quality-passed commit read-only.

Capacity, Recruiting, Network, Team, and Programs roles are not scheduled implementation lanes. One
may run only after Experience returns a concrete missing-interface request and the coordinator
dispatches a bounded logic-only repair.

## Active ownership

| Role | Exclusive write paths | Active brief | Schedule |
|---|---|---|---|
| Data | `src/data/` and colocated data tests | `tasks/data-expansion-p4.md` | First, serial |
| Experience | `src/ui/`, `src/shell/`, `src/styles/`; presentation files and colocated presentation tests under `src/features/markets/`, `recruiting/`, `reporters/`, `team/`, and `programs/` | `tasks/experience-redesign.md` | After Data integration; same owner across both visual phases |
| Capacity | `src/logic/capacity/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Recruiting | `src/logic/recruiting/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Network | `src/logic/network/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Team | `src/logic/team/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Programs | `src/logic/programs/` and colocated logic tests | `tasks/domain-support-redesign.md` | On demand after a contract-change request |
| Quality | `tests/acceptance/`, `tests/e2e/` | `tasks/quality-redesign.md` | After one fixed integrated candidate |
| Reviewer | None; read-only | `tasks/reviewer.md` | After Quality passes without waiver |

Experience is the only P4 presentation writer. Domain roles may not edit feature JSX/CSS, shared UI,
shell, styles, or another domain. The coordinator alone owns contracts, integration, shared logic,
dependencies, configuration, instructions, routing, source entry points, merges, and unassigned paths.

## Runtime roles

| Role | Model | Reasoning | Requested service tier |
|---|---|---|---|
| Experience | GPT-5.6 Terra | medium | `default` |
| Data | GPT-5.6 Luna | medium | `default` |
| Capacity | GPT-5.6 Terra | high | `default` |
| Recruiting | GPT-5.6 Terra | medium | `default` |
| Network | GPT-5.6 Terra | medium | `default` |
| Team | GPT-5.6 Terra | medium | `default` |
| Programs | GPT-5.6 Terra | medium | `default` |
| Quality | GPT-5.6 Luna | medium | `default` |
| Reviewer | GPT-5.6 Terra | high | `default` |

All roles use Standard/default processing. The coordinator remains selected interactively. Every
routed spawn uses the named role with `fork_turns="none"`; workers do not spawn children or change
their model, reasoning effort, or service tier.

## Handoff and gates

- Run `node scripts/verify-p4-readiness.mjs` before every phase transition.
- Immediately before the first Data worker, run the required read-only runtime routing probe and
  verify its observable role/model/reasoning metadata.
- One worker owns one verified worktree and one exact commit. A separate task is not a separate
  checkout.
- Workers stop editing before handoff and return base SHA, candidate SHA, changed paths, actual checks,
  acceptance coverage, and remaining gaps.
- A missing shared interface produces a contract-change request. It does not authorize copied types,
  local calculations, shadow records, or expanded paths.
- The coordinator integrates exact commits sequentially and reruns required checks.
- Quality failure returns to the owning production lane. Any repair invalidates the prior Quality
  result and must be retested before Reviewer.

Path ownership is an enforceable review rule, not an operating-system sandbox. The coordinator must
reject out-of-bound changes even when the filesystem technically permits them.
