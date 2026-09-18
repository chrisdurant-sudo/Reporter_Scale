# P4 implementation readiness

Status: **ROUTING READY — IMPLEMENTATION INACTIVE PENDING EXPLICIT USER AUTHORIZATION**

Prepared: September 17, 2026

Production/source baseline reviewed: `c4f304c376ca631d88c694f519f76ec316f12a13`

This packet converts the approved P4 design into enforceable agent routing. It does not authorize
production implementation, dependency changes, deployment, or external writes.

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
| Experience Lead | GPT-5.6 Terra | medium | Shared UI architecture, interaction work, and cross-workspace coordination need balanced coding ability and judgment. |
| Reporters / Team / Programs Experience | GPT-5.6 Terra | medium | Each specialist must implement a polished screen while following the Lead's frozen system and visual reference. |
| Capacity logic support | GPT-5.6 Terra | high | Supply/demand and projection rules are the most reasoning-sensitive domain calculations. |
| Recruiting / Network / Team / Programs logic support | GPT-5.6 Terra | medium | Bounded prepared-view or command repairs need solid coding/reasoning without broad redesign authority. |
| Quality | GPT-5.6 Luna | medium | Independent, repeatable acceptance/browser execution is focused and test-driven. |
| Reviewer | GPT-5.6 Terra | high | Final cross-contract inspection and deviation detection need deeper reasoning over the complete candidate. |

Terra is the balanced intelligence/cost model; Luna is optimized for cost-sensitive, high-volume
work. `medium` is the normal implementation setting, while `high` is reserved for the two lanes that
need deeper rule or cross-cutting scrutiny. All lanes use Standard/default processing; no worker may
switch to Fast, Priority, or Ultrafast.

## Mandatory gates

- `implementation_active` and `fanout_authorized` remain false until the user explicitly authorizes
  P4 implementation.
- Immediately before the first Data worker, the coordinator must run one routing probe with
  `fork_turns="none"` and verify the actual role/model/reasoning metadata. The probe is not an
  implementation worker and must not edit files.
- Data must pass SD01–SD05 and the full baseline suite before Experience starts.
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

## Static verification

Run from the repository root:

```bash
node scripts/verify-p4-readiness.mjs
```

The verifier fails if parallelism can begin before the proof, the P4.2 limit exceeds four, paths
overlap, a specialist can change shared UI, Lead review disappears, a domain role regains a feature
path, Standard/default processing changes, required packet files are untracked, the visual bundle
drifts, or the locked screenshots are incomplete.

Baseline verification for this readiness packet:

| Check | Result |
|---|---|
| P4 static routing verifier | Pass — 139 checks |
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
