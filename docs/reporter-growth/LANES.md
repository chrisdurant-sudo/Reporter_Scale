# Lane ownership

A lane is one bounded assignment with exclusive write ownership. All paths below are planned paths Codex will create.
They are not included as source files in this packet. `lanes.json` is the authoritative path registry.

## Parallel lanes
| Lane | May edit | Owns |
|---|---|---|
| Shared interface (`experience`) | `src/ui/`, `src/shell/`, `src/styles/` | Shared components, responsive shell, market-selector presentation, visual tokens and accessible detail panel |
| Demo data (`data`) | `src/data/` | Fictional records, stable scenario anchors, local repository adapter, loading and reset |
| Rules and calculations (`logic`) | `src/logic/` | Canonical metrics, plans, view models, validated commands and simulated transitions |
| Markets screen (`markets`) | `src/features/markets/` | Five-market comparison, selected-market plan, preview/save/cancel |
| Reporters screen (`reporters`) | `src/features/reporters/` | Stage strip, work list, details, screening, follow-up and small team section |
| Improvements screen (`improvements`) | `src/features/improvements/` | Change/result cards, decisions, partner work, draft processes and weekly review |
| Independent checks (`quality`) | `tests/acceptance/`, `tests/e2e/` | Cross-feature acceptance and browser tests; no production-code repairs |

Domain workers place unit tests inside their own directories. Quality owns cross-feature tests only.
Any nested AGENTS.md / AGENTS.override.md remains coordinator-owned, even inside a lane directory.

## Coordinator-only shared area
`src/contracts/`, `src/integration/`, `src/main.tsx`, dependencies and lockfile, root configuration,
`index.html`, `public/`, `scripts/`, `.codex/`, and the planning/instruction documents.
Unassigned paths are coordinator-owned by default. Existing applications may need a recorded path mapping in setup;
after that mapping is frozen, the same exclusive-ownership rules apply.

## Import direction
- Contracts define shared records, commands, view props, and public signatures; they have no implementation.
- Data imports contracts only, apart from ordinary runtime/validation libraries approved in setup.
- Logic imports contracts only, plus its own private pure helpers. No React, storage, or network.
- Shared UI has no data access or business rules. Shell uses UI and contract types.
- Each feature imports its own files, contract types, and shared UI public exports. Never sibling features, data, logic, or integration.
- Integration imports public exports from all areas and connects them. No area imports integration.
- Quality may inspect/test public exports and browser behavior, but writes only its test directories.
No catch-all shared utils, root barrel, shared writable fixture helper, or cross-feature singleton store.

## Why the screens can start together
Before parallel work, the coordinator freezes exact view props/callbacks and module exports, then creates a compiling
placeholder at each boundary. Screen workers use small private example props in their own tests, not another lane's
unmerged seed or selectors. The real data, rules, and UI are merged behind the same agreed interfaces.
A placeholder is a temporary setup aid, never evidence that an MVP requirement is complete.

## The shared-file rule
A Markets worker who needs a new metric requests the field; they do not edit logic or calculate a second version in JSX.
A Reporters worker who needs a new panel behavior requests the UI API change; they do not edit shared UI.
A Quality worker who finds a production bug reports it; they do not repair another lane's code.
Coordinator integration ownership means composition and merging, not taking over all domain implementation.

## Capacity and reviews
Seven lane workers may run together after SETUP_FROZEN. One additional slot may be used for a specific read-only
review of a fixed commit. Use fewer if local limits, resource pressure, or work readiness requires it.
Workers do not spawn subagents. The quality writer is not its own final reviewer.
Review/investigation is a temporary role, not another product lane or an always-on management hierarchy.
