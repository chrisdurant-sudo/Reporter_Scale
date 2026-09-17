# P1.5 V2 role and lane routing gate

Status: **ROUTING_BLOCKED**

Reviewed source-contract authority: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

Routing work began from repository HEAD `4ddc61a3521ec30f69479988a095c58b88728036`.
This gate changed routing configuration and documentation only. No product source, package, lockfile,
dependency, application behavior, or implementation lane was changed or launched.

## Outcome

The project configuration and lane registry now express the requested V2 role mapping, ownership,
sequencing, seven-thread ceiling, `fork_turns="none"` policy, and Standard/default service tier. The
old V1 writer roles and registry are inactive.

The authorized `data` probe successfully identified itself as the named `data` role, received the V2
data write boundary, ran read-only, and showed no inherited coordinator conversation. However, the
runtime surfaces available to this coordinator and child did **not** expose the child's actual model,
reasoning effort, or service tier. The current coordinator session also retained the role catalog it
loaded before the configuration edit: it still advertised the old V1 role names and did not advertise
the new domain roles.

Configuration intent is not proof of runtime routing. Because the requested Luna/medium/default
runtime cannot be verified, P1.5 is blocked and no implementation fan-out is authorized.

## Final role mapping

| Role | Model | Reasoning | Service tier | Schedule |
|---|---|---|---|---|
| `experience` | `gpt-5.6-terra` | medium | `default` | Initial implementation wave |
| `data` | `gpt-5.6-luna` | medium | `default` | Initial implementation wave |
| `capacity` | `gpt-5.6-terra` | high | `default` | Initial implementation wave |
| `recruiting` | `gpt-5.6-terra` | medium | `default` | Initial implementation wave |
| `network` | `gpt-5.6-terra` | medium | `default` | Initial implementation wave |
| `team` | `gpt-5.6-terra` | medium | `default` | Initial implementation wave |
| `programs` | `gpt-5.6-terra` | medium | `default` | Initial implementation wave |
| `quality` | `gpt-5.6-luna` | medium | `default` | After one integrated candidate exists |
| `reviewer` | `gpt-5.6-terra` | high | `default` | Read-only after Quality on a fixed candidate |

The project config intentionally contains no top-level `model` or `model_reasoning_effort`; the
coordinator remains selected interactively. It keeps top-level `service_tier = "default"` and every
role layer also sets `service_tier = "default"`. Fast, Priority, and Ultrafast are not enabled.

The configuration structure follows the official OpenAI Codex configuration reference: named roles
use `agents.<name>.config_file`, role layers use `developer_instructions`, and the active concurrency
key is `agents.max_concurrent_threads_per_session`. See the
[official configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference).

## Concurrency and spawn policy

- The project ceiling remains seven spawned-agent threads excluding the coordinator.
- A future initial implementation wave is exactly: experience, data, capacity, recruiting, network,
  team, and programs.
- Quality is not one of those seven initial workers. It runs only after coordinator integration.
- Reviewer runs read-only only after Quality. The ceiling is not increased to overlap those phases.
- Every routed V2 spawn must use its exact named role and `fork_turns="none"`. `fork_turns="all"`
  and bounded-history forks are prohibited for V2 lanes so parent settings/context cannot replace the
  configured role.
- Workers do not spawn children or raise/substitute their own model, reasoning, or service tier.

## Exact write ownership

| Lane | Exclusive write paths |
|---|---|
| experience | `src/ui/`, `src/shell/`, `src/styles/` |
| data | `src/data/` |
| capacity | `src/logic/capacity/`, `src/features/markets/` |
| recruiting | `src/logic/recruiting/`, `src/features/recruiting/` |
| network | `src/logic/network/`, `src/features/reporters/` |
| team | `src/logic/team/`, `src/features/team/` |
| programs | `src/logic/programs/`, `src/features/programs/` |
| quality | `tests/acceptance/`, `tests/e2e/` |
| reviewer | None; read-only |

The coordinator alone owns `src/contracts/`, `src/logic/shared/`, `src/integration/`, source barrels,
common evidence/time/filter primitives, shared command/revision behavior, scenario application,
root tooling/dependencies, migration/compatibility seams, legacy Improvements retirement, routing and
instruction files, integration, merges, and all cross-lane contract changes. Unassigned paths are
coordinator-owned. A worker encountering a missing shared interface must stop and request a contract
change rather than patching shared code or duplicating a type/rule.

## V2 task briefs

The active briefs are:

- `docs/reporter-growth/v2/tasks/experience.md`
- `docs/reporter-growth/v2/tasks/data.md`
- `docs/reporter-growth/v2/tasks/capacity.md`
- `docs/reporter-growth/v2/tasks/recruiting.md`
- `docs/reporter-growth/v2/tasks/network.md`
- `docs/reporter-growth/v2/tasks/team.md`
- `docs/reporter-growth/v2/tasks/programs.md`
- `docs/reporter-growth/v2/tasks/quality.md`
- `docs/reporter-growth/v2/tasks/reviewer.md`

Each brief records purpose, allowed and forbidden paths, frozen reading, deliverables, acceptance IDs,
targeted verification, escalation conditions, changed-file/test reporting, no-child/no-cross-lane
rules, and the mandatory stop-on-contract-gap behavior. They preserve these shared product rules:

- conclusions derive from complete synthetic source records;
- `Why this?` and `Open the work` consume the shared `EvidenceBundle`;
- unknown remains unknown;
- readiness, acceptance, and completion are distinct;
- demand counts reporter-slot requests;
- scenario expected facts are test oracles, never runtime output;
- no real Steno system, API, policy, personal data, or message is invented or used.

## Configuration files changed

Modified:

- `.codex/config.toml`
- `.codex/agents/experience.toml`
- `.codex/agents/data.toml`
- `.codex/agents/quality.toml`
- `.codex/agents/reviewer.toml`

Added:

- `.codex/agents/capacity.toml`
- `.codex/agents/recruiting.toml`
- `.codex/agents/network.toml`
- `.codex/agents/team.toml`
- `.codex/agents/programs.toml`

Removed as active role layers (recoverable in Git history):

- `.codex/agents/logic.toml`
- `.codex/agents/markets.toml`
- `.codex/agents/reporters.toml`
- `.codex/agents/improvements.toml`

All nine active role layers declare the required model, reasoning effort, `service_tier = "default"`,
and V2 path/stop instructions.

## V1 routing retired

- `.codex/config.toml` no longer declares `logic`, `markets`, `reporters`, or `improvements`.
- `docs/reporter-growth/lanes.json` is marked `active: false`, `inactive_v1_history`, and points to the
  V2 registry.
- The V1 `AGENT_ROUTING.md`, `LANES.md`, `CODEX_START.md`, `BUILD_PLAN.md`, all V1 task briefs, and
  `FIRSTPROMPTi.txt` carry explicit inactive/legacy warnings.
- The sole routing registry is `docs/reporter-growth/v2/lanes.v2.json`. It is active as routing
  authority but records `fanout_authorized: false` and `implementation_active: false` while this
  runtime-verification blocker remains.
- V1 application source was not removed or modified. Legacy Improvements retirement remains a future
  coordinator-owned integration action.

## Routing probe

Exact dispatch characteristics:

- Role: `data`
- Task: `/root/p1_5_data_routing_probe`
- `fork_turns`: `none`
- Scope: read-only configuration/brief inspection; no product implementation, writes, commit, or
  child spawn.

Observed:

1. The worker reported runtime role identity `data` and canonical task name
   `/root/p1_5_data_routing_probe`.
2. It received the correct V2 data boundary: `src/data/` only, with features, domain/shared logic,
   contracts, integration, tooling/dependencies, `.codex/`, instructions, and other lanes forbidden.
3. It reported only the scoped probe prompt and repository instructions, with no apparent inherited
   implementation conversation context. This is consistent with `fork_turns="none"`.
4. It made no file changes. Its `git status --short` matched the coordinator's routing/doc edits.
5. The spawn result and live agent listing exposed task identity/status but no model, reasoning, or
   service-tier fields.
6. The worker likewise reported that its actual model, reasoning effort, and service tier were not
   exposed. It could read `gpt-5.6-luna`, `medium`, and `default` from configuration, but correctly did
   not claim those configured values as runtime proof.
7. The current coordinator session's available role catalog still reflects its pre-edit load: the old
   V1 roles remain advertised and the new capacity/recruiting/network/team/programs roles are not yet
   available in this session.

No second probe and no implementation worker was launched.

## Routing limitation and smallest unblock

The blocker is observability/reload, not TOML syntax or a missing role definition. A fresh coordinator
session must load the committed project configuration and show the new V2 role catalog. In that fresh
session, run exactly one read-only `data` probe with `agent_type="data"` and `fork_turns="none"`.
Proceed only if session/UI metadata actually confirms `gpt-5.6-luna`, medium reasoning, and
Standard/default service tier. If those fields remain unavailable, keep routing blocked; do not infer
them from TOML and do not launch the seven workers.

## Verification performed

| Exact command/tool | Result |
|---|---|
| Official OpenAI documentation search/open for Codex custom agents/config | Confirmed current role config, reasoning, service-tier, and concurrency keys. |
| `python3 -c 'import pathlib,tomllib; paths=sorted(pathlib.Path(".codex").glob("**/*.toml")); [tomllib.loads(p.read_text()) for p in paths]; print("TOML_OK", len(paths))'` | Exit 0; printed `TOML_OK 10`. |
| Read-only Python routing audit comparing all nine role layers to the required map and the V2 registry sequence/ceiling | Exit 0; printed `ROUTING_CONFIG_OK` and the exact expected mapping. |
| `jq empty docs/reporter-growth/lanes.json docs/reporter-growth/v2/lanes.v2.json` | Exit 0. |
| `git diff --check` | Exit 0 at the pre-report validation point. |
| Legacy-role declaration search in `.codex/config.toml` | No `logic`, `markets`, `reporters`, or `improvements` role declaration remained. |
| Read-only `data` role spawn with `fork_turns="none"` | Role/instructions verified; actual model/reasoning/service tier not exposed. |
| Live agent listing | Probe identity/status exposed; model/reasoning/service tier absent. |

Application typecheck, tests, build, and browser checks were not rerun because P1.5 changed no product
source, package, or toolchain file. No runtime/browser functionality is claimed.

## Git status

At probe time, `git status --short` showed only the routing/configuration/documentation changes listed
in this report; no `src/`, package, lockfile, or generated application path was modified. Final status
after the routing report commit: clean; `git status --short` returned no output.

## Exact next implementation gate

The next implementation gate remains **P2 — Records and Calculations**, but it is not authorized.
Before any P2 dispatch, a fresh-session P1.5 re-verification must end `ROUTING_VERIFIED`, followed by
explicit user authorization naming the integration base. Until then, `fanout_authorized` and
`implementation_active` remain false.

**ROUTING_BLOCKED**
