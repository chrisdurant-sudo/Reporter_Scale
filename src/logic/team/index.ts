import type { WorkspaceLogicPort } from "../../contracts/v2";

export const TEAM_WORKSPACE = "team" as const;
export type TeamLogicPort = WorkspaceLogicPort<typeof TEAM_WORKSPACE>;
