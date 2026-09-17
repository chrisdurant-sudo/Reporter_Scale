import type { MetricDefinitionId } from "./ids";

declare const valueBrand: unique symbol;

export type UtcTimestamp = string & { readonly [valueBrand]: "UtcTimestamp" };
export type IanaTimeZone = string & { readonly [valueBrand]: "IanaTimeZone" };
export type CapabilityCode = string & { readonly [valueBrand]: "CapabilityCode" };
export type ProceedingTypeCode = string & { readonly [valueBrand]: "ProceedingTypeCode" };
export type CurrencyCode = string & { readonly [valueBrand]: "CurrencyCode" };
export type DefinitionVersion = string & { readonly [valueBrand]: "DefinitionVersion" };
export type MinorCurrencyAmount = number & { readonly [valueBrand]: "MinorCurrencyAmount" };

export const V2_MARKET_IDS = ["LAX", "SFO", "DFW", "ORD", "ATL"] as const;
export type MarketId = (typeof V2_MARKET_IDS)[number];
export type SelectedMarket = "ALL" | MarketId;

export const V2_WORKSPACE_IDS = ["markets", "recruiting", "reporters", "team", "programs"] as const;
export type WorkspaceId = (typeof V2_WORKSPACE_IDS)[number];

export const REPORTING_TIME_ZONE = "America/Los_Angeles" as IanaTimeZone;

export type AttendanceMode = "remote" | "in-person";
export type DemoProvenance = "synthetic-demo" | "demo-simulation";

export interface DateWindow {
  readonly startAt: UtcTimestamp;
  readonly endAt: UtcTimestamp;
  readonly boundary: "[start,end)";
}

export interface MetricDefinitionRef {
  readonly id: MetricDefinitionId;
  readonly version: DefinitionVersion;
}

export type MarketBasis =
  | "all-markets"
  | "recruiting-market-at-entry"
  | "service-market"
  | "demand-market"
  | "job-market"
  | "program-market-at-entry";

export interface MetricEvaluationContext {
  readonly asOfAt: UtcTimestamp;
  readonly snapshotRevision: number;
  readonly reportingTimeZone: IanaTimeZone;
}
