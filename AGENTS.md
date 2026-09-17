# Reporter Growth

> **Current phase:** Reporter Growth v2 foundation review, governed by
> `docs/reporter-growth/v2/START_HERE.md`. The existing three-tab application and
> `docs/reporter-growth/CODEX_START.md` build entry point are version 1. This phase is
> documentation-only; do not run the legacy build prompt. Future source implementation
> requires explicit authorization and a frozen v2 lane registry.

The independent synthetic-data application currently in `src/` implements the version 1
scope defined in `docs/reporter-growth/PRODUCT.md`. The original v1 repository packet began
as a plan; the current checkout contains implemented v1 source and tests. Preserve the v1
application until an authorized v2 migration has a working replacement path.

## Processing policy

- Always use Standard processing.
- Do not enable Fast, Priority, or Ultrafast service tiers.
- Preserve `service_tier = "default"` for the coordinator and all subagents.
- Reasoning effort may vary by lane according to `.codex/agents/*.toml`; processing tier may not.

That gives you configuration + agent instruction, which is what I'd want.

## Read before starting
For future implementation, first use the packet for the explicitly authorized phase. The
references below are retained as the version 1 build record and do not authorize a v2 build.
Coordinator: `docs/reporter-growth/CODEX_START.md`, `BUILD_PLAN.md`, `LANES.md`, `AGENT_ROUTING.md`, `CONTRACTS.md`, and `ACCEPTANCE.md` in the same directory.
Worker: your one task file under `docs/reporter-growth/tasks/`, the frozen source contracts, and relevant product/design requirements.
The path registry is `docs/reporter-growth/lanes.json`. Reading other lanes for context is allowed; editing them is not.

## Rules
- Complete the serial setup and freeze a compiling baseline before starting parallel implementation.
- At most seven lane workers and one optional read-only reviewer concurrently; obey lower actual runtime limits. Workers do not spawn children.
- Use the named Codex roles in `.codex/config.toml` and `AGENT_ROUTING.md`; workers do not raise their own model/reasoning tier.
- Every `spawn_agent` call must specify `fork_turns="none"` or a bounded positive number. Never use `fork_turns="all"` because full-history forks inherit the coordinator model and reasoning effort instead of the named role configuration.
- Prefer `fork_turns="none"` for lane workers. Include all required context, paths, commit hashes, and acceptance criteria in the worker message.
- After spawning the routing probe, verify its actual session metadata before spawning any implementation workers.
- One worker, one assigned lane, one verified Git worktree and branch. A separate chat is not a separate checkout.
- Coordinator alone owns shared contracts, dependencies, configuration, integration, governance, and merges.
- Feature screens consume prepared data and callbacks. They do not import sibling features, storage, or canonical calculations.
- Each lane owns its own tests; the quality lane owns cross-feature acceptance/browser tests and cannot modify production code.
- Use a contract-change request for missing interfaces; never duplicate shared types or business rules to bypass ownership.
- Stop edits before handing off an exact commit. Return REVIEW_READY, actual checks, and gaps; do not self-approve or merge another worker's work.
- Reviewers inspect fixed commits without changing source. Coordinator integrates sequentially and verifies the final assembled commit.
- Version 1 scope (legacy): keep Markets / Reporters / Improvements, one five-market selector, simple labels, synthetic data, and no real messages or API connections. The authorized v2 plan supersedes only the three-tab scope; its safety boundaries remain in force.
- Preserve user work and stricter existing instructions. No blanket staging, destructive cleanup, force push, deployment, sandbox weakening, or unauthorized external writes.
- Do not claim installation, testing, subagent execution, or MVP completion without actual evidence.
