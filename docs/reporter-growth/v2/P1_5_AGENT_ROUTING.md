# P1.5 V2 role and lane routing gate

> Historical P2/P3 routing record. For P4, this document's seven-lane schedule and feature ownership
> are inactive and superseded by `P4_READINESS.md`, `LANES.md`, and `lanes.v2.json`.

Status: **ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION**

Reviewed source-contract authority: `19f7df98000e346a5b4ff32e00b699276c3f62fb`

Routing work began from repository HEAD `4ddc61a3521ec30f69479988a095c58b88728036`.
This gate changed routing configuration and documentation only. No product source, package, lockfile,
dependency, application behavior, or implementation lane was changed or launched.

## Outcome

The project configuration and lane registry now express the requested V2 role mapping, ownership,
sequencing, seven-thread ceiling, `fork_turns="none"` policy, and Standard/default service tier. The
old V1 writer roles and registry are inactive.

The fresh coordinator session loaded the active V2 catalog with `experience`, `data`, `capacity`,
`recruiting`, `network`, `team`, `programs`, `quality`, and `reviewer`. The retired V1 writer roles
`logic`, `markets`, `reporters`, and `improvements` were absent as active implementation authorities.
The runtime catalog exposed the `data` role's fixed `gpt-5.6-luna` model and medium reasoning effort.

Exactly one fresh-session `data` probe identified itself as the named `data` role, received the V2
Data lane write boundary, ran read-only, and received no coordinator conversation history under
`fork_turns="none"`. The spawn result, live-agent listing, and child-visible runtime metadata did not
expose a resolved child service-tier field.

That missing field is accepted as a runtime-observability limitation rather than a routing blocker.
The root configuration and all nine active role layers explicitly request `service_tier = "default"`;
no active project configuration enables Fast, Priority, Ultrafast, or a Fast-mode override;
`AGENTS.md` requires Standard/no-Fast processing; and workers may not change their own model,
reasoning effort, or service tier. Configured `default`/Standard is therefore the strongest available
tier evidence. It is **not** direct runtime verification and must not be represented as such.

## Final role mapping

| Role | Model | Reasoning | Requested service tier | Schedule |
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
role layer also sets `service_tier = "default"`. Fast, Priority, and Ultrafast are not enabled. The
table records the requested tier, not a directly observed resolved child tier.

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
  authority. Its phase-activation flags were not changed during this routing-verification-only turn;
  implementation was not launched.
- V1 application source was not removed or modified. Legacy Improvements retirement remains a future
  coordinator-owned integration action.

## Fresh-session routing probe

Exact dispatch characteristics:

- Role: `data`
- Task: `/root/p1_5_data_routing_probe`
- `fork_turns`: `none`
- Scope: read-only configuration/brief inspection; no product implementation, writes, commit, or
  child spawn.

Observed:

1. The fresh runtime's callable role catalog contained all nine active V2 roles and no retired V1
   writer role. This verified that the committed catalog had been reloaded.
2. The runtime role metadata fixed `data` to `gpt-5.6-luna` with medium reasoning; the probe did not
   inherit the coordinator's Sol/extra-high settings.
3. The worker reported runtime role identity `data` and canonical task name
   `/root/p1_5_data_routing_probe`.
4. It received the correct V2 Data boundary: `src/data/` only, with features, domain/shared logic,
   contracts, integration, tooling/dependencies, `.codex/`, instructions, and other lanes forbidden.
5. It reported only the scoped probe prompt and repository instructions and explicitly reported that
   it received no coordinator conversation history, confirming `fork_turns="none"`.
6. It made no file changes. The repository remained clean after the probe.
7. The spawn result and live-agent listing exposed task identity/status. The loaded role catalog
   exposed the `data` model and reasoning setting. None of those runtime surfaces exposed the resolved
   child service tier, and the child likewise reported that service-tier metadata was unavailable.
8. The root config and each of the nine active role layers request `service_tier = "default"`. A
   repository-wide active-configuration search found no Fast, Priority, Ultrafast, or enabled
   Fast-mode override.

No second probe and no implementation worker was launched.

## Tier observability limitation

This runtime does not expose a resolved child service-tier field through the spawn result, live-agent
listing, or child-visible session metadata. The following controls make configured
`default`/Standard the strongest available and accepted evidence:

1. Root `.codex/config.toml` requests `service_tier = "default"`.
2. Every active implementation, quality, and reviewer role layer requests
   `service_tier = "default"`.
3. No active project configuration contains `service_tier = "fast"`,
   `service_tier = "priority"`, `service_tier = "ultrafast"`, or an enabled Fast-mode override.
4. `AGENTS.md` explicitly requires Standard processing and prohibits Fast, Priority, and Ultrafast.
5. Workers are prohibited from raising or substituting their model, reasoning effort, or service tier.

This acceptance does not convert configured tier intent into direct runtime observation. The
service-tier observability limitation must remain visible in future routing and implementation
evidence until the runtime exposes a resolved tier field.

## Verification performed

| Exact command/tool | Result |
|---|---|
| Official OpenAI documentation search/open for Codex custom agents/config | Confirmed current role config, reasoning, service-tier, and concurrency keys. |
| `python3 -c 'import pathlib,tomllib; paths=sorted(pathlib.Path(".codex").glob("**/*.toml")); [tomllib.loads(p.read_text()) for p in paths]; print("TOML_OK", len(paths))'` | Exit 0; printed `TOML_OK 10`. |
| Read-only Python routing audit comparing all nine role layers to the required map and the V2 registry sequence/ceiling | Exit 0; printed `ROUTING_CONFIG_OK` and the exact expected mapping. |
| `jq empty docs/reporter-growth/lanes.json docs/reporter-growth/v2/lanes.v2.json` | Exit 0. |
| `git diff --check` | Exit 0 at the pre-report validation point. |
| Legacy-role declaration search in `.codex/config.toml` | No `logic`, `markets`, `reporters`, or `improvements` role declaration remained. |
| Fresh loaded runtime role catalog | All nine V2 roles present; retired V1 writer roles absent; `data` fixed to `gpt-5.6-luna` with medium reasoning. |
| Read-only `data` role spawn with `fork_turns="none"` | Role, scope, and no-history fork verified; no product or configuration changes. |
| Spawn result and live-agent listing | Probe identity/status exposed; resolved child service tier not exposed. |
| Active tier-control audit | Root plus all nine roles request `default`; no Fast/Priority/Ultrafast or enabled Fast-mode override found. |

Application typecheck, tests, build, and browser checks were not rerun because P1.5 changed no product
source, package, or toolchain file. No runtime/browser functionality is claimed.

## Git status

The fresh-session probe began and ended with a clean repository. This acceptance update changes only
this routing report; no `src/`, package, lockfile, configuration, or generated application path was
modified.

## Exact next implementation gate

The next implementation phase is **P2 — Records and Calculations**. This
`ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION` result is sufficient to clear the P1.5 routing
gate for that phase. No P2 worker was launched in this routing-verification turn. A later P2 dispatch
must still follow the authorized phase packet, name and verify its integration base, and preserve the
tier-observability limitation in its evidence.

**ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION**
