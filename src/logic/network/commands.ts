import type { AvailabilityWindow, DemoSnapshotV2, MarketId, NetworkCommandEnvelope, ReporterId, TeamMemberId, UtcTimestamp, V2CommandMutation, WorkCreatePayload, WorkItemId, WorkspaceNavigationTarget } from "../../contracts/v2";
import { isUtcTimestamp } from "../shared/time";
import { before, exactFilters, latest, ms, ref, target } from "./support";

export interface ReengagementFollowUpInput {
  readonly reporterId: ReporterId;
  readonly marketId: MarketId;
  readonly asOfAt: UtcTimestamp;
  readonly ownerId: TeamMemberId | null;
  readonly dueAt: UtcTimestamp | null;
}
export type PreparedReengagementFollowUp =
  | { readonly kind: "existing"; readonly workItemId: WorkItemId; readonly navigationTarget: WorkspaceNavigationTarget }
  | { readonly kind: "create"; readonly payload: WorkCreatePayload };

export function openReengagementWork(snapshot: DemoSnapshotV2, reporterId: ReporterId, asOfAt: UtcTimestamp) {
  return snapshot.workItems.filter((work) => {
    if (work.kind !== "re-engage" || work.primaryEntityRef.kind !== "reporter" || work.primaryEntityRef.id !== reporterId || !before(work.createdAt, asOfAt)) return false;
    const status = latest(work.statusHistory.filter((event) => before(event.occurredAt, asOfAt)), (event) => event.occurredAt)?.status;
    return status === "open" || status === "in-progress" || status === "blocked";
  }).sort((a, b) => ms(a.createdAt) - ms(b.createdAt) || a.id.localeCompare(b.id))[0];
}

/** Resolves identity only; Team owns creation and integration owns the atomic repository save. */
export function prepareReengagementFollowUp(snapshot: DemoSnapshotV2, input: ReengagementFollowUpInput): PreparedReengagementFollowUp {
  const { reporterId, marketId, asOfAt, ownerId, dueAt } = input;
  const reporter = snapshot.reporters.find((item) => item.id === reporterId && before(item.createdAt, asOfAt) && before(item.recordedAt, asOfAt));
  if (!isUtcTimestamp(asOfAt) || ms(asOfAt) > ms(snapshot.currentAsOfAt) || !reporter || !snapshot.markets.some((market) => market.id === marketId)) throw new Error("Follow-up requires a known reporter, market and valid evaluation time.");
  const existing = openReengagementWork(snapshot, reporterId, asOfAt);
  if (existing) return { kind: "existing", workItemId: existing.id, navigationTarget: target(snapshot, asOfAt, { ...exactFilters(marketId), reporterIds: [reporterId], workItemIds: [existing.id], recordRefs: [ref("work-item", existing.id)] }, "team") };
  if (ms(asOfAt) !== ms(snapshot.currentAsOfAt)) throw new Error("Create follow-up at the current demo time.");
  if (ownerId !== null && !snapshot.teamMembers.some((member) => member.id === ownerId && before(member.activeFrom, asOfAt) && (member.activeTo === null || ms(member.activeTo) > ms(asOfAt)))) throw new Error("Choose an active owner or explicitly leave the work unassigned.");
  if (dueAt !== null && !isUtcTimestamp(dueAt)) throw new Error("Choose a valid due date or explicitly leave it unset.");
  return { kind: "create", payload: { title: `Re-engage ${reporter.fictionalName}`, ownerId, dueAt, status: "open", domain: "market", kind: "re-engage", programId: null, primaryEntityRef: ref("reporter", reporterId), relatedRequestIds: [] } };
}

/** Appends only the explicit simulation evidence; never confirms preferences or manufactures outcomes. */
export function prepareNetworkCommand(snapshot: DemoSnapshotV2, command: NetworkCommandEnvelope): V2CommandMutation {
  if (command.type !== "network.record-availability") throw new Error("Unsupported Network command.");
  const { context, payload } = command;
  const time = ms(context.occurredAt);
  const actor = snapshot.teamMembers.find((member) => member.actorId === context.actorId);
  if (!context.commandId.trim() || !isUtcTimestamp(context.occurredAt) || time !== ms(snapshot.currentAsOfAt) || !actor || !before(actor.activeFrom, context.occurredAt) || (actor.activeTo !== null && ms(actor.activeTo) <= time)) throw new Error("Availability needs an active actor and the current demo time.");
  if (!snapshot.reporters.some((item) => item.id === payload.reporterId && before(item.createdAt, context.occurredAt) && before(item.recordedAt, context.occurredAt))) throw new Error("Choose a known reporter.");
  if (!isUtcTimestamp(payload.startAt) || !isUtcTimestamp(payload.endAt) || ms(payload.endAt) <= ms(payload.startAt)) throw new Error("Availability needs explicit bounded UTC start and end times.");
  if (!["available", "unavailable", "unknown"].includes(payload.status)) throw new Error("Choose an explicit availability status.");
  if (!Array.isArray(payload.serviceMarketIds) || !payload.serviceMarketIds.length || new Set(payload.serviceMarketIds).size !== payload.serviceMarketIds.length || payload.serviceMarketIds.some((id) => !snapshot.markets.some((market) => market.id === id))) throw new Error("Choose explicit, known service markets.");
  if (!Array.isArray(payload.attendanceModes) || !payload.attendanceModes.length || new Set(payload.attendanceModes).size !== payload.attendanceModes.length || payload.attendanceModes.some((mode) => mode !== "remote" && mode !== "in-person")) throw new Error("Choose explicit attendance modes.");
  if (payload.confirmationExpiresAt !== null && (!isUtcTimestamp(payload.confirmationExpiresAt) || ms(payload.confirmationExpiresAt) <= time || ms(payload.confirmationExpiresAt) <= ms(payload.startAt))) throw new Error("Confirmation expiry must follow recording and the window start, or be explicitly unset.");
  const id = `availability-${context.commandId}` as AvailabilityWindow["id"];
  if (snapshot.availabilityWindows.some((window) => window.id === id)) throw new Error("Availability command identity already exists; replay through the repository transaction.");
  const record: AvailabilityWindow = { ...payload, serviceMarketIds: [...payload.serviceMarketIds], attendanceModes: [...payload.attendanceModes], id, recordedAt: context.occurredAt, actorId: context.actorId, source: "demo-simulation", provenance: "demo-simulation" };
  return { snapshot: { ...snapshot, availabilityWindows: [...snapshot.availabilityWindows, record] }, affectedRecords: [ref("availability-window", id), ref("reporter", payload.reporterId)], message: "Explicit demo availability recorded for the entered markets, modes and time window." };
}
