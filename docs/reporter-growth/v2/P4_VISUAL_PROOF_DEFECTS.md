# P4 Visual Proof Defects

**Candidate:** `29735a174028795b107c07d75aa7a58a32aeec05`

**Disposition:** `NOT_ACCEPTED`

**Owner:** Experience Lead

**Gate:** P4.1 visual proof repair

These defects record why the current preview is not the locked P4 canvas. They are blocking until
candidate screenshots and interaction evidence prove the repair at the exact implementation commit.

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

This register closes only when every defect is marked verified against the candidate artifact manifest,
`npm run verify:p4` passes, and the coordinator records the exact visual-proof commit as accepted.
