import type { V2CommandError } from "./commands";
import type { DemoSnapshotV2 } from "./snapshot";

export type RepositoryResult<TValue> =
  | { readonly ok: true; readonly value: TValue; readonly revision: number; readonly message: string }
  | { readonly ok: false; readonly errors: readonly V2CommandError[]; readonly revision: number; readonly message: string };

export interface DemoRepositoryV2 {
  load(): Promise<RepositoryResult<DemoSnapshotV2>>;
  save(snapshot: DemoSnapshotV2, expectedRevision: number): Promise<RepositoryResult<DemoSnapshotV2>>;
  reset(): Promise<RepositoryResult<DemoSnapshotV2>>;
}

export type DemoSnapshotV2Validator = (value: unknown) => RepositoryResult<DemoSnapshotV2>;
