import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceQueryContext } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { prepareMarketsWorkspace } from "../../logic/capacity";
import { MarketsV2Screen } from "./MarketsV2Screen";
afterEach(cleanup);
const snapshot = DEMO_SNAPSHOT_V2;
const context: WorkspaceQueryContext<"markets"> = {workspace:"markets",evaluation:{asOfAt:snapshot.currentAsOfAt,snapshotRevision:snapshot.revision,reportingTimeZone:"America/Los_Angeles" as WorkspaceQueryContext<"markets">["evaluation"]["reportingTimeZone"]},filters:{selectedMarket:"LAX",marketBasis:"service-market",marketIds:[],reporterIds:[],acquisitionCaseIds:[],requestIds:[],workItemIds:[],programIds:[],programEnrollmentIds:[],sourceIds:[],jobOutcomeIds:[],capabilityCodes:[],attendanceModes:[],recordRefs:[],window:null}};
const view=prepareMarketsWorkspace(snapshot,context);
const props={view,onOpenEvidence:vi.fn(),onPreviewGoal:vi.fn(),onSaveGoal:vi.fn(),onSelectMarket:vi.fn()};
describe("MarketsV2Screen",()=>{
 it("uses scheduling slots and distinguishes absent goals from saved targets",()=>{render(<MarketsV2Screen {...props}/>);const metrics=screen.getByRole("region",{name:"Overview metrics"});expect(within(metrics).getByText("Requested slots").parentElement).toHaveTextContent("10");expect(within(metrics).getByText("Confirmed slots").parentElement).toHaveTextContent("6");expect(within(metrics).getByText("Unresolved slots").parentElement).toHaveTextContent("4");expect(within(metrics).getByText("No growth goal saved")).toBeVisible();expect(screen.queryByText("Available reporters")).not.toBeInTheDocument();});
 it("uses each attention row's exact evidence and target and preserves workspace navigation",()=>{const inspect=vi.fn(),navigate=vi.fn(),workspace=vi.fn();render(<MarketsV2Screen {...props} onInspectEvidence={inspect} onNavigateTarget={navigate} onNavigateWorkspace={workspace}/>);fireEvent.click(screen.getAllByRole("button",{name:"Why this?"})[0]!);expect(inspect).toHaveBeenCalledWith(view.overview!.attention[0]!.evidence);fireEvent.click(screen.getAllByRole("button",{name:"Open the work →"})[0]!);expect(navigate).toHaveBeenCalledWith(view.overview!.attention[0]!.navigationTarget);expect(navigate.mock.calls[0]![0].filters.requestIds).toHaveLength(2);fireEvent.click(screen.getByRole("button",{name:"View Funnel"}));expect(workspace).toHaveBeenCalledWith("recruiting");fireEvent.click(screen.getByRole("button",{name:"Projection on"}));expect(screen.getByRole("button",{name:"Projection off"})).toHaveAttribute("aria-pressed","false");});
 it("does not relabel another market's plan as LAX",()=>{render(<MarketsV2Screen {...props} view={prepareMarketsWorkspace(snapshot,{...context,filters:{...context.filters,selectedMarket:"DFW"}})}/>);expect(screen.queryByRole("button",{name:"LAX original plan"})).not.toBeInTheDocument();});
});
