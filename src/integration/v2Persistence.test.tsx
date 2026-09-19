import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INTERVIEW_V2_STORAGE_KEY, type PersistedDemoSnapshotV2 } from "../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../data/v2";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.removeItem(INTERVIEW_V2_STORAGE_KEY);
  localStorage.removeItem("v1-test-preserved");
});

describe("V2 browser storage integration", () => {
  it("opens a reporter's exact recruiting market instead of reusing the service-market filter", async () => {
    const acquisition = DEMO_SNAPSHOT_V2.acquisitionCases.find((item) => item.ownerMarketId === "SFO"
      && DEMO_SNAPSHOT_V2.readinessEvents.some((event) => event.reporterId === item.reporterId
        && Date.parse(event.occurredAt) <= Date.parse(DEMO_SNAPSHOT_V2.currentAsOfAt)))!;
    const reporter = DEMO_SNAPSHOT_V2.reporters.find((item) => item.id === acquisition.reporterId)!;
    const snapshot = { ...DEMO_SNAPSHOT_V2, reporters: DEMO_SNAPSHOT_V2.reporters.map((item) => item.id === reporter.id ? { ...item, serviceMarketIds: ["LAX" as const] } : item) };
    localStorage.setItem(INTERVIEW_V2_STORAGE_KEY, JSON.stringify({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: snapshot.seedVersion, snapshot }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("region", { name: "Overview metrics" });
    await user.click(screen.getByRole("button", { name: "LAX" }));
    await user.click(screen.getByRole("button", { name: "Reporters" }));
    const row = (await screen.findByRole("rowheader", { name: reporter.fictionalName })).closest("tr")!;
    await user.click(within(row).getByRole("button", { name: "Inspect checklist" }));
    expect(await screen.findByRole("main", { name: "Funnel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "SFO" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("region", { name: "Preserved evidence context" })).toHaveTextContent("1 linked case");
    expect(screen.getByRole("row", { name: new RegExp(`${reporter.fictionalName} SFO`) })).toBeInTheDocument();
  });

  it("keeps a market selection open to all canonical requests in its scheduling window", async () => {
    const request = DEMO_SNAPSHOT_V2.demandRequests.find((item) => item.id === "req-lax-101")!;
    const snapshot = { ...DEMO_SNAPSHOT_V2, demandRequests: [...DEMO_SNAPSHOT_V2.demandRequests, { ...request, id: "req-lax-additional-proof" as never }] };
    localStorage.setItem(INTERVIEW_V2_STORAGE_KEY, JSON.stringify({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: snapshot.seedVersion, snapshot }));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("region", { name: "Overview metrics" });
    await user.click(screen.getByRole("button", { name: "LAX" }));
    const metrics = screen.getByRole("region", { name: "Overview metrics" });
    expect(within(metrics).getByText("Open jobs").parentElement).toHaveTextContent("11");
  });

  it("reloads saved work and the scenario clock on remount, then explicitly restores the seed", async () => {
    const user = userEvent.setup();
    const mounted = render(<App />);
    await screen.findByRole("region", { name: "Overview metrics" });
    await user.click(screen.getByText("Scenario controls"));
    const feedback = screen.getByRole("region", { name: "Scenario and action result" });
    await user.click(within(feedback).getByRole("button", { name: "Advance to Plan saved" }));
    await waitFor(() => expect(feedback).toHaveTextContent("Checkpoint: Plan saved"));
    await user.click(screen.getByRole("button", { name: "Team" }));
    await user.click(screen.getByRole("button", { name: "Add work" }));
    const form = screen.getByRole("form", { name: "Add work" });
    await user.click(within(form).getByRole("textbox", { name: "Work title" }));
    await user.paste("Inspect the saved interview handoff");
    await user.click(within(form).getByRole("button", { name: "Add" }));
    await screen.findByText("Inspect the saved interview handoff");
    const saved = JSON.parse(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)!) as PersistedDemoSnapshotV2;
    expect(saved.snapshot.revision).toBe(2);
    const created = saved.snapshot.workItems.find((item) => item.title === "Inspect the saved interview handoff")!;
    const command = saved.snapshot.commandRecords.find((item) => item.commandType === "work.create")!;
    expect(command.affectedRecords).toContainEqual({ kind: "work-item", id: created.id });
    expect(saved.snapshot.appliedCommandIds).toContain(command.id);
    expect(created.primaryEntityRef).toEqual({ kind: "work-item", id: created.id });
    expect(created.ownerHistory[0]?.ownerId).toBeNull();
    expect(saved.snapshot.currentAsOfAt).not.toBe(DEMO_SNAPSHOT_V2.currentAsOfAt);
    mounted.unmount();

    render(<App />);
    await screen.findByRole("region", { name: "Overview metrics" });
    await user.click(screen.getByText("Scenario controls"));
    expect(screen.getByRole("region", { name: "Scenario and action result" })).toHaveTextContent("Checkpoint: Plan saved");
    await user.click(screen.getByRole("button", { name: "Team" }));
    expect(await screen.findByText("Inspect the saved interview handoff")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    await screen.findByRole("region", { name: "Overview metrics" });
    const reset = JSON.parse(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)!) as PersistedDemoSnapshotV2;
    expect(reset.snapshot).toEqual(DEMO_SNAPSHOT_V2);
  }, 10_000);

  it("preserves malformed bytes and unrelated data until explicit namespace reset", async () => {
    localStorage.setItem(INTERVIEW_V2_STORAGE_KEY, "invalid saved bytes");
    localStorage.setItem("v1-test-preserved", "legacy content");
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Saved demo is not valid JSON/)).toBeInTheDocument();
    expect(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)).toBe("invalid saved bytes");
    await user.click(screen.getByText("Scenario controls"));
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    expect(await screen.findByRole("region", { name: "Overview metrics" })).toBeInTheDocument();
    expect(localStorage.getItem("v1-test-preserved")).toBe("legacy content");
    expect(screen.queryByText(/Saved demo is not valid JSON/)).not.toBeInTheDocument();
  });

  it("reports denied browser storage without crashing or claiming a reset succeeded", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    const user = userEvent.setup();
    render(<App />);
    expect(await screen.findByText(/Local demo storage could not be read/)).toBeInTheDocument();
    await user.click(screen.getByText("Scenario controls"));
    await user.click(screen.getByRole("button", { name: "Reset demo" }));
    await waitFor(() => expect(screen.getByRole("region", { name: "Scenario and action result" })).toHaveTextContent("Nothing was reset."));
    expect(screen.queryByRole("region", { name: "Overview metrics" })).not.toBeInTheDocument();
  });
});
