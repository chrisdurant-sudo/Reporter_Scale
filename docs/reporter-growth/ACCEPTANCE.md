# MVP acceptance — target behavior, not a claim of implementation

| ID | Observable requirement |
|---|---|
| UI-01 | Only three main tabs; one responsive market selector; selection survives tab changes and filters every relevant view |
| UI-02 | Plain labels, visible numbers/statuses, readable type, useful empty/error/loading states; no whole-page overflow at 390/1280/1440px |
| UI-03 | Detail panel is keyboard usable, closes with Escape, returns focus, and preserves the work-list context |
| DATA-01 | Five distinct synthetic scenarios; unique reporter IDs; coherent timestamps; stable anchors; no real personal information |
| DATA-02 | Repository load/save/reset behavior is tested; returned state cannot accidentally mutate the seed; no direct fixture imports in features |
| RULE-01 | First jobs counted once per person; canceled/duplicate/future events excluded; market/time scope correct |
| RULE-02 | Mature 14-day observation windows only; recent entrants separate; null empty denominator; late job does not rewrite a historical success |
| RULE-03 | Goal/rate/date validation, rounding and lead time; changed plans do not change actual completed jobs |
| RULE-04 | Valid screening transitions; duplicate clicks/simulations controlled; saved follow-ups and message previews do not create outcome data |
| MKT-01 | Compare all five markets; progress, goal, gap, record-supported issue and relevant next action visible |
| MKT-02 | Preview/edit goal and assumptions, save or cancel, see a clearly hypothetical plan with lead-time limitation |
| REP-01 | Current-stage strip, search, working list and detail; distinct delay reasons; preference, assigned owner and due date visible |
| REP-02 | Save reasoned screening review and follow-up; show history; message preview never sends |
| REP-03 | Small team workload view and saved coaching/clarification next action without simplistic rankings |
| IMP-01 | Hypothesis, owner, partner deliverable, dates, observation limits and descriptive results visible; no automatic success verdict |
| IMP-02 | Continue/Change/Stop requires rationale; Save as process creates an editable draft; record-backed weekly review; no rollout |
| INT-01 | LAX selection → save plan → review reporter → assign follow-up → review improvement → save process draft; filter remains coherent |
| INT-02 | Explicit simulation advances time/completes one late first job without duplicating records; fixed historical cohort rate unchanged; reset restores baseline |
| SAFE-01 | Permanent independent/synthetic disclosure; no real connection, secret, message, automatic rejection or fake production outcome |
| ENG-01 | Ownership/import review, type checks, tests, production build and browser verification pass on the independently reviewed final commit |

Domain owners write focused unit tests. Quality writes end-to-end and cross-feature assertions using small independent
expected-value examples, not the calculation under test. A screenshot, disabled test, or placeholder export cannot substitute
for working behavior. Name the date window/population being asserted; do not assume a rolling metric must stay constant.
