import type { WorkspaceLogicPort } from "../../contracts/v2";

export const CAPACITY_WORKSPACE = "markets" as const;
export type CapacityLogicPort = WorkspaceLogicPort<typeof CAPACITY_WORKSPACE>;
