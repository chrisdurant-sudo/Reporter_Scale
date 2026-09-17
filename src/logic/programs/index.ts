import type { WorkspaceLogicPort } from "../../contracts/v2";

export const PROGRAMS_WORKSPACE = "programs" as const;
export type ProgramsLogicPort = WorkspaceLogicPort<typeof PROGRAMS_WORKSPACE>;
