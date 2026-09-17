import type { DemoSnapshot } from "../contracts/models";
import type { DemoSnapshotV2 } from "../contracts/v2";

export type CompatibleSnapshotEnvelope =
  | {
      readonly schemaVersion: 1;
      readonly mode: "v1-preserved";
      readonly snapshot: DemoSnapshot;
      readonly automaticMigration: false;
    }
  | {
      readonly schemaVersion: 2;
      readonly mode: "v2-native";
      readonly snapshot: DemoSnapshotV2;
      readonly automaticMigration: false;
    };

export function preserveSnapshotBoundary(snapshot: DemoSnapshot | DemoSnapshotV2): CompatibleSnapshotEnvelope {
  if (snapshot.schemaVersion === 1) {
    return { schemaVersion: 1, mode: "v1-preserved", snapshot, automaticMigration: false };
  }

  return { schemaVersion: 2, mode: "v2-native", snapshot, automaticMigration: false };
}
