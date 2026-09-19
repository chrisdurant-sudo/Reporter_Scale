import type {
  DemoRepositoryV2,
  DemoSnapshotV2,
  V2CommandEnvelope,
  V2CommandError,
  V2CommandMutation,
  V2CommandResult,
  V2CommandType,
} from "../contracts/v2";
import { assessCommandGate } from "../logic/shared";

/** Call from the app's serialized mutation queue; a successful result means repository save succeeded. */
export async function commitV2Command<TType extends V2CommandType, TPayload>(
  repository: DemoRepositoryV2,
  command: V2CommandEnvelope<TType, TPayload>,
  prepare: (snapshot: DemoSnapshotV2, command: V2CommandEnvelope<TType, TPayload>) => V2CommandMutation,
): Promise<V2CommandResult<DemoSnapshotV2>> {
  const fail = (revision: number, message: string, code: V2CommandError["code"] = "invalid-command", errors?: readonly V2CommandError[]): V2CommandResult<DemoSnapshotV2> => ({
    ok: false, commandId: command.context.commandId, revision, message,
    errors: errors ?? [{ code, message, field: null, relatedRecords: [] }],
  });
  const loaded = await repository.load();
  if (!loaded.ok) return fail(loaded.revision, loaded.message, "storage-failed", loaded.errors);
  const current = loaded.value;
  const gate = assessCommandGate(current, command.context);
  if (gate.kind === "replay") {
    const prior = current.commandRecords.find((record) => record.id === command.context.commandId);
    if (!prior || prior.commandType !== command.type || prior.actorId !== command.context.actorId) {
      return fail(current.revision, "The command ID belongs to a different or incomplete recorded command.");
    }
    return { ok: true, value: current, commandId: command.context.commandId, revision: current.revision, changed: false, replayed: true, affectedRecords: prior.affectedRecords, message: "This command was already saved." };
  }
  if (gate.kind === "stale") return fail(current.revision, "The snapshot changed. Reload before saving this action.", "stale-revision");
  const actor = current.teamMembers.find((member) => member.actorId === command.context.actorId);
  const at = Date.parse(command.context.occurredAt);
  if (!command.context.commandId.trim() || !Number.isFinite(at) || at !== Date.parse(current.currentAsOfAt)
    || !actor || Date.parse(actor.activeFrom) > at || (actor.activeTo !== null && Date.parse(actor.activeTo) <= at)) {
    return fail(current.revision, "A command needs a unique ID, an active team actor, and the current demo time.");
  }
  let mutation: V2CommandMutation;
  try {
    mutation = prepare(structuredClone(current), command);
  } catch (error) {
    return fail(current.revision, error instanceof Error ? error.message : "The action could not be prepared.", "validation-failed");
  }
  for (const key of ["schemaVersion", "seedVersion", "revision", "baseAsOfAt", "currentAsOfAt", "appliedCommandIds", "appliedScenarioEventIds", "commandRecords"] as const) {
    if (JSON.stringify(mutation.snapshot[key]) !== JSON.stringify(current[key])) {
      return fail(current.revision, "Domain actions cannot change the clock, revision, or command history.", "invariant-failed");
    }
  }
  const next: DemoSnapshotV2 = {
    ...mutation.snapshot,
    appliedCommandIds: [...current.appliedCommandIds, command.context.commandId],
    commandRecords: [...current.commandRecords, {
      id: command.context.commandId, expectedRevision: current.revision, appliedRevision: current.revision + 1,
      actorId: command.context.actorId, occurredAt: command.context.occurredAt, commandType: command.type,
      affectedRecords: mutation.affectedRecords, result: "applied",
    }],
  };
  const saved = await repository.save(next, current.revision);
  if (!saved.ok) return fail(saved.revision, saved.message, "storage-failed", saved.errors);
  return { ok: true, value: saved.value, commandId: command.context.commandId, revision: saved.revision, changed: true, replayed: false, affectedRecords: mutation.affectedRecords, message: mutation.message };
}
