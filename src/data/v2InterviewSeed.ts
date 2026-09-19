import type { CoachingAction, ProcessVersion, RecordPointer, UtcTimestamp, WorkItem, WorkQualityCheck } from "../contracts/v2";

const id = (value: string) => value as never;
const at = (value: string) => value as UtcTimestamp;
const provenance = "synthetic-demo" as const;
const createdAt = at("2026-02-12T18:00:00Z");
const reviewedAt = at("2026-02-15T15:00:00Z");
const reporter = (value: string): RecordPointer => ({ kind: "reporter", id: value });
const program = (value: string): RecordPointer => ({ kind: "program", id: value });

type SeedWork = Pick<WorkItem, "title" | "kind" | "primaryEntityRef" | "priority"> & {
  key: string;
  owner: string | null;
  due: string | null;
  status?: "in-progress" | "blocked" | "completed";
  blocker?: string;
  requests?: readonly string[];
  program?: string;
  evidence?: readonly RecordPointer[];
  note: string;
};

// A bounded work amendment. Every identity below already exists; no cohorts are expanded.
const work: readonly SeedWork[] = [
  { key: "lax-confirm-107", title: "Confirm Keira Holt for the February 26 realtime slot", kind: "first-opportunity", primaryEntityRef: reporter("person-lax-007"), owner: "team-3", due: "2026-02-18T17:00:00Z", priority: "high", status: "in-progress", requests: ["req-lax-107"], note: "Check the full scheduled interval with Keira before recording any acceptance. A possible match is not a commitment." },
  { key: "lax-confirm-108", title: "Confirm Micah Vale for the second February 26 slot", kind: "first-opportunity", primaryEntityRef: reporter("person-lax-008"), owner: "team-3", due: "2026-02-19T17:00:00Z", priority: "high", requests: ["req-lax-108"], note: "Use the request's exact start and end time; leave the assignment unconfirmed until a separate acceptance arrives." },
  { key: "lax-marketing-brief", title: "Marketing: prepare the realtime referral eligibility brief", kind: "partner-task", primaryEntityRef: program("program-lax-realtime-referrals"), owner: null, due: "2026-02-17T17:00:00Z", priority: "high", program: "program-lax-realtime-referrals", requests: ["req-lax-110"], note: "Deliver a draft describing the required capability, service window and referral intake questions. Maya will review it; nothing is sent externally." },
  { key: "lax-screen-review", title: "Review the open realtime screening case", kind: "screen", primaryEntityRef: reporter("person-p4-lax-02"), owner: "team-1", due: "2026-02-15T17:00:00Z", priority: "high", status: "in-progress", note: "Inspect the recorded screening evidence and confirm the next owner before progressing this case." },
  { key: "lax-screening-evidence", title: "Resolve the missing screening capability evidence", kind: "screen", primaryEntityRef: reporter("person-p4-lax-05"), owner: "team-1", due: "2026-02-14T17:00:00Z", priority: "urgent", status: "blocked", blocker: "p4-capability", note: "The screening review explicitly needs capability information. Ask the reviewer to attach the source record before recording qualification." },
  { key: "lax-first-opportunity", title: "Review a first opportunity with the newly ready reporter", kind: "first-opportunity", primaryEntityRef: reporter("person-p4-lax-06"), owner: "team-3", due: "2026-02-20T17:00:00Z", priority: "normal", note: "Readiness is recorded. Discuss a suitable first opportunity after confirming current availability; no first job has been observed." },
  { key: "sfo-availability", title: "Confirm Sofia Lane's in-person availability", kind: "re-engage", primaryEntityRef: reporter("person-sfo-availability-01"), owner: "team-3", due: "2026-02-17T18:00:00Z", priority: "high", status: "blocked", blocker: "availability-unknown", requests: ["req-sfo-in-person-201"], note: "The current window is explicitly unknown. Confirm the full in-person interval before considering this request covered." },
  { key: "sfo-credential", title: "Request the missing California credential evidence", kind: "onboard", primaryEntityRef: reporter("person-p4-sfo-10"), owner: null, due: null, priority: "normal", note: "Do not infer verification from previous work. An owner must inspect the missing evidence and set a due date." },
  { key: "checklist-data-review", title: "Data: inspect the checklist cohort membership and horizon", kind: "partner-task", primaryEntityRef: program("program-readiness-checklist"), owner: "team-2", due: "2026-02-15T17:00:00Z", priority: "high", status: "completed", program: "program-readiness-checklist", evidence: [{ kind: "program-enrollment", id: "enrollment-checklist-pilot-sfo-01" }], note: "Inspected the SFO pilot member's entry and linked first job under the same 14-day horizon. Preserve frozen membership and distinguish descriptive results from causal impact." },
  { key: "dfw-targeted-intake", title: "Review the targeted alternative for the DFW applicant", kind: "source", primaryEntityRef: reporter("person-p4-dfw-01"), owner: "team-1", due: "2026-02-20T18:00:00Z", priority: "normal", note: "Assess the applicant's stated interests using the existing community-event attribution; do not add them to the stopped outreach cohort." },
  { key: "dfw-qualified-sample", title: "Inspect the qualified broad-outreach case", kind: "screen", primaryEntityRef: reporter("person-dfw-outreach-01"), owner: "team-1", due: "2026-02-15T17:00:00Z", priority: "normal", status: "completed", program: "program-dfw-broad-outreach", evidence: [{ kind: "lifecycle-event", id: "life-person-dfw-outreach-01-qualified" }], note: "Confirmed the qualified lifecycle record for this inspected case. This review does not alter the stopped program or imply that every case was inspected." },
  { key: "dfw-stop-archive", title: "Document the stopped outreach decision and reuse limits", kind: "partner-task", primaryEntityRef: program("program-dfw-broad-outreach"), owner: "team-2", due: "2026-02-18T18:00:00Z", priority: "low", status: "in-progress", program: "program-dfw-broad-outreach", note: "Prepare an internal summary of the completed window, source spend and stop rationale. The conclusion applies to this synthetic cohort, not all broad outreach." },
  { key: "ord-product-handoff", title: "Product/Ops: draft an exception handoff for missing steps", kind: "partner-task", primaryEntityRef: { kind: "market", id: "ORD" }, owner: "team-2", due: "2026-02-19T18:00:00Z", priority: "high", status: "in-progress", program: "program-readiness-checklist", note: "Deliver a proposed owner-and-evidence handoff for the repeated ORD blocker. Review against the checklist draft; adoption requires a separate decision." },
  { key: "ord-screen-owner", title: "Assign the open Chicago screening review", kind: "screen", primaryEntityRef: reporter("person-p4-ord-02"), owner: null, due: "2026-02-17T18:00:00Z", priority: "normal", note: "Select a screening owner and inspect the recorded case before changing its lifecycle." },
  { key: "ord-coaching-followthrough", title: "Review Maya's next missing-step handoff", kind: "onboard", primaryEntityRef: reporter("person-ord-blocked-1"), owner: "team-1", due: "2026-02-18T18:00:00Z", priority: "high", note: "Apply the coaching action: identify the evidence owner, required record and next review time. Keep the case blocked until the evidence arrives." },
  { key: "atl-reengage-owner", title: "Assign a current-availability check for the returning reporter", kind: "re-engage", primaryEntityRef: reporter("person-p4-atl-09"), owner: null, due: "2026-02-20T17:00:00Z", priority: "low", note: "Older completed work is not evidence of current availability or churn. Start with a confirmation request after assigning an owner." },
  { key: "atl-history-sample", title: "Inspect Nell Harper's last completed assignment", kind: "re-engage", primaryEntityRef: reporter("person-atl-returning-1"), owner: "team-3", due: "2026-02-15T17:00:00Z", priority: "normal", status: "completed", evidence: [{ kind: "job-outcome", id: "job-atl-historic-1" }], note: "Inspected the accepted assignment and completed job. The old availability confirmation remains expired and needs separate follow-up." },
  { key: "atl-availability-guide", title: "Draft a guide for expired availability confirmations", kind: "partner-task", primaryEntityRef: { kind: "market", id: "ATL" }, owner: "team-3", due: "2026-02-23T17:00:00Z", priority: "normal", status: "in-progress", note: "Document the distinction between expired confirmation, explicit unavailability and no recent work. Use Nell's inspected history as a worked example." },
];

export const interviewWorkItems: readonly WorkItem[] = work.map((item) => ({
  id: id(`work-interview-${item.key}`), title: item.title, kind: item.kind, primaryEntityRef: item.primaryEntityRef, priority: item.priority,
  relatedRequestIds: (item.requests ?? []).map(id), programId: item.program ? id(item.program) : null, createdAt,
  ownerHistory: [...(item.key === "ord-product-handoff" ? [{ ownerId: id("team-1"), occurredAt: createdAt, actorId: id("actor-team-1"), reason: "Record the recurring handoff issue for ownership review." }] : []), { ownerId: item.owner ? id(item.owner) : null, occurredAt: item.key === "ord-product-handoff" ? reviewedAt : createdAt, actorId: id("actor-team-1"), reason: item.owner ? "Assign the defined synthetic review or deliverable." : "Leave ownership explicitly unassigned for the manager's review." }],
  dueAt: item.due ? at(item.due) : null,
  statusHistory: [{ status: "open", occurredAt: createdAt, actorId: id("actor-team-1"), reason: "Open the linked synthetic work." }, ...(item.status ? [{ status: item.status, occurredAt: reviewedAt, actorId: id(`actor-${item.owner ?? "team-1"}`), reason: item.status === "completed" ? "Inspected the linked source evidence and recorded the review." : item.status === "blocked" ? "Required confirmation or evidence remains missing." : "The assigned owner has begun the review." }] : [])],
  blockerCode: item.blocker ?? null, completionEvidenceRefs: item.evidence ?? [],
  notes: [{ commandId: id(`seed-note-${item.key}`), actorId: id(`actor-${item.owner ?? "team-1"}`), occurredAt: reviewedAt, text: item.note }],
  ...(item.key === "lax-screen-review" ? { editHistory: [{ commandId: id("seed-edit-lax-screen-review"), actorId: id("actor-team-1"), occurredAt: reviewedAt, reason: "Bring the evidence review forward before the next handoff.", previous: { priority: "normal" as const, dueAt: at("2026-02-17T17:00:00Z") }, changes: { priority: "high" as const, dueAt: at("2026-02-15T17:00:00Z") } }] } : {}),
  provenance,
}));

export const interviewQualityChecks: readonly WorkQualityCheck[] = [
  { id: id("quality-interview-checklist"), workItemId: id("work-interview-checklist-data-review"), checkedBy: id("team-1"), checkedAt: at("2026-02-15T16:00:00Z"), requiredCheckResults: [{ checkCode: "member-and-horizon", passed: true, reason: "The inspected SFO member retains explicit entry and outcome references." }, { checkCode: "descriptive-limit", passed: true, reason: "The note avoids causal attribution." }], outcome: "passed", provenance },
  { id: id("quality-interview-ord-handoff"), workItemId: id("work-ord-required-step-1"), checkedBy: id("team-2"), checkedAt: at("2026-02-15T16:00:00Z"), requiredCheckResults: [{ checkCode: "evidence-owner", passed: false, reason: "The blocked work names the missing step but not who will supply the evidence." }], outcome: "needs-follow-up", provenance },
  { id: id("quality-interview-atl-history"), workItemId: id("work-interview-atl-history-sample"), checkedBy: id("team-2"), checkedAt: at("2026-02-15T16:00:00Z"), requiredCheckResults: [{ checkCode: "work-versus-availability", passed: true, reason: "Completed work and expired availability are reviewed as separate facts." }], outcome: "passed", provenance },
];

export const interviewCoaching: readonly CoachingAction[] = [
  { id: id("coaching-interview-ord-handoff"), teamMemberId: id("team-1"), linkedWorkItemIds: [id("work-ord-required-step-1"), id("work-interview-ord-coaching-followthrough")], observedIssueOrStrength: "The inspected blocked handoff lacks a named evidence supplier.", expectedPractice: "Name the supplier, required record and next review time in each handoff.", nextAction: "Use the practice on the next ORD missing-step review and ask Eli to inspect it.", dueAt: at("2026-02-18T18:00:00Z"), reviewAt: at("2026-02-19T18:00:00Z"), outcomeNote: null, authorId: id("actor-team-2"), createdAt: at("2026-02-15T16:30:00Z"), updatedAt: at("2026-02-15T16:30:00Z"), provenance },
  { id: id("coaching-interview-availability-practice"), teamMemberId: id("team-3"), linkedWorkItemIds: [id("work-interview-atl-history-sample"), id("work-interview-atl-availability-guide")], observedIssueOrStrength: "The inspected review clearly distinguishes work history from current availability.", expectedPractice: "Retain both dates and explain unknown availability without inferring churn.", nextAction: "Prepare the worked example for the team's next review.", dueAt: at("2026-02-23T17:00:00Z"), reviewAt: at("2026-02-24T17:00:00Z"), outcomeNote: null, authorId: id("actor-team-2"), createdAt: at("2026-02-15T16:30:00Z"), updatedAt: at("2026-02-15T16:30:00Z"), provenance },
];

export const interviewProcess: ProcessVersion = {
  id: id("process-checklist-v2"), programId: id("program-readiness-checklist"), version: 2, status: "draft", trigger: "A first-time case reaches onboarding; propose explicit ownership for a future limited pilot.", ownerId: id("team-2"),
  requiredSteps: [
    { id: "scope", order: 1, instruction: "Confirm the proceeding, market and capability requirements.", evidenceRequirement: "Linked acquisition case and applicable demand requirements.", responsibleRole: "Recruiting operations", slaElapsedHours: 24, exceptionRoute: "Record unknown requirements and assign an owner before progressing." },
    { id: "verification", order: 2, instruction: "Inspect the required capability and credential evidence.", evidenceRequirement: "Dated verification records and required onboarding steps.", responsibleRole: "Recruiting operations", slaElapsedHours: 48, exceptionRoute: "Keep the missing step blocked and name the evidence supplier in linked Team work." },
    { id: "availability", order: 3, instruction: "Confirm the reporter's service scope and full availability window.", evidenceRequirement: "Explicit dated availability window; readiness alone is insufficient.", responsibleRole: "Network operations", slaElapsedHours: 24, exceptionRoute: "Leave availability unknown and create a confirmation item when the window is missing or expired." },
    { id: "review", order: 4, instruction: "Inspect readiness evidence and schedule the first-opportunity review.", evidenceRequirement: "Required-step evidence, separate readiness record and linked Team review.", responsibleRole: "Program operations", slaElapsedHours: 24, exceptionRoute: "Escalate incomplete evidence to the accountable owner; do not infer an acceptance or completed job." },
  ],
  exceptions: ["Missing evidence stays explicitly unknown or blocked.", "Drafting this version does not enroll reporters or change the historical pilot."],
  approvalHistory: [{ status: "draft", actorId: id("actor-team-2"), occurredAt: at("2026-02-16T16:00:00Z"), rationale: "Propose owned evidence handoffs for review after the completed synthetic comparison." }],
  evidenceSnapshotId: id("evidence-checklist-pilot"), nextReviewAt: at("2026-02-23T17:00:00Z"), definitionVersion: id("v2-draft"), provenance,
};
