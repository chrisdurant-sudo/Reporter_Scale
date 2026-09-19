# IP0 browser-suite prerequisite repair

The authorized interview implementation remains in IP0. No new start is needed. The loaded Astra catalog and Data zero-inheritance runtime probe now pass. Browser launch works outside the macOS sandbox.

The unchanged full suite at `df04eefc2b42680332bd0d8a3e0219ca79627f92` passes governance, lint, types, 131 unit/integration tests, 9 acceptance tests and build. Browser assertions produce 2 passes and 6 failures.

## Concrete repair

Only `tests/e2e/reporter-growth.browser.spec.ts` needs the proposed prerequisite repair:

1. Scope workspace navigation locators to the named navigation landmark, avoiding the separate Overview/Programs local-view buttons.
2. Open the existing Scenario controls disclosure before asserting its feedback is visible.
3. Replace unsupported Playwright `getByDisplayValue` with the same labeled notes textbox plus visibility and exact-value assertions.

No assertion is removed, no product behavior changes, and desktop plus 390px coverage remains required. The exact proposed patch and diagnostic log are in the adjacent evidence directory. The scratch diagnostic passes all 8 cases against the unchanged built application. It is diagnostic evidence, not a pass of the registered full suite.

## Authority needed

AGENTS.md requires the full `npm run verify:p4` before each phase transition and says any failure blocks dispatch. It also reserves browser tests to Quality after integration. This creates a prerequisite cycle for the stale suite. Requested exception: one serial Quality-owned, tests-only prerequisite repair during IP0, after its own verified Astra/xhigh zero-inheritance probe. Quality may change only this spec for the repairs above, in a separate worktree, with an exact commit and lane-boundary audit. Coordinator then integrates and reruns the unchanged full command. IP5 independent Quality remains mandatory and no acceptance gate is waived.

Status: awaiting the narrow sequencing exception; no Quality repair worker or implementation worker has been dispatched.
