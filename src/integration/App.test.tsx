import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("integrated application shell", () => {
  it("loads demo data, renders the three controlled screens, and keeps the permanent disclosure", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Where we need more reporters", level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Independent application concept. Synthetic data. Not connected to Steno systems.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(await screen.findByRole("heading", { name: "Reporter work", level: 2 })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Improvements" }));
    expect(await screen.findByRole("heading", { name: "Improvements", level: 2 })).toBeInTheDocument();
  });
});
