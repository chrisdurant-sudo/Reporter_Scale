# Data contract — proposed source model

This specifies the next source contracts; it does not ship TypeScript types or replace the current schema. The coordinator must reconcile exact type names with the live checkout before the later source-contract phase.

## Fundamental rules

Use stable IDs, UTC timestamps, explicit references, and `synthetic-demo` or `demo-simulation` provenance. Display request times in the market's named time zone. A data record becoming known (`recordedAt`) is different from a request scheduled for a future time. Future requested work is valid current demand; future outcomes are not current evidence.

A computation has an explicit `asOfAt`, snapshot revision, definition version, and filter scope. Use half-open date windows `[startAt, endAt)` unless a named metric explicitly specifies its boundary. Never use the machine clock silently.

A person has one identity across all service markets. Person counts must be distinct IDs. A request has one canonical demand market. A recruiting case has an owner market whose history is retained. Source and cohort attribution use the market/source fixed at the defined entry event, not today's reassigned owner.

For v2, first-time recruiting uses one acquisition case per person. Re-engagement is a separate activity against the existing person, not a duplicate identity or a second first-time acquisition. Repeated acquisition-case modeling beyond this is not required.

## Record groups and grain

### 1. Snapshot and reference values

`DemoSnapshotV2`: schemaVersion 2, seedVersion, revision, baseAsOfAt, currentAsOfAt, appliedCommandIds, appliedScenarioEventIds, and the collections below. Keep future scenario-feed events outside the current operational collections until the scenario advances.

`Market`: id/code, name, timeZone. Do not store computed market health, observed issue, next action, rates, or chart totals as authoritative facts. A staff note can exist if clearly labeled `manual-note` with author/date; it cannot masquerade as a derived signal.

`MetricDefinition`: id/version, unit, description, time-window semantics, population and attribution rules. Definitions are code/configuration contracts; they are not freely editable formula strings from the UI.

### 2. People and recruiting

`Reporter`: id, fictionalName, recruitingMarketId, serviceMarketIds, createdAt/recordedAt, preferences, and provenance. Avoid real contact details.

`AcquisitionCase`: id, reporterId, ownerMarketId, primarySourceId, openedAt, purpose=`first-time`, originProgramId optional. The primary source is recorded at entry; later assisting programs are separate links. Unknown source stays unknown.

`LifecycleEvent`: id, caseId/reporterId, eventType, occurredAt, recordedAt, actorId, reasonCode/text, marketAtEntry, optional linkedWorkItemId. Event types cover sourced, contacted, responded, screening-started, qualified, onboarding-started, ready, paused, resumed, and closed with a reason. First-job completion is derived from completed jobs, not independently asserted by a lifecycle editor.

Stage transitions preserve history and prerequisites. Missing intermediate history stays “not recorded” during migration; do not manufacture timestamps to make a funnel look complete. The new seed must contain the complete history it needs.

### 3. Screening and readiness

`CredentialRecord`: id, reporterId, label, issuerLabel, jurisdictionScope optional, verificationStatus, verifiedAt, validFrom/validUntil optional, evidenceRef. Sample labels are metadata, not automatic legal authorization.

`CapabilityVerification`: id, reporterId, capabilityCode, status (unreviewed / needs-information / verified / not-demonstrated), recordedAt, reviewerId, evidenceRef. Unknown and not-demonstrated are distinct.

`ScreeningReview`: id, reporterId/caseId, checks with evidence, outcome, unresolvedInformation, reviewerId, reviewedAt, reason. Preserve the original review and append changes.

`OnboardingStep`: id, caseId, stepDefinitionId, required, state, assignedTo, dueAt, completedAt, completedBy, evidenceRef and blockerCode optional. A completion without required evidence must fail validation.

`ReadinessEvent`: id, reporterId, occurredAt, actorId, checklistVersion, checkedStepIds, relevantCapabilityVerificationIds. Readiness can be recorded only when the defined sample requirements are met. Required credentials/capabilities must be valid for the intended request when matching; a historic readiness event alone is not perpetual eligibility.

Use a small fixed onboarding template: requirements verified; preferences/availability confirmed; orientation complete; readiness reviewed. First-opportunity support is a subsequent work item, not a reason to fabricate completed work.

### 4. Explicit availability and preferences

`AvailabilityWindow`: id, reporterId, startAt/endAt, status (available / unavailable / unknown), serviceMarketIds or scope, attendanceModes, recordedAt, confirmationExpiresAt, source/actor. No matching based on parsing a notes string such as “flexible evenings.”

`ReporterPreferences`: structured attendance modes, supported proceedings/services, service-market/travel restrictions where recorded, and separate free-text notes. Missing preferences may cause “needs confirmation,” not a negative eligibility assertion.

For a possible match, a current explicitly available window must cover the full requested interval, including a declared demo buffer where relevant. Expired confirmation is unknown. Existing accepted commitments override overlapping availability. No real routing or inferred travel-time calculation is required.

### 5. Demand, commitments, and completed work

`DemandRequest`: id, marketId, createdAt/recordedAt, startAt/endAt, timeZone, proceedingType, attendanceMode, requiredCapabilityCodes, sampleCredentialRequirements, requirementsVersion, status (open / canceled / concluded), canceledAt/reason optional, agreedDeliveryAt optional. Grain: one reporter slot. Reporter assignment is not required for the record to exist.

`AssignmentEvent`: id, requestId, reporterId, state (proposed / offered / accepted / declined / canceled), occurredAt/recordedAt, actor/source, reason. The latest valid state at the selected time determines a commitment. Proposed or offered is not confirmed. Store sufficient history to see what changed.

`JobOutcome`: id, requestId, reporterId, acceptedAssignmentRef, outcome (completed / canceled / not-completed), startedAt optional, completedAt when completed, deliveryAt optional, recordedAt. No completed event may precede the request/acceptance it depends on or the end of its declared work interval in the fixed scenario.

One valid accepted reporter per slot; no overlapping accepted work for the same person. Offers may overlap, but the UI must show the conflict and cannot count both as confirmed. Validate both time overlap and capability/availability before accepting in the demo.

A reporter can appear as a *possible* candidate for several conflicting requests. That is a candidate list, not several units of usable capacity. Show shared-candidate contention; never present a sum of such options as guaranteed coverage.

### 6. Internal work and development

`TeamMember`: id, fictionalName, focusRole, activeFrom/activeTo optional. This is not a Reporter.

`WorkItem`: id, kind (source / screen / onboard / first-opportunity / re-engage / partner-task), primaryEntityRef, relatedRequestIds, programId optional, createdAt, ownerHistory, dueAt, statusHistory, blockerCode optional, completionEvidenceRefs. The case/queue view can create work through the shared command boundary; there is one underlying task collection.

`TeamTarget`: id, teamMemberId or role, metricId/version, target, reportingWindow, createdAt, rationale. Compare like roles and work units, not an undifferentiated activity count.

`WorkQualityCheck`: id, workItemId, checkedBy, checkedAt, requiredCheckResults, outcome. Quality metrics report the inspected sample and reasons, not an invented universal score.

`CoachingAction`: id, teamMemberId, linkedWorkItemIds, observedIssueOrStrength, expectedPractice, nextAction, dueAt, reviewAt, outcomeNote optional, author/timestamps. Include one positive practice-sharing example, not only problems.

### 7. Sources, programs, and samples

`Source`: id, label, kind (referral / outreach / event / other), description.

`SourceSpend`: id, sourceId, programId optional, cohortRef or bounded attributable period, amount, currency, occurredAt, allocationNote. No double-counting spend across multiple joined records. Keep costs as minor units or another exact representation selected at contract freeze.

`Program`: id, title, marketIds, linkedNeedRefs, type (source / tool / incentive / workflow / re-engagement), stage (idea / trying / reviewing / rolling-out / closed), ownerId, hypothesis, changeSummary, primaryMetricId/version, targetRef, startAt, reviewAt, measurementPlan, originWorkaroundRef optional, limitations.

`ProgramEnrollment`: id, programId, groupId, person/caseId, enteredAt, eligibilityEvidenceRefs, marketAtEntry, sourceAtEntry, processVersion optional. Membership is explicit and frozen at review; exclusions require reasons. Per-person outcome data come from lifecycle/job records. Summary counts in the v1 ImprovementSample are not source data for new claims.

`ProgramNote`: id, programId, author, text, createdAt. `PartnerTask` is a WorkItem linked to the program, with a real expected output and owner role. Demo notes are local, not live collaboration.

`ProgramDecision`: id, programId, decision (continue / change / stop / expand), rationale, decidedBy/At, evidenceSnapshotRef, nextReviewAt optional. Program stage and decision are distinct. Expansion is an explicit decision, never automatically granted because a rate is green.

### 8. Goals, process drafts, and audit

`GoalRevision`: id, goalId, version, metricId/version, scope, baselineAsOfAt, baselineEvidenceRef, target, deadline, ownerId, savedAt, changeReason, supersedesRevisionId optional. Goals can be linked to a market and program without being copied into separate inconsistent targets. Historical reports retain the version they evaluated.

`WorkaroundExample`: id, kind=`synthetic-spreadsheet`, purpose, columnDefinitions, a few fictional rows, relatedProblemRefs. This is an embedded illustrative artifact, not an external file connection.

`ProcessVersion`: id, programId, version, status (draft / review-ready / approved-for-limited-pilot), trigger, ownerId, requiredSteps, exceptions, approvalHistory, evidenceSnapshotRef, nextReviewAt. Creating it does not migrate every live case or change a frozen program cohort.

`CommandRecord`: id, expectedRevision, actorId, occurredAt, commandType, affectedRefs, result. Existing idempotency/revision protections must remain. Commands update the single repository through integration; features do not save separate copies of shared records.

## Evidence object shared by all views

Every key metric/signal returns a typed evidence bundle containing:
- id, metricId/definitionVersion, asOfAt, snapshotRevision;
- market basis, filters, explicit window and unit;
- numeric value and numerator/denominator where appropriate;
- distinct contributing record refs and join paths;
- numerator/denominator member refs for ratios;
- exclusions with reasons, unknown counts, limitations;
- plain-language rule/explanation built from the same calculation;
- allowed navigation target with the exact affected-record filter.

References must resolve to actual human-readable rows. IDs hidden in text are not an evidence experience. Headline, chart point, table total, and evidence must reconcile. Expected numbers in the scenario specification are tests, never runtime data injected into the UI.

## Field/command ownership for later parallel work

Capacity owns request classification and acceptance validation. Recruiting owns stage/screening/onboarding/readiness transitions. Network owns preferences and availability changes. Team owns tasks, target/quality/coaching calculations. Programs owns enrollment/decisions/process drafts. The coordinator owns shared goal revision commands, evidence primitives, clock/scenario application, and integration.

Cross-domain actions are composed at integration through explicit interfaces, not by importing a sibling feature or duplicating another domain's rule. Data owns fixtures and repository persistence, not business conclusions.

## Version-1 preservation

Do not infer detailed availability from old prose or invent program members from old summary counts. Preserve/export the v1 snapshot unchanged if persistent data exists. Prefer a separate v2 seed/storage version and an explicit start/reset notice over a misleading lossless migration. Never overwrite a user's data on page load.

The supplied v1 repository implementation is in-memory. Inspect the live checkout before assuming it still is. The migration decision must document actual storage and any user changes.
