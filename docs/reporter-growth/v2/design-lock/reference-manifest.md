# P4 visual reference manifest

Status: **LOCKED REFERENCE — IMPLEMENTATION NOT AUTHORIZED BY THIS FILE**

This package is the literal visual north star for P4. It turns the approved canvas into a
repository-owned interactive reference plus fixed screenshots. Implementers, Quality, and Reviewer
must use it alongside [`../P4_DESIGN_LOCK.md`](../P4_DESIGN_LOCK.md).

## Authority

- `P4_DESIGN_LOCK.md` governs required behavior, content, exclusions, responsive rules, and product
  meaning.
- [`reporter-growth-reference.html`](reporter-growth-reference.html) governs the approved composition,
  density, component treatment, labels, and interaction model.
- The screenshots below freeze the expected states at the named widths.
- Original V2 data, metric, evidence, command, and safety contracts still govern factual meaning and
  production behavior.
- [`../P4_SYNTHETIC_SAMPLE_EXPANSION.md`](../P4_SYNTHETIC_SAMPLE_EXPANSION.md) governs the expanded
  50-person population; the numeric values pictured here remain illustrative.

Production must match the reference's hierarchy, ordering, controls, interaction states, visual
system, and responsive behavior. Canonical source-backed values may replace the illustrative values
shown here. An agent may not reinterpret the layout or add back removed copy. Any intentional visual
departure requires a user-approved design-lock amendment before implementation.

## Bundle

- Interactive reference: [`reporter-growth-reference.html`](reporter-growth-reference.html)
- Reproducible capture script: [`capture-reference.mjs`](capture-reference.mjs)
- Bundle checksums: [`SHA256SUMS`](SHA256SUMS)
- Screenshots: [`screenshots/`](screenshots/)

The capture script uses the repository's installed Playwright package and local Google Chrome. Run
it from the repository root:

```bash
node docs/reporter-growth/v2/design-lock/capture-reference.mjs
```

## Required reference states

| Workspace/state | Desktop viewport | Mobile viewport | Full desktop composition |
|---|---|---|---|
| Overview, All markets, projection on | [1440 × 900](screenshots/overview-desktop-1440x900.png) | [390 × 844](screenshots/overview-mobile-390x844.png) | [1440 wide](screenshots/overview-full-1440.png) |
| Funnel, People, Onboarding trend | [1440 × 900](screenshots/funnel-desktop-1440x900.png) | [390 × 844](screenshots/funnel-mobile-390x844.png) | [1440 wide](screenshots/funnel-full-1440.png) |
| Reporters, Ready | [1440 × 900](screenshots/reporters-desktop-1440x900.png) | [390 × 844](screenshots/reporters-mobile-390x844.png) | [1440 wide](screenshots/reporters-full-1440.png) |
| Team, Work board | [1440 × 900](screenshots/team-desktop-1440x900.png) | [390 × 844](screenshots/team-mobile-390x844.png) | [1440 wide](screenshots/team-full-1440.png) |
| Programs, Programs view | [1440 × 900](screenshots/programs-desktop-1440x900.png) | [390 × 844](screenshots/programs-mobile-390x844.png) | [1440 wide](screenshots/programs-full-1440.png) |

The fixed open-control states are:

- [Funnel SLA editor — 1440 × 900](screenshots/funnel-sla-editor-desktop-1440x900.png)
- [Team Add work — 1440 × 900](screenshots/team-add-work-desktop-1440x900.png)

## Use during implementation

1. Open the interactive reference before editing presentation code.
2. Build the shared shell and primitives once; do not independently redesign each workspace.
3. At the Overview/Funnel proof gate, capture the live candidate at the required P4 widths and compare
   it side by side with the matching reference states.
4. After the proof gate, use the same comparison for Reporters, Team, and Programs.
5. Record every mismatch as a defect or a user-approved amendment. “Close enough,” an older screen,
   or passing element-presence tests is not a substitute for the locked composition.

## Use during Quality and Reviewer

- Quality compares the live candidate with these fixed states and also exercises every interaction;
  the reference images do not replace browser, keyboard, source-record, or command checks.
- Reviewer opens the same interactive reference and inspects the exact Quality-passed commit. A
  structurally different page fails review even if its tests pass.
- Checksums protect this committed package from accidental drift. They are not a cross-platform
  pixel-hash requirement because font rasterization can differ by browser and operating system.
