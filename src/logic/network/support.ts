import type { DemoSnapshotV2, MarketId, RecordPointer, SelectedMarket, UtcTimestamp, WorkspaceFilterPayload, WorkspaceNavigationTarget } from "../../contracts/v2";

export const ms = (at: string) => Date.parse(at);
export const before = (at: string, asOf: string) => ms(at) <= ms(asOf);
export const known = (item: { occurredAt: UtcTimestamp; recordedAt: UtcTimestamp }, asOf: UtcTimestamp) => before(item.occurredAt, asOf) && before(item.recordedAt, asOf);
export const ref = (kind: RecordPointer["kind"], id: string): RecordPointer => ({ kind, id });
export const includes = <T>(values: readonly T[], value: T) => !values.length || values.includes(value);
export const inWindow = (at: UtcTimestamp, window: NonNullable<WorkspaceFilterPayload["window"]>) => ms(at) >= ms(window.startAt) && ms(at) < ms(window.endAt);
/** Histories are append ordered when event times tie. Never sort IDs to infer chronology. */
export function latest<T>(items: readonly T[], time: (item: T) => string): T | undefined {
  return items.reduce<T | undefined>((prior, item) => !prior || ms(time(item)) >= ms(time(prior)) ? item : prior, undefined);
}
export function exactFilters(selectedMarket: SelectedMarket, marketBasis: WorkspaceFilterPayload["marketBasis"] = "service-market"): WorkspaceFilterPayload {
  return { selectedMarket, marketBasis, marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null };
}
export function target(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, filters: WorkspaceFilterPayload, workspace: WorkspaceNavigationTarget["workspace"] = "reporters", intent: WorkspaceNavigationTarget["intent"] = "record-detail"): WorkspaceNavigationTarget {
  const metric = snapshot.metricDefinitions.find((item) => String(item.id) === "M10");
  if (!metric) throw new Error("Network view requires the frozen M10 metric definition.");
  return { workspace, intent, filters, evidenceContext: { asOfAt, snapshotRevision: snapshot.revision, metric: { id: metric.id, version: metric.version } } };
}
export const marketMatches = (market: MarketId, filters: WorkspaceFilterPayload) => (filters.selectedMarket === "ALL" || filters.selectedMarket === market) && includes(filters.marketIds, market);
