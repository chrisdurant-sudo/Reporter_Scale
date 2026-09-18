# P4 Visual Proof Defects

**Candidate:** `e33ee8d1a70a7f103eaf67354aa98139c1fd20a7`

**Disposition:** `P4_VISUAL_PROOF_READY_ACCEPTED`

**Owner:** Experience Lead

**Gate:** P4.1 visual proof repair

These defects record why the earlier preview was not the locked P4 canvas. The exact-commit artifact
matrix and interaction record now prove the P4.1 repairs. VP11 and VP12 remain explicit post-P4.2
Quality obligations; they do not authorize Quality to start early.

| ID | Acceptance mapping | Observed deviation | Required repair and proof |
| --- | --- | --- | --- |
| VP01 | XR02, XR03, XR04 | The shell is constrained to roughly 74rem, uses content-width underlined tabs, and mixes green/navy navigation treatments. | Match the full-width bordered shell, equal-width navy active navigation, spacing, typography, and responsive behavior in the locked desktop and mobile references. |
| VP02 | XR03, XR04 | The original candidate selected LAX. Candidate `29735a1` retains the All default and market-persistence behavior while integrating SD06 and the complete SD07 identity repair. Browser proof remains outstanding. | Capture the required viewport evidence showing the All default and dependent market updates. |
| VP03 | XR01, XR02 | The dated demo strip has been removed from the primary surface. Scenario controls now live in a collapsed secondary disclosure after the main workspace. | Verify the collapsed treatment against the locked utility expectations in browser screenshots. |
| VP04 | XR05 | Candidate `29735a1` retains the connected summary regions, removes the superseded Growth goal panel, and supplies source-derived ebbs and flows; the assembled tests assert the composition and data thresholds. | Complete direct screenshot comparison at all four Overview viewports. |
| VP05 | XR05, XR09 | The repaired capacity chart adds the reference axes, date labels, legend, and forecast treatment. | Prove readable values and labels at all four required viewports. |
| VP06 | XR09 | The Overview summary actions are now deterministic navigation controls, and the assembled integration test exercises `View Funnel`. | Capture interaction evidence for every remaining visible control. |
| VP07 | XR06, XR09 | Funnel status filtering and distinct People/SLA and Bottlenecks compositions are implemented and covered by focused Experience tests. | Capture browser state changes and compare them directly with both fixed Funnel references. |
| VP08 | XR06, XR09 | Deterministic filters and immediate SLA recomputation are implemented without changing lifecycle facts. | Capture the exact SLA-editor state and prove unrelated market values remain unchanged in browser acceptance. |
| VP09 | XR02, XR11 | The browser acceptance suite still contains a 390px waiver even though mobile is mandatory. | Replace the waiver with real 390×844 navigation, wrapping, no-horizontal-overflow, and interaction assertions in the Quality-owned phase. |
| VP10 | XR01–XR11 | No candidate screenshot matrix, checksum manifest, exact-commit comparison, or `P4_VISUAL_PROOF_READY` handoff exists. | Produce the evidence package defined in `P4_VISUAL_PROOF_GATE.md`; coordinator acceptance must name the exact commit. |
| VP11 | Process ownership | A cross-feature acceptance file changed before the Quality phase. | The ownership exception is now registered. Quality must explicitly adopt or replace `tests/acceptance/reporter-growth.integration.test.tsx` when its approved post-P4.2 phase begins. |
| VP12 | Process gate | The normal check passes, while all five Quality-owned UI scenarios wait for an obsolete P3 Overview heading. | The stale suite is now a recorded Quality preflight finding and remains mandatory in the final `npm run verify:p4` gate. It does not authorize an early Quality run or block the P4.1→P4.2 transition after exact visual proof. |
| VP13 | Process gate | After moving outside `node_modules`, Playwright discovers all eight desktop/mobile tests, but both installed Chromium runtimes (Chrome and Brave) abort under the current host policy before any page opens. | Rerun the browser suite in an allowed local browser environment and record actual assertion results. Do not convert the environment failure into a waiver. |

## Exit condition

P4.1 closed for exact commit `e33ee8d1a70a7f103eaf67354aa98139c1fd20a7`: the Experience Lead
returned `P4_VISUAL_PROOF_READY`, `npm run verify:p4:visual` passed, the coordinator independently
accepted the locked-reference comparison, and the manifest proves the complete viewport/state matrix.
The full `npm run verify:p4` command remains the post-integration Quality/Reviewer gate.

## P4.2 assembled workspace disposition

The first assembled proof at `8c331d5d85816ec282597a099bc12187add1d7e4` was rejected after direct
review found generic “All markets” Focus badges on Reporters, Team, and Programs and no visible
Programs target-met label. That rejected local proof is preserved at
`/private/tmp/steno-p4-rejected-8c331d5d` and is not part of the accepted artifact set.

The repaired exact source commit is `1e03a5d538b64bb647bafa01dcacab7fa869ea45`. Its committed manifest
at `docs/reporter-growth/v2/design-lock/candidate/1e03a5d538b64bb647bafa01dcacab7fa869ea45/manifest.json`
records 37 unique checksum-valid screenshots, and its interaction record contains 15 passing
interactions with empty console and page error lists. The proof includes real 390×844 states and was
captured in Playwright Chromium 153.0.8010.12 at `http://127.0.0.1:5174/`.

The Experience Lead returned `P4_WORKSPACE_VISUAL_PROOF_READY`; the coordinator independently
accepted the locked-reference comparison. VP09, VP11, and VP12 were mandatory Quality obligations;
Quality has now adopted the suites and removed the waiver, but its repaired-candidate rerun remains
mandatory.

### Quality defect loop

Quality commit `439829151151de6e8279e5af01261f07d1b50a3c` adopted the stale suites and removed
the 390px waiver, then returned `DEFECTS`: sequential Funnel note input collapsed internal whitespace,
and clearing the controlled Onboarding SLA before typing `90` produced `1090`. The Experience Lead
repaired only its authorized Funnel path in handoff `f120189a808503f1b5894513c1fdc65b0b4cb18c`,
integrated as exact source commit `16479473d6b22ed64a18d4b1b5b9748f1c84374b`.

The replacement manifest at
`docs/reporter-growth/v2/design-lock/candidate/16479473d6b22ed64a18d4b1b5b9748f1c84374b/manifest.json`
contains 37 checksum-valid screenshots and 16 passing interactions. It explicitly verifies the two
repaired sequential-input paths, real 390×844 states, per-market SLA isolation, unchanged lifecycle
facts, and empty console/page error lists. Independent Quality must still rerun; this repair evidence
does not self-approve the candidate.

## Verification record

| Defect | P4.1 disposition | Exact evidence |
| --- | --- | --- |
| VP01–VP05 | Verified | The complete Overview matrix matches the locked shell, All-first controls, hierarchy, axes, legend, forecast treatment, and responsive composition with source-backed values. |
| VP06–VP08 | Verified | `interactions.json` records passed navigation, range/status/filter changes, Bottlenecks mode, and LAX SLA 1→90 recomputation without lifecycle mutation or SFO leakage. |
| VP09 | Quality suite adopted; rerun pending | Three exact 390×844 artifacts prove the mobile composition without overflow or clipping. Quality replaced the stale waiver with real mobile assertions; those assertions must pass after the latest repair. |
| VP10 | Verified | The committed manifest contains exactly 13 checksum-valid artifacts from the accepted commit and links the clean-worktree interaction record. |
| VP11–VP12 | Quality adoption complete; rerun pending | Quality adopted the cross-workspace and browser suites. The first run exposed production defects, so the repaired candidate must be rerun before Quality can pass. |
| VP13 | Verified | After the recorded Chrome/Brave SIGABRT and managed Vite EPERM attempts, the unrestricted local preview and Playwright Chromium runner completed with all required interactions passed and empty console/page error lists. |
