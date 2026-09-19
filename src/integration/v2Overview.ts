import type { DemoSnapshotV2, WorkspaceQueryContext } from "../contracts/v2";
import { DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW } from "../data/v2";
import { prepareMarketsWorkspace } from "../logic/capacity";

// Freeze the original LAX plan population from baseline source records. Browsing
// a market still includes later requests; plan delivery keeps its original set.
const originalLaxRequestIds = DEMO_SNAPSHOT_V2.demandRequests.filter((request) =>
  request.marketId === "LAX" && request.status !== "canceled"
  && Date.parse(request.startAt) >= Date.parse(V2_MAIN_REQUEST_WINDOW.startAt)
  && Date.parse(request.startAt) < Date.parse(V2_MAIN_REQUEST_WINDOW.endAt),
).map((request) => request.id);

export function prepareInterviewOverview(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<"markets">): ReturnType<typeof prepareMarketsWorkspace> {
  const view = prepareMarketsWorkspace(snapshot, context);
  if (context.filters.matchNone || context.filters.requestIds.length || context.filters.recordRefs.length
    || (context.filters.selectedMarket !== "ALL" && context.filters.selectedMarket !== "LAX")
    || (context.filters.marketIds.length && !context.filters.marketIds.includes("LAX"))) return view;
  const plan = prepareMarketsWorkspace(snapshot, { ...context, filters: {
    ...context.filters, selectedMarket: "LAX", marketIds: ["LAX"], requestIds: originalLaxRequestIds,
    recordRefs: originalLaxRequestIds.map((id) => ({ kind: "demand-request", id })), window: V2_MAIN_REQUEST_WINDOW,
  } }).originalPlan;
  return { ...view, originalPlan: plan, evidence: [...view.evidence, ...plan.evidence],
    limitations: [...view.limitations, "Original-plan delivery follows the LAX baseline request set; current scheduling coverage includes every matching current request."] };
}
