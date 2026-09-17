# Product scope

## Goal
Create an independent application sample for a Steno provider-operations job application.
Show how an operator sets reporter-growth goals, runs recruiting work, and turns a tested improvement into a repeatable process.
The role framing comes from the user's supplied job description and this conversation, not access to Steno systems.

**Working stack: React + TypeScript + Vite.** Reuse appropriate existing UI foundations after inspecting the actual repository.
Do not replace an existing compatible component system or install overlapping libraries.

## Three screens only
| Screen | At-a-glance answer | Signature action |
|---|---|---|
| Markets | Where do we need more reporters? | Preview a growth plan, then save a goal and assumptions |
| Reporters | Who needs a next step? | Review screening or onboarding and assign follow-up |
| Improvements | What should we change? | Review a test, record a decision, and save a draft process |

## Five illustrative markets
All markets is the default. LAX = Los Angeles; SFO = San Francisco; DFW = Dallas–Fort Worth;
ORD = Chicago; ATL = Atlanta. Airport codes are navigation labels, not qualification rules.
One global selection persists across tabs. A reporter has one recruiting-market owner but may serve several markets.
A nationwide count of reporters counts each person once.

## Required content
Markets: compact comparison with first jobs completed, goal, remaining gap, observed issue, and next step.
A selected market exposes editable planning assumptions with preview/save/cancel. Actual results never change because a goal changes.
Reporters: current-stage strip, searchable work list, detail panel, screening checks and reasons, preferences,
follow-up owner/date, message preview, activity history, and small team workload/coaching section.
Improvements: hypothesis, change type, owner, partner deliverable, review date, observation window,
results/limitations, Continue/Change/Stop with rationale, and Save as process producing an editable draft.
A short record-backed weekly review belongs here. No fourth main tab.

## Distinct from the fleet project
Fleet: daily readiness, coverage, and disruption response.
Reporter Growth: market growth planning and team/process improvement.
Do not build a dispatch board, full job-matching engine, or reskinned fleet dashboard.

## Demo story
Use about 60 fictional reporters across five meaningfully different recruiting scenarios.
Use a fixed demo date, not the machine clock. A separate, clearly labeled simulation can advance the date.
A manager selects LAX, previews/saves a plan, reviews a stalled reporter, assigns follow-up, reviews an improvement,
and saves a process draft. A simulated late first-job completion changes lifetime outcomes but not the reporter's
historical 14-day success classification. Reset restores all demo changes, simulated date, and replay markers.
Selection may remain on the current market after reset; make this intentional and documented.

## Boundaries
Permanent text: "Independent application concept. Synthetic data. Not connected to Steno systems."
No real reporter records, Steno branding implying affiliation, invented real integrations, authentication,
production backend, real messages, automated candidate rejection, AI scores, maps, advanced forecasting,
or automatic rollout of process changes. Public hosting is not part of this build authorization.
A future approved export or API could feed the data boundary, but no integration is claimed here.
