# P4_VISUAL_PROOF_READY — Experience Lead

Source edits stopped. Candidate is ready for coordinator inspection, not self-approved or integrated.

- Worktree: /private/tmp/steno-interview-ip2-experience
- Branch: codex/interview-ip2-experience
- Exact base: f7a6fc734513ba8621a7dbf3b1845f818d420658
- Exact clean candidate: be5d7a1d3a634f4a29243e09993661cef7264c1c
- Frozen reference: d4b4ff98a3ee9e9fd1bffe829a6b747ab34670d1, docs/reporter-growth/v2/design-lock/interview-2026-09-19/reference-manifest.json
- Historical reference preserved: docs/reporter-growth/v2/design-lock/reference-manifest.md
- User's latest scope: desktop only. Required core proof is1440×900. No new phone/tablet proof or optimization.

## Changed paths

src/features/markets/MarketsV2Screen.tsx
src/features/markets/MarketsV2Screen.test.tsx
src/features/recruiting/index.tsx
src/features/recruiting/index.test.tsx
src/shell/V2AppShell.tsx
src/shell/V2AppShell.test.tsx
src/styles/tokens.css
src/ui/interview.tsx
src/ui/interview.test.tsx
src/ui/presentationFormat.ts

Only the allowed presentation paths changed. No data, logic, contracts, integration, configuration, dependencies, repository docs or Quality tests changed.

## Checks and honest limits

- Lane audit exit0: npm run verify:p4:lane -- --lane experience --base f7a6fc734513ba8621a7dbf3b1845f818d420658 --candidate be5d7a1d3a634f4a29243e09993661cef7264c1c. lane-audit.log.
- Lint exit0; typecheck exit0; build exit0. lint.log, typecheck.log, build.log.
- Owned presentation tests exit0:23 tests/8files. owned-tests.log.
- Exact candidate full unit run exit1:313/314 passed. unit-final.json. Sole failure is coordinator App.test.tsx looking for the old attention button text, “Inspect the affected requests and missing readiness evidence.” Coordinator reports its replacement selector is ready on its branch. Source now has a row-specific Why this? and Open the work →, with exact prepared two-request target.
- Existing independent acceptance exit1:7/9 passed. acceptance.log. Old Overview KPI names and old chart img/accessible-name expectation conflict with amendment; no assertions changed here.
- Existing independent browser exit1:4/8 passed. existing-browser.log. Failure pairs in desktop and the historical mobile project expect old img chart semantics, exclusion-on-first-status-click and one unscoped Why this? button. The new contextual row controls intentionally provide multiple evidence buttons. Existing browser command includes its old mobile project; no phone-specific source work or new proof artifacts were added.
- Governance readiness203 checks passed; phase gate exit1 requires the recorded coordinator checkout. governance.log. Coordinator must run its full governance/integration gate.
- Actual desktop proof exit0:19 recorded checks, no page or console errors. proof-manifest.json. pointer_keyboard_passed:true. All artifacts declare the exact clean candidate.
- Initial TS/Vite sandbox calls failed EPERM because installed node_modules is a symlink to caches outside worker writable roots; scoped escalated reruns succeeded. Initial Chromium sandbox launch failed MachPort bootstrap permission; scoped launch succeeded. No installations or permission/configuration changes made.
- Intermediate lint/build/test defects (ref write in render, formatter export warning, branded test timezone, test cleanup and named-main compatibility) were repaired before this candidate. The final owned checks above passed.

## Reproducible artifact package

Directory: /private/tmp/steno-ip2-source-proof
- proof.mjs reproduces captures and actual interactions against http://127.0.0.1:5186.
- proof-manifest.json records candidate, clean state, route, viewport, state, SHA256 per image,19 interaction checks and empty browser-error list.
- SHA256SUMS lists the16 final image checksums.
- Four core artifacts: overview_1440x900.png, funnel_people_1440x900.png, funnel_bottlenecks_1440x900.png, funnel_sla_editor.png.
- Additional states: overview_chart_keyboard, weekly_review, weekly_measures, overview_attention_evidence, overview_exact_attention, funnel_source_filter, funnel_sla_filter, funnel_february_cohort, funnel_person_detail, funnel_bottleneck_table, funnel_people_filters, original_plan_delivered (all .png).
- Earlier checkpoint/working images are interim and not final proof; use only manifest artifacts.

Browser proof covers All+five markets through five workspaces; exact chart pointer/keyboard observations and projection; weekly direct evidence and modal keyboard containment/focus return; precise LAX req109/110 attention scope; status focus/clear; stable owner/wait/source selections; search,sort,SLA/empty-state filters; January/February cohort separate from inventory; M08 evidence; inline LAX90/SFO11 SLA draft isolation and recomputation; candidate notes and focus return; all five capacity milestones; original ten-slot LAX10completed/2firstjobs and reset. Desktop document width equals1440; scrollWidth1440.

## Reference comparison and presentation differences

Preserves shell, contiguous navy tabs, green/amber signals, 0.85/1.35 attention/chart layout, compact white panels, dense tables, shared right drawer, inline SLA editor and cohort-before-inventory placement. Source-backed charts use measured container coordinates and one keyboard target rather than hundreds of independent marks. Separate people/slot/count-gap units remain explicit. Default no-goal state is distinct from saved goal progress; delivery remains distinct from live scheduling demand. Weekly calculations/limitations stay available in expandable evidence sections.

Cross-workspace cards use honest navigation copy because Overview has no prepared aggregate task/program headline counts. They do not manufacture hardcoded findings from the illustrative prototype. Current People inventory displays all113 canonical case records (66 active), with explicit active KPI versus records-shown labels. Filtered rows, counts, status summaries and cohort results all come from prepared views; presentation does not recompute business metrics.

## Shared component/API contract for specialists

Import from src/ui/interview.tsx:
- Panel({title,tools?,children,className?}): shared titled white panel.
- Drawer({title,eyebrow?,children,onClose,closeLabel?}): native modal dialog; focus on close, native keyboard containment/Escape, opener restoration. Callers retain their actual canonical form state/errors. To hand off to root evidence/navigation from a local drawer, close local state then requestAnimationFrame(callback), allowing opener restoration before root captures it. Do not place another Drawer inside an open Drawer.
- TimeSeriesChart({label,points,series,boundaryAt?,threshold?,note}): points are {at,phase?,values}; series {id,label,color,unit}. Prepared values only. Null creates a gap. Date-proportional coordinates, ResizeObserver sizing, whole-count visual ticks, known/forecast strokes/boundary, pointer nearest point and ArrowLeft/Right/Home/End exact readout. No canonical calculations inside this component.
- CategoryComparison({label,unit,observations,benchmark?,onInspect?}): observations {id,label,value,valueLabel,detail,unavailableReason?}. Separate categorical bars, formatted exact count/rate plus denominator detail; no connected cohort lines. Optional inspect callback passes category ID. Callers map the ID to their prepared evidence. Benchmark must be supplied by the prepared API.
- displayDate/displayNumber from src/ui/presentationFormat.ts: presentation formatting only.

Shared CSS classes: ip2-workspace, ip2-panel, ip2-actions, ip2-scope, ip2-filters, ip2-form, ip2-review-row, ip2-facts, ip2-category. Existing primitives and consumers remain available. The Lead remains sole writer for shared files; specialists must request shared repairs rather than copying primitives. Root-owned .v2-linked-selection is styled, not rebuilt.

## Runtime handoff

Local Vite preview remains live on127.0.0.1:5186, process PID84979, exec session62652. It serves the clean candidate worktree. Proof/browser/test processes have finished; no pending approval or active mutation. Repository status is clean. Do not merge or treat this as accepted until coordinator review, authorized test alignment and independent checks pass.
