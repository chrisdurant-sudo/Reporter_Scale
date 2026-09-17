import { useRef, useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DetailPanel } from "./index";

function PanelHarness() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)}>
        Open reporter details
      </button>
      <DetailPanel open={open} title="Reporter details" onClose={() => setOpen(false)} returnFocusRef={triggerRef}>
        <p>Detail content remains available until closed.</p>
        <button type="button">Last panel action</button>
      </DetailPanel>
    </>
  );
}

afterEach(cleanup);

describe("DetailPanel", () => {
  it("closes with Escape and returns focus to the opening control", () => {
    render(<PanelHarness />);
    const trigger = screen.getByRole("button", { name: "Open reporter details" });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Reporter details" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close details" })).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("keeps Tab focus inside the modal panel", () => {
    render(<PanelHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Open reporter details" }));
    const close = screen.getByRole("button", { name: "Close details" });
    const lastAction = screen.getByRole("button", { name: "Last panel action" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(lastAction).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();
  });
});
