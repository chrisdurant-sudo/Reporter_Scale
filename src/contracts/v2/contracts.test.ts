import { describe, expect, it } from "vitest";
import { v2 } from "../index";
import type {
  CapabilityCode,
  DemandRequest,
  IanaTimeZone,
  ProceedingTypeCode,
  RequestId,
  UtcTimestamp,
} from "./index";

describe("Reporter Growth v2 source contracts", () => {
  it("freezes the five workspace and five market identifiers", () => {
    expect(v2.V2_WORKSPACE_IDS).toEqual(["markets", "recruiting", "reporters", "team", "programs"]);
    expect(v2.V2_MARKET_IDS).toEqual(["LAX", "SFO", "DFW", "ORD", "ATL"]);
    expect(v2.REPORTING_TIME_ZONE).toBe("America/Los_Angeles");
  });

  it("allows a demand request to exist without an assigned reporter", () => {
    const request: DemandRequest = {
      id: "req-lax-101" as RequestId,
      marketId: "LAX",
      createdAt: "2026-02-12T17:00:00Z" as UtcTimestamp,
      recordedAt: "2026-02-12T17:00:00Z" as UtcTimestamp,
      startAt: "2026-02-23T18:00:00Z" as UtcTimestamp,
      endAt: "2026-02-23T21:00:00Z" as UtcTimestamp,
      timeZone: "America/Los_Angeles" as IanaTimeZone,
      proceedingType: "deposition" as ProceedingTypeCode,
      attendanceMode: "remote",
      requiredCapabilityCodes: ["realtime-transcription" as CapabilityCode],
      sampleCredentialRequirements: [],
      requirementsVersion: "sample-realtime-policy-v1",
      status: "open",
      canceledAt: null,
      cancellationReason: null,
      agreedDeliveryAt: null,
      provenance: "synthetic-demo",
    };

    expect(request.status).toBe("open");
    expect(Object.hasOwn(request, "reporterId")).toBe(false);
    expect(Object.hasOwn(request, "assignmentId")).toBe(false);
  });
});
