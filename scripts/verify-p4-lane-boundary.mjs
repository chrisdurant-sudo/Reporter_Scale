import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const key = process.argv[index];
  const value = process.argv[index + 1];
  if (!key?.startsWith("--") || !value) {
    console.error("Usage: node scripts/verify-p4-lane-boundary.mjs --lane <id> --base <commit> --candidate <commit>");
    process.exit(2);
  }
  args.set(key.slice(2), value);
}

const laneId = args.get("lane");
const baseCommit = args.get("base");
const candidateCommit = args.get("candidate");
if (!laneId || !baseCommit || !candidateCommit) {
  console.error("Usage: node scripts/verify-p4-lane-boundary.mjs --lane <id> --base <commit> --candidate <commit>");
  process.exit(2);
}

function git(commandArgs, options = {}) {
  return execFileSync("git", commandArgs, {
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

const registry = JSON.parse(readFileSync(path.join(root, "docs/reporter-growth/v2/lanes.v2.json"), "utf8"));
const lane = registry.lanes.find((candidate) => candidate.id === laneId);
const errors = [];
if (!lane) errors.push(`Unknown P4 lane: ${laneId}`);
if (!commitExists(baseCommit)) errors.push(`Base commit does not exist: ${baseCommit}`);
if (!commitExists(candidateCommit)) errors.push(`Candidate commit does not exist: ${candidateCommit}`);

if (!errors.length) {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", baseCommit, candidateCommit], {
      cwd: root,
      stdio: "ignore",
    });
  } catch {
    errors.push(`Base ${baseCommit} is not an ancestor of candidate ${candidateCommit}.`);
  }
}

const changedPaths = errors.length
  ? []
  : git(["diff", "--name-only", `${baseCommit}..${candidateCommit}`]).split("\n").filter(Boolean);
if (!errors.length && changedPaths.length === 0) errors.push("Candidate contains no changes from its declared base.");

if (lane) {
  for (const changedPath of changedPaths) {
    if (!lane.allowed_directory_prefixes.some((prefix) => changedPath.startsWith(prefix))) {
      errors.push(`${laneId} changed a path outside its registry boundary: ${changedPath}`);
    }
  }
}

if (errors.length) {
  console.error(`P4 lane-boundary verification failed for ${laneId}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`P4 lane-boundary verification passed for ${laneId}.`);
console.log(`- task: ${lane.task}`);
console.log(`- base: ${baseCommit}`);
console.log(`- candidate: ${candidateCommit}`);
console.log(`- changed paths: ${changedPaths.length}`);
console.log(`- acceptance IDs requiring separate evidence: ${lane.acceptance_ids.join(", ")}`);
