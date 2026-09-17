import type { EvidenceBundle, RecordPointer } from "../../contracts/v2";
import { isUtcTimestamp, isValidHalfOpenWindow } from "./time";

export interface EvidenceContractIssue {
  readonly code: string;
  readonly message: string;
}

const pointerKey = (pointer: RecordPointer) => `${pointer.kind}:${pointer.id}`;

function sameValues(left: readonly unknown[], right: readonly unknown[]): boolean {
  if (left.length !== right.length) return false;
  const leftValues = left.map(String).sort();
  const rightValues = right.map(String).sort();
  return leftValues.every((value, index) => value === rightValues[index]);
}

function samePointers(left: readonly RecordPointer[], right: readonly RecordPointer[]): boolean {
  return sameValues(left.map(pointerKey), right.map(pointerKey));
}

function sameFilters(left: EvidenceBundle["filters"], right: EvidenceBundle["filters"]): boolean {
  const sameWindow =
    left.window === right.window ||
    (left.window !== null &&
      right.window !== null &&
      left.window.startAt === right.window.startAt &&
      left.window.endAt === right.window.endAt &&
      left.window.boundary === right.window.boundary);

  return (
    left.selectedMarket === right.selectedMarket &&
    left.marketBasis === right.marketBasis &&
    sameValues(left.marketIds, right.marketIds) &&
    sameValues(left.reporterIds, right.reporterIds) &&
    sameValues(left.acquisitionCaseIds, right.acquisitionCaseIds) &&
    sameValues(left.requestIds, right.requestIds) &&
    sameValues(left.workItemIds, right.workItemIds) &&
    sameValues(left.programIds, right.programIds) &&
    sameValues(left.programEnrollmentIds, right.programEnrollmentIds) &&
    sameValues(left.sourceIds, right.sourceIds) &&
    sameValues(left.jobOutcomeIds, right.jobOutcomeIds) &&
    sameValues(left.capabilityCodes, right.capabilityCodes) &&
    sameValues(left.attendanceModes, right.attendanceModes) &&
    samePointers(left.recordRefs, right.recordRefs) &&
    sameWindow
  );
}

export function validateEvidenceBundle(bundle: EvidenceBundle): readonly EvidenceContractIssue[] {
  const issues: EvidenceContractIssue[] = [];
  const add = (code: string, message: string) => issues.push({ code, message });

  if (!Number.isInteger(bundle.snapshotRevision) || bundle.snapshotRevision < 0) {
    add("invalid-snapshot-revision", "Snapshot revision must be a nonnegative integer.");
  }
  if (!Number.isInteger(bundle.unknownCount) || bundle.unknownCount < 0) {
    add("invalid-unknown-count", "Unknown count must be a nonnegative integer.");
  }
  if (!isUtcTimestamp(bundle.asOfAt)) add("invalid-as-of", "Evidence asOfAt must be an explicit UTC timestamp.");
  if (bundle.reportingWindow && !isValidHalfOpenWindow(bundle.reportingWindow)) {
    add("invalid-reporting-window", "Evidence reporting windows must be valid half-open UTC windows.");
  }
  if (bundle.filters.window && !isValidHalfOpenWindow(bundle.filters.window)) {
    add("invalid-filter-window", "Evidence filter windows must be valid half-open UTC windows.");
  }
  if (
    bundle.scope.selectedMarket !== bundle.filters.selectedMarket ||
    bundle.scope.marketBasis !== bundle.filters.marketBasis
  ) {
    add("scope-filter-mismatch", "Evidence scope and filters must use the same market selection and basis.");
  }
  if (!bundle.explanation.trim()) add("missing-explanation", "Evidence must include a plain-language explanation.");

  const contributingKeys = bundle.contributingRecords.map(pointerKey);
  if (new Set(contributingKeys).size !== contributingKeys.length) {
    add("duplicate-contributing-record", "Contributing records must be distinct.");
  }

  if (bundle.computation.status === "available") {
    const { numerator, denominator, value } = bundle.computation;
    if ((numerator === null) !== (denominator === null)) {
      add("incomplete-ratio", "Numerator and denominator must either both be present or both be absent.");
    }
    if (numerator !== null && denominator !== null) {
      if (numerator < 0 || denominator <= 0 || numerator > denominator) {
        add("invalid-ratio", "An available ratio requires a positive denominator and a valid numerator.");
      } else if (value !== numerator / denominator) {
        add("ratio-value-mismatch", "Ratio value must equal numerator divided by denominator.");
      }
      if (bundle.numeratorMembers.length !== numerator || bundle.denominatorMembers.length !== denominator) {
        add("ratio-member-count", "Ratio member counts must match the numeric numerator and denominator.");
      }
      const numeratorKeys = bundle.numeratorMembers.map(pointerKey);
      const denominatorMemberKeys = bundle.denominatorMembers.map(pointerKey);
      if (
        new Set(numeratorKeys).size !== numeratorKeys.length ||
        new Set(denominatorMemberKeys).size !== denominatorMemberKeys.length
      ) {
        add("duplicate-ratio-member", "Ratio member lists must contain distinct records.");
      }
      const denominatorKeys = new Set(bundle.denominatorMembers.map(pointerKey));
      if (bundle.numeratorMembers.some((member) => !denominatorKeys.has(pointerKey(member)))) {
        add("ratio-member-subset", "Every numerator member must also be a denominator member.");
      }
    }

    const countUnits = new Set(["requests", "people", "jobs", "tasks", "events"]);
    if (countUnits.has(bundle.unit) && numerator === null && value !== bundle.contributingRecords.length) {
      add("count-record-mismatch", "Count evidence must reconcile to its distinct contributing records.");
    }
  } else if (bundle.numeratorMembers.length || bundle.denominatorMembers.length) {
    add("unavailable-ratio-members", "Unavailable evidence cannot claim numerator or denominator members.");
  }

  const navigation = bundle.navigationTarget.evidenceContext;
  if (
    navigation.asOfAt !== bundle.asOfAt ||
    navigation.snapshotRevision !== bundle.snapshotRevision ||
    navigation.metric.id !== bundle.metric.id ||
    navigation.metric.version !== bundle.metric.version
  ) {
    add("navigation-context-mismatch", "Open-the-work context must match the evidence definition and snapshot.");
  }
  if (!sameFilters(bundle.filters, bundle.navigationTarget.filters)) {
    add("navigation-filter-mismatch", "Open-the-work must carry the exact evidence filters.");
  }

  return issues;
}
