import type {
  DefinitionVersion,
  DemoProvenance,
  IanaTimeZone,
  MarketId,
  MetricDefinitionRef,
  UtcTimestamp,
} from "./common";
import type { EvidenceUnit } from "./evidence";

export interface Market {
  readonly id: MarketId;
  readonly code: MarketId;
  readonly name: string;
  readonly timeZone: IanaTimeZone;
  readonly provenance: DemoProvenance;
}

export interface MetricDefinition extends MetricDefinitionRef {
  readonly version: DefinitionVersion;
  readonly unit: EvidenceUnit;
  readonly description: string;
  readonly timeWindowSemantics: string;
  readonly populationRule: string;
  readonly attributionRule: string;
}

export interface ManualMarketNote {
  readonly id: string;
  readonly marketId: MarketId;
  readonly kind: "manual-note";
  readonly authorLabel: string;
  readonly text: string;
  readonly createdAt: UtcTimestamp;
  readonly provenance: DemoProvenance;
}
