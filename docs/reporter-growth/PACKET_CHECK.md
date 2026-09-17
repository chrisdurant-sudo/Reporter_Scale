# Planning packet checks

Checked in the packaging environment:
- Lane registry parses as JSON and contains seven unique lane IDs.
- Every registered task file exists.
- All lane-owned directory prefixes are mutually non-overlapping.
- All declared lane acceptance IDs exist in the acceptance checklist.
- Files are nonempty Markdown/JSON documents; no application source, dependency manifest, executable helper, or Codex configuration is included.

These checks concern the plan only. No application install, typecheck, calculation test, browser run, deployment,
or Codex subagent run is claimed. Source contracts, actual filesystem isolation and build behavior must be verified by Codex during execution.
