# Reporter Growth

> **Current phase:** Reporter Growth v2 P3 — LAX Vertical Integration is explicitly authorized and
> active from integration baseline `97f3ed4606f62dddcf86d5ad261b77dcf1f17ed5`, using source freeze
> `19f7df98000e346a5b4ff32e00b699276c3f62fb`, the approved
> `ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION` P1.5 gate, and final integrated P2 source
> commit `2844a4bb578515d1c9a5f14357cae0c66be67763`. P2 is complete and inactive. P3 is limited to
> the live LAX vertical described in `docs/reporter-growth/v2/P3_LAX_VERTICAL.md`. Quality and
> Reviewer have not been launched. P4, deployment, dependency changes, external writes, and
> unrelated product work remain unauthorized.

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
For v2 work, read the packet for the explicitly authorized phase, then
`docs/reporter-growth/v2/FOUNDATION_REVIEW.md`, `P1_SOURCE_CONTRACT.md`, `LANES.md`,
`lanes.v2.json`, and the relevant v2 product/data/metrics/screen/acceptance contracts.
Workers read exactly one brief under `docs/reporter-growth/v2/tasks/` plus the frozen source
contracts. `docs/reporter-growth/v2/lanes.v2.json` is the sole active routing registry.
The v1 files under `docs/reporter-growth/` and `docs/reporter-growth/tasks/` are historical and
inactive; they do not authorize dispatch or source work.

## Rules
- Complete the serial setup and freeze a compiling baseline before starting parallel implementation.
- The initial implementation wave, only after explicit P2 authorization, is exactly seven roles:
  `experience`, `data`, `capacity`, `recruiting`, `network`, `team`, and `programs`.
  `quality` runs after an integrated candidate; `reviewer` runs read-only after Quality.
- At most seven spawned-agent threads may be open concurrently, excluding the coordinator. Obey
  any lower runtime limit. Workers do not spawn children.
- Use the named V2 roles in `.codex/config.toml` and the active v2 registry; workers never raise
  or substitute their own model, reasoning level, or service tier.
- Every `spawn_agent` call for a routed role must specify `fork_turns="none"`. Never use
  `fork_turns="all"` or a bounded history fork for a V2 lane because inherited coordinator context
  must not replace the configured child model/instructions.
- Include required context, absolute worktree, base commit, allowed paths, task brief, frozen
  contract commit, acceptance IDs, and handoff requirements in every implementation dispatch.
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
- Within the explicitly authorized project scope, proceed with all nondestructive reads, edits,
  checks, worktree/branch operations, commits, and integration without asking for permission. Ask only
  before a destructive edit; this rule does not expand scope or override a missing external authority.
- Do not claim installation, testing, subagent execution, or MVP completion without actual evidence.
