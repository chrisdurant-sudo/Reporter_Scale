import { describe, expect, it } from "vitest";
import type {
  ActorId,
  CommandId,
  DefinitionVersion,
  DemoSnapshotV2,
  EvidenceBundle,
  EvidenceBundleId,
  MetricDefinitionId,
  RequestId,
  UtcTimestamp,
  V2CommandContext,
  WorkspaceFilterPayload,
} from "../../contracts/v2";
import { assessCommandGate, isUtcTimestamp, isValidHalfOpenWindow, validateEvidenceBundle } from "./index";

const timestamp = (value: string) => value as UtcTimestamp;

const filters: WorkspaceFilterPayload = {
  selectedMarket: "LAX",
  marketBasis: "demand-market",
  marketIds: ["LAX"],
  reporterIds: [],
  acquisitionCaseIds: [],
  requestIds: ["req-lax-101" as RequestId],
  workItemIds: [],
  programIds: [],
  programEnrollmentIds: [],
  sourceIds: [],
  jobOutcomeIds: [],
  capabilityCodes: [],
  attendanceModes: ["remote"],
  recordRefs: [],
  window: {
    startAt: timestamp("2026-02-23T08:00:00Z"),
    endAt: timestamp("2026-03-02T08:00:00Z"),
    boundary: "[start,end)",
  },
};

function validEvidence(): EvidenceBundle {
  const metric = {
    id: "M01" as MetricDefinitionId,
    version: "v1" as DefinitionVersion,
  };
  const request = { kind: "demand-request" as const, id: "req-lax-101" };
  return {
    id: "evidence-m01" as EvidenceBundleId,
    metric,
    asOfAt: timestamp("2026-02-16T17:00:00Z"),
    snapshotRevision: 0,
    unit: "requests",
    scope: {
      workspace: "markets",
      marketBasis: "demand-market",
      selectedMarket: "LAX",
      populationDescription: "Recorded, non-canceled LAX requests in the selected window.",
    },
    filters,
    reportingWindow: filters.window,
    computation: { status: "available", value: 1, numerator: null, denominator: null },
    contributingRecords: [{ ...request, label: "LAX request 101", occurredAt: timestamp("2026-02-23T18:00:00Z"), joinPath: [] }],
    numeratorMembers: [],
    denominatorMembers: [],
    exclusions: [],
    unknownCount: 0,
    limitations: [],
    explanation: "One non-canceled request is in the selected schedule window.",
    navigationTarget: {
      workspace: "markets",
      intent: "evidence-list",
      filters,
      evidenceContext: { asOfAt: timestamp("2026-02-16T17:00:00Z"), snapshotRevision: 0, metric },
    },
  };
}

describe("v2 shared invariants", () => {
  it("preserves exact empty drilldowns and rejects population expansion in navigation", () => {
    const initial = validEvidence();
    const emptyFilters = { ...initial.filters, requestIds: [], recordRefs: [], matchNone: true };
    const empty: EvidenceBundle = { ...initial, filters: emptyFilters, contributingRecords: [],
      computation: { status: "available", value: 0, numerator: null, denominator: null },
      navigationTarget: { ...initial.navigationTarget, filters: emptyFilters } };
    expect(validateEvidenceBundle(empty)).toEqual([]);
    expect(validateEvidenceBundle({ ...empty, navigationTarget: { ...empty.navigationTarget, filters: { ...emptyFilters, matchNone: false } } }).map((issue) => issue.code)).toContain("navigation-filter-mismatch");
    expect(validateEvidenceBundle({ ...empty, contributingRecords: initial.contributingRecords }).map((issue) => issue.code)).toContain("empty-selection-members");
  });

  it("accepts explicit UTC timestamps and rejects implicit local dates", () => {
    expect(isUtcTimestamp("2026-02-16T17:00:00Z")).toBe(true);
    expect(isUtcTimestamp("2026-02-16T17:00:00")).toBe(false);
  });

  it("requires a non-empty half-open window", () => {
    expect(isValidHalfOpenWindow(filters.window!)).toBe(true);
    expect(
      isValidHalfOpenWindow({
        startAt: timestamp("2026-02-16T17:00:00Z"),
        endAt: timestamp("2026-02-16T17:00:00Z"),
        boundary: "[start,end)",
      }),
    ).toBe(false);
  });

  it("gates commands by replay before revision and rejects stale new commands", () => {
    const appliedId = "command-applied" as CommandId;
    const actorId = "team-maya" as ActorId;
    const snapshot = {
      revision: 4,
      appliedCommandIds: [appliedId],
      commandRecords: [
        {
          id: appliedId,
          expectedRevision: 2,
          appliedRevision: 3,
          actorId,
          occurredAt: timestamp("2026-02-16T17:00:00Z"),
          commandType: "work.create" as const,
          affectedRecords: [],
          result: "applied" as const,
        },
      ],
    } satisfies Pick<DemoSnapshotV2, "revision" | "appliedCommandIds" | "commandRecords">;
    const replay: V2CommandContext = {
      commandId: appliedId,
      expectedRevision: 0,
      actorId,
      occurredAt: timestamp("2026-02-16T17:00:00Z"),
    };
    const stale = { ...replay, commandId: "command-new" as CommandId, expectedRevision: 3 };
    const current = { ...stale, expectedRevision: 4 };

    expect(assessCommandGate(snapshot, replay)).toEqual({ kind: "replay", appliedRevision: 3 });
    expect(assessCommandGate(snapshot, stale)).toEqual({ kind: "stale", actualRevision: 4 });
    expect(assessCommandGate(snapshot, current)).toEqual({ kind: "apply" });
  });

  it("reconciles count evidence to records and exact navigation context", () => {
    expect(validateEvidenceBundle(validEvidence())).toEqual([]);
    const invalid = validEvidence();
    const changedFilters = { ...filters, requestIds: [] };
    const issues = validateEvidenceBundle({
      ...invalid,
      computation: { status: "available", value: 2, numerator: null, denominator: null },
      navigationTarget: { ...invalid.navigationTarget, filters: changedFilters },
    });

    expect(issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["count-record-mismatch", "navigation-filter-mismatch"]),
    );
  });

  it("requires ratio numerator members to be a denominator subset", () => {
    const evidence = validEvidence();
    const denominator = { kind: "reporter" as const, id: "person-1" };
    const outsider = { kind: "reporter" as const, id: "person-2" };
    const issues = validateEvidenceBundle({
      ...evidence,
      unit: "ratio",
      computation: { status: "available", value: 0.5, numerator: 1, denominator: 1 },
      contributingRecords: [],
      numeratorMembers: [outsider],
      denominatorMembers: [denominator],
    });

    expect(issues.map((issue) => issue.code)).toContain("ratio-member-subset");
  });
});
