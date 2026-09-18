# P4 implementation readiness

Status: **ROUTING READY — IMPLEMENTATION INACTIVE PENDING EXPLICIT USER AUTHORIZATION**

Prepared: September 17, 2026

Production/source baseline reviewed: `c4f304c376ca631d88c694f519f76ec316f12a13`

This packet converts the approved P4 design into enforceable agent routing. It does not authorize
production implementation, dependency changes, deployment, or external writes.

## Readiness decision

P4 is configured for a strictly serial implementation:

1. Data expands the deterministic seed by 50 canonical fictional people and stops at a commit.
2. The coordinator integrates and verifies that commit.
3. Experience alone owns the shared shell and all five presentation surfaces.
4. Experience stops after the Overview/Funnel visual proof.
5. After proof acceptance, the same Experience owner completes Reporters, Team, and Programs.
6. Quality compares the fixed candidate with the locked reference and reports defects without repairs.
7. Reviewer inspects only the exact Quality-passed commit.

Only one lane worker may be active at a time. Domain roles are unavailable for presentation work and
may run only after a concrete contract-change request for their logic directory.

## P3 fragmentation: cause and closure

| P3 failure mechanism | Result in P3 | P4 control that closes it |
|---|---|---|
| Five domain lanes owned their own feature JSX/CSS | Five separate layouts and interaction patterns | Experience now owns presentation files for all five workspaces; domain roles have logic-only paths |
| Experience could edit shared primitives but not the feature screens using them | Shared styling could not enforce page hierarchy | Registry and role instructions give Experience both shared UI and all five presentation paths |
| Seven implementation lanes ran as an initial fan-out | Local decisions diverged before integration | Registry is strictly serial with concurrency fixed at one: Data, then Experience, then Quality, then Reviewer |
| No literal visual reference lived in the repository | Agents could interpret prose differently | Versioned interactive reference, 17 fixed screenshots, state manifest, and checksums are mandatory inputs |
| Acceptance emphasized existence and data correctness over the finished experience | Functional tests could pass while the page remained cluttered and inconsistent | XR01–XR40 require hierarchy, exact composition, interactivity, responsive states, and direct candidate/reference comparisons |
| Quality could identify problems but there was no enforced repair/rerun loop | Visible defects could survive into closeout | Quality cannot repair or waive; defects return to the owning lane and the full suite reruns before Reviewer |
| Sparse/uneven records encouraged locally invented demo content | Screens could look populated without a trustworthy shared source | A serial Data gate adds exactly 50 canonical people, ten per market, before Experience; UI shadow records are forbidden |
| Active role files and routing could drift from planning documents | Agents could receive old permissions and briefs | The active registry, `.codex` role instructions, task briefs, and `AGENTS.md` now agree and are checked by `scripts/verify-p4-readiness.mjs` |

The earlier root cause is therefore closed structurally, not just described. Reintroducing distributed
feature ownership, parallel UI work, old P2/P3 briefs, or an unreferenced visual interpretation makes
the readiness check fail.

## Active ownership

| Role | When | Write boundary | Required brief |
|---|---|---|---|
| Data | First, serial | `src/data/` and colocated tests | `tasks/data-expansion-p4.md` |
| Experience | After Data integration | shared UI/shell/styles plus presentation files and colocated presentation tests for all five feature workspaces | `tasks/experience-redesign.md` |
| Capacity / Recruiting / Network / Team / Programs | Only after a specific contract-change request | the owning `src/logic/<domain>/` directory and colocated tests | `tasks/domain-support-redesign.md` |
| Quality | After one fixed integrated candidate | `tests/acceptance/`, `tests/e2e/` | `tasks/quality-redesign.md` |
| Reviewer | After Quality passes without waiver | read-only | `tasks/reviewer.md` |

The sole active registry is [`lanes.v2.json`](lanes.v2.json). The configured models, reasoning levels,
and Standard/default processing remain unchanged.

## Mandatory gates

- `implementation_active` and `fanout_authorized` remain false until the user explicitly authorizes
  P4 implementation.
- Immediately before the first Data worker, the coordinator must run one routing probe with
  `fork_turns="none"` and verify the actual role/model/reasoning metadata. The probe is not an
  implementation worker and must not edit files.
- Data must pass SD01–SD05 and the full baseline suite before Experience starts.
- Experience must return `P4_VISUAL_PROOF_READY` for Overview and Funnel, including locked-reference
  comparisons at every required width, before the other workspaces continue.
- Domain support cannot edit feature JSX/CSS and cannot start without a concrete missing-interface
  request.
- Quality must pass without a visual, responsive, source-record, keyboard, or data waiver.
- Any production repair invalidates the prior Quality result and requires a rerun before Reviewer.

## Static verification

Run from the repository root:

```bash
node scripts/verify-p4-readiness.mjs
```

The verifier fails if routing becomes parallel, old briefs return, a domain role regains a feature
path, Experience loses a workspace, Standard/default processing changes, required packet files are
untracked, the visual bundle drifts, or the locked screenshots are incomplete.

Baseline verification for this readiness packet:

| Check | Result |
|---|---|
| P4 static routing verifier | Pass — 104 checks |
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
