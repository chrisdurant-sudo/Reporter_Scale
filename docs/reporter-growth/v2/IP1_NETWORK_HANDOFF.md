# IC04 Network integration handoff

Worker base `027f754db5e338da631aadc945a4607136f035e5`, candidate `67fbed109a7306204c692dcb1b509f6560591621`, integrated at `314d5f67ae9f2bb265186c0af6c34dfb494c6ad5`. The coordinator independently passed the six-file boundary audit and governance. Worker focused tests: 41; Network plus source reconciliation: 47; full unit/integration: 238. The live ledger records the later coordinator full gate. This is logic evidence, not presentation acceptance.

## Prepared records and navigation

`prepareNetworkView` retains separate `verifiedSkills` (code, humanized label, verification and evidence pointers), structured `preferences`, credential records/review status, readiness evidence, and dated availability records/cells. Credential status describes stored evidence review, not inferred legal eligibility. No preference or recent job confirms availability. Display the actual market, mode, time bounds and expiry. Mixed scope stays unknown except expired/missing-only scope retains an expired warning; the limitation explicitly discloses missing cells.

Service-market browsing and actual job-market activity have different stated scopes. Exact ID families intersect, `recordRefs` is a union within that family, and `matchNone` produces an empty selection. Global earliest valid completed work is determined before filtering. Recent work uses the selected observed half-open window or trailing 28 elapsed days. Weekly active sets use equal-length windows shifted seven days, with exact current/prior membership and global first-time versus returning classification. No recent work is not attrition or unwillingness.

Each row supplies `detailTarget`, nullable `checklistTarget`, and nullable `followUpTarget`. Use them directly. `checklistTarget` carries all known matching acquisition cases and their recruiting-market-at-entry scope; it clears irrelevant demand/attendance/capability/source filters. It must not reuse the selected service market or blindly select the first case. A null target means no recorded case. Root integration now consumes this target.

## Explicit command and canonical follow-up

`prepareNetworkCommand(snapshot, NetworkCommandEnvelope): V2CommandMutation` validates and appends the explicit availability payload: reporter, start/end, status, market IDs, attendance modes and nullable confirmation expiry. Integration commits it through `commitV2Command`; the specialist must provide a form with entered scope, awaited success and visible errors. The old one-click callback invents a seven-day confirmation and is pending replacement; it is not accepted interview behavior.

`prepareReengagementFollowUp(snapshot, input)` receives reporter ID, market ID, as-of time, owner ID and due date. Owner/date are required inputs with explicit null allowed. `followUpInputs` supplies active owner options and canonical market options. An existing same-person canonical open/in-progress/blocked `re-engage` task returns its ID and exact Team target, without changing its owner or fields. Unrelated or terminal tasks do not prevent a new follow-up. The create result is a typed `WorkCreatePayload`, never a private WorkItem. Root composes it through Team's preparer and one repository save, then opens the exact created task. Repeated action resolves that same open task.

## Remaining presentation obligations

The Reporters specialist consumes the prepared skill/preference/availability/credential fields and exact targets, adds the explicit forms and person detail, and fixes awaited success/error feedback. It must make existing follow-up work openable rather than disabling the button. The current chart and labels are historical; they do not yet fulfill IP07. Do not sum or relabel the prepared values into unsupported activity or compliance claims. Preserve all 113 baseline people, the single scenario addition, the 25-task seed and SD01–SD07.

Root still needs Team composition for follow-up and explicit availability callback wiring. Independent IP01/IP06/IP07/IP09, revised reference comparisons, all required viewports and browser persistence proof remain pending.

## Coordinator follow-up composition

`src/integration/v2NetworkComposition.ts` now exports `commitNetworkFollowUp(repository, context, payload)`. The explicit payload contains reporter, market, nullable owner and nullable due date. Invoke it only through the app's serialized queue. It loads the canonical state, asks Network to resolve existing follow-up identity, and creates missing work through Team plus `commitV2Command`. Existing open work is read-only: no reassignment, duplicate task or extra save. Successful creation acknowledges repository storage before returning.

The result includes the saved/current snapshot and exact work target. It prepares the Team target in the entered market first, falling back to All only when that task has no matching recorded market relationship (for example, historical job-market activity outside present service/acquisition scope). It clears unrelated inherited demand filters and uses Team's M11 detail target. This does not add a market field to the work item or rewrite historical evidence targets. A null target must be disclosed as unavailable, never replaced with the first task.

Three focused integration tests cover one save plus repeated open, unchanged operational outcomes, denied storage/stale writes, and the cross-market target round trip. Typecheck passed. The Reporters specialist still must supply explicit availability/follow-up inputs and catch awaited failures; the old feature callback port remains pending until its presentation phase.
