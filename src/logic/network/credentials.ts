import type { CredentialRecord, ReporterId, UtcTimestamp } from "../../contracts/v2";
import type { NetworkReporterRow } from "./index";
import { before, ms } from "./support";

export function latestCredentials(records: readonly CredentialRecord[], reporterId: ReporterId, asOfAt: UtcTimestamp) {
  const latest = new Map<string, CredentialRecord>();
  for (const record of records.filter((item) => item.reporterId === reporterId && before(item.recordedAt, asOfAt))) {
    const key = `${record.jurisdictionScope ?? "national"}:${record.label}`;
    const prior = latest.get(key);
    if (!prior || ms(record.recordedAt) >= ms(prior.recordedAt)) latest.set(key, record);
  }
  return [...latest.values()];
}

/** Legacy compliance labels describe source evidence review, never jurisdictional eligibility. */
export function credentialProjection(records: readonly CredentialRecord[], reporterId: ReporterId, asOfAt: UtcTimestamp): Pick<NetworkReporterRow, "certificationSummary" | "compliance"> {
  const current = latestCredentials(records, reporterId, asOfAt);
  if (!current.length) return { certificationSummary: "No credential evidence recorded", compliance: { state: "needs-check", evidenceLabel: "No credential evidence recorded" } };
  const jurisdictions = [...new Set(current.map((record) => record.jurisdictionScope).filter((scope): scope is string => scope !== null))];
  const labels = [...new Set(current.map((record) => record.label).filter((label) => !jurisdictions.includes(label)))];
  const certificationSummary = [...jurisdictions, ...labels].join(" · ");
  const reviewAt = ms(asOfAt) + 28 * 86_400_000;
  if (current.some((record) => record.verificationStatus !== "verified" || (record.validFrom !== null && ms(record.validFrom) > ms(asOfAt)) || (record.validUntil !== null && ms(record.validUntil) <= ms(asOfAt)))) return { certificationSummary, compliance: { state: "needs-check", evidenceLabel: "Credential evidence needs review" } };
  if (current.some((record) => record.validUntil !== null && ms(record.validUntil) <= reviewAt)) return { certificationSummary, compliance: { state: "expiring", evidenceLabel: "Verified credential expires within 28 days" } };
  return { certificationSummary, compliance: { state: "clear", evidenceLabel: "Verified credential evidence current" } };
}
