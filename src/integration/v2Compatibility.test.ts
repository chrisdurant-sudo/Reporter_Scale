import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2 } from "../contracts/v2";
import { DEMO_SNAPSHOT } from "../data";
import { preserveSnapshotBoundary } from "./v2Compatibility";

describe("v1/v2 snapshot compatibility boundary", () => {
  it("preserves v1 without claiming an automatic migration", () => {
    const result = preserveSnapshotBoundary(DEMO_SNAPSHOT);

    expect(result).toEqual({
      schemaVersion: 1,
      mode: "v1-preserved",
      snapshot: DEMO_SNAPSHOT,
      automaticMigration: false,
    });
    expect(result.snapshot).toBe(DEMO_SNAPSHOT);
  });

  it("recognizes a native v2 snapshot without altering it", () => {
    const snapshot = { schemaVersion: 2 } as DemoSnapshotV2;
    const result = preserveSnapshotBoundary(snapshot);

    expect(result).toEqual({
      schemaVersion: 2,
      mode: "v2-native",
      snapshot,
      automaticMigration: false,
    });
    expect(result.snapshot).toBe(snapshot);
  });
});
