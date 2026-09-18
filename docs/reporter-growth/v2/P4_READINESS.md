# P4 implementation readiness

Status: **IMPLEMENTATION ACTIVE — P4.1 VISUAL PROOF REPAIR; FAN-OUT BLOCKED**

Prepared: September 17, 2026

Production/source baseline reviewed: `c4f304c376ca631d88c694f519f76ec316f12a13`

This packet converts the approved P4 design into enforceable agent routing. The user activated the
scoped P4 implementation on September 17, 2026 and directed the coordinator to repair the process
gaps before continuing presentation work. That authorization does not include dependency changes,
deployment, external writes, or unrelated product work.

## September 17 takeover correction

The candidate at `2d1789b92ea6a14842b50e1709511dbf405f3599` reached a local preview without the
required exact-commit screenshot matrix or a recorded visual-proof acceptance. Static readiness
still reported implementation as inactive, so the repository contained two contradictory truths:
active source work and an inactive routing registry. Functional tests also passed without asserting
the locked visual composition or real state changes for every visible control.

The correction is now explicit:

- `P4_EXECUTION_STATE.json` is the live gate ledger and marks the current candidate not accepted.
- `P4_VISUAL_PROOF_DEFECTS.md` turns the observed canvas deviations into blocking defects.
- `P4_VISUAL_PROOF_GATE.md` defines the exact-commit screenshot and interaction evidence required.
- `scripts/verify-p4-phase-gate.mjs` prevents P4.2, Quality, or Reviewer from starting early.
- `scripts/verify-p4-lane-boundary.mjs` rejects handoffs that cross a lane's registered write paths.
- `npm run verify:p4:governance` checks static and live state during repair; the full
  `npm run verify:p4` also runs lint, types, unit, build, acceptance, and browser suites for the
  post-integration Quality/Reviewer gate. P4.1 uses `npm run verify:p4:visual` and its artifact matrix.

The takeover recheck confirmed the need for the full command: lint, types, 114 unit tests, and the
build passed, while all five cross-workspace integration tests failed because they still waited for
an obsolete Overview heading. The former routine command did not run that suite, so it could report
green while the future Quality suite was stale. That finding is now recorded in the execution
ledger for the Quality-owned phase. It does not start Quality early or create a circular dependency
before P4.2; the current visual transition remains blocked by missing browser evidence.

The takeover also found that the prior active worktrees were nested below `node_modules/`. Current
Node rejects TypeScript Playwright configuration and test files from that path before executing a
single assertion. Active worktrees must now live outside `node_modules`; they may use a symlink to the
shared dependency directory. The phase verifier enforces the location rule.

From the corrected `/private/tmp` worktree, Playwright now loads the configuration and discovers all
eight desktop/mobile tests. Installed Chrome still aborts at launch under the host policy before an
assertion runs, with process cleanup denied by `EPERM`. The ledger records this as an environment
block, not a pass and not a waiver; browser proof must be rerun in an allowed local browser runtime.

The preview is therefore a repair candidate. It must not be represented as P4-complete, and its
existence does not authorize specialist fan-out.

## Readiness decision

P4 is configured for serial gates followed by one bounded parallel presentation wave:

1. Data expands the deterministic seed by 50 canonical fictional people and stops at a commit.
2. The coordinator integrates and verifies that commit.
3. The Experience Lead builds the shared system plus Overview/Funnel, then stops at the visual proof.
4. The coordinator accepts the proof and freezes the shared presentation baseline.
5. The Lead remains design steward while Reporters, Team, and Programs Experience specialists build
   their single, non-overlapping feature paths in parallel.
6. The Lead reviews each specialist's candidate/reference screenshots; the coordinator integrates
   exact commits sequentially and fixes one integrated candidate.
7. Quality compares that candidate with the locked reference and reports defects without repairs.
8. Reviewer inspects only the exact Quality-passed commit.

Data and the visual proof permit one lane worker at a time. Only the P4.2 workspace wave permits up to
four concurrent workers: the Lead plus three Experience specialists. Domain roles are unavailable for
presentation work and may run only after a concrete contract-change request for their logic directory.

## P3 fragmentation: cause and closure

| P3 failure mechanism | Result in P3 | P4 control that closes it |
|---|---|---|
| Five domain lanes owned both logic and their own feature JSX/CSS | Five separate layouts and interaction patterns | Domain roles now have logic-only paths; presentation specialists own one screen apiece only after the Lead freezes the system |
| Experience could edit shared primitives but not the feature screens using them | Shared styling could not enforce page hierarchy | The Lead owns shared UI plus Overview/Funnel, remains the sole shared-component writer, and reviews every specialist screen |
| Seven implementation lanes ran as an ungated initial fan-out | Local decisions diverged before a common composition existed | Data and proof are serial; bounded parallelism starts only after the proof and uses non-overlapping presentation paths |
| No literal visual reference lived in the repository | Agents could interpret prose differently | Versioned interactive reference, 17 fixed screenshots, state manifest, and checksums are mandatory inputs |
| Acceptance emphasized existence and data correctness over the finished experience | Functional tests could pass while the page remained cluttered and inconsistent | XR01–XR41 require hierarchy, exact composition, interactivity, responsive states, candidate/reference comparison, and Lead review |
| Quality could identify problems but there was no enforced repair/rerun loop | Visible defects could survive into closeout | Quality cannot repair or waive; defects return to the owning lane and the full suite reruns before Reviewer |
| Sparse/uneven records encouraged locally invented demo content | Screens could look populated without a trustworthy shared source | A serial Data gate adds exactly 50 canonical people, ten per market, before Experience; UI shadow records are forbidden |
| Active role files and routing could drift from planning documents | Agents could receive old permissions and briefs | The active registry, `.codex` role instructions, task briefs, and `AGENTS.md` now agree and are checked by `scripts/verify-p4-readiness.mjs` |

The earlier root cause is therefore closed structurally, not just described. Parallel work is allowed
only after one shared composition exists, only across non-overlapping presentation paths, and only
with Lead component control and screenshot review. Reintroducing domain-owned screens, pre-proof UI
fan-out, overlapping paths, specialist-local design systems, old briefs, or unreferenced visual
interpretation makes the readiness check fail.

## Active ownership

| Role | When | Write boundary | Required brief |
|---|---|---|---|
| Data | First, serial | `src/data/` and colocated tests | `tasks/data-expansion-p4.md` |
| Experience Lead | After Data integration; remains steward in P4.2 | shared UI/shell/styles plus `src/features/markets/` and `src/features/recruiting/` presentation/tests | `tasks/experience-redesign.md` |
| Reporters Experience | P4.2 after proof | `src/features/reporters/` presentation/tests only | `tasks/experience-reporters.md` |
| Team Experience | P4.2 after proof | `src/features/team/` presentation/tests only | `tasks/experience-team.md` |
| Programs Experience | P4.2 after proof | `src/features/programs/` presentation/tests only | `tasks/experience-programs.md` |
| Capacity / Recruiting / Network / Team / Programs | Only after a specific contract-change request | the owning `src/logic/<domain>/` directory and colocated tests | `tasks/domain-support-redesign.md` |
| Quality | After one fixed integrated candidate | `tests/acceptance/`, `tests/e2e/` | `tasks/quality-redesign.md` |
| Reviewer | After Quality passes without waiver | read-only | `tasks/reviewer.md` |

The sole active registry is [`lanes.v2.json`](lanes.v2.json).

## Models and why each lane uses them

| Lane | Model | Reasoning | Why |
|---|---|---:|---|
| Data | GPT-5.6 Luna | medium | Deterministic, high-volume synthetic record generation and validation benefit from a cost-sensitive focused model. |
| Experience Lead | GPT-5.6 Terra | high | Shared UI architecture, exact visual comparison, interaction work, and cross-workspace coordination require deeper cross-contract reasoning. |
| Reporters / Team / Programs Experience | GPT-5.6 Terra | medium | Each specialist must implement a polished screen while following the Lead's frozen system and visual reference. |
| Capacity logic support | GPT-5.6 Terra | high | Supply/demand and projection rules are the most reasoning-sensitive domain calculations. |
| Recruiting / Network / Team / Programs logic support | GPT-5.6 Terra | medium | Bounded prepared-view or command repairs need solid coding/reasoning without broad redesign authority. |
| Quality | GPT-5.6 Terra | high | Independent visual comparison, responsive/browser investigation, and cross-contract acceptance require deeper deviation detection in addition to repeatable execution. |
| Reviewer | GPT-5.6 Terra | high | Final cross-contract inspection and deviation detection need deeper reasoning over the complete candidate. |

Terra is the balanced intelligence/cost model; Luna is optimized for cost-sensitive, high-volume
work. `medium` remains the normal bounded implementation setting, while `high` is reserved for the
Experience Lead, Capacity, Quality, and Reviewer lanes that need deeper visual, rule, or cross-cutting
scrutiny. All lanes use Standard/default processing; no worker may
switch to Fast, Priority, or Ultrafast.

## Mandatory gates

- `implementation_active` mirrors the recorded user authorization in `P4_EXECUTION_STATE.json`.
  `fanout_authorized` remains false until exact-commit Overview/Funnel visual proof is accepted.
- Zero inheritance is mandatory for every routing probe and worker: each spawn must use
  `fork_turns="none"`; `all` and bounded-history forks are forbidden. A child receives only its
  explicit dispatch packet plus repository instructions, never the coordinator conversation.
- Immediately before the first Data worker, the coordinator must run one routing probe with
  `fork_turns="none"` and verify the actual role/model/reasoning metadata. The probe is not an
  implementation worker and must not edit files.
- Data must pass SD01–SD07 and the full baseline suite before Experience starts or resumes after an
  authorized data-contract repair.
- The Experience Lead must return `P4_VISUAL_PROOF_READY` for Overview and Funnel, including
  locked-reference comparisons at every required width, before the three specialists start.
- Before the P4.2 wave, the coordinator must verify the Lead and all three specialist role/model/
  reasoning assignments. Each specialist must receive Lead fidelity review before integration.
- Only the Lead may change shared UI/shell/styles. Specialists may not copy shared primitives or create
  workspace-local design systems.
- Domain support cannot edit feature JSX/CSS and cannot start without a concrete missing-interface
  request.
- Quality must pass without a visual, responsive, source-record, keyboard, or data waiver.
- Any production repair invalidates the prior Quality result and requires a rerun before Reviewer.
- Each incoming lane commit must pass the exact-base/exact-candidate boundary audit in
  `P4_LANE_HANDOFF_CONTRACT.md`; Quality independently replays the evidence before closeout.

## Static verification

Run from the repository root:

During an active repair, run `npm run verify:p4:governance`. Before any phase transition, run the
complete gate:

```bash
npm run verify:p4
```

The static verifier fails if zero inheritance is removed, the P4.2 limit exceeds four, paths
overlap, a specialist can change shared UI, Lead review disappears, a domain role regains a feature
path, Standard/default processing changes, required packet files are untracked, the visual bundle
drifts, or the locked screenshots are incomplete. The phase verifier separately fails when live
authorization and routing disagree, a phase is skipped, fan-out is attempted without accepted proof,
candidate evidence is incomplete or checksum-invalid, or P4.2 feature paths change before approval.

Baseline verification for this readiness packet:

| Check | Result |
|---|---|
| P4 static routing verifier | Pass — 145 checks |
| TypeScript | Pass — exit 0 |
| Lint | Pass — exit 0, zero warnings |
| Unit tests | Pass — 21 files, 100 tests |
| Acceptance tests | Pass — 2 files, 9 tests |
| Production build | Pass — 72 modules transformed |
| Browser tests | Pass — 8 tests using installed system Chrome |
| Diff check | Pass — no whitespace errors |

Playwright's bundled Chromium is not installed on this host. The existing suite already supports
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`; readiness used the installed Google Chrome binary without a
dependency or repository change. Future local browser runs on this host must provide that environment
variable unless the separately managed Playwright browser is installed.

## Remaining runtime limitation

Codex exposes the configured role/model/reasoning values, but the resolved child service tier is not
directly observable. Every coordinator and child setting remains `service_tier = "default"`; this is
the strongest available evidence for the required Standard processing policy. The mandatory runtime
routing probe checks the observable metadata immediately before implementation.
