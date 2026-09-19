import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DateWindow, SourceId, WorkspaceNavigationTarget } from "../contracts/v2";
import { INTERVIEW_V2_STORAGE_KEY } from "../contracts/v2";
import type { PreparedRecruitingView, RecruitingRecordFilters } from "../logic/recruiting";
import { App } from "./App";

type Controls = {
  view: PreparedRecruitingView;
  entryCohortOptions: readonly { id: string; label: string; window: DateWindow }[];
  selectedEntryCohortId: string;
  onChangeEntryCohort(id: string): void;
  onChangeRecordFilters(next: RecruitingRecordFilters): void;
  onChangeSourceIds(ids: readonly SourceId[]): void;
  onNavigateTarget(target: WorkspaceNavigationTarget): void;
};
let controls: Controls;
vi.mock("../features/recruiting", () => ({ RecruitingScreen: (props: Controls) => {
  controls = props;
  return <main aria-label="Funnel"><p>Prepared cases: {props.view.currentCases.length}</p><p>Entry cohort: {props.selectedEntryCohortId}</p></main>;
} }));
afterEach(() => { cleanup(); localStorage.removeItem(INTERVIEW_V2_STORAGE_KEY); });

async function openFunnel() {
  const user = userEvent.setup(); render(<App />);
  await screen.findByRole("region", { name: "Overview metrics" });
  await user.click(screen.getByRole("button", { name: "Funnel" }));
  await screen.findByRole("main", { name: "Funnel" });
  return user;
}

describe("coordinator Funnel control wiring", () => {
  it("prepares explicit January and February cohorts without redefining the people inventory", async () => {
    await openFunnel();
    const inventory = controls.view.currentCases.map((item) => item.acquisitionCaseId);
    const january = controls.view.evidence.find((item) => item.metric.id === "M08")!;
    expect(january.computation).toMatchObject({ status: "available", numerator: 17, denominator: 51 });
    act(() => controls.onChangeEntryCohort("february-2026"));
    await waitFor(() => expect(controls.selectedEntryCohortId).toBe("february-2026"));
    expect(controls.view.evidence.find((item) => item.metric.id === "M08")!.computation).toMatchObject({ status: "available", numerator: 0, denominator: 1 });
    expect(controls.view.currentCases.map((item) => item.acquisitionCaseId)).toEqual(inventory);
  });

  it("applies stable owner IDs and restores them after an exact external record drill-down", async () => {
    const user = await openFunnel();
    const fullView = controls.view;
    const external = fullView.currentCases.find((item) => !item.responsibility.memberIds.includes("team-1" as never))!;
    expect(external).toBeDefined();
    act(() => controls.onChangeRecordFilters({ ownerId: "team-1" as never }));
    await waitFor(() => expect(controls.view.recordFilters.ownerId).toBe("team-1"));
    const owned = controls.view.currentCases.map((item) => item.acquisitionCaseId);
    expect(owned.length).toBeGreaterThan(0);
    expect(controls.view.currentCases.every((item) => item.responsibility.memberIds.includes("team-1" as never))).toBe(true);
    expect(owned).not.toContain(external.acquisitionCaseId);
    const metric = fullView.evidence[0]!.metric;
    act(() => controls.onNavigateTarget({
      workspace: "recruiting", intent: "record-detail",
      filters: { ...fullView.appliedFilters, acquisitionCaseIds: [external.acquisitionCaseId], recordRefs: [{ kind: "acquisition-case", id: external.acquisitionCaseId }] },
      evidenceContext: { ...fullView.evaluation, metric },
    }));
    await screen.findByRole("region", { name: "Preserved evidence context" });
    expect(controls.view.currentCases.map((item) => item.acquisitionCaseId)).toEqual([external.acquisitionCaseId]);
    await user.click(screen.getByRole("button", { name: "Clear drill-down" }));
    expect(controls.view.recordFilters.ownerId).toBe("team-1");
    expect(controls.view.currentCases.map((item) => item.acquisitionCaseId)).toEqual(owned);
  });
});
