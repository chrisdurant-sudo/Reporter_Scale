import type { DemoSnapshotV2, MarketId, RecordPointer, ResolvedRecordReference, UtcTimestamp, WorkItem, WorkItemKind, WorkOwnershipDomain, WorkspaceFilterPayload } from "../../contracts/v2";

import { projectWorkItemAt } from "../shared/work";

export const ms = (value: string) => Date.parse(value);
export const before = (value: string, at: string) => ms(value) <= ms(at);
export const ref = (kind: RecordPointer["kind"], id: string): RecordPointer => ({ kind, id });
export const key = (pointer: RecordPointer) => `${pointer.kind}:${pointer.id}`;
export const latest = <T>(items: readonly T[], time: (item: T) => string, at: string): T | null => items.reduce<T | null>((found, item) => before(time(item), at) && (!found || ms(time(item)) >= ms(time(found))) ? item : found, null);
export const ownerAt = (work: WorkItem, at: string) => latest(work.ownerHistory, (event) => event.occurredAt, at)?.ownerId ?? null;
export const statusAt = (work: WorkItem, at: string) => latest(work.statusHistory, (event) => event.occurredAt, at)?.status ?? null;
export const open = (work: WorkItem, at: string) => ["open", "in-progress", "blocked"].includes(statusAt(work, at) ?? "");
export const label = (work: WorkItem) => work.title?.trim() || `${work.kind.replaceAll("-", " ")} work`;
export const ownershipDomain = (kind: WorkItemKind): WorkOwnershipDomain => kind === "source" ? "sourcing" : kind === "screen" ? "screening" : kind === "onboard" ? "onboarding" : kind === "partner-task" ? "program" : "market";
export const inWindow = (value: string, window: WorkspaceFilterPayload["window"]) => window !== null && ms(value) >= ms(window.startAt) && ms(value) < ms(window.endAt);
export function completion(work: WorkItem) {
  const events = work.statusHistory.map((event, index) => ({ ...event, eventId: `${work.id}:statusHistory:${index}`, historyIndex: index }));
  return events.filter((event) => event.status === "completed").sort((a, b) => ms(a.occurredAt) - ms(b.occurredAt) || a.historyIndex - b.historyIndex)[0] ?? null;
}
export function lastOpenStatus(work: WorkItem, at: string): "open" | "in-progress" {
  return latest(work.statusHistory.filter((event) => event.status === "open" || event.status === "in-progress"), (event) => event.occurredAt, at)?.status === "in-progress" ? "in-progress" : "open";
}

export interface TeamRecordOption extends ResolvedRecordReference { readonly marketIds: readonly MarketId[] }
interface RecordNode extends TeamRecordOption { readonly parents: readonly RecordPointer[] }
/** Canonical relationship index for Team links, choices and completion validation; no metric calculation. */
export function recordIndex(snapshot: DemoSnapshotV2, at: string): Map<string, RecordNode> {
  const index = new Map<string, RecordNode>();
  const add = (kind: RecordPointer["kind"], id: string, title: string, times: readonly (string | null | undefined)[], parents: readonly RecordPointer[] = [], markets: readonly MarketId[] = []) => {
    const dated = times.filter((value): value is string => !!value);
    if (dated.some((value) => !before(value, at))) return;
    index.set(key(ref(kind, id)), { kind, id, label: title, occurredAt: (dated.sort((a, b) => ms(b) - ms(a))[0] ?? null) as UtcTimestamp | null, joinPath: parents, parents, marketIds: markets });
  };
  for (const x of snapshot.markets ?? []) add("market", x.id, x.id, [], [], [x.id]);
  for (const x of snapshot.reporters ?? []) add("reporter", x.id, x.fictionalName, [x.createdAt, x.recordedAt], [], [...new Set([x.recruitingMarketId, ...x.serviceMarketIds])]);
  for (const x of snapshot.sources ?? []) add("source", x.id, x.label, []);
  for (const x of snapshot.teamMembers ?? []) add("team-member", x.id, x.fictionalName, [x.activeFrom]);
  for (const x of snapshot.demandRequests ?? []) add("demand-request", x.id, `${x.marketId} request ${x.id}`, [x.createdAt, x.recordedAt], [], [x.marketId]);
  for (const x of snapshot.programs ?? []) add("program", x.id, x.title, [x.startAt], [], x.marketIds ?? []);
  for (const x of snapshot.acquisitionCases ?? []) add("acquisition-case", x.id, `Acquisition case ${x.id}`, [x.openedAt, x.recordedAt], [ref("reporter", x.reporterId), ...(x.primarySourceId ? [ref("source", x.primarySourceId)] : [])], [x.ownerMarketId]);
  for (const x of snapshot.programEnrollments ?? []) add("program-enrollment", x.id, `Enrollment ${x.groupId}: ${x.id}`, [x.enteredAt], [ref("program", x.programId), ref("reporter", x.reporterId), ...(x.acquisitionCaseId ? [ref("acquisition-case", x.acquisitionCaseId)] : []), ...(x.sourceAtEntry ? [ref("source", x.sourceAtEntry)] : [])], [x.marketAtEntry]);
  for (const x of snapshot.lifecycleEvents ?? []) add("lifecycle-event", x.id, x.eventType, [x.occurredAt, x.recordedAt], [ref("reporter", x.reporterId), ref("acquisition-case", x.acquisitionCaseId), ...(x.linkedWorkItemId ? [ref("work-item", x.linkedWorkItemId)] : [])], [x.marketAtEntry]);
  for (const x of snapshot.credentialRecords ?? []) add("credential-record", x.id, x.label, [x.recordedAt], [ref("reporter", x.reporterId)]);
  for (const x of snapshot.capabilityVerifications ?? []) add("capability-verification", x.id, `${x.capabilityCode}: ${x.status}`, [x.recordedAt], [ref("reporter", x.reporterId)]);
  for (const x of snapshot.screeningReviews ?? []) add("screening-review", x.id, `Screening: ${x.outcome}`, [x.reviewedAt, x.recordedAt], [ref("reporter", x.reporterId), ref("acquisition-case", x.acquisitionCaseId)]);
  for (const x of snapshot.onboardingSteps ?? []) add("onboarding-step", x.id, `${x.stepDefinitionId}: ${x.state}`, [x.recordedAt, x.completedAt], [ref("acquisition-case", x.acquisitionCaseId)]);
  for (const x of snapshot.readinessEvents ?? []) add("readiness-event", x.id, `Readiness ${x.id}`, [x.occurredAt, x.recordedAt], [ref("reporter", x.reporterId), ref("acquisition-case", x.acquisitionCaseId)]);
  for (const x of snapshot.availabilityWindows ?? []) add("availability-window", x.id, `Availability: ${x.status}`, [x.recordedAt], [ref("reporter", x.reporterId)], x.serviceMarketIds);
  for (const x of snapshot.assignmentEvents ?? []) add("assignment-event", x.id, `Assignment: ${x.state}`, [x.occurredAt, x.recordedAt], [ref("reporter", x.reporterId), ref("demand-request", x.requestId)]);
  for (const x of snapshot.jobOutcomes ?? []) add("job-outcome", x.id, `Job: ${x.outcome}`, [x.recordedAt, x.completedAt], [ref("reporter", x.reporterId), ref("demand-request", x.requestId), ref("assignment-event", x.acceptedAssignmentEventId)]);
  for (const x of snapshot.workItems ?? []) add("work-item", x.id, label(projectWorkItemAt(x, at as UtcTimestamp)), [x.createdAt], [x.primaryEntityRef, ...x.relatedRequestIds.map((id) => ref("demand-request", id)), ...(x.programId ? [ref("program", x.programId)] : [])]);
  for (const x of snapshot.teamTargets ?? []) add("team-target", x.id, `Target: ${x.target}`, [x.createdAt]);
  for (const x of snapshot.workQualityChecks ?? []) add("work-quality-check", x.id, `Inspection: ${x.outcome}`, [x.checkedAt], [ref("work-item", x.workItemId)]);
  for (const x of snapshot.coachingActions ?? []) add("coaching-action", x.id, x.observedIssueOrStrength, [x.createdAt], x.linkedWorkItemIds.map((id) => ref("work-item", id)));
  for (const x of snapshot.sourceSpend ?? []) add("source-spend", x.id, `Source spend ${x.amountMinor} ${x.currency}`, [x.occurredAt], [ref("source", x.sourceId), ...(x.programId ? [ref("program", x.programId)] : [])]);
  for (const x of snapshot.goalRevisions ?? []) add("goal-revision", x.id, `Goal revision ${x.version}: ${x.target}`, [x.savedAt], x.scope.programIds.map((id) => ref("program", id)), x.scope.marketIds);
  for (const x of snapshot.workaroundExamples ?? []) add("workaround-example", x.id, x.purpose, [], x.relatedProblemRefs);
  for (const x of snapshot.commandRecords ?? []) add("command-record", x.id, x.commandType, [x.occurredAt], x.affectedRecords);
  for (const x of snapshot.programNotes ?? []) add("program-note", x.id, x.text, [x.createdAt], [ref("program", x.programId)]);
  for (const x of snapshot.programDecisions ?? []) add("program-decision", x.id, x.rationale, [x.decidedAt], [ref("program", x.programId)]);
  for (const x of snapshot.processVersions ?? []) add("process-version", x.id, `Process version ${x.version}`, x.approvalHistory.map((event) => event.occurredAt), [ref("program", x.programId)]);
  return index;
}
function ancestors(index: Map<string, RecordNode>, refs: readonly RecordPointer[]): RecordNode[] {
  const seen = new Set<string>(); const found: RecordNode[] = [];
  const visit = (pointer: RecordPointer) => { const id = key(pointer); if (seen.has(id)) return; seen.add(id); const node = index.get(id); if (node) { found.push(node); node.parents.forEach(visit); } };
  refs.forEach(visit); return found;
}
export function workLinks(work: WorkItem, snapshot: DemoSnapshotV2, at: string, index = recordIndex(snapshot, at)): readonly TeamRecordOption[] {
  const roots = [ref("work-item", work.id), work.primaryEntityRef, ...work.relatedRequestIds.map((id) => ref("demand-request", id)), ...(work.programId ? [ref("program", work.programId)] : [])];
  const direct = ancestors(index, roots);
  const reporterIds = work.primaryEntityRef.kind === "reporter" ? [work.primaryEntityRef.id] : [];
  const programIds = work.primaryEntityRef.kind === "program" ? [work.primaryEntityRef.id] : [];
  const related = [...index.values()].filter((node) => (node.kind === "acquisition-case" && node.parents.some((p) => p.kind === "reporter" && reporterIds.includes(p.id))) || (node.kind === "program-enrollment" && node.parents.some((p) => (p.kind === "reporter" && reporterIds.includes(p.id)) || (p.kind === "program" && programIds.includes(p.id)))));
  const identities = new Set([...direct, ...related].map(key));
  const events = [...index.values()].filter((node) => ["lifecycle-event", "credential-record", "capability-verification", "screening-review", "onboarding-step", "readiness-event", "availability-window", "assignment-event", "job-outcome", "work-quality-check", "coaching-action"].includes(node.kind) && node.parents.some((parent) => parent.kind === "work-item" && parent.id === work.id || parent.kind !== "reporter" && identities.has(key(parent)) || parent.kind === "reporter" && reporterIds.includes(parent.id)));
  return [...new Map([...ancestors(index, [...roots, ...related]), ...events].map((node) => [key(node), node])).values()];
}
export function workMarkets(work: WorkItem, snapshot: DemoSnapshotV2, at: string, index = recordIndex(snapshot, at)): readonly MarketId[] {
  // Case/enrollment markets are entry facts: do not widen them to the reporter's other service markets.
  const marketsFor = (pointer: RecordPointer, seen = new Set<string>()): readonly MarketId[] => {
    if (seen.has(key(pointer))) return []; seen.add(key(pointer));
    const node = index.get(key(pointer)); if (!node) return [];
    if (node.marketIds.length || ["reporter", "acquisition-case", "program-enrollment", "program", "market", "demand-request", "team-member"].includes(node.kind)) return node.marketIds;
    return node.parents.flatMap((parent) => marketsFor(parent, seen));
  };
  return [...new Set([work.primaryEntityRef, ...work.relatedRequestIds.map((id) => ref("demand-request", id)), ...(work.programId ? [ref("program", work.programId)] : [])].flatMap((pointer) => marketsFor(pointer)))];
}
export function completionChoices(work: WorkItem, snapshot: DemoSnapshotV2, at: string, index = recordIndex(snapshot, at)): readonly TeamRecordOption[] {
  const roots = [work.primaryEntityRef, ...work.relatedRequestIds.map((id) => ref("demand-request", id)), ...(work.programId ? [ref("program", work.programId)] : [])];
  const related = new Set(roots.filter((pointer) => !["market", "source", "team-member", "work-item"].includes(pointer.kind)).map(key));
  related.add(key(work.primaryEntityRef));
  return [...index.values()].filter((node) => node.kind !== "work-item" && node.kind !== "team-target" && node.kind !== "coaching-action" && (ancestors(index, [node]).some((parent) => related.has(key(parent))) || node.parents.some((parent) => parent.kind === "work-item" && parent.id === work.id)));
}
export function matchesWork(work: WorkItem, snapshot: DemoSnapshotV2, filters: WorkspaceFilterPayload, at: string, index = recordIndex(snapshot, at)): boolean {
  if (filters.matchNone) return false;
  const markets = workMarkets(work, snapshot, at, index);
  if (filters.selectedMarket !== "ALL" && !markets.includes(filters.selectedMarket)) return false;
  if (filters.marketIds.length && !filters.marketIds.some((id) => markets.includes(id))) return false;
  const links = new Set(workLinks(work, snapshot, at, index).map(key));
  links.add(key(ref("work-item", work.id)));
  const groups: readonly [RecordPointer["kind"], readonly string[]][] = [["reporter", filters.reporterIds], ["acquisition-case", filters.acquisitionCaseIds], ["demand-request", filters.requestIds], ["program", filters.programIds], ["program-enrollment", filters.programEnrollmentIds], ["source", filters.sourceIds], ["job-outcome", filters.jobOutcomeIds]];
  if (filters.workItemIds.length && !filters.workItemIds.includes(work.id)) return false;
  if (groups.some(([kind, ids]) => ids.length && !ids.some((id) => links.has(key(ref(kind, id)))))) return false;
  if (filters.recordRefs.length && !filters.recordRefs.some((pointer) => pointer.kind === "work-item" ? pointer.id === work.id : links.has(key(pointer)))) return false;
  const requests = (snapshot.demandRequests ?? []).filter((request) => links.has(key(ref("demand-request", request.id))));
  if (filters.attendanceModes.length && !requests.some((request) => filters.attendanceModes.includes(request.attendanceMode))) return false;
  if (filters.capabilityCodes.length && !requests.some((request) => filters.capabilityCodes.every((code) => request.requiredCapabilityCodes.includes(code)))) return false;
  return true;
}
