# P4 design lock

Status: **USER-APPROVED DESIGN — PRODUCTION IMPLEMENTATION NOT AUTHORIZED**

Locked: September 17, 2026

This document freezes the approved P4 presentation and interaction outcome. It corrects the earlier
P4 concepts that reintroduced verbose headings, mission cards, step labels, repeated evidence, and
separate feature compositions. Implementation must reproduce this contract as one coherent product,
using the existing V2 records, calculations, commands, and safety boundaries.

The lock is a product specification, not permission to edit `src/`, install dependencies, launch P4
workers, deploy, or alter agent roles. A later explicit implementation instruction is still required.

## Precedence

For P4 presentation and interaction, this document supersedes conflicting material in:

- `P4_EXPERIENCE_REDESIGN.md`;
- `P4_ACCEPTANCE.md` before its locked-design amendment;
- the earlier workspace composition in `SCREEN_CONTRACTS.md`; and
- any task brief that asks for step labels, mission/progress cards, question-led introductions,
  repeated `Why this?` controls, or independently designed feature screens.

Canonical data meanings, metric definitions, evidence reconstruction, no-real-message behavior,
synthetic-data boundaries, and command safety are not superseded.

## Versioned visual reference

The literal approved composition is stored in
[`design-lock/reference-manifest.md`](design-lock/reference-manifest.md). Its interactive reference,
desktop/mobile screenshots, open SLA/Add work states, capture script, and checksums are part of this
lock. Implementation, Quality, and Reviewer must compare against that package; prose-only
interpretation is insufficient.

The visual package governs presentation. Frozen V2 source, metric, evidence, command, and safety
contracts continue to govern what the displayed values and actions mean.

## Exact shell

The default desktop composition is:

1. `Provider growth command center` as the single product heading.
2. One compact **Focus** badge on the right with the current workspace condition.
3. One persistent market switcher: **All / LAX / SFO / DFW / ORD / ATL**. `All` is the default.
4. Five equal navigation labels only: **Overview / Funnel / Reporters / Team / Programs**.
5. The active workspace content.

Do not add text above or below a tab label. In particular, do not render `Step X`, workspace
descriptions, or operating-loop subtitles.

Do not render beneath the product heading:

- selected-market/date/demo metadata prose;
- a question-led workspace heading or orientation paragraph;
- `Looks right` / `Needs revision` controls;
- a mission card, mission progress bar, next-milestone paragraph, or repeated workspace purpose; or
- the canvas-only `What should change on …` field and discussion button.

## Shared composition

- Use at most four compact KPI cells at the start of each workspace.
- Keep labels short and use common language.
- Put workspace-specific view controls directly below the KPIs.
- Overview, Funnel, Reporters, and Programs may use a two-column attention/chart section.
- Team replaces that section with its work board; it has no `What needs attention` panel.
- Working records use a dense, Fleet Readiness-style grid with search and only useful filters.
- Wide grids scroll inside their section; the page itself does not scroll horizontally.
- Color must always be paired with a text label such as `Under`, `At`, `Over`, `Clear`, or the named
  status.
- Tables, filters, charts, badges, controls, and spacing must look like one system across all tabs.

The reference behavior comes from the compact status filters, searchable roster, sort controls, and
trend-selection model in <https://lax-market.vercel.app/#fleet> and
<https://lax-market.vercel.app/trends?section=fleet&range=R7&status=READY>. Copy the interaction
clarity, not the brand, fleet terminology, colors, or claims.

## Overview

Navigation label: **Overview**. Do not call this tab `Markets` in the navigation.

Required content:

- persistent All-first market switcher;
- KPIs: market count, available reporters, open jobs, and projected additional need;
- view controls: **Trends / Overview / Projection on|off**;
- an attention list of no more than three concise items;
- a responsive supply, demand, and needed-supply time-series chart;
- solid historical lines and dashed projected lines with a visible forecast boundary;
- four compact connected summaries for Markets, Funnel, Team, and Programs;
- a market grid with supply direction, demand direction, gap, and next step; and
- selected-market filtering that updates the market row and chart scale.

## Funnel

Required content:

- KPIs: people in funnel, people needing follow-up, slowest step, and percent that started work;
- view controls: **People / Bottlenecks / Edit SLAs**;
- one editable SLA set per market plus a default All-market set;
- one overall funnel SLA and one SLA for each status:
  **Applicant / Screening / Approved / Onboarding / Starting soon**;
- an `R7 / R28` wait-time chart inspired by the reference Trends view;
- chart status controls for every funnel status;
- a visible SLA reference line and `Under SLA`, `At SLA`, or `Over SLA` result;
- Fleet Readiness-style status filters with counts, candidate search, waiting-on filter, and sort;
- columns: candidate, market, status, next step, waiting on, total time in funnel, time in status,
  and notes;
- total and status time shown against their applicable market SLA; and
- editable free-text candidate/process notes.

SLA color semantics are fixed:

- green plus `Under` when elapsed days are below the SLA;
- amber plus `At` when elapsed days equal the SLA; and
- red plus `Over` when elapsed days exceed the SLA.

Changing a market SLA immediately recomputes the visual SLA state. It does not alter lifecycle facts.

## Reporters

Required content:

- KPIs: ready, active within 28 days, inactive for 28 or more days, and licenses to check;
- view controls: **Ready / Activity**;
- a concise readiness/activity visual;
- a searchable/filterable reporter grid;
- columns: reporter, market, skills, certifications, preferences, last active, compliance, and
  follow-up;
- `N days ago` last-active values, with 28 days as the initial churn-review threshold;
- state-market credentials using the applicable state abbreviations for CA, TX, IL, and GA plus
  national credentials such as RPR and CRR;
- a visible compliance result for clear, expiring, or missing license/continuing-education evidence;
  and
- the three existing follow-up actions:
  **Confirm availability / Create re-engagement task / Inspect checklist**.

The 28-day threshold identifies review work; it does not assert churn, unwillingness, or
unavailability.

## Team

Required content:

- KPIs: open tasks, tasks with no owner, programs owned, and coaching due;
- view controls: **Work / Goals**;
- no `Late` KPI or `Late` column;
- no `What needs attention` box;
- a Kanban-style board with **To do / In progress / Done** columns;
- work cards showing title, owner, ownership domain, and linked program/campaign when present;
- an **Add work** control with title, owner, status, domain, and optional linked program/campaign;
- ownership domains including sourcing, screening, onboarding, market, and program work; and
- a compact member table with member, owned domain, open work, goal, and coaching.

The board manages work, not employee rank or performance scores.

## Programs

Required content:

- KPIs: running, review now, expanding, and stopped;
- view controls: **Programs / Results**;
- an attention list of no more than three concise items;
- a result-over-time chart with the declared target and a clear target-met point;
- a Fleet Readiness-style program grid with search plus Type and Status filters;
- Type options: **Experiment / Campaign / Sourcing / Process**;
- columns: type, program/status, market, brief, implementation date, review date, goal,
  results so far, notes, next step, and source;
- editable free-text notes and next step; and
- a source value that identifies the actual synthetic workflow source, including one-off sources such
  as Google Sheet, ATS export, manual tracker, or synthetic events.

Program filters and the shared market selector constrain the grid. Stopped work stays visible when
selected and retains its result, notes, next step, and source.

## Synthetic sample depth

P4 includes the balanced source-record expansion in
[`P4_SYNTHETIC_SAMPLE_EXPANSION.md`](P4_SYNTHETIC_SAMPLE_EXPANSION.md): exactly 50 additional
canonical fictional people, ten per market. Funnel and Reporters consume the same identities and
histories. The expansion must provide useful per-market stage, SLA, activity, credential, and
compliance variation without changing the visual composition or manufacturing conclusions.

## Interaction state

The interface preserves, at minimum:

- active workspace;
- selected market;
- local view;
- projection setting;
- funnel chart range and status;
- selected funnel status filters;
- per-market SLA values;
- candidate notes;
- program type/status filters, notes, and next steps; and
- Team work added through the board.

Presentation state must never create readiness, acceptance, completion, program success, or rollout.
Production actions continue to use the existing safe command layer.

## Responsive lock

- At 1024px and wider, preserve the approved balanced desktop hierarchy.
- At tablet widths, stack the chart/attention grid and keep filters wrapping in place.
- At phone width, stack KPIs, SLA fields, Kanban columns, and add-work fields.
- Funnel, Reporters, and Programs grids may scroll only inside their table container.
- Charts resize from their actual container and retain readable axes and labels.

## Implementation ownership

The Experience Lead implements and freezes the shared shell, styles, component system, Overview, and
Funnel. Only after the Overview/Funnel proof is accepted, three Experience specialists may implement
Reporters, Team, and Programs in parallel, with exactly one non-overlapping feature path apiece. They
must reuse the frozen shared system, send component questions and candidate/reference screenshots to
the Lead, and receive the Lead's fidelity review before integration. The Lead alone may change shared
components and may not edit a specialist's feature path.

Domain roles may provide bounded prepared-view or command repairs only after a concrete contract gap
is proven. They have no presentation ownership. This gated hub-and-spoke model does not recreate P3's
domain-owned screen fan-out.

## Change control

This is lock version 3. Version 2 added the September 17, 2026 balanced 50-person synthetic sample.
Version 3 adds gated multi-Experience implementation after the visual proof without changing the
approved composition or sample. Minor user-approved adjustments must be recorded as a dated amendment
here and mirrored in `P4_ACCEPTANCE.md`. No implementation agent may reinterpret or replace the
composition because an older plan, task brief, or existing screen differs.
