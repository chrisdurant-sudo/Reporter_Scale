import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecruitingScreen } from "./index";

const statuses = ["Applicant", "Screening", "Approved", "Onboarding", "Starting soon"] as const;
const trend = [
  { asOfAt: "2026-02-10T00:00:00Z", meanElapsedDays: null },
  { asOfAt: "2026-02-11T00:00:00Z", meanElapsedDays: 9 },
] as const;
const view = {
  currentCases: [],
  kpis: {
    activePeopleInFunnel: { value: 66 },
    peopleNeedingFollowUp: { value: 9 },
    slowestStep: { status: "Onboarding", meanElapsedDays: 34.071969696969695 },
    percentStartedWork: { value: 0.415929203539823 },
  },
  applicableSla: { marketId: "ALL", values: { overallDays: 30, statusDays: Object.fromEntries(statuses.map((status) => [status, 12])) } },
  waitTimeTrends: {
    R7: Object.fromEntries(statuses.map((status) => [status, trend])),
    R28: Object.fromEntries(statuses.map((status) => [status, trend])),
  },
  statusFilterCounts: statuses.map((status) => ({ status, count: 1 })),
  waitingOnFilterOptions: [],
  attentionItems: [
    { acquisitionCaseId: "case-ord-blocked-1", finding: "Onboarding is over SLA at 14.958333333333334 days against 12 days.", nextAction: "Complete sample-required-evidence: Blocked: same-required-step-missing", contributingRecords: [{ kind: "acquisition-case", id: "case-ord-blocked-1" }, { kind: "onboarding-step", id: "step-1" }] },
    { acquisitionCaseId: "case-ord-blocked-1", finding: "Onboarding is over SLA at 13.958333333333334 days against 12 days.", nextAction: "Complete sample-required-evidence: Blocked: same-required-step-missing", contributingRecords: [{ kind: "acquisition-case", id: "case-ord-blocked-1" }, { kind: "onboarding-step", id: "step-2" }] },
  ],
  evidence: [],
} as never;

describe("RecruitingScreen", () => {
  it("renders concise Funnel values and preserves unknown wait-time gaps", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<RecruitingScreen onOpenWork={vi.fn()} onWhyThis={vi.fn()} view={view} />);
    expect(screen.getByText("34 days")).toBeVisible();
    expect(screen.getByText("42%")).toBeVisible();
    expect(screen.getAllByText("Onboarding is over SLA at 15 days.")).toHaveLength(1);
    expect(screen.getAllByText("Complete the missing evidence.")).toHaveLength(2);
    expect(screen.queryByText(/sample-required-evidence|same-required-step-missing/)).not.toBeInTheDocument();
    expect(document.querySelector(".rg-chart__line--waitTime")?.getAttribute("points")).not.toContain("0,92");
    expect(document.querySelector(".chart-key--waitTime")).toHaveTextContent("Wait time");
    expect(consoleError.mock.calls.flat().join(" ")).not.toContain("Encountered two children with the same key");
    consoleError.mockRestore();
  });

  it("preserves ordinary note whitespace while editing and commits the draft on blur", () => {
    const onLocalNoteCommand = vi.fn();
    const editableView = Object.assign({}, view, {
      currentCases: [{
        acquisitionCaseId: "case-ord-blocked-1",
        reporterName: "Avery Example",
        marketId: "LAX",
        funnelStatus: "Onboarding",
        stage: "onboarding",
        totalElapsedDays: 14,
        openActions: [],
        sla: { total: { state: "under", elapsedDays: 14 }, currentStatus: { state: "over", elapsedDays: 14 } },
      }],
    }) as never;
    render(<RecruitingScreen onLocalNoteCommand={onLocalNoteCommand} onOpenWork={vi.fn()} onWhyThis={vi.fn()} view={editableView} />);
    const input = screen.getByRole("textbox", { name: "Notes for Avery Example" });
    fireEvent.change(input, { target: { value: "Quality note" } });
    expect(input).toHaveValue("Quality note");
    expect(onLocalNoteCommand).not.toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onLocalNoteCommand).toHaveBeenCalledWith({ type: "recruiting.local-note.set", target: { kind: "candidate", acquisitionCaseId: "case-ord-blocked-1" }, text: "Quality note" });
  });
});
