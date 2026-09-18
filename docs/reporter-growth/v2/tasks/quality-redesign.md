# P4 experience Quality brief

## Purpose

Independently test the fixed P4 integrated candidate after the Overview/Funnel proof and remaining
workspace implementation are complete.

Read `docs/reporter-growth/v2/P4_DESIGN_LOCK.md`,
`docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md`,
`docs/reporter-growth/v2/design-lock/reference-manifest.md`, its interactive reference and fixed
screenshots, `docs/reporter-growth/v2/P4_EXPERIENCE_REDESIGN.md`,
`docs/reporter-growth/v2/P4_ACCEPTANCE.md`, the original V2 acceptance/evidence contracts, and the
exact candidate SHA before work.

## Write boundary

Allowed: `tests/acceptance/` and `tests/e2e/` only.

Forbidden: all production source, contracts, data, integration, configuration, dependencies,
instructions, and snapshots not owned by Quality.

## Required checks

- XR01–XR40, including real charts, interaction-to-record filtering, content hierarchy, one evidence
  path, working actions, drawer state/focus return, and no raw technical context on default screens;
- screenshot matrix at the exact required viewports, with no 390px waiver;
- side-by-side comparison with every applicable locked state in
  `docs/reporter-growth/v2/design-lock/reference-manifest.md`, including Funnel SLA editor and Team
  Add work; treat unexplained hierarchy, composition, density, component, or responsive differences
  as defects;
- all original V2 source/metric/scenario reconciliation tests;
- SD01–SD05, including exact 50/10-per-market counts, canonical identity reuse, per-market stage/SLA/
  activity/credential/compliance variation, deterministic reset, and named-scenario protection;
- typecheck, lint, unit, acceptance, build, browser, and diff checks on the fixed commit.

Do not encode an existing defect as the expected screenshot or weaken an assertion to make the
candidate pass. Report each defect with acceptance ID, exact reproduction, affected workspace, and
evidence, including the candidate and reference screenshots for visual defects. Production repairs
return to the owning implementation lane. After reintegration, rerun the affected check and the full
suite before returning `QUALITY_PASSED`.
