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

/** Browser storage is injected into Data; domain logic and feature components never access it. */
export interface DemoSnapshotStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const INTERVIEW_V2_STORAGE_KEY = "reporter-growth.v2.interview.v1";

export interface PersistedDemoSnapshotV2 {
  readonly format: "reporter-growth-v2";
  readonly storageVersion: 1;
  readonly seedVersion: string;
  readonly snapshot: DemoSnapshotV2;
}

export interface DemoRepositoryV2Options {
  /** Undefined/null preserves the existing memory adapter for isolated tests. */
  readonly storage?: DemoSnapshotStorage | null;
  readonly storageKey?: string;
}
