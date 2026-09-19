import type { EvidenceBundle, EvidenceBundleId, MetricDefinitionRef, RecordPointer, ResolvedRecordReference, WorkItem, WorkspaceFilterPayload, WorkspaceQueryContext } from "../../contracts/v2";
import { label } from "./support";
const TEAM_WORKSPACE = "team" as const;
function workRef(work: WorkItem): ResolvedRecordReference { return { kind: "work-item", id: work.id, label: label(work), occurredAt: work.createdAt, joinPath: [work.primaryEntityRef] }; }
function filtersFor(base: WorkspaceFilterPayload, work: readonly WorkItem[]): WorkspaceFilterPayload {
  const refs: RecordPointer[] = work.map((item) => ({ kind: "work-item", id: item.id }));
  return { ...base, workItemIds: work.map((item) => item.id) as WorkspaceFilterPayload["workItemIds"], recordRefs: refs, matchNone: work.length === 0 };
}
export function countEvidence(id: string, metric: MetricDefinitionRef, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>, work: readonly WorkItem[], explanation: string): EvidenceBundle {
  const filters = filtersFor(context.filters, work);
  return { id: id as EvidenceBundleId, metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "tasks", scope: { workspace: TEAM_WORKSPACE, marketBasis: filters.marketBasis, selectedMarket: filters.selectedMarket, populationDescription: "Canonical work items." }, filters, reportingWindow: filters.window, computation: { status: "available", value: work.length, numerator: null, denominator: null }, contributingRecords: work.map(workRef), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0, limitations: [], explanation, navigationTarget: { workspace: TEAM_WORKSPACE, intent: "work-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric } } };
}
/** M11's frozen unit is tasks. The prepared quality view separately carries the explicit pass ratio. */
export function qualityEvidence(id: string, metric: MetricDefinitionRef, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>, samples: readonly { work: WorkItem; passed: boolean }[]): EvidenceBundle {
  const inspected = samples.map((sample) => sample.work);
  const passed = samples.filter((sample) => sample.passed).length;
  const evidence = countEvidence(id, metric, context, inspected, `Inspection sample size: ${inspected.length} distinct inspected work items, of which ${passed} passed the latest applicable required checks. This is the inspected denominator, not completed-work output. The prepared quality view lists the pass ratio, owner at inspection, reviewer and required-check reasons.`);
  return { ...evidence, scope: { ...evidence.scope, populationDescription: "Distinct inspected work items; inspection sample size, not completion output." }, limitations: ["Only inspected work appears in this sample; uninspected work is not treated as checked."] };
}
