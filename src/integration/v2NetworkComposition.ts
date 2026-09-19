import type {
  DemoRepositoryV2, DemoSnapshotV2, MarketId, SelectedMarket, TeamCommandEnvelope,
  V2CommandContext, WorkItemId, WorkspaceNavigationTarget, WorkspaceQueryContext,
} from "../contracts/v2";
import { REPORTING_TIME_ZONE } from "../contracts/v2";
import { prepareReengagementFollowUp, type ReengagementFollowUpInput } from "../logic/network";
import { prepareTeamCommand, prepareTeamView } from "../logic/team";
import { commitV2Command } from "./v2CommandTransaction";

export type NetworkFollowUpPayload = Omit<ReengagementFollowUpInput, "asOfAt">;
export type NetworkFollowUpResult = {
  readonly ok: true;
  readonly value: DemoSnapshotV2;
  readonly changed: boolean;
  readonly workItemId: WorkItemId;
  readonly navigationTarget: WorkspaceNavigationTarget | null;
  readonly message: string;
} | { readonly ok: false; readonly message: string };

/** Opening existing operational work is a fresh Team view, not an unrelated inherited evidence filter. */
function exactWorkTarget(snapshot: DemoSnapshotV2, workItemId: WorkItemId, marketId: MarketId): WorkspaceNavigationTarget | null {
  const definition = snapshot.metricDefinitions.find((item) => item.id === "M11");
  if (!definition) return null;
  const prepare = (selectedMarket: SelectedMarket) => {
    const context: WorkspaceQueryContext<"team"> = {
      workspace: "team",
      evaluation: { asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision, reportingTimeZone: REPORTING_TIME_ZONE },
      filters: { selectedMarket, marketBasis: "all-markets", marketIds: selectedMarket === "ALL" ? [] : [selectedMarket],
        reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [workItemId], programIds: [], programEnrollmentIds: [],
        sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [{ kind: "work-item", id: workItemId }], window: null },
    };
    return prepareTeamView(snapshot, context, { id: definition.id, version: definition.version }).workDetails.find((item) => item.id === workItemId)?.navigationTarget ?? null;
  };
  // A reporter's historical job market may differ from the task's recorded relationships.
  return prepare(marketId) ?? prepare("ALL");
}

/** Invoke through the app queue. Network resolves identity; Team creates; one repository acknowledges. */
export async function commitNetworkFollowUp(
  repository: DemoRepositoryV2,
  context: V2CommandContext,
  payload: NetworkFollowUpPayload,
): Promise<NetworkFollowUpResult> {
  const loaded = await repository.load();
  if (!loaded.ok) return { ok: false, message: loaded.message };
  let followUp;
  try {
    followUp = prepareReengagementFollowUp(loaded.value, { ...payload, asOfAt: loaded.value.currentAsOfAt });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Follow-up could not be prepared." };
  }
  if (followUp.kind === "existing") return {
    ok: true, value: loaded.value, changed: false, workItemId: followUp.workItemId,
    navigationTarget: exactWorkTarget(loaded.value, followUp.workItemId, payload.marketId),
    message: "Opened the existing canonical re-engagement work; its owner and due date were preserved.",
  };
  const command: TeamCommandEnvelope = { type: "work.create", context, payload: followUp.payload };
  const result = await commitV2Command(repository, command, prepareTeamCommand);
  if (!result.ok) return { ok: false, message: result.message };
  const workItemId = result.affectedRecords.find((record) => record.kind === "work-item")!.id as WorkItemId;
  return {
    ok: true, value: result.value, changed: result.changed, workItemId,
    navigationTarget: exactWorkTarget(result.value, workItemId, payload.marketId),
    message: result.replayed ? result.message : "Created one canonical re-engagement work item with the entered owner and due date.",
  };
}
