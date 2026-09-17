import type { CommandGateDecision, DemoSnapshotV2, V2CommandContext } from "../../contracts/v2";

export function assessCommandGate(
  snapshot: Pick<DemoSnapshotV2, "revision" | "appliedCommandIds" | "commandRecords">,
  context: V2CommandContext,
): CommandGateDecision {
  if (snapshot.appliedCommandIds.includes(context.commandId)) {
    const prior = snapshot.commandRecords.find((record) => record.id === context.commandId);
    return { kind: "replay", appliedRevision: prior?.appliedRevision ?? snapshot.revision };
  }

  if (context.expectedRevision !== snapshot.revision) {
    return { kind: "stale", actualRevision: snapshot.revision };
  }

  return { kind: "apply" };
}
