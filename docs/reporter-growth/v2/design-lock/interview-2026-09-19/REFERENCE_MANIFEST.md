# Interview amendment reference proposal

Open [reporter-growth-interview-reference.html](reporter-growth-interview-reference.html). This self-contained file has no network dependency and starts at All/Overview. It is synthetic, read-only baseline design evidence, not the application.

- [Amendment and comparison map](AMENDMENT_MAP.md)
- [Final desktop/tablet state manifest](state-manifest.json):44 states, routes, viewport, market, SHA-256 and no-overflow results.
- [Prototype interaction checks](reference-interactions.json)
- [Historical interactive inspection](historical-interactive-inspection.json)
- [Capture script](capture-reference.mjs)
- [Interaction check script](check-reference.mjs)
- [Checksums](SHA256SUMS)

## Review sequence

1. Compare `overview-default-1440x900.png`, `funnel-default-1440x900.png` and their1024/768 equivalents with the historical locked shell and chart/table system.
2. Inspect `funnel-bottlenecks-*`, `funnel-sla-editor-*`, `funnel-applicant-filter-1440x900.png`, `funnel-maya-owner-filter-1440x900.png` and `funnel-february-cohort-1440x900.png`. Cohort controls now precede the People grid; full-page defaults show composition beyond the first viewport.
3. Inspect `overview-keyboard-inspection-1440x900.png`, `overview-pointer-inspection-1440x900.png` and `overview-weekly-review-1440x900.png`.
4. Inspect Reporters, Team and Programs desktop defaults plus person/availability/follow-up, work/add/coaching/goals, checklist/decision/draft and DFW stopped states.

The coordinator should version only the interactive HTML, this manifest, amendment map, capture/check scripts, interaction/historical records, SHA256SUMS and images named by `state-manifest.json`. Unlisted scratch assets and earlier phone captures are exploratory history, not the final package. Historical source references are preserved unchanged and remain necessary comparison inputs.

## Reproduce captures and prototype checks

Run from the intended repository checkout, with its installed dependencies; no installation:

```sh
REFERENCE_SOURCE_ROOT=/absolute/path/to/checkout node /path/to/package/capture-reference.mjs
REFERENCE_SOURCE_ROOT=/absolute/path/to/checkout node /path/to/package/check-reference.mjs
```

Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` if the provided local headless-shell path is unavailable. The capture script reads the old interactive package from `REFERENCE_SOURCE_ROOT` to confirm it is still directly accessible; it never writes to it. Browser launch may require the host's existing scoped permission.

The final matrix uses1440×900,1024×768 and768×1024. Earlier390px captures remain only in scratch history after the user's phone-priority amendment; they are excluded from the final manifest and checksum list.
