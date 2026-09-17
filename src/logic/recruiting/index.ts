import type { WorkspaceLogicPort } from "../../contracts/v2";

export const RECRUITING_WORKSPACE = "recruiting" as const;
export type RecruitingLogicPort = WorkspaceLogicPort<typeof RECRUITING_WORKSPACE>;
