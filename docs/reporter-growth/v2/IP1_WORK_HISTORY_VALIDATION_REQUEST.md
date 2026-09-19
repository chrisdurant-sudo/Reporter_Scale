# IP1 work-history validation repair

Status: resolved. Data candidate `56feb58cb37f2ec19da664fa111aa497255339e7`, integrated `702e95a8364232d03c913460d606970aaed1e7e0`. The original malformed envelope now fails load, preserves its exact bytes and never reaches projection. Full verification passes 207 unit/integration, nine acceptance and eight browser tests; evidence is recorded in the execution ledger.

Authorized scope: bounded IC07 repository validation during the existing interview implementation. No new seed expansion or data enrichment. Coordinator review found a reproducible incompatibility between accepted stored history and the shared historical work projection.

At source commit `662e7de0e3b87305a22f8a56ac67c2b2a48004cf`, a valid seed work item was given `dueAt: null` and one edit at the current clock with `changes: { dueAt: null }` and `previous: {}`. A version-1 interview envelope containing that snapshot loaded successfully. Projecting the item one millisecond earlier then failed with `Work work-avery-verification is missing its previous due date.` The malformed original storage bytes remained untouched, but the load should have rejected them before the view received them.

## Data-owned repair

Only `src/data/` and colocated tests may change. Reject edit histories that omit the previous value for a changed required field (`dueAt` or `blockerCode`), or otherwise fail to reconstruct valid required fields. Preserve the supported absence of optional title/priority before their first edit. Validate loaded bytes and proposed saves consistently, return the existing explicit validation failure, and preserve the prior state and original stored bytes on failure. Do not repair malformed bytes automatically. Explicit Reset remains the recovery path.

Cover missing previous due date/blocker, valid explicit null clearing, originally absent optional fields, rejected-save noninterference and unchanged seed/reset. Preserve SD01–SD07 and all stable identities. Do not change repository/schema versions, the historical projection helper, domain command semantics, contracts, UI, integration or dependencies.

Use exactly the existing Data brief `docs/reporter-growth/v2/tasks/data-expansion-p4.md` plus this bounded request and frozen source contracts. A dedicated serial dispatch will name the separate worktree, exact base and contract commit. Stop at an exact clean candidate, report checks and gaps, and pass the Data lane audit before coordinator integration.
