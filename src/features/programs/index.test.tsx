import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { PreparedProgramsView } from "../../logic/programs";
import { ProgramsScreen } from "./index";

const view = {
  rows: [
    { id: "program-checklist" as never, title: "Readiness checklist pilot", marketLabel: "LAX, SFO", stage: "reviewing", ownerId: "team-2", target: .5, result: { result: .55, evidence: { id: "evidence-pilot" } }, reviewAt: "2026-02-16T17:00:00Z", nextStep: "Review the result.", latestDecision: { decision: "expand" } },
    { id: "program-outreach" as never, title: "DFW broad outreach", marketLabel: "DFW", stage: "closed", ownerId: "team-2", target: .4, result: { result: .16, evidence: { id: "evidence-outreach" } }, reviewAt: "2026-01-15T17:00:00Z", nextStep: "Keep the reason visible.", latestDecision: { decision: "stop" } },
  ],
  evidence: [],
} as unknown as PreparedProgramsView;

const actions = { onEditProgram: vi.fn(), onRecordDecision: vi.fn(), onSaveProcessDraft: vi.fn(), onCreatePartnerTask: vi.fn(), onOpenEvidence: vi.fn() };

describe("ProgramsScreen", () => {
  it("filters source-backed prepared rows and keeps note drafts from manufacturing an outcome", () => {
    render(<ProgramsScreen actions={actions} view={view} />);
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Sourcing" } });
    expect(screen.getByRole("button", { name: "DFW broad outreach" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Readiness checklist pilot" })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Notes for DFW broad outreach"), { target: { value: "Keep the cohort note." } });
    expect(screen.getByText(/Program outcomes and decisions did not change/i)).toBeInTheDocument();
    expect(actions.onRecordDecision).not.toHaveBeenCalled();
  });

  it("opens the Results view and routes the selected record through shared evidence", () => {
    render(<ProgramsScreen actions={actions} view={view} />);
    fireEvent.click(screen.getByRole("button", { name: "Readiness checklist pilot" }));
    expect(screen.getByRole("button", { name: "Why this?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Why this?" }));
    expect(actions.onOpenEvidence).toHaveBeenCalledWith("evidence-pilot");
  });
});
