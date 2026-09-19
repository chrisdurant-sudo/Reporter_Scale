import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, WorkspaceQueryContext } from "../contracts/v2";
import { REPORTING_TIME_ZONE } from "../contracts/v2";
import { applyScenarioCheckpoint, DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW } from "../data/v2";
import { prepareInterviewOverview } from "./v2Overview";

const query = (snapshot: DemoSnapshotV2): WorkspaceQueryContext<"markets"> => ({
  workspace: "markets", evaluation: { asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision, reportingTimeZone: REPORTING_TIME_ZONE },
  filters: { selectedMarket: "LAX", marketBasis: "demand-market", marketIds: ["LAX"], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [],
    programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: V2_MAIN_REQUEST_WINDOW },
});

describe("Overview integration populations", () => {
  it("keeps the frozen plan separate from additional current requests and delivered outcomes", () => {
    const source = DEMO_SNAPSHOT_V2.demandRequests.find((request) => request.id === "req-lax-101")!;
    const expanded = { ...DEMO_SNAPSHOT_V2, demandRequests: [...DEMO_SNAPSHOT_V2.demandRequests, { ...source, id: "new-current-request" as never }] };
    const current = prepareInterviewOverview(expanded, query(expanded));
    expect(current.coverage.requested).toBe(11);
    expect(current.originalPlan.requestIds).toHaveLength(10);
    expect(current.originalPlan.requestIds).not.toContain("new-current-request");
    const completed = applyScenarioCheckpoint(expanded, "original-plan-delivered");
    expect(prepareInterviewOverview(completed, query(completed)).originalPlan).toMatchObject({ completedRequests: 10, firstJobs: 2 });
  });

  it("does not substitute the plan for an exact evidence or other-market selection", () => {
    const context = query(DEMO_SNAPSHOT_V2);
    const exact = prepareInterviewOverview(DEMO_SNAPSHOT_V2, { ...context, filters: { ...context.filters, requestIds: ["req-lax-101" as never] } });
    expect(exact.originalPlan.requestIds).toEqual(["req-lax-101"]);
    const other = prepareInterviewOverview(DEMO_SNAPSHOT_V2, { ...context, filters: { ...context.filters, selectedMarket: "SFO", marketIds: ["SFO"] } });
    expect(other.originalPlan.status).toBe("unavailable");
    const empty = prepareInterviewOverview(DEMO_SNAPSHOT_V2, { ...context, filters: { ...context.filters, matchNone: true } });
    expect(empty.originalPlan.status).toBe("unavailable");
  });
});
