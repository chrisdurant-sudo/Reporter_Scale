import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreparedProgramsView } from "../../logic/programs";
import { ProgramsScreen } from "./index";

const view = {
  rows: [
    { id: "program-checklist" as never, title: "Readiness checklist pilot", typeLabel: "Experiment", marketLabel: "LAX, SFO", stage: "reviewing", ownerId: "team-2", brief: "Compare cohorts.", implementationAt: "2026-01-01T17:00:00Z", target: .5, result: { result: .55, evidence: { id: "evidence-pilot" } }, reviewAt: "2026-02-16T17:00:00Z", latestNote: "Documented note.", latestNextStep: "Review the result.", nextStep: "Review the result.", workflowSource: "Synthetic spreadsheet workaround", latestDecision: { decision: "expand" } },
    { id: "program-outreach" as never, title: "DFW broad outreach", typeLabel: "Sourcing", marketLabel: "DFW", stage: "closed", ownerId: "team-2", brief: "Retain the cohort.", implementationAt: "2025-12-01T17:00:00Z", target: .4, result: { result: .16, evidence: { id: "evidence-outreach" } }, reviewAt: "2026-01-15T17:00:00Z", latestNote: null, latestNextStep: null, nextStep: "Keep the reason visible.", workflowSource: "DFW outreach", latestDecision: { decision: "stop" } },
  ],
  evidence: [],
  summary: { running: 0, reviewNow: 1, expanding: 1, stopped: 1 },
  resultOverTime: [{ id: "pilot-earlier", programId: "program-checklist", groupId: "earlier", periodStartAt: "2026-01-01T00:00:00Z", periodEndAt: "2026-01-10T00:00:00Z", result: .3, target: .5, targetState: "not-met", accessibleLabel: "Earlier result 30 percent.", evidenceId: "evidence-pilot" }, { id: "pilot-current", programId: "program-checklist", groupId: "pilot", periodStartAt: "2026-02-01T00:00:00Z", periodEndAt: "2026-02-10T00:00:00Z", result: .55, target: .5, targetState: "met", accessibleLabel: "Pilot result 55 percent.", evidenceId: "evidence-pilot" }],
} as unknown as PreparedProgramsView;

const actions = { onEditProgram: vi.fn(), onRecordDecision: vi.fn(), onSaveProcessDraft: vi.fn(), onCreatePartnerTask: vi.fn(), onOpenEvidence: vi.fn(), onSaveProgramText: vi.fn() };

describe("ProgramsScreen", () => {
  it("filters prepared rows and saves note text through the canonical callback", () => {
    render(<ProgramsScreen actions={actions} view={view} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Sourcing" } });
    expect(screen.getByRole("button", { name: "DFW broad outreach" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Readiness checklist pilot" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Notes for DFW broad outreach"), { target: { value: "Keep the cohort note." } });
    fireEvent.blur(screen.getByLabelText("Notes for DFW broad outreach"));
    expect(actions.onSaveProgramText).toHaveBeenCalledWith({ programId: "program-outreach", field: "note", text: "Keep the cohort note." });
    expect(screen.getByText(/Program outcomes and decisions do not change/i)).toBeInTheDocument();
    expect(actions.onRecordDecision).not.toHaveBeenCalled();
  });

  it("opens the Results view and routes the selected record through shared evidence", () => {
    render(<ProgramsScreen actions={actions} view={view} />);
    fireEvent.click(screen.getByRole("button", { name: "Readiness checklist pilot" }));
    expect(screen.getByRole("button", { name: "Why this?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why this?" }));
    expect(actions.onOpenEvidence).toHaveBeenCalledWith("evidence-pilot");
    expect(screen.getAllByText("Jan 1–Jan 10").length).toBeGreaterThan(0);
  });
});
