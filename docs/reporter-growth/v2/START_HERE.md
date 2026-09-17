# Reporter Growth v2 — Foundation packet

**Purpose:** settle the operating story, records, measurements, and work boundaries before expanding the interface.
**Delivery:** planning documents only. No application code, dependency changes, agent settings, installer, or deployment.
**Prepared:** September 17, 2026, against the supplied `STENO_REVIEW.zip` snapshot.

## The decision

Keep the existing React + TypeScript + Vite application. Evolve it into five connected workspaces:
**Markets / Recruiting / Reporters / Team / Programs**.

The operating story is:
**Find a specific capacity need → inspect the evidence → set a dated growth goal → choose the right work → manage execution → observe readiness, acceptance, and completed work separately → decide what to standardize.**

Do not start over. Do not create five independent mock dashboards. All views must use the same underlying people, requests, events, work items, and programs.

## What is established versus proposed

The five-workspace direction and the need for granular evidence come from Chris's approved conversation requirements. The detailed definitions and synthetic scenarios in this folder are the proposed implementation contract for the next version. They are not Steno policies, internal data, or discovered business performance.

The first Codex session is a **documentation-only foundation review**. It reconciles this packet with the current local repository and stops before production-code changes. It does not launch the original v1 build prompt.

## Read in this order

1. [PRODUCT_BRIEF.md](PRODUCT_BRIEF.md) — scope and responsibilities.
2. [DEMO_STORY.md](DEMO_STORY.md) — exact main scenario and the improvement example.
3. [DATA_CONTRACT.md](DATA_CONTRACT.md) — records, identity, events, and allowed transitions.
4. [METRICS_AND_EVIDENCE.md](METRICS_AND_EVIDENCE.md) — calculations and drill-down rules.
5. [SCREEN_CONTRACTS.md](SCREEN_CONTRACTS.md) — screen purpose, filters, and interactions.
6. [BASELINE_AND_MIGRATION.md](BASELINE_AND_MIGRATION.md) — actual source gaps, governance, and phase gates.
7. [LANES.md](LANES.md) and [ACCEPTANCE.md](ACCEPTANCE.md) — future write boundaries and checks.

`scenario_contract.json` contains expected scenario facts and stable anchor IDs, not a complete runnable dataset.
`lanes.v2.json` is an ownership registry, not an agent launcher or enforcement mechanism.

## Add this packet to the existing repository

The ZIP contains only `docs/reporter-growth/v2/`. It has no hidden folders. Keep all existing app files and `.codex/` settings.

In the Cursor terminal at the STENO repository root, with the ZIP in Downloads:

```bash
unzip -n "$HOME/Downloads/STENO_V2_FOUNDATION.zip" -d .
```

`-n` leaves an existing file with the same path unchanged. For a later revised packet, reconcile changes rather than silently overlaying an old v2 folder.

## First Codex prompt — foundation review only

```text
Read AGENTS.md and docs/reporter-growth/v2/START_HERE.md. Follow this v2 packet for a documentation-only foundation review of the existing Reporter Growth application.

Do not rebuild the app, change src/, install packages, alter .codex/ or model settings, or launch implementation workers. Inspect the current Git state and source; preserve all user changes. The supplied ZIP baseline may be older than this checkout.

Reconcile PRODUCT_BRIEF, DEMO_STORY, DATA_CONTRACT, METRICS_AND_EVIDENCE, SCREEN_CONTRACTS, BASELINE_AND_MIGRATION, LANES, ACCEPTANCE, scenario_contract.json, and lanes.v2.json against the real repository. Resolve contradictions within these planning files without adding features. Do not invent Steno requirements or missing operational data.

This request authorizes a narrow documentation amendment: mark the old three-tab scope and old build entry point as v1, and add a v2 planning-phase pointer to AGENTS.md. Preserve its safety, cost, ownership, and no-Fast instructions. Do not rewrite agent configuration or treat legacy role names as proof of compatible lane permissions.

Create docs/reporter-growth/v2/FOUNDATION_REVIEW.md. Record the current commit and dirty paths, agreed story, definitions, schema/migration decisions, source-to-target file map, role-routing conflicts requiring later attention, scenario checks, and any truly blocking decisions. Distinguish inspected evidence from assumptions. Use at most two read-only helpers when useful; no implementation fan-out in this phase.

Then stop with FOUNDATION_REVIEWED or FOUNDATION_BLOCKED. Summarize the result in plain language. This phase is not application implementation and is not approval to run the later build.
```

## Required review output

The review should settle one goal, one primary LAX story, five distinct market situations, exact entity meanings, metric populations, evidence links, version-1 preservation, and isolated future lanes. Missing current code details should be recorded, not guessed.

The next implementation phase will require explicit authorization. It starts with a compiling source-contract baseline and record-level tests, not a UI swarm.

## Boundaries that remain in force

Independent synthetic demo; no actual Steno system access; no real messaging; no automatic rejection, scoring, or dispatch; no public deployment without authorization. Existing local model/reasoning and Standard/no-Fast policies remain untouched. No blanket staging, destructive cleanup, repository reset, or overwriting user edits.
