import type { WorkspaceLogicPort } from "../../contracts/v2";

export const NETWORK_WORKSPACE = "reporters" as const;
export type NetworkLogicPort = WorkspaceLogicPort<typeof NETWORK_WORKSPACE>;
