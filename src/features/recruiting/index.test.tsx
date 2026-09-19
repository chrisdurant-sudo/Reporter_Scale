import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkspaceQueryContext, UtcTimestamp } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { prepareRecruitingWorkspace } from "../../logic/recruiting";
import { RecruitingScreen } from "./index";
afterEach(cleanup);
const snapshot=DEMO_SNAPSHOT_V2;
const context:WorkspaceQueryContext<"recruiting">={workspace:"recruiting",evaluation:{asOfAt:snapshot.currentAsOfAt,snapshotRevision:snapshot.revision,reportingTimeZone:"America/Los_Angeles" as WorkspaceQueryContext<"markets">["evaluation"]["reportingTimeZone"]},filters:{selectedMarket:"ALL",marketBasis:"recruiting-market-at-entry",marketIds:[],reporterIds:[],acquisitionCaseIds:[],requestIds:[],workItemIds:[],programIds:[],programEnrollmentIds:[],sourceIds:[],jobOutcomeIds:[],capabilityCodes:[],attendanceModes:[],recordRefs:[],window:{startAt:"2026-01-01T00:00:00Z" as UtcTimestamp,endAt:"2026-02-01T00:00:00Z" as UtcTimestamp,boundary:"[start,end)"}}};
const view=prepareRecruitingWorkspace(snapshot,context);const props={view,onOpenWork:vi.fn(),onWhyThis:vi.fn()};
describe("RecruitingScreen",()=>{
 it("labels People inventory separately from the active people summarized in Bottlenecks",()=>{
  const {rerender}=render(<RecruitingScreen {...props}/>);
  expect(screen.getByText("113 records shown")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"Bottlenecks",exact:true}));
  expect(screen.getByText("66 active people summarized")).toBeVisible();
  expect(screen.queryByText("113 records shown")).not.toBeInTheDocument();
  const applicantView=prepareRecruitingWorkspace(snapshot,context,{filters:{status:"Applicant"}});
  rerender(<RecruitingScreen {...props} view={applicantView}/>);
  expect(screen.getByText("11 active people summarized")).toBeVisible();
  fireEvent.click(screen.getByRole("button",{name:"People",exact:true}));
  expect(screen.getByText("11 records shown")).toBeVisible();
 });
 it("renders mature-cohort denominators separately from current inventory and sends focus/clear filters",()=>{const change=vi.fn();const {rerender}=render(<RecruitingScreen {...props} onChangeRecordFilters={change}/>);expect(screen.getByText("First job in 14 days")).toBeVisible();expect(screen.getByText(/17 \/ 51 mature · 14-day/)).toBeVisible();fireEvent.click(screen.getByRole("button",{name:/Applicant \d+/}));expect(change).toHaveBeenLastCalledWith({status:"Applicant"});rerender(<RecruitingScreen {...props} view={{...view,recordFilters:{status:"Applicant"}}} onChangeRecordFilters={change}/>);fireEvent.click(screen.getByRole("button",{name:/Applicant \d+/}));expect(change).toHaveBeenLastCalledWith({status:undefined});expect(screen.getByRole("button",{name:"R28"})).toHaveAttribute("aria-pressed","true");});
 it("passes stable owner/wait keys and uses prepared rows without local filtering",()=>{const change=vi.fn();render(<RecruitingScreen {...props} onChangeRecordFilters={change}/>);const owner=view.ownerFilterOptions.find((o)=>o.memberId)!;fireEvent.change(screen.getByRole("combobox",{name:"Owner"}),{target:{value:owner.memberId}});expect(change).toHaveBeenLastCalledWith({ownerId:owner.memberId});const waiting=view.waitingOnFilterOptions[0]!;fireEvent.change(screen.getByRole("combobox",{name:"Waiting on"}),{target:{value:waiting.key}});expect(change).toHaveBeenLastCalledWith({waitingOnKey:waiting.key});expect(screen.getAllByRole("textbox",{name:/Notes for/})).toHaveLength(view.currentCases.length);});
 it("keeps draft whitespace and commits notes only on blur",()=>{const onLocalNoteCommand=vi.fn();render(<RecruitingScreen {...props} onLocalNoteCommand={onLocalNoteCommand}/>);const person=view.currentCases[0]!;const input=screen.getByRole("textbox",{name:`Notes for ${person.reporterName}`});fireEvent.change(input,{target:{value:"  Quality note  "}});expect(input).toHaveValue("  Quality note  ");expect(onLocalNoteCommand).not.toHaveBeenCalled();fireEvent.blur(input);expect(onLocalNoteCommand).toHaveBeenCalledWith({type:"recruiting.local-note.set",target:{kind:"candidate",acquisitionCaseId:person.acquisitionCaseId},text:"  Quality note  "});});
 it("retains the editable SLA draft while issuing valid immediate updates",()=>{const changed=vi.fn();render(<RecruitingScreen {...props} onChangeSlaInput={changed}/>);fireEvent.click(screen.getByRole("button",{name:"Edit SLAs"}));const input=screen.getByRole("spinbutton",{name:"Onboarding SLA in days"});fireEvent.change(input,{target:{value:""}});expect(changed).not.toHaveBeenCalled();fireEvent.change(input,{target:{value:"90"}});expect(input).toHaveValue(90);expect(changed).toHaveBeenCalledWith({defaultSet:{statusDays:{Onboarding:90}}});});
});
