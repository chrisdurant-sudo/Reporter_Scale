import type { UtcTimestamp } from "./common";
import type { ActorId, TeamMemberId } from "./ids";

/** Current synthetic command context; distinct from a historical evidence view's evaluation. */
export interface DemoActionContext {
  readonly snapshotRevision: number;
  readonly occurredAt: UtcTimestamp;
  readonly actor: { readonly memberId: TeamMemberId; readonly actorId: ActorId; readonly name: string } | null;
  readonly busy: boolean;
}
export type DemoRecordKind = "team-target" | "work-quality-check" | "coaching-action";
