# Reporter Growth — bounded completion handoff

## Latest state — MVP delivered September 21

The user replaced the exhaustive finish with a practical MVP: good-looking screens and working filters. **MVP is complete** at integrated source `4afff14c14f7da58ceaebf7ad57932a996d9a6c2`, equivalent to tested candidate `26d8e4ac29e3ac321f448fe635014b20a1a3381c`. The current coordinator contains the accepted work. No implementation or audit dispatch remains required. The older six-step completion sequence below is retained as history and must not restart omitted Quality/Reviewer audits, full-suite reruns, assertion alignment or formal walkthrough validation.

- Preview: `http://127.0.0.1:5195/` from `/private/tmp/steno-completion-review`, identical application source to the coordinator.
- Practical Lead review passed Reporters, Team and Programs; existing desktop scripts passed all three workspaces, with 40 captures, working filters, saves, reload and reset. The 11 focused integration tests, lint, typecheck and build passed.
- Evidence: `design-lock/candidate/26d8e4ac29e3ac321f448fe635014b20a1a3381c/mvp-visual-review.json` and `proof-manifest.json`; no exhaustive formal pass is claimed. The original formal `current_phase` is retained only as history; `mvp_completion_amendment.status=complete` is the active disposition.
- Usage:3% at start,5% at finish (+2 points), below the8% stop threshold. No reset or settings change.
- Original test drafts are preserved in the named Git stash and the existing recovery package. Final versions are integrated. Coordinator working tree is intended to be clean after this handoff commit.

Read this first, then `USAGE_BOUNDED_COMPLETION_2026-09-21.md`. The user paused implementation because
of usage and approved tighter orders. This task prepared the handoff without restarting workers.
Resume implementation only when the new task's user prompt requests it. Do not restart planning or
the completed data/Overview/Funnel phases.

## Mandatory startup folder check

The new task must use the existing coordinator checkout at **`/private/tmp/steno-p4-coordinator`**.
This handoff's absolute path is
`/private/tmp/steno-p4-coordinator/docs/reporter-growth/v2/COMPLETION_HANDOFF_2026-09-21.md`.
Do not infer the repository from the task title or its initial working directory.

Before edits, tests, or dispatch, set the shell tool's `workdir` explicitly to
`/private/tmp/steno-p4-coordinator` and run these read-only checks:

```sh
pwd -P
git rev-parse --show-toplevel
git branch --show-current
git merge-base --is-ancestor 8a04cb31ba27ae5a45907cd1ac3841dd9d30f312 HEAD
git status --short
```

Both paths must resolve to `/private/tmp/steno-p4-coordinator`, the branch must be
`codex/reporter-growth-p4-coordinator`, and the ancestry check must exit successfully.
The saved handoff state includes modified `src/integration/App.test.tsx` and untracked
`src/integration/v2WorkspaceActions.test.tsx`; preserve both. Investigate any difference before
writing rather than resetting the checkout. Preserve the Lead's saved changes listed below too.

Set an explicit `workdir` on every subsequent shell call: the coordinator path for coordinator
operations, or the verified assigned worktree for a lane operation. A `cd` in one shell invocation
does not establish the next tool call's directory. Do not use `/Users/pc/Desktop/STENO`, a historical
worktree under `node_modules`, or a fresh checkout as a replacement coordinator. If the task starts
elsewhere, inspect this absolute path first. If it is missing or inaccessible, report that specific
blocker without moving files, recreating the project, or silently falling back to another checkout.

For the user choosing the folder in a macOS folder chooser: press **Command–Shift–G**, paste
`/private/tmp/steno-p4-coordinator`, press Return, and select Open. Use the existing local checkout
if the task offers a choice between local work and a new worktree.

Paste this into the new task to resume:

> Resume Reporter Growth in the existing checkout `/private/tmp/steno-p4-coordinator`.
> First read `/private/tmp/steno-p4-coordinator/docs/reporter-growth/v2/COMPLETION_HANDOFF_2026-09-21.md`
> and perform its mandatory startup folder check before editing or dispatching. Use explicit tool
> working directories, preserve saved work, and follow the usage-bounded completion orders:
> at most one active child, a usage checkpoint after each bounded job, and stop further dispatch
> at five additional account usage percentage points. Continue the saved implementation;
> do not restart planning or completed phases.

## Checkout and actual state

- Coordinator: `/private/tmp/steno-p4-coordinator`, branch `codex/reporter-growth-p4-coordinator`.
  Use this existing checkout directly; do not create a fresh project clone or discard dirty files.
- Phase: `IP3_workspace_wave`. Overview/Funnel proof accepted; workspace integration, independent
  Quality and Reviewer are not passed. The latest handoff commit changes instructions/evidence only.
- Shared source baseline: `b5cbe33e66a52f466456467a240d2f704208fb10`, full gate passed315 unit/integration,
  9 acceptance,8 browser plus governance/lint/types/build. This is not a pass for the new specialist screens.
- Accepted clean desktop proof: `055fcd18a39a6238d6beb7fc52bdd03a315ea1c3`, versioned under
  `design-lock/candidate/055fcd18a39a6238d6beb7fc52bdd03a315ea1c3/`.
- Serial data/logic/contract freeze: `dfa4b9b921991abd6a40127146520c421204c8cb`.
  The sample is complete:113 baseline people,114 with scenario,25 seed tasks. Do not expand it again.
- Desktop1440×900 pointer/keyboard proof only. Preserve basic responsiveness and existing390px browser assertions.
- Synthetic local application only. No dependencies, deployments, external messages, destructive
  cleanup, or merge into the Desktop STENO checkout.

## Saved implementation

All specialist commits share base `3a7842908ebf84fb53147d56bb270b0c44423847`.

| Lane | Worktree / branch | Candidate / disposition |
|---|---|---|
| Lead | `/private/tmp/steno-ip2-proof-repair` / `codex/interview-ip2-proof-repair` | HEAD3a78429, dirty three-file CategoryComparison repair; preserve and finish |
| Reporters | `/private/tmp/steno-interview-ip3-reporters` / `codex/interview-ip3-reporters` | `cca641d2ef1d15c92bc345e7e32737d16ec0405a`, clean;10 owned tests reported passed,11 browser captures; visual review pending shared density fix |
| Team | `/private/tmp/steno-interview-ip3-team` / `codex/interview-ip3-team` | `e6ebc6d6085ca2e3de4029c2e64f424b29526c5d`, clean; presentation implemented, final browser harness unfinished |
| Programs | `/private/tmp/steno-interview-ip3-programs` / `codex/interview-ip3-programs` | `46d0b90a0eb7ba56b5339635d3b7668a00fc9673`, clean;9 owned tests,32 browser checks/14 captures reported passed; visual review pending shared density fix |

Coordinator dirty work: `src/integration/App.test.tsx` edits and untracked
`src/integration/v2WorkspaceActions.test.tsx`. These prepare the new explicit forms and canonical
save/retry/repeat-follow-up tests. They have not been run against the integrated new screens.
Do not treat them as passed or discard them as unrelated changes.

Recovery copies with checksums are in `handoff-2026-09-21/recovery-manifest.json`: both working-tree
patches, the untracked test, three capture scripts and existing proof/handoff metadata. Existing
worktrees are primary; compare hashes before restoring, and never apply a patch twice. Historical
screenshots remain in `/private/tmp/steno-ip3-{reporters,team,programs}-proof`; committed metadata
and scripts survive loss of those scratch outputs. Recapture final affected states honestly.

## Shortest authorized finish

1. Check the account usage meter and record the baseline. Confirm the actual current permission and
   loaded role catalog; do not start another permission/settings troubleshooting loop. The prior
   runtime was `workspace-write`, `on-request`, `auto_review` with restricted network, despite TOML
   requesting Full Access. Authorized local Git/test/browser escalations were automatically approved.
   Do not change permission settings or consume a reset.
2. At most one active child. Old child names may be inaccessible from the new task. If needed,
   create one fresh named Experience Lead, `fork_turns="none"`, probe actual Astra/high once,
   then have that same child finish the saved shared repair. Historical specialist probes are
   evidence for completed work; do not recreate three specialist agents merely to re-probe them.
3. Shared repair is already only14 inserted/11 deleted lines across `src/ui/interview.tsx`,
   `src/ui/interview.test.tsx`, `src/styles/tokens.css`: compact category spacing/typography,
   optional `scaleMaximum`, optional green tone, one meaningful scale regression test. Lead found
   Reporters/Programs tables pushed about67px too far down. No Overview/Funnel production caller
   uses CategoryComparison. Finish this exact repair; no redesign or new data calculations.
4. Coordinator audits lane boundaries, assembles existing commits in one provisional review worktree,
   and completes known integration cleanup BEFORE final capture/review. The completion amendment
   permits coordinator removal of unused legacy feature callback types and wiring Lead-approved
   scale/palette props. Programs ratio charts should use an explicit100% scale; do not reinterpret
   cohorts as a time series. Substantive feature defects still return to their owning lane.
5. Run/adapt existing scratch capture scripts against the assembled clean commit. Their import,
   worktree, output and localhost values are hardcoded: update these together and derive the actual
   candidate SHA. Do not relabel old screenshots. Finish Team's script; its reset tail needs to
   navigate back to Team after Reset sends the app to Overview. A harness failure is not automatically
   a production defect. Lead reviews all three assembled/reference comparisons in one batch.
6. Official integration follows passing Lead review and exact lane audits. Diagnose obsolete
   acceptance/browser assertions on the fixed candidate. If needed, the already authorized
   `IP2_TEST_ALIGNMENT_REQUEST.md` permits a serial Quality-owned repair of only
   `tests/acceptance/reporter-growth.integration.test.tsx` and `tests/e2e/reporter-growth.browser.spec.ts`.
   Record exact diagnostics/scope and stop all source writers. This alignment is separate from
   fresh independent IP5 Quality; do not weaken any substantive assertion.
7. Integrated full gate, independent Quality (all IP01–IP12 and unaffected XR/SD/original checks),
   then read-only Reviewer on the exact Quality-passed commit. Existing scripts enforce those gates.
   Do not claim finished or waive a defect. Validate the walkthrough, record final evidence, conclude.

## Integration details to avoid rediscovery

`src/integration/V2App.tsx` already passes typed canonical ports. Remove the obsolete factories
`appendAvailability`, `appendReengagementTask`, `recordProgramDecision`, `saveProcessDraft`,
`createPartnerTask` and their legacy actions after the new screens are assembled; remove unused
`onEditProgram` and resulting unused imports. The old factories invent dates/defaults. New forms
must use the existing queued command ports. Optional deprecated feature action members exist only
to keep isolated specialist candidates compiling; remove them under the narrow coordinator exception.

- Reporters: row actions Confirm availability / Create re-engagement task / Open linked work /
  Inspect checklist. Save availability has explicit Status, market/mode checkboxes, Starts/Ends/
  Confirmation expires at (UTC), or No expiry. Follow-up has Market, Owner (explicit Unassigned),
  Due date (UTC) or No due date, then Save and open linked work. Marcus Wren is a known fixture.
  Use scoped combobox roles for select names. Reopening linked work must not write or duplicate it.
- Programs: open Readiness checklist pilot, then Record decision / Save process draft / Create linked
  work. Save decision uses entered rationale, owner, future review date. Draft selects a real process
  version and preserves steps/exceptions. Notes now save explicitly in a drawer. The full Programs
  handoff with selectors is backed up in `handoff-2026-09-21/programs-handoff.md`.
- Team: canonical owner/details/status operations are separate acknowledged actions. Completion
  requires evidence; original completion actor is immutable. Forms and exact operations are in
  the existing capture script. No CategoryComparison caller; the shared density repair does not affect it.
- All/LAX/SFO checklist cohorts are6/20→11/20,3/10→6/10,3/10→5/10 over14 days. Whole-program50%
  target does not automatically apply to market subsets. DFW is qualification1/6 against40%,
  $3,600 recorded spend. Readiness, availability, acceptance and completed work remain distinct.

## Tools, evidence and checks

- Existing dependencies: `/Users/pc/Desktop/STENO/node_modules` symlink; no installation needed.
- Chromium: `/private/tmp/steno-playwright-headless-shell/chrome-headless-shell-mac-arm64/chrome-headless-shell`.
- Prior preview ports: Lead5188, Reporters5189, Team5190, Programs5191. Verify a process before assuming
  it is live; use a new local port for assembled review. Browser execution may need automatic-reviewed escalation.
- Commands: `npm run verify:p4:governance`; `npm run verify:p4:dispatch -- --role ROLE --kind probe|implementation`;
  `npm run verify:p4:lane -- --lane ROLE --base SHA --candidate SHA`; full gate `npm run verify:p4` with
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` set. Run governance from the recorded coordinator checkout.
- New task runtime metadata must come from its actual session. The old helper
  `/private/tmp/steno-record-probe.py` hardcodes September19; adapt its date/session lookup before use.
- Historical required reference: `docs/reporter-growth/v2/design-lock/reference-manifest.md`.
  Changed-state reference: `docs/reporter-growth/v2/design-lock/interview-2026-09-19/reference-manifest.json`
  SHA256 `f5a1443b3705b8bb5a5bdd50ef89d9e5e0ca44520172de17a01780ace79b268f`.
  Required sample contract: `docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`.
- Use one relevant task brief per dispatched role. Read precise contract sections as needed;
  do not print the entire execution ledger or all historical handoffs into context.
- `INTERVIEW_WALKTHROUGH_2026-09-19.md` is drafted, not finally validated. `P4_EXECUTION_STATE.json`
  remains authoritative; update the source candidate and evidence truthfully as gates pass.

Check usage after each bounded job/gate. Stop further dispatch at an additional5 percentage points
or an unresolved repair/review cycle. This is a shared-meter checkpoint, not a guaranteed per-call cap.
