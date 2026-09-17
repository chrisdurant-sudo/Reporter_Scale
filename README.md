# Reporter Growth — Codex build packet

**Planning only. No application code, packages, executable helpers, or Codex configuration is included.**
Codex will create the MVP in your repository. This packet defines the lanes and how their work fits together.

## Add to a repository
- New repository: copy this packet's contents into its root.
- Existing repository: copy `docs/reporter-growth/` only after checking for filename conflicts. Merge the relevant instructions from this packet's `AGENTS.md` into your existing one; do not overwrite it or change existing Codex settings.
- Open Codex in the actual repository root and paste the prompt in `docs/reporter-growth/CODEX_START.md`.

The plan authorizes a bounded local build when you give Codex the launch prompt. Merely copying these documents launches nothing.
There is nothing to install or run from this packet. Dependency installation and source creation belong to Codex's setup stage.

## Where to look
| File | Purpose |
|---|---|
| `AGENTS.md` | Short rules every agent must follow |
| `docs/reporter-growth/LANES.md` | Seven owners, their paths, and prohibited work |
| `docs/reporter-growth/lanes.json` | Machine-readable ownership and concurrency ceilings |
| `docs/reporter-growth/BUILD_PLAN.md` | Setup, dispatch, handoff, integration, and final review |
| `docs/reporter-growth/CONTRACTS.md` | Shared interfaces Codex must settle before splitting the work |
| `docs/reporter-growth/PRODUCT.md` | Three screens, five markets, and scope limits |
| `docs/reporter-growth/DESIGN.md` | Plain language and uncluttered working views |
| `docs/reporter-growth/ACCEPTANCE.md` | Observable requirements for a finished MVP |
| `docs/reporter-growth/tasks/` | A short assignment for each lane |
| `docs/reporter-growth/CODEX_START.md` | Coordinator launch prompt |
| `docs/reporter-growth/SOURCES.md` | Official tooling references and evidence boundaries |
| `docs/reporter-growth/PACKET_CHECK.md` | Checks of this planning packet, not of an application |

## Operating principle
Maximize useful independent work, not the number of open agents. The cap is seven concurrent lane workers,
plus at most one optional read-only reviewer, excluding the main coordinator. These are project limits,
not a claim about your Codex account. Use fewer when the actual runtime or ready work requires it.
