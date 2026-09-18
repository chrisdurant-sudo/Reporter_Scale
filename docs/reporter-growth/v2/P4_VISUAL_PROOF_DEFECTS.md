# P4 Visual Proof Defects

**Candidate:** `2d1789b92ea6a14842b50e1709511dbf405f3599`

**Disposition:** `NOT_ACCEPTED`

**Owner:** Experience Lead

**Gate:** P4.1 visual proof repair

These defects record why the current preview is not the locked P4 canvas. They are blocking until
candidate screenshots and interaction evidence prove the repair at the exact implementation commit.

| ID | Acceptance mapping | Observed deviation | Required repair and proof |
| --- | --- | --- | --- |
| VP01 | XR02, XR03, XR04 | The shell is constrained to roughly 74rem, uses content-width underlined tabs, and mixes green/navy navigation treatments. | Match the full-width bordered shell, equal-width navy active navigation, spacing, typography, and responsive behavior in the locked desktop and mobile references. |
| VP02 | XR03, XR04 | The default app state selects LAX instead of the locked all-market state. | Start in the locked default state and prove market changes update all dependent content. |
| VP03 | XR01, XR02 | `Demo controls · <date>` exposes implementation scaffolding that is absent from the canvas. | Remove demo-only chrome from the product surface or replace it with the exact locked utility treatment. |
| VP04 | XR05 | Overview omits the four connected summary regions from the approved layout and introduces an extra Growth goal panel. | Rebuild the Overview hierarchy from the reference: KPI row, capacity trend, opportunity/funnel summary, coverage/attention summaries, and locked explanatory placement. |
| VP05 | XR05, XR09 | The capacity chart lacks the reference axes, date labels, legend, forecast labeling, and comparable plot treatment. | Implement the locked chart presentation and prove readable values/labels at all four viewports. |
| VP06 | XR09 | The visible Overview view selector does not provide a demonstrated state change. | Wire the control or remove it to match the lock; capture interaction evidence for every remaining visible control. |
| VP07 | XR06, XR09 | Funnel status/count controls are presented as actionable but do not demonstrate filtering behavior; bottleneck mode is largely a heading swap. | Implement real status filtering and distinct People/SLA and Bottlenecks compositions with visible state changes. |
| VP08 | XR06, XR09 | Funnel filter combinations and SLA draft/apply/reset behavior lack exact-state proof. | Add deterministic interactions and screenshots for filters, selected reporter, SLA draft validation, apply, reset, and untouched-row preservation. |
| VP09 | XR02, XR11 | The browser acceptance suite still contains a 390px waiver even though mobile is mandatory. | Replace the waiver with real 390×844 navigation, wrapping, no-horizontal-overflow, and interaction assertions in the Quality-owned phase. |
| VP10 | XR01–XR11 | No candidate screenshot matrix, checksum manifest, exact-commit comparison, or `P4_VISUAL_PROOF_READY` handoff exists. | Produce the evidence package defined in `P4_VISUAL_PROOF_GATE.md`; coordinator acceptance must name the exact commit. |
| VP11 | Process ownership | A cross-feature acceptance file changed before the Quality phase. | Quality must explicitly adopt or replace `tests/acceptance/reporter-growth.integration.test.tsx` before its gate can pass. |
| VP12 | Process gate | The normal check passes, but all five cross-workspace integration tests fail while waiting for an obsolete Overview heading. Acceptance was not part of the routine check. | Repair or replace the stale Quality-owned suite, require it in the phase-transition command, and prove the candidate passes before any downstream dispatch. |

## Exit condition

This register closes only when every defect is marked verified against the candidate artifact manifest,
`npm run verify:p4` passes, and the coordinator records the exact visual-proof commit as accepted.
