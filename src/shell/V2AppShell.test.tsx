import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { V2GlobalFilters } from "./V2AppShell";
import { V2AppShell } from "./V2AppShell";

const filters: V2GlobalFilters = { selectedMarket: "ALL", capabilityCodes: [], attendanceModes: [] };

describe("V2AppShell", () => {
  it("offers five controlled workspaces and preserves the supplied shared filters across navigation", async () => {
    const user = userEvent.setup();
    const onWorkspaceChange = vi.fn();
    const onFiltersChange = vi.fn();
    const { rerender } = render(
      <V2AppShell activeWorkspace="markets" demoDateLabel="February 16, 2026" filters={filters} onFiltersChange={onFiltersChange} onWorkspaceChange={onWorkspaceChange}>
        <p>Prepared markets view</p>
      </V2AppShell>,
    );
    expect(screen.getAllByRole("button", { name: /Overview|Funnel|Reporters|Team|Programs/ })).toHaveLength(5);
    await user.selectOptions(screen.getAllByLabelText("Market")[0]!, "LAX");
    expect(onFiltersChange).toHaveBeenCalledWith({ ...filters, selectedMarket: "LAX" });
    await user.click(screen.getByRole("button", { name: "Funnel" }));
    expect(onWorkspaceChange).toHaveBeenCalledWith("recruiting");
    rerender(<V2AppShell activeWorkspace="recruiting" demoDateLabel="February 16, 2026" filters={{ ...filters, selectedMarket: "LAX" }} onFiltersChange={onFiltersChange} onWorkspaceChange={onWorkspaceChange}><p>Recruiting</p></V2AppShell>);
    expect(screen.getAllByLabelText("Market")[0]).toHaveValue("LAX");
    expect(screen.getByText(/Independent synthetic demo/)).toBeVisible();
    expect(screen.getByText(/No real message is sent/)).toBeVisible();
  });

  it("returns only explicit capability and attendance changes to its controller", async () => {
    const user = userEvent.setup();
    const onFiltersChange = vi.fn();
    render(<V2AppShell activeWorkspace="reporters" demoDateLabel="February 16, 2026" filters={filters} onFiltersChange={onFiltersChange} onWorkspaceChange={vi.fn()} capabilityOptions={[{ value: "realtime" as never, label: "Realtime" }]} attendanceOptions={[{ value: "remote", label: "Remote" }]}><p>Network</p></V2AppShell>);
    await user.click(screen.getByLabelText("Realtime"));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, capabilityCodes: ["realtime"] });
    await user.click(screen.getByLabelText("Remote"));
    expect(onFiltersChange).toHaveBeenLastCalledWith({ ...filters, attendanceModes: ["remote"] });
  });

  it("keeps scenario controls collapsed and after the working surface", () => {
    render(<V2AppShell actionFeedback={<button type="button">Advance scenario</button>} activeWorkspace="markets" demoDateLabel="February 16, 2026" filters={filters} onFiltersChange={vi.fn()} onWorkspaceChange={vi.fn()}><p>Prepared markets view</p></V2AppShell>);
    const details = screen.getByText("Scenario controls").closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(document.querySelector("main")!.compareDocumentPosition(details) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(details.querySelector("button")?.textContent).toBe("Advance scenario");
  });
});
