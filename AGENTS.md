# Reporter Growth

> **Current phase:** Reporter Growth v2 P4 has a user-approved design lock and a completed static
> readiness packet, but production implementation is not authorized. P4 routing uses serial Data and
> visual-proof gates followed by one bounded Experience workspace wave; it remains inactive until a
> separate explicit user gate. The reviewed source baseline is
> `c4f304c376ca631d88c694f519f76ec316f12a13`. P3 LAX Vertical Integration remains the live production baseline. P3 started from integration baseline
> `97f3ed4606f62dddcf86d5ad261b77dcf1f17ed5`, using source freeze
> `19f7df98000e346a5b4ff32e00b699276c3f62fb`, the approved
> `ROUTING_VERIFIED_WITH_TIER_OBSERVABILITY_LIMITATION` P1.5 gate, and final integrated P2 source
> commit `2844a4bb578515d1c9a5f14357cae0c66be67763`. The live P3 implementation is
> `3c37fefa2c7b8c9e7a4dd5a0013e2251cd53a66d`; exact closeout evidence is in
> `docs/reporter-growth/v2/P3_LAX_VERTICAL.md`. Commit `669e929` added Quality-owned V2 acceptance and
> browser tests after that closeout, but no Quality closeout or Reviewer result is recorded and those
> tests did not validate the missing visual/product experience. The corrected next-phase packet is
> `docs/reporter-growth/v2/P4_READINESS.md`, `P4_DESIGN_LOCK.md`, `P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
> `design-lock/reference-manifest.md`, `P4_EXPERIENCE_REDESIGN.md`, and `P4_ACCEPTANCE.md`. P4 production edits,
> new dependencies, deployment, external writes, and unrelated product work require a separate user gate.

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
For P4 planning or implementation, read `P4_READINESS.md`, `P4_DESIGN_LOCK.md`,
`P4_SYNTHETIC_SAMPLE_EXPANSION.md`, `design-lock/reference-manifest.md`,
`P4_EXPERIENCE_REDESIGN.md`, and `P4_ACCEPTANCE.md` before the earlier contracts. The readiness packet
and `lanes.v2.json` govern sequencing and ownership; the design lock and versioned
interactive/screenshot package govern presentation; the sample addendum governs the approved
population expansion; the plan and acceptance files govern the quality loop. They supersede P2/P3
presentation routing without changing frozen data or metric meanings.
Workers read exactly one brief under `docs/reporter-growth/v2/tasks/` plus the frozen source
contracts. `docs/reporter-growth/v2/lanes.v2.json` is the sole active routing registry.
The v1 files under `docs/reporter-growth/` and `docs/reporter-growth/tasks/` are historical and
inactive; they do not authorize dispatch or source work.

## Rules
- Complete the serial setup and freeze a compiling baseline before starting parallel implementation.
- The initial implementation wave, only after explicit P2 authorization, is exactly seven roles:
  `experience`, `data`, `capacity`, `recruiting`, `network`, `team`, and `programs`.
  `quality` runs after an integrated candidate; `reviewer` runs read-only after Quality.
- P4 begins, only after explicit P4 implementation authorization, with exactly one serial `data` role
  using `docs/reporter-growth/v2/tasks/data-expansion-p4.md` to add the approved 50-person sample.
  After coordinator integration and a frozen compiling baseline, exactly one `experience` Lead owns
  shared UI plus Overview/Funnel and stops at `P4_VISUAL_PROOF_READY`. Data and Experience do not run
  concurrently. Do not recreate the seven-lane domain-owned UI fan-out.
- Only after the coordinator accepts the Overview/Funnel proof and freezes the shared presentation
  baseline may `experience_reporters`, `experience_team`, and `experience_programs` run together.
  Each owns exactly one feature path. The Experience Lead remains the sole shared-component writer
  and design steward, answers component-contract questions, broadcasts shared changes, and reviews
  each specialist's candidate/reference screenshots before integration. The Lead does not edit a
  specialist's path, and specialists do not copy primitives or create local design systems.
- During P4, domain roles are on-demand, logic-only support after a concrete contract-change request.
  They do not edit feature JSX/CSS. The approved serial Data expansion is the only pre-Experience
  exception. The Experience proof must pass on Overview and Funnel before the remaining presentation
  work begins.
- P4 Quality reports defects without production edits. The owning implementation role repairs them,
  coordinator reintegrates, and Quality reruns. Reviewer starts only after all required checks pass
  without waivers.
- The historical P2 limit was seven spawned-agent threads. P4 permits one lane worker during Data and
  visual proof, and at most four during P4.2: the Lead plus three specialists. All other phases are
  serial. Workers do not spawn children.
- Use the named V2 roles in `.codex/config.toml` and the active v2 registry; workers never raise
  or substitute their own model, reasoning level, or service tier.
- Every `spawn_agent` call for a routed role must specify `fork_turns="none"`. Never use
  `fork_turns="all"` or a bounded history fork for a V2 lane because inherited coordinator context
  must not replace the configured child model/instructions.
- Include required context, absolute worktree, base commit, allowed paths, task brief, frozen
  contract commit, acceptance IDs, and handoff requirements in every implementation dispatch.
- Every P4 Experience Lead, Experience specialist, Quality, or Reviewer dispatch must include the exact path
  `docs/reporter-growth/v2/design-lock/reference-manifest.md` and require direct comparison with its
  interactive reference and fixed screenshots.
- Every P4 Data, Experience, Quality, or Reviewer dispatch must include
  `docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`. The Data dispatch must use
  `docs/reporter-growth/v2/tasks/data-expansion-p4.md` and require SD01–SD05.
- After spawning the initial routing probe, verify its actual session metadata before the Data worker.
  Before P4.2, separately verify the Lead and all three specialist role/model/reasoning assignments.
- Lead and specialist messages are required for component-contract questions, shared-change broadcasts,
  and screenshot review. Communication does not expand write authority or replace exact-commit handoff.
- Run `node scripts/verify-p4-readiness.mjs` before the routing probe and again before each P4 phase
  transition. A failure blocks dispatch.
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
