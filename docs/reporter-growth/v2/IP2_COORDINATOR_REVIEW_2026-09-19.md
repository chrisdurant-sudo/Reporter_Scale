# IP2 coordinator desktop review — September 19

Submitted source: `be5d7a1d3a634f4a29243e09993661cef7264c1c`; exact integration: `6115ee767a9c10730fc908c5f52b1468f30c83ab`. Original clean worktree and `/private/tmp/steno-ip2-source-proof` are preserved. All 16 PNG hashes match the manifest. Coordinator directly inspected all 16 candidate captures and the amended Overview/Funnel/People/Bottlenecks/SLA reference captures. Main shell, hierarchy and canonical semantics match the approved amendment. Acceptance remains pending.

## Bounded Lead defects

1. **XR08/XR24 — Clear drill-down styling.** The root `.v2-linked-selection` banner is outside `.ip2-workspace`; its button renders with browser-default styling. Reuse the shared button treatment including hover and visible keyboard focus. No integration or business-logic edits. Evidence: `overview_exact_attention.png`.
2. **IP03/U02 — distinguish original-plan evidence actions.** The original-plan drawer renders two identical `Inspect M05 evidence` buttons. Give completed-request and new-reporter-first-job evidence actions distinct human labels from their prepared bundles while preserving exact callbacks. Evidence: `original_plan_delivered.png`.

## Independent interaction review

Coordinator opened both actual historical and amended interactive references, including Funnel Bottlenecks and SLA editor. Source checks passed: weekly review scrolling, expanded calculations and exact M02 evidence action, Escape focus return, chart End selection and projection-removal clamp, and no horizontal page overflow at 1440×900. Five checks passed; browser error array empty. Evidence: `/private/tmp/steno-ip2-coordinator-review/checks.json` and adjacent captures. The original manifest records 19 interactions; only the five named checks were independently repeated here.

## Verification

Exact integrated candidate passes governance, lint, types, all 314 unit/integration tests and production build. Acceptance: seven pass, two fail at obsolete Overview/Funnel selectors. Full gate therefore fails, no waiver. Browser diagnostics are being run separately before the authorized serial Quality alignment. No specialist work or visual acceptance is authorized by this review.
