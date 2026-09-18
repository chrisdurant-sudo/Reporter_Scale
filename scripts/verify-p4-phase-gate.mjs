import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
const notes = [];
let assertions = 0;

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function json(relativePath) {
  return JSON.parse(read(relativePath));
}

function check(condition, message) {
  assertions += 1;
  if (!condition) errors.push(message);
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.stdio ?? ["ignore", "pipe", "pipe"],
  }).trim();
}

function commitExists(commit) {
  try {
    git(["cat-file", "-e", `${commit}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function isAncestor(commit) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", commit, "HEAD"], {
      cwd: root,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

const registryPath = "docs/reporter-growth/v2/lanes.v2.json";
const statePath = "docs/reporter-growth/v2/P4_EXECUTION_STATE.json";
const defectsPath = "docs/reporter-growth/v2/P4_VISUAL_PROOF_DEFECTS.md";
const gatePath = "docs/reporter-growth/v2/P4_VISUAL_PROOF_GATE.md";
const registry = json(registryPath);
const state = json(statePath);

check(!root.split(path.sep).includes("node_modules"), "P4 worktrees must not be nested under node_modules; Node and Playwright reject TypeScript files there.");
check(state.schema_version === 1, "P4 execution state must use schema version 1.");
check(state.kind === "p4_execution_state", "P4 execution state kind is invalid.");
check(state.authorization?.status === "active", "P4 implementation must have explicit active authorization.");
check(state.authorization?.source, "P4 authorization must record its source.");
check(state.implementation_active === true, "The active repair phase must keep implementation active.");
check(registry.implementation_active === state.implementation_active, "Registry and execution state disagree on implementation activation.");
check(registry.fanout_authorized === state.fanout_authorized, "Registry and execution state disagree on fan-out authorization.");
check(registry.current_phase === state.current_phase, "Registry and execution state disagree on the current phase.");
check(registry.execution_state === statePath, "Registry does not point to the execution-state ledger.");
check(existsSync(path.join(root, defectsPath)), "The active visual defect register is missing.");
check(existsSync(path.join(root, gatePath)), "The visual-proof evidence contract is missing.");
check(state.current_candidate?.defect_register === defectsPath, "The current candidate must point to the active defect register.");
check(path.resolve(root) === path.resolve(state.active_coordinator_worktree), "Run phase verification from the recorded active coordinator worktree.");

const legalPhases = [
  "P4.0b_serial_sample_expansion",
  "P4.1_visual_proof_repair",
  "P4.1_visual_proof_review",
  "P4.2_workspace_wave",
  "P4.3_integration",
  "P4.4_quality",
  "P4.5_reviewer",
  "P4_complete",
];
check(legalPhases.includes(state.current_phase), `Unknown P4 phase: ${state.current_phase}`);

const baseCommit = state.implementation_base_commit;
const candidateCommit = state.current_candidate?.commit;
check(typeof baseCommit === "string" && commitExists(baseCommit), "Implementation base commit is missing or invalid.");
check(typeof candidateCommit === "string" && commitExists(candidateCommit), "Current candidate commit is missing or invalid.");
if (commitExists(baseCommit)) check(isAncestor(baseCommit), "Implementation base commit must be an ancestor of HEAD.");
if (commitExists(candidateCommit)) check(isAncestor(candidateCommit), "Current candidate commit must be an ancestor of HEAD.");

const committedPaths = commitExists(baseCommit)
  ? git(["diff", "--name-only", `${baseCommit}..HEAD`]).split("\n").filter(Boolean)
  : [];
const worktreePaths = git(["diff", "--name-only", "HEAD"]).split("\n").filter(Boolean);
const stagedPaths = git(["diff", "--cached", "--name-only", "HEAD"]).split("\n").filter(Boolean);
const untrackedPaths = git(["ls-files", "--others", "--exclude-standard"]).split("\n").filter(Boolean);
const changedPaths = [...new Set([...committedPaths, ...worktreePaths, ...stagedPaths, ...untrackedPaths])];
const allowedPrefixes = state.phase_allowed_prefixes ?? [];
for (const changedPath of changedPaths) {
  check(
    allowedPrefixes.some((prefix) => changedPath === prefix || changedPath.startsWith(prefix)),
    `Path changed outside the active P4.1 repair boundary: ${changedPath}`,
  );
}

const specialistPrefixes = [
  "src/features/reporters/",
  "src/features/team/",
  "src/features/programs/",
];
if (!state.fanout_authorized) {
  for (const changedPath of changedPaths) {
    check(
      !specialistPrefixes.some((prefix) => changedPath.startsWith(prefix)),
      `P4.2 feature changed before visual-proof acceptance: ${changedPath}`,
    );
  }
}

const visual = state.gates?.visual_proof;
const baseline = state.gates?.baseline;
const browser = state.gates?.browser;
const workspace = state.gates?.workspace_wave;
const quality = state.gates?.quality;
const reviewer = state.gates?.reviewer;
check(Array.isArray(visual?.required_artifact_ids) && visual.required_artifact_ids.length === 13, "Visual proof must require the full 13-state artifact matrix.");
check(new Set(visual?.required_artifact_ids ?? []).size === visual?.required_artifact_ids?.length, "Visual artifact IDs must be unique.");
check(["passed", "failed"].includes(baseline?.status), "The full baseline gate must record an explicit passed or failed state.");

const experienceAudit = state.lane_audits?.experience;
check(Boolean(experienceAudit), "The active Experience handoff must have a lane-audit record.");
if (experienceAudit) {
  check(commitExists(experienceAudit.base_commit), "Experience lane-audit base commit is invalid.");
  check(commitExists(experienceAudit.handoff_commit), "Experience lane-audit handoff commit is invalid.");
  check(experienceAudit.boundary_status === "passed", "Experience lane boundary must pass before coordinator integration.");
}

if (!state.fanout_authorized) {
  check(visual?.status !== "accepted", "Accepted visual proof and blocked fan-out are an inconsistent state transition.");
  check(workspace?.status === "blocked", "Workspace wave must be blocked before visual-proof acceptance.");
  notes.push("P4.2 remains blocked: visual proof has not been accepted.");
  if (baseline?.status !== "passed") notes.push("The full baseline is also blocked by failing cross-workspace acceptance tests.");
}

if (state.fanout_authorized || visual?.status === "accepted") {
  const acceptedCommit = visual?.accepted_commit;
  const manifestPath = visual?.artifact_manifest;
  check(state.fanout_authorized === true, "Accepted visual proof must transition fan-out authorization explicitly.");
  check(baseline?.status === "passed", "Visual-proof acceptance and fan-out require the full baseline suite to pass.");
  check(browser?.status === "passed", "Visual-proof acceptance and fan-out require a real browser-suite pass.");
  check(browser?.waiver_allowed === false, "P4 browser verification cannot be waived.");
  check(experienceAudit?.acceptance_evidence_status === "passed", "Experience acceptance evidence must pass before visual-proof acceptance.");
  check(experienceAudit?.visual_evidence_status === "passed", "Experience visual evidence must pass before visual-proof acceptance.");
  check(typeof acceptedCommit === "string" && commitExists(acceptedCommit), "Accepted visual proof requires a valid exact implementation commit.");
  if (commitExists(acceptedCommit)) check(isAncestor(acceptedCommit), "Accepted visual-proof commit must be an ancestor of HEAD.");
  check(typeof manifestPath === "string" && existsSync(path.join(root, manifestPath)), "Accepted visual proof requires a committed candidate artifact manifest.");

  if (typeof manifestPath === "string" && existsSync(path.join(root, manifestPath))) {
    const manifest = json(manifestPath);
    check(manifest.captured_from_commit === acceptedCommit, "Artifact manifest commit must match the accepted implementation commit.");
    const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
    const byId = new Map(artifacts.map((artifact) => [artifact.id, artifact]));
    check(artifacts.length === visual.required_artifact_ids.length, "Artifact manifest must contain exactly the required evidence states.");

    for (const id of visual.required_artifact_ids) {
      const artifact = byId.get(id);
      check(Boolean(artifact), `Missing candidate artifact: ${id}`);
      if (!artifact) continue;
      check(artifact.commit === acceptedCommit, `${id} was not captured from the accepted commit.`);
      check(Boolean(artifact.viewport && artifact.route && artifact.state), `${id} lacks viewport, route, or UI-state metadata.`);
      const artifactPath = path.join(root, artifact.file ?? "");
      check(Boolean(artifact.file) && existsSync(artifactPath), `${id} image file is missing.`);
      if (artifact.file && existsSync(artifactPath)) {
        const actual = createHash("sha256").update(readFileSync(artifactPath)).digest("hex");
        check(actual === artifact.sha256, `${id} checksum does not match its manifest.`);
      }
    }
  }

  const browserSuite = read("tests/e2e/reporter-growth.browser.spec.ts");
  check(!/(390.{0,80}waiv|waiv.{0,80}390)/is.test(browserSuite), "The 390px waiver must be removed before visual-proof acceptance.");
}

const phaseIndex = legalPhases.indexOf(state.current_phase);
const visualProofIndex = legalPhases.indexOf("P4.1_visual_proof_repair");
const workspaceIndex = legalPhases.indexOf("P4.2_workspace_wave");
const qualityIndex = legalPhases.indexOf("P4.4_quality");
const reviewerIndex = legalPhases.indexOf("P4.5_reviewer");
if (phaseIndex >= visualProofIndex) {
  const dataAudit = state.lane_audits?.data;
  check(state.gates?.data?.status === "passed", "P4.1 or later requires a passed Data gate.");
  check(Array.isArray(state.gates?.data?.required_acceptance_ids) && state.gates.data.required_acceptance_ids.join(",") === "SD01,SD02,SD03,SD04,SD05,SD06,SD07", "The Data gate must require SD01-SD07.");
  check(dataAudit?.boundary_status === "passed", "P4.1 or later requires a passed Data lane-boundary audit.");
  check(dataAudit?.acceptance_evidence_status === "passed_sd01_sd07", "P4.1 or later requires recorded SD01-SD07 evidence.");
}
if (phaseIndex >= workspaceIndex) check(visual?.status === "accepted", "P4.2 or later requires accepted visual proof.");
if (phaseIndex >= qualityIndex) check(workspace?.status === "passed", "Quality requires a passed workspace-wave integration gate.");
if (phaseIndex >= reviewerIndex) check(quality?.status === "passed", "Reviewer requires a waiver-free Quality pass.");
if (state.current_phase === "P4_complete") check(reviewer?.status === "passed", "P4 completion requires Reviewer pass.");

for (const exception of state.known_ownership_exceptions ?? []) {
  check(changedPaths.includes(exception.path), `Recorded ownership exception is not present in the candidate diff: ${exception.path}`);
  check(exception.status !== "resolved", `Resolved ownership exception must be removed from the active exception list: ${exception.path}`);
}

if (errors.length) {
  console.error(`P4 phase-gate verification failed (${errors.length}/${assertions} checks):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`P4 phase-gate verification passed (${assertions} checks) for ${state.current_phase}.`);
for (const note of notes) console.log(`- ${note}`);
