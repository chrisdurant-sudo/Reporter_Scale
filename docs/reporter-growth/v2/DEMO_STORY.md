# The demonstration story

All names, timings, counts, and decisions below are **designed synthetic examples**, not observations of Steno. The exact anchor IDs and expected checkpoints are in [scenario_contract.json](scenario_contract.json).

## Opening sentence

> LAX has ten upcoming remote realtime depositions. Six have a reporter confirmed. Two have suitable available reporters to contact. Two have no verified ready match. Let's inspect the gap before deciding to recruit.

A “job” in this bounded example contains one reporter slot. The unit must remain consistent across the table, chart, and evidence.

## Fixed context

Use the existing demo baseline, `2026-02-16T17:00:00Z`, rather than silently jumping to the user's computer date. The target request window is February 23–March 1, 2026, inclusive by market-local dates; store its boundaries as `[2026-02-23T08:00:00Z, 2026-03-02T08:00:00Z)` for LAX.

The ten main request IDs are `req-lax-101` through `req-lax-110`. The baseline has six accepted assignments (`101–106`), two requests with distinct usable candidates (`107–108`), and two without a ready match (`109–110`). Other demo people must not accidentally create matches to this narrow requirement/time slice.

### The two growth cases

**Avery Cole (`person-lax-009`)** is already in onboarding. Availability for request 109 was recorded on February 15 at 17:00Z, but a required sample capability/verification check remains unresolved. Avery is not yet usable supply. Assign the missing review to the screening owner and track the handoff to onboarding.

**Rowan Ellis (`person-lax-010`)** enters through a targeted referral after the baseline. Rowan's response, screening, onboarding, explicit availability for request 110, and readiness occur as separate evidence. Availability is recorded on February 22 at 17:00Z, before readiness; neither fact appears at the baseline. The future feed may contain the events, but it is not current operational evidence.

Neither person's qualification, readiness, acceptance, or completion is created by saving a follow-up task.

## Checkpoint sequence

| Checkpoint | Visible event | Confirmed requests | Possible match, not confirmed | No ready match | New realtime-ready additions | First jobs for Avery/Rowan |
|---|---|---:|---:|---:|---:|---:|
| Baseline | Inspect February 16 data | 6 | 2 | 2 | 0 | 0 |
| Plan saved | Set two-addition goal and assign work | 6 | 2 | 2 | 0 | 0 |
| Existing supply responds | Separate simulated acceptance records for 107/108 | 8 | 0 | 2 | 0 | 0 |
| Verification and onboarding finish | Avery and Rowan independently become ready by February 23 | 8 | 2 | 0 | 2 | 0 |
| New reporters accept | Separate accepted assignments for 109/110 | 10 | 0 | 0 | 2 | 0 |
| Work takes place | Observed after all ten scheduled requests end | Not an upcoming-coverage measure at this date | — | — | 2 | 2 |

The final checkpoint reports **10 completed requests from the original ten-request plan**. Do not leave expired work in a chart labeled “upcoming.” Keep a plan-results view with the original request IDs so a reviewer can compare baseline and outcome without changing the denominator.

### Important measurement distinction

Avery began onboarding February 10 at 17:00Z and completes the first job February 27 at 21:00Z: outside 14 days. Rowan began onboarding February 19 at 17:00Z and completes February 28 at 01:00Z: within 14 days.

At a later review when both windows are complete, their illustrative two-person onboarding cohort is **1 of 2 within 14 days**. Their first jobs completed to date are **2**. Neither is an error; the evidence panel must identify the different populations and windows.

This two-person slice is a teaching example, not a credible effectiveness estimate for a program. Do not label the readiness program “50% effective” from it.

## Walkthrough across tabs

**Markets:** select LAX and the remote/realtime requirement. Open the two no-ready-match requests. See that one has an onboarding candidate who needs verification, while the other lacks a suitable current prospect. Save the two-addition goal without changing the actuals.

**Recruiting:** open Avery's missing step with the same request/signal context. Show Rowan's later referral-source history in a dated follow-up state. Inspect stage evidence, rather than manually changing a headline status.

**Team:** assign/rebalance the relevant review and set a clear quality expectation. See the specific case and reviewer; do not rank people by raw speed. A task completion is visible as task completion only.

**Reporters:** see separately verified service capability, readiness, explicit availability, and later accepted work. New reporters become eligible for consideration before they become confirmed coverage.

**Programs:** trace Rowan to the referral effort. Inspect the readiness-checklist pilot and its earlier sample. Create a process draft and a concrete partner task. No process draft automatically changes other markets or pilot results.

**Dated follow-up:** advance the labeled scenario to see readiness, acceptance, and completed jobs as distinct events. Show a concise “Changed / Not changed” result after each action or scenario advance.

## A successful pilot worth formalizing

Program `program-readiness-checklist` starts from a fictional shared-spreadsheet workaround used to record missing onboarding details. Include a tiny in-app example of the original columns and rows, not a pretend external connector.

The completed pilot uses two 20-person groups, split evenly between LAX and SFO:

| Group | First jobs within 14 days | Fully observed entrants | Result |
|---|---:|---:|---:|
| Earlier process | 6 | 20 | 30% |
| Pilot checklist | 11 | 20 | 55% |

The predefined pilot target is at least 50%. Both groups' observation windows have ended before the baseline. LAX contributes 3/10 and 6/10; SFO contributes 3/10 and 5/10. “All markets” computes 6/20 and 11/20 by joining members and events, not averaging unrelated percentages.

Each group has explicit IDs, actual synthetic stage-entry dates, outcome dates, source/job records, and exclusion rules. Successful IDs are specified in the JSON; unsuccessful members have no timely first job, or a demonstrably late one.

The decision is **met the target; propose a limited rollout**, not “proved a causal improvement.” Show sample size, non-random assignment, time-period differences, and relevant source/case-mix limitations.

Saving the draft creates process version 1 with an owner, required steps, evidence, exceptions, and a review date. A later approved limited pilot uses new enrollment records/version references. Never add rollout participants to the old frozen pilot sample.

## Other programs

`program-lax-realtime-referrals`: running targeted sourcing effort linked to the LAX requirement and Rowan. Recent entrants remain “still being observed” for final conversion rates. Source spend and qualified outcomes have record-level evidence.

`program-dfw-broad-outreach`: stopped after a complete observation window showed weak relevant qualification relative to its predefined target. Include qualified/total counts, actual member records, and a written reason to stop. Do not claim all broad outreach is ineffective.

## Distinct supporting markets

| Market | Designed situation | Inspectable evidence | Primary response |
|---|---|---|---|
| LAX | Realtime demand with a mix of unconfirmed and not-yet-ready supply | Requests, capabilities, verification, availability, commitments | Confirm existing supply; unblock onboarding; targeted referrals |
| SFO | In-person availability is poorly known | Explicit unknown windows and confirmations, not travel prose alone | Confirm availability before spending more on sourcing |
| DFW | Many outreach contacts, few relevant qualified prospects | Comparable source cohorts and screening reasons | Stop/revise weak outreach; test a better-targeted source |
| ORD | Onboarding cases repeatedly wait on the same required step | Checklist timestamps, owned tasks, repeated blocker type | Rebalance work and improve the handoff |
| ATL | Suitable previously working reporters have gone quiet | Job history and unknown/stale availability, separate from “unavailable” | Re-engagement and availability check; not automatic adverse scoring |

Exact supporting-market counts must be derived during fixture implementation. Only the anchor counts expressly specified here and in the JSON are fixed numerical acceptance examples.

## Negative paths are part of the story

Unknown credentials are not verified; unknown availability is not a refusal. A declined unsuitable job is not a quality failure. Canceling a task does not cancel a job. Declining an offer does not end a person's candidacy. A canceled request is removed from live demand, but appears with its cancellation in the original-plan review. Reloading a saved scenario cannot replay the same success twice.
