# IC03 integration requirements for Team

This is a bounded coordinator clarification of the approved interview Team repair, not an additional implementation lane or presentation brief. Team logic is dispatched serially after Network, using `tasks/domain-support-redesign.md` and an exact base. Only `src/logic/team/` and its tests belong to that worker. The Experience Team specialist later owns the controls.

## Pure commands and one repository

Provide a pure `prepareTeamCommand(snapshot, TeamCommandEnvelope): V2CommandMutation` (or equivalent explicit exported signature). Validate commands and return the proposed snapshot, affected references and a concise message. Integration calls `commitV2Command` through its existing serialized queue; that boundary alone records the replay ID/command record, increments the repository revision and acknowledges persistence. A preparer must not change clock, schema, seed, revisions, command/replay or scenario metadata. Do not add storage.

Cover the frozen create, edit, assign, transition, target, quality, coaching, review and practice-sharing command variants. Preserve typed optional create links/due date/priority and the explicit kind. Market-domain work permits first-opportunity or re-engage; program work permits partner-task. Network returns a typed re-engagement creation payload and Programs returns typed requested work; both must use this same Team preparer. Derive unique work identity from the command context; coordinator can derive distinct child creation command IDs when one parent Programs action requests more than one item, while saving one parent transaction.

Append actor/time/history rather than rewriting it. Edit only supplied fields; preserve note whitespace. Required previous dueAt/blockerCode values must be explicit, including null, under the corrected Data validator. Optional title/priority may have been absent. Use shared `projectWorkItemAt` for historical editable fields. For history at one fixed demo timestamp, the latest append wins. Completion credit remains with the recorded first completion actor, and terminal work cannot reopen. A completion requires related, resolvable evidence known at the command time; it does not create lifecycle, readiness, assignment or job records. Blocker changes and status transitions must retain enough history to reconstruct past fields.

Blocked is independent of the three displayed board columns. Legacy blocked work stays in the last open/in-progress column from its history; clearing its blocker returns it to that column. Do not silently treat every blocked task as In progress. A task created initially blocked has no previous progress claim and should show To do with its blocker.

## Scope, identity and prepared detail

Apply selected-market and exact-ID/record-reference filters conjunctively, including `matchNone`. Resolve canonical work relationships through demand requests, acquisition cases, reporters, programs/enrollment and direct market references as supported by source records. Current code only recognizes linked demand requests and leaves its board unfiltered; this is insufficient for the linked sample. Keep genuinely unscoped team work explicit rather than inventing a market. All is a union of task IDs.

Provide member filter options with IDs, exact card/detail navigation, editable fields/history, linked evidence choices, and source-backed creation options. Do not require presentation to import storage, inspect raw snapshots, calculate source metrics or construct WorkItems. Clearly distinguish filtered/selected-market workload from total workload. Completion, quality, target and coaching samples must disclose their respective scope rather than silently mixing totals.

## Targets, inspection and coaching

Select the latest known valid target for the same member/role, metric version, unit and reporting window; retain earlier revisions for inspection. Do not sum mixed units or mutate actual work when a target changes. The current app's completed-week window is Feb 9–16, 2026, half-open; the fixed baseline clock is later on Feb 16. Display the actual reporting window. Current-day task edits do not automatically belong to that past reporting period. Offer source-backed prepared current/prior comparable completion facts for the weekly review, with exact event/work IDs, the two windows and any partial-period limitation.

A quality check's `checkedBy` is the reviewer, not the subject of a performance claim. Expose the inspected work and reviewer explicitly. If grouping inspected work by member, state the attribution basis and derive it from canonical work history (for example, owner at inspection); do not label reviewer activity as someone else's work quality. Keep unowned or ambiguous attribution visible. Only inspected work belongs in the denominator, with latest applicable checks and reasons visible. No invented overall score or ranking.

Coaching and successful-practice records need the observed issue/strength, linked work, expected practice, next action, due date, review date and recorded result. Preserve source authors and inspectable review history supported by the existing schema. A review result is an explicit entered note, not an automatic score. If the frozen storage type cannot preserve a required history, request a narrow shared change before implementing a private substitute.

## Integration and proof

The current Team feature wires most callbacks but only exposes Add work and static Goals. The specialist will implement forms, detail editing and awaited success/error feedback. Root integration currently constructs work directly and swallows failed saves; it will be replaced with the pure command preparer before those controls are accepted. Logic completion does not establish IP09 persistence or visual acceptance.

Required evidence: IC03/IP08/IP09, W02–W04, D06, M11, and unchanged SD01–SD07. Cover same-time repeated edits/reassignments, stale/replay composition through the shared transaction, failure noninterference, exact member/market filters, blocked columns, valid versus unrelated completion evidence, target units/revisions, inspection attribution and coaching. Preserve the existing 25-task sample and all people. Report exact base/candidate, checks, remaining presentation gaps and lane-boundary results.
