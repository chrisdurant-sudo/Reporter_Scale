# Reporter Growth

> September 18 IP0 prerequisite exception: the user explicitly approved one serial Quality-owned test-only repair of `tests/e2e/reporter-growth.browser.spec.ts` during IP0, as specified in `docs/reporter-growth/v2/IP0_BROWSER_REPAIR_REQUEST.md`. This exception requires a verified Astra/xhigh zero-inheritance probe, a separate worktree, an exact-commit boundary audit, and a full-suite rerun. It does not waive any assertion, permit production edits, or replace the later independent IP5 Quality gate. All other dispatch sequencing remains unchanged.

> September 18 explicit start: the interview amendment is now authorized by the user's “please start” in task `01a0b79d-03f1-7f60-9d63-681a9f9baef3`. Read `docs/reporter-growth/v2/P4_INTERVIEW_CONTRACT_DELTAS.md` and the active execution ledger. Current phase: `IP0_contract_preparation`; loaded Astra catalog plus Data and Quality probes are verified. The approved Quality-only browser prerequisite repair must pass the full baseline before serial Data/logic implementation. No new start approval is needed. Historical P4 authorization/proof below cannot open the interview gates. The 50-person expansion is complete and must not be repeated.

> September 18 planning update: read `docs/reporter-growth/v2/ASTRA_COORDINATOR_HANDOFF.md` and `P4_INTERVIEW_IMPROVEMENT_PLAN.md` first. The latter is a dated design/acceptance amendment with IP01–IP12. Astra model configuration is approved; the new improvement implementation is not started or authorized by this planning request. Historical P4 state below does not bypass that gate.

> **Current phase:** Reporter Growth v2 P4 implementation is authorized, but the candidate at
> `2d1789b92ea6a14842b50e1709511dbf405f3599` is **not accepted**. The active phase is
> `P4.1_visual_proof_repair`; the preview at `http://127.0.0.1:5174/` is repair evidence, not a
> completed P4 experience. P4.2 specialist work, Quality, and Reviewer remain blocked until the
> exact-commit screenshot and interaction gate in `P4_VISUAL_PROOF_GATE.md` passes. The authoritative
> live state is `docs/reporter-growth/v2/P4_EXECUTION_STATE.json`. The reviewed source baseline is
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
> `design-lock/reference-manifest.md`, `P4_EXPERIENCE_REDESIGN.md`, and `P4_ACCEPTANCE.md`. The active
> authorization covers the scoped P4 repair and implementation sequence; new dependencies,
> deployment, external writes, and unrelated product work require a separate user gate.

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
`P4_EXPERIENCE_REDESIGN.md`, `P4_ACCEPTANCE.md`, `P4_EXECUTION_STATE.json`,
`P4_VISUAL_PROOF_GATE.md`, and `P4_VISUAL_PROOF_DEFECTS.md` before the earlier contracts. The readiness packet
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
- Zero-inheritance policy: every routed probe and worker `spawn_agent` call must specify
  `fork_turns="none"`. Never use `fork_turns="all"` or a bounded history fork for any Data,
  Experience, domain-support, Quality, or Reviewer role. Each child starts with zero coordinator
  conversation turns and receives only its explicit dispatch packet plus repository instructions.
- Include required context, absolute worktree, base commit, allowed paths, task brief, frozen
  contract commit, acceptance IDs, and handoff requirements in every implementation dispatch.
- Every P4 Experience Lead, Experience specialist, Quality, or Reviewer dispatch must include the exact path
  `docs/reporter-growth/v2/design-lock/reference-manifest.md` and require direct comparison with its
  interactive reference and fixed screenshots.
- Every P4 Data, Experience, Quality, or Reviewer dispatch must include
  `docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`. The Data dispatch must use
  `docs/reporter-growth/v2/tasks/data-expansion-p4.md` and require SD01–SD07.
- After spawning the initial routing probe, verify its actual session metadata before the Data worker.
  Before P4.2, separately verify the Lead and all three specialist role/model/reasoning assignments.
- Lead and specialist messages are required for component-contract questions, shared-change broadcasts,
  and screenshot review. Communication does not expand write authority or replace exact-commit handoff.
- Every lane handoff must declare an exact base and candidate commit, then pass
  `npm run verify:p4:lane -- --lane <lane> --base <base> --candidate <candidate>` before integration.
  Record the result in `P4_EXECUTION_STATE.json`; a narrative `REVIEW_READY` claim cannot override a
  failed boundary, missing acceptance evidence, or missing screenshots.
- Run `npm run verify:p4:governance` during repair and before every integration. Run the full
  `npm run verify:p4` before each P4 phase transition; it includes governance, lint, typecheck, unit,
  build, cross-workspace acceptance, and browser suites. Any failure blocks dispatch.
- A local preview, passing DOM tests, or a compiling build is never visual-proof acceptance. Candidate
  screenshots must use the exact clean commit, all required viewports, checksums, and interaction states
  defined by `P4_VISUAL_PROOF_GATE.md`.
- Do not describe an unaccepted preview as P4-complete. Record its candidate commit and disposition in
  `P4_EXECUTION_STATE.json`, and keep `fanout_authorized` false until visual proof is accepted.
- One worker, one assigned lane, one verified Git worktree and branch. A separate chat is not a separate checkout.
- Never place an active P4 worktree under `node_modules/`. Node and Playwright reject TypeScript
  configuration/tests from that path, which can prevent browser acceptance from running at all.
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
