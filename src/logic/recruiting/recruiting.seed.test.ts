import { describe, expect, it } from "vitest";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import type { MarketId, UtcTimestamp, WorkspaceQueryContext } from "../../contracts/v2";
import { prepareRecruitingWorkspace } from "./recruiting";
import { validateEvidenceBundle } from "../shared/evidence";

const query = (selectedMarket: "ALL" | MarketId, start = "2026-01-01T00:00:00Z", end = "2026-02-01T00:00:00Z"): WorkspaceQueryContext<"recruiting"> => ({
  workspace: "recruiting",
  evaluation: { asOfAt: DEMO_SNAPSHOT_V2.baseAsOfAt, snapshotRevision: DEMO_SNAPSHOT_V2.revision, reportingTimeZone: "America/Los_Angeles" },
  filters: { selectedMarket, marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: { startAt: start as UtcTimestamp, endAt: end as UtcTimestamp, boundary: "[start,end)" } },
});

describe("IC02 frozen seed integration", () => {
  it("keeps every market independent and All the exact union of current inventory", () => {
    const all = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query("ALL"));
    const markets: MarketId[] = ["LAX", "SFO", "DFW", "ORD", "ATL"];
    const individual = markets.flatMap((market) => {
      const view = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query(market));
      expect(view.currentCases.length).toBeGreaterThan(0);
      expect(view.currentCases.every((item) => item.marketId === market)).toBe(true);
      expect(view.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
      expect(view.attentionItems.every((item) => item.navigationTarget.filters.selectedMarket === market)).toBe(true);
      return view.currentCases.map((item) => item.acquisitionCaseId);
    });
    expect([...individual].sort()).toEqual(all.currentCases.map((item) => item.acquisitionCaseId).sort());
    expect(new Set(individual).size).toBe(individual.length);
  });

  it("filters Maya's actual seeded responsibilities by member ID and each waiting condition by key", () => {
    const view = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query("ALL"));
    const maya = DEMO_SNAPSHOT_V2.teamMembers.find((item) => item.fictionalName === "Maya Chen")!;
    expect(maya).toBeDefined();
    const owner = view.ownerFilterOptions.find((item) => item.memberId === maya.id)!;
    expect(owner.count).toBeGreaterThan(0);
    const selected = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query("ALL"), { filters: { ownerId: maya.id } });
    expect(selected.currentCases.map((item) => item.acquisitionCaseId).sort()).toEqual([...owner.acquisitionCaseIds].sort());
    for (const option of selected.waitingOnFilterOptions) {
      const waiting = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query("ALL"), { filters: { ownerId: maya.id, waitingOnKey: option.key } });
      expect(waiting.currentCases.map((item) => item.acquisitionCaseId).sort()).toEqual([...option.acquisitionCaseIds].sort());
    }
  });

  it("declares mature and observing populations for both explicit entry windows", () => {
    const diagnostics = (["ALL", "LAX", "DFW"] as const).flatMap((market) => [
      ["Jan", "2026-01-01T00:00:00Z", "2026-02-01T00:00:00Z"],
      ["Feb", "2026-02-01T00:00:00Z", "2026-03-01T00:00:00Z"],
    ].map(([label, start, end]) => {
      const view = prepareRecruitingWorkspace(DEMO_SNAPSHOT_V2, query(market, start, end));
      expect(view.funnel.matureCaseIds.length + view.funnel.observingCaseIds.length).toBe(view.funnel.members.length);
      expect(view.onboarding.matureCaseIds.length + view.onboarding.observingCaseIds.length).toBe(view.onboarding.members.length);
      expect(view.sources.flatMap((item) => item.caseIds).sort()).toEqual(view.funnel.members.map((item) => item.acquisitionCaseId).sort());
      if (label === "Feb") expect(view.funnel.stages.at(-1)?.conversion.value).toBeNull();
      return { market, window: label, m07: { mature: view.funnel.matureCaseIds.length, observing: view.funnel.observingCaseIds.length }, m08: { timely: view.onboarding.timelyCaseIds.length, mature: view.onboarding.matureCaseIds.length, observing: view.onboarding.observingCaseIds.length } };
    }));
    expect(diagnostics).toEqual([
      { market: "ALL", window: "Jan", m07: { mature: 31, observing: 4 }, m08: { timely: 17, mature: 51, observing: 0 } },
      { market: "ALL", window: "Feb", m07: { mature: 0, observing: 3 }, m08: { timely: 0, mature: 1, observing: 10 } },
      { market: "LAX", window: "Jan", m07: { mature: 7, observing: 0 }, m08: { timely: 9, mature: 22, observing: 0 } },
      { market: "LAX", window: "Feb", m07: { mature: 0, observing: 3 }, m08: { timely: 0, mature: 0, observing: 2 } },
      { market: "DFW", window: "Jan", m07: { mature: 3, observing: 4 }, m08: { timely: 0, mature: 2, observing: 0 } },
      { market: "DFW", window: "Feb", m07: { mature: 0, observing: 0 }, m08: { timely: 0, mature: 0, observing: 1 } },
    ]);
  });
});
