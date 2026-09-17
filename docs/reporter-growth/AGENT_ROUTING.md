# Codex agent routing

> **Version 1 legacy routing — INACTIVE.** Do not dispatch these roles. The sole active routing
> authority is `docs/reporter-growth/v2/lanes.v2.json` with briefs under
> `docs/reporter-growth/v2/tasks/`. The old `logic`, `markets`, `reporters`, and `improvements`
> meanings are retired and are not declared in `.codex/config.toml`.

This file controls the intended **cost/capability policy** for parallel implementation. Lane scope and write ownership remain authoritative in `LANES.md`, `lanes.json`, and the lane task files.

## Principle
The coordinator is intentionally not pinned by repo config. Choose the strongest appropriate coordinator interactively in Codex. Spawned implementation workers should use the cheapest model/reasoning combination that is still reliable for the lane.

| Lane / role | Model | Reasoning | Why |
|---|---|---|---|
| `experience` | GPT-5.6 Terra | medium | Shared UI needs solid TypeScript/React judgment without flagship cost. |
| `data` | GPT-5.6 Luna | medium | Bounded fixture/adapter work is cheap to parallelize. |
| `logic` | GPT-5.6 Terra | high | Canonical calculations and workflow rules carry the highest implementation risk. |
| `markets` | GPT-5.6 Terra | medium | Bounded feature implementation against frozen contracts. |
| `reporters` | GPT-5.6 Terra | medium | Interaction/state-heavy feature work, still bounded by contracts. |
| `improvements` | GPT-5.6 Terra | medium | Bounded feature implementation with moderate logic. |
| `quality` | GPT-5.6 Luna | medium | Independent acceptance/browser test authoring and evidence gathering. |
| `reviewer` | GPT-5.6 Terra | high | One focused read-only review of the assembled candidate. |

No subagent role is intentionally configured to use GPT-5.6 Sol. The coordinator may use Sol if selected by the user.

## Startup verification gate
Do **not** immediately fan out all workers. After `SETUP_FROZEN`:

1. Spawn exactly one `data` worker on a tiny read-only/no-op probe.
   Use `agent_type="data"` and `fork_turns="none"`. Never use
   `fork_turns="all"` for a role-routed worker.
2. Verify from the Codex UI/session metadata, if exposed, that the child is actually running the configured model and reasoning effort (`gpt-5.6-luna`, `medium`).
3. If routing is correct, close the probe and begin normal fan-out using the named lane roles.
4. If the child inherits the coordinator model/effort, the role model is unavailable, or the client does not expose enough evidence to verify routing, **do not launch the full swarm blindly**. Report the observed behavior and either fix the local Codex configuration/version or use explicit per-spawn model controls supported by that runtime.
5. Never silently substitute an expensive parent configuration for a cheaper requested worker role.

This gate exists because Codex subagent model overrides have had client/version-specific regressions. Repo configuration expresses intent; runtime evidence determines whether the cost policy is actually being enforced.

## Escalation policy
A lane worker does not increase its own model or reasoning effort.

- Luna worker blocked by complexity -> return `NEEDS_ESCALATION` with the exact blocker.
- Coordinator may retry the narrow unresolved task with Terra medium.
- Terra medium may be raised to Terra high only for a specific hard defect or ambiguity.
- Flagship-model escalation stays with the coordinator and should be exceptional.

Do not rerun an entire lane at a higher tier when only one narrow issue needs escalation.

## Concurrency
The repo does not pin `max_concurrent_threads_per_session`. Use the maximum **useful** concurrency supported by the current Codex runtime while preserving the lane/worktree boundaries in `LANES.md` and `BUILD_PLAN.md`.
