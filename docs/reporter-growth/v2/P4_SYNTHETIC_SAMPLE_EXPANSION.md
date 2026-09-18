# P4 synthetic sample expansion

Status: **USER-APPROVED ADDENDUM — SD06 TREND-VARIATION REPAIR AUTHORIZED**

Approved: September 17, 2026

This addendum expands the P4 demonstration population so the All-market and individual-market views
have enough records to make filters, tables, SLA states, activity patterns, credentials, and charts
useful. It does not change the locked visual composition.

## Exact added population

Add exactly **50 distinct fictional people**, distributed evenly:

| Market | New canonical people |
|---|---:|
| LAX | 10 |
| SFO | 10 |
| DFW | 10 |
| ORD | 10 |
| ATL | 10 |
| **Total** | **50** |

These are canonical `Reporter` identities with one first-time `AcquisitionCase` each. Funnel and
Reporters are different views of the same people and histories; do not create separate candidate and
reporter identities for the same fictional person.

## Per-market composition

Each market's ten additions contain:

- one current Applicant;
- one current Screening case;
- one current Approved case;
- one current Onboarding case;
- one additional current Screening or Onboarding bottleneck;
- one Starting soon reporter who is ready but has not completed a first job;
- two ready reporters with completed work inside the trailing 28 days;
- one ready reporter last active 28–55 days ago; and
- one ready reporter last active 56 or more days ago.

This yields five active pre-ready funnel cases and five ready-network reporters per market. The
Starting soon person appears in both the appropriate Funnel status and the Reporters network because
the views share one canonical identity.

Use the frozen lifecycle vocabulary: Applicant is the pre-screening sourced/contacted/responded
state, Screening is `screening-started`, Approved is `qualified`, Onboarding is
`onboarding-started`, and Starting soon is `ready` with no first completed job. Do not add duplicate
presentation-only lifecycle values to the source contract.

## Required variation

For every market:

- arrange current-stage ages so the six Funnel rows provide two `Under`, two `At`, and two `Over`
  examples against that market's approved SLA values;
- spread entry and stage timestamps across the trailing 7- and 28-day windows so the Funnel trend is
  derived from records rather than a decorative series;
- give the five ready reporters the applicable state credential abbreviation—CA for LAX/SFO, TX for
  DFW, IL for ORD, and GA for ATL—and a varied RPR/CRR mix;
- provide three `Clear`, one `Expiring`, and one `Needs check` compliance example;
- preserve missing evidence as missing; a `Needs check` record is not eligible for work that requires
  the absent evidence;
- vary attendance, proceeding, source, availability, and capability facts enough for filters to
  produce meaningfully different rows; and
- use clearly fictional names and `synthetic-demo` provenance only.

Color/SLA labels, churn-review labels, compliance results, funnel counts, and chart points remain
derived presentation or logic results. Do not store those conclusions as source facts.

## SD06 noticeable trend variation

The September 17 user-directed repair adds an explicit visibility threshold for the record-derived
trend lines. It does not authorize decorative points or stored chart totals.

For the Overview source-backed supply/demand series, each individual market and the All scope must:

- expose at least eight ordered source timestamps across the trailing 90-day history and known future
  schedule;
- give both `availableSupply` and `demand` a range of at least two reporter equivalents;
- include at least one increase and at least one later decrease in both supply and demand; and
- include a zero-needed point, a `neededSupply` peak of at least two, and a later point at least one
  below that peak so the gap visibly opens and eases.

For the Funnel R28 wait-time trends, each individual market and the All scope must contain at least
one lifecycle status whose seven-point series has at least four non-null points, at least three
distinct mean-wait values, and both a positive and a negative adjacent change. Stage entries and exits
must cause the reversal; time passing by itself is not enough.

All variation must come from complete `DemandRequest`, `AvailabilityWindow`, `LifecycleEvent`, and
supporting canonical records. Existing scenario anchors and current-stage composition remain fixed.

## SD07 human-readable dummy identities

The 50 P4 people must use 50 unique, natural-looking invented names. Names must not contain
`Fictional`, a market name or market code, `Sample`, `Test`, `Person`, or an ordinal/numbered-fixture
suffix. Do not copy customer, employee, celebrity, or other known-person lists. The records remain
synthetic demo data through provenance and disclosure; the visible name itself should read like a
person's name rather than a database fixture.

## Record completeness

Every addition must include a complete, temporally valid source graph for its intended state:

- canonical Reporter and AcquisitionCase;
- ordered LifecycleEvents through the current stage;
- ScreeningReview and OnboardingStep records when applicable;
- CapabilityVerification, CredentialRecord, ReadinessEvent, and AvailabilityWindow records for ready
  people as required by the frozen contracts;
- AssignmentEvent, DemandRequest, and JobOutcome records only where the activity history requires
  them; and
- explicit unknowns instead of invented evidence.

The seed and reset remain deterministic. All record IDs are stable and unique. Dates use the frozen
V2 as-of time and valid market time zones.

## Existing scenario protection

The additions must not rewrite the named LAX scenario, checklist cohorts, program memberships,
checkpoint feed, or stable anchor IDs. Existing scenario facts remain unchanged. Aggregate totals may
change only as a transparent consequence of the new records.

Do not add the new people to an existing program cohort merely to fill a table. Program enrollment,
source attribution, readiness, activity, and work outcomes require their own explicit records.

## Ownership and order

After explicit P4 implementation authorization, one serial `data` role owns this expansion and the
authorized SD06 variation repair in
`src/data/` and its colocated tests. It runs before the Experience role. The coordinator integrates
and freezes the expanded, compiling data baseline before visual implementation starts.

The Data role may not edit UI, feature, logic, contract, integration, dependency, or agent-setting
files. If the frozen schema cannot express a required fact, it returns a contract-change request
instead of inventing a parallel field.
