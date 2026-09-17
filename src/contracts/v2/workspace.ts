import type { MetricEvaluationContext, WorkspaceId } from "./common";
import type { EvidenceBundle, WorkspaceFilterPayload } from "./evidence";
import type { DemoSnapshotV2 } from "./snapshot";

export interface WorkspaceQueryContext<TWorkspace extends WorkspaceId> {
  readonly workspace: TWorkspace;
  readonly evaluation: MetricEvaluationContext;
  readonly filters: WorkspaceFilterPayload;
}

export interface PreparedWorkspaceViewBase<TWorkspace extends WorkspaceId> {
  readonly workspace: TWorkspace;
  readonly evaluation: MetricEvaluationContext;
  readonly appliedFilters: WorkspaceFilterPayload;
  readonly evidence: readonly EvidenceBundle[];
}

export interface WorkspaceLogicPort<TWorkspace extends WorkspaceId> {
  readonly workspace: TWorkspace;
  prepare(
    snapshot: DemoSnapshotV2,
    context: WorkspaceQueryContext<TWorkspace>,
  ): PreparedWorkspaceViewBase<TWorkspace>;
}
