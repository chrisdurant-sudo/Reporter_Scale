import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("setup shell", () => {
  it("renders the three controlled screens and permanent disclosure", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole("heading", { name: "Markets", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("Independent application concept. Synthetic data. Not connected to Steno systems.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reporters" }));
    expect(screen.getByRole("heading", { name: "Reporters", level: 2 })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Improvements" }));
    expect(screen.getByRole("heading", { name: "Improvements", level: 2 })).toBeInTheDocument();
  });
});
