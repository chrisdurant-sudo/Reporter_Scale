# IP1 Team logic and integration handoff

Team candidate `dfbff4a443e831ae4c154bbd0cae16503ff2dc7e`, based on `a4a765efab8fb8e2651b3ba871930f836ae6ecaa`, passed its exact six-file lane boundary and was integrated at `ccb2973`. Final worker checks: 29 focused Team tests, typecheck, lint and build passed. The coordinator corrected the app's stale nationwide unowned-count assertion to the selected SFO count. Combined full verification is recorded separately in the execution ledger; this handoff does not establish presentation acceptance.

## Domain APIs

- `prepareTeamCommand(snapshot, TeamCommandEnvelope)` validates all nine command variants and returns a pure mutation. Creation identities derive from command IDs; edits, notes and ownership/status append history. Completion requires known related evidence and preserves the first completion actor. Blocked remains separate from the three board columns. The transaction, not this function, saves and increments the revision.
- `prepareTeamView(snapshot, context, metric, teamFilters?)` supports stable member IDs/null/`unassigned`, domains, programs and blocked filtering. Prepared board/details include canonical relationships, title/status/owner/priority/due/blocker, histories, notes and evidence choices. Creation options come from source records.
- `prepareTeamCompletionComparison(snapshot, context, metric, teamFilters?)` returns current/prior equal-length windows, counts/delta, exact first-completion event/work IDs, recorded actors and per-period evidence. Partial periods are disclosed. Evidence identities include the complete evaluation/filter scope so separately prepared member comparisons cannot collide.

Market and exact record filters are conjunctive, including `matchNone`. Case/enrollment links do not broaden to unrelated sibling cases or enrollments. Unscoped work appears in All with an explicit limitation. A linked program does not make a task assignee the program owner.

Targets retain revisions and compare only matching metric/version/unit/window/member-or-role populations. A market/task subset does not silently use a whole-member target. Quality groups the latest inspected sample by owner at inspection, with the reviewer separately identified. M11's evidence bundle counts inspected tasks; prepared passed/inspected counts and ratio carry the quality proportion without relabeling a task metric as a ratio. Coaching retains original author and current stored review result; earlier review content is unavailable when the current update postdates the selected as-of time.

## Coordinator integration

The existing Team callbacks now use `commitV2Command` through the serialized queue. A successful callback means repository save succeeded; a failed command rejects and displays the repository/validation error. No direct Team record factories remain in those callbacks. Refresh/reset coverage also verifies the command record, replay ID and canonical unassigned work identity.

`prepareWeeklyTeamReview` maps domain-prepared member completion comparisons, compatible targets and explicit coaching actions into IC09. It preserves actual coaching review dates separately from due dates. The baseline LAX scope has no coaching record; the All scope retains the three DFW/ORD/ATL records. Programs review composition and the rendered weekly review remain pending.

## Presentation obligations

The Team specialist must add the prepared filters, exact detail drawer, editing/assignment/status controls, completion evidence, goals/inspection/coaching workflows, and awaited success/error handling. The historical Add form does not catch rejected callbacks yet; do not treat it as IP09 acceptance. New edit/transition controls use the same typed commands. No raw snapshot or business calculations belong in the feature.

Network follow-up and Programs requested work must compose through this Team preparer, with one repository save and no private task store. Integration wiring and explicit input forms are pending. Preserve the 113-person base population, 114-person scenario result and 25-task baseline. SD01–SD07 remain unchanged. IP08/IP09 and independent Quality are still open.


The coordinator also passes `onChangeFilters(TeamViewFilters)`, `onNavigateTarget(target)` and `preservedEvidenceContext` to TeamScreen for the specialist to declare and render. The domain receives these filters, and `view.appliedTeamFilters` is the current selection. Exact work navigation temporarily ignores retained local filters; clearing it restores them. Manual filter changes clear the exact drill-down. Root Reset clears both Team filters and Funnel controls.
