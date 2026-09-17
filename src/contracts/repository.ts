import type { ActionResult } from "./commands";
import type { DemoSnapshot } from "./models";

export interface DemoRepository {
  load(): Promise<ActionResult<DemoSnapshot>>;
  save(snapshot: DemoSnapshot, expectedRevision: number): Promise<ActionResult<DemoSnapshot>>;
  reset(): Promise<ActionResult<DemoSnapshot>>;
}

export type DemoRepositoryFactory = () => DemoRepository;

export type SnapshotValidator = (snapshot: unknown) => ActionResult<DemoSnapshot>;
