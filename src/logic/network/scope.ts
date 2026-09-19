import type { CapabilityVerification, DemoSnapshotV2, JobOutcome, Reporter, UtcTimestamp, WorkspaceFilterPayload } from "../../contracts/v2";
import { before, includes, known, marketMatches, ref } from "./support";

/** Every ID family intersects; recordRefs is a union within its family, never an override. */
export function reporterMatches(snapshot: DemoSnapshotV2, reporter: Reporter, filters: WorkspaceFilterPayload, asOf: UtcTimestamp, jobs: readonly JobOutcome[], capabilities: readonly CapabilityVerification[]) {
  if (filters.matchNone || !includes(filters.reporterIds, reporter.id)) return false;
  const cases = (snapshot.acquisitionCases ?? []).filter((item) => item.reporterId === reporter.id && before(item.openedAt, asOf) && before(item.recordedAt, asOf) && includes(filters.acquisitionCaseIds, item.id) && (!filters.sourceIds.length || (item.primarySourceId !== null && filters.sourceIds.includes(item.primarySourceId))));
  if ((filters.acquisitionCaseIds.length || filters.sourceIds.length) && !cases.length) return false;
  const enrollments = (snapshot.programEnrollments ?? []).filter((item) => cases.some((acq) => acq.id === item.acquisitionCaseId) && before(item.enteredAt, asOf) && includes(filters.programEnrollmentIds, item.id) && includes(filters.programIds, item.programId));
  if (filters.programEnrollmentIds.length && !enrollments.length) return false;
  if (filters.programIds.length && !enrollments.length && !cases.some((item) => item.originProgramId !== null && filters.programIds.includes(item.originProgramId))) return false;
  const work = snapshot.workItems.filter((item) => before(item.createdAt, asOf) && includes(filters.workItemIds, item.id) && ((item.primaryEntityRef.kind === "reporter" && item.primaryEntityRef.id === reporter.id) || (item.primaryEntityRef.kind === "acquisition-case" && cases.some((acq) => acq.id === item.primaryEntityRef.id))));
  if (filters.workItemIds.length && !work.length) return false;
  const assignments = snapshot.assignmentEvents.filter((item) => item.reporterId === reporter.id && known(item, asOf));
  const requests = snapshot.demandRequests.filter((item) => before(item.createdAt, asOf) && before(item.recordedAt, asOf) && includes(filters.requestIds, item.id) && (assignments.some((event) => event.requestId === item.id) || work.some((task) => task.relatedRequestIds.includes(item.id))));
  const personJobs = jobs.filter((item) => item.reporterId === reporter.id && includes(filters.jobOutcomeIds, item.id) && includes(filters.requestIds, item.requestId));
  if (filters.requestIds.length && !requests.length) return false;
  if (filters.jobOutcomeIds.length && !personJobs.length) return false;
  if (!filters.capabilityCodes.every((code) => capabilities.some((item) => item.capabilityCode === code && item.status === "verified"))) return false;
  if (filters.attendanceModes.length && !filters.attendanceModes.some((mode) => reporter.preferences.attendanceModes?.includes(mode))) return false;
  const basis = filters.marketBasis;
  const markets = basis === "job-market" ? personJobs.flatMap((job) => snapshot.demandRequests.filter((request) => request.id === job.requestId).map((request) => request.marketId))
    : basis === "demand-market" ? requests.map((request) => request.marketId)
    : basis === "recruiting-market-at-entry" ? cases.map((item) => item.ownerMarketId)
    : basis === "program-market-at-entry" ? enrollments.map((item) => item.marketAtEntry)
    : reporter.serviceMarketIds;
  if ((filters.selectedMarket !== "ALL" || filters.marketIds.length) && !markets.some((market) => marketMatches(market, filters))) return false;
  if (!filters.recordRefs.length) return true;
  const refs = [ref("reporter", reporter.id), ...markets.filter((market) => marketMatches(market, filters)).map((market) => ref("market", market)),
    ...cases.flatMap((item) => [ref("acquisition-case", item.id), ...(item.primarySourceId ? [ref("source", item.primarySourceId)] : []), ...(item.originProgramId ? [ref("program", item.originProgramId)] : [])]),
    ...enrollments.flatMap((item) => [ref("program-enrollment", item.id), ref("program", item.programId)]),
    ...work.map((item) => ref("work-item", item.id)),
    ...requests.filter((item) => !filters.jobOutcomeIds.length || personJobs.some((job) => job.requestId === item.id)).map((item) => ref("demand-request", item.id)),
    ...personJobs.map((item) => ref("job-outcome", item.id)),
    ...assignments.filter((item) => includes(filters.requestIds, item.requestId) && (!filters.jobOutcomeIds.length || personJobs.some((job) => job.acceptedAssignmentEventId === item.id))).map((item) => ref("assignment-event", item.id)),
    ...snapshot.lifecycleEvents.filter((item) => item.reporterId === reporter.id && known(item, asOf)).map((item) => ref("lifecycle-event", item.id)),
    ...snapshot.readinessEvents.filter((item) => item.reporterId === reporter.id && known(item, asOf)).map((item) => ref("readiness-event", item.id)),
    ...snapshot.capabilityVerifications.filter((item) => item.reporterId === reporter.id && before(item.recordedAt, asOf)).map((item) => ref("capability-verification", item.id)),
    ...(snapshot.credentialRecords ?? []).filter((item) => item.reporterId === reporter.id && before(item.recordedAt, asOf)).map((item) => ref("credential-record", item.id)),
    ...snapshot.availabilityWindows.filter((item) => item.reporterId === reporter.id && before(item.recordedAt, asOf) && item.serviceMarketIds.some((market) => marketMatches(market, filters)) && (!filters.attendanceModes.length || item.attendanceModes.some((mode) => filters.attendanceModes.includes(mode)))).map((item) => ref("availability-window", item.id)),
    ...(snapshot.screeningReviews ?? []).filter((item) => cases.some((acq) => acq.id === item.acquisitionCaseId) && before(item.reviewedAt, asOf) && before(item.recordedAt, asOf)).map((item) => ref("screening-review", item.id)),
    ...(snapshot.onboardingSteps ?? []).filter((item) => cases.some((acq) => acq.id === item.acquisitionCaseId) && before(item.recordedAt, asOf)).map((item) => ref("onboarding-step", item.id)),
  ];
  return filters.recordRefs.some((wanted) => refs.some((item) => item.kind === wanted.kind && item.id === wanted.id));
}
