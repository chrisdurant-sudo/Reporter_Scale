import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const errors = [];
let assertions = 0;

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), "utf8");
}

function check(condition, message) {
  assertions += 1;
  if (!condition) errors.push(message);
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

const registryPath = "docs/reporter-growth/v2/lanes.v2.json";
const registry = JSON.parse(read(registryPath));
const lanes = new Map(registry.lanes.map((lane) => [lane.id, lane]));

check(registry.routing_active === true, "P4 routing must be active as configuration.");
check(registry.implementation_active === false, "Readiness must not activate implementation.");
check(registry.fanout_authorized === false, "P4 fan-out must remain disabled.");
check(registry.current_phase === "P4_ready_awaiting_explicit_implementation_authorization", "Registry phase must be P4 ready/awaiting authorization.");
check(registry.execution_model === "strictly_serial", "P4 execution must be strictly serial.");
check(registry.max_concurrent_lane_workers === 1, "P4 must allow only one lane worker at a time.");
check(registry.max_concurrent_spawned_agents_excluding_coordinator === 1, "P4 spawn limit must be one.");
check(registry.workers_may_spawn === false, "P4 workers must not spawn children.");
check(registry.implementation_requires.includes("explicit_P4_implementation_authorization"), "Explicit P4 authorization must be a registry gate.");
check(registry.implementation_requires.includes("RUNTIME_ROUTING_PROBE_VERIFIED_BEFORE_FIRST_WORKER"), "Runtime routing probe must be a registry gate.");

const expectedSequence = ["data", "experience", "experience", "quality", "reviewer"];
check(JSON.stringify(registry.p4_execution_sequence.map((step) => step.role)) === JSON.stringify(expectedSequence), "P4 execution order must be Data → Experience proof → Experience completion → Quality → Reviewer.");

const data = lanes.get("data");
check(data?.task === "docs/reporter-growth/v2/tasks/data-expansion-p4.md", "Data must use the P4 expansion brief.");
check(JSON.stringify(data?.allowed_directory_prefixes) === JSON.stringify(["src/data/"]), "Data must own only src/data/.");
check(data?.start_phase === "P4.0b_serial_sample_expansion", "Data must be the serial first lane.");
check(JSON.stringify(data?.acceptance_ids) === JSON.stringify(["SD01", "SD02", "SD03", "SD04", "SD05"]), "Data must own SD01-SD05.");

const experience = lanes.get("experience");
const experiencePaths = [
  "src/ui/",
  "src/shell/",
  "src/styles/",
  "src/features/markets/",
  "src/features/recruiting/",
  "src/features/reporters/",
  "src/features/team/",
  "src/features/programs/",
];
check(experience?.task === "docs/reporter-growth/v2/tasks/experience-redesign.md", "Experience must use the unified P4 brief.");
check(JSON.stringify(experience?.allowed_directory_prefixes) === JSON.stringify(experiencePaths), "Experience must own all five presentation surfaces and shared UI.");
check(experience?.start_phase === "P4.1_after_data_integration", "Experience must start only after Data integration.");

const formerFeaturePaths = {
  capacity: "src/features/markets/",
  recruiting: "src/features/recruiting/",
  network: "src/features/reporters/",
  team: "src/features/team/",
  programs: "src/features/programs/",
};

for (const id of Object.keys(formerFeaturePaths)) {
  const lane = lanes.get(id);
  check(lane?.start_phase === "on_demand_after_contract_change_request", `${id} must be on-demand only.`);
  check(lane?.task === "docs/reporter-growth/v2/tasks/domain-support-redesign.md", `${id} must use the logic-only support brief.`);
  check(lane?.allowed_directory_prefixes.every((prefix) => prefix.startsWith("src/logic/") && !prefix.startsWith("src/features/")), `${id} must not own feature presentation paths.`);
}

const quality = lanes.get("quality");
check(quality?.task === "docs/reporter-growth/v2/tasks/quality-redesign.md", "Quality must use the P4 brief.");
check(quality?.start_phase === "P4.4_after_fixed_integrated_candidate", "Quality must wait for a fixed candidate.");
check(registry.reviewer.task === "docs/reporter-growth/v2/tasks/reviewer.md", "Reviewer must use the fixed-candidate brief.");
check(registry.reviewer.read_only === true, "Reviewer must remain read-only.");

const roleExpectations = {
  data: ["tasks/data-expansion-p4.md", "exactly 50 canonical fictional people", "src/data/"],
  experience: ["tasks/experience-redesign.md", "design-lock/reference-manifest.md", "src/features/markets/", "src/features/programs/", "P4_VISUAL_PROOF_READY"],
  quality: ["tasks/quality-redesign.md", "design-lock/reference-manifest.md", "XR01-XR40", "SD01-SD05"],
  reviewer: ["P4 Reviewer", "design-lock/reference-manifest.md", "Quality passes without waiver", "Do not edit any file"],
};

for (const [id, expected] of Object.entries(roleExpectations)) {
  const text = read(`.codex/agents/${id}.toml`);
  check(text.includes('service_tier = "default"'), `${id} must use Standard/default processing.`);
  check(includesAll(text, expected), `${id} instructions do not contain all required P4 controls.`);
}

for (const [id, formerFeaturePath] of Object.entries(formerFeaturePaths)) {
  const text = read(`.codex/agents/${id}.toml`);
  check(text.includes("tasks/domain-support-redesign.md"), `${id} role must point to the P4 support brief.`);
  check(text.includes("no feature, JSX, CSS, shell, or shared-UI ownership"), `${id} role must explicitly forbid presentation ownership.`);
  check(!text.includes(formerFeaturePath), `${id} role must not retain its former feature path.`);
  check(text.includes('service_tier = "default"'), `${id} must use Standard/default processing.`);
}

const config = read(".codex/config.toml");
check(config.includes('service_tier = "default"'), "Coordinator configuration must remain Standard/default.");
check(config.includes("max_concurrent_threads_per_session = 1"), "Project runtime must enforce one P4 lane worker at a time.");
check(config.includes("P4 single presentation owner"), "Experience description must identify the single presentation owner.");
check(config.includes("P4 serial data-preparation lane"), "Data description must identify the serial preparation step.");

const requiredFiles = [
  "AGENTS.md",
  "docs/reporter-growth/v2/P4_READINESS.md",
  "docs/reporter-growth/v2/P4_DESIGN_LOCK.md",
  "docs/reporter-growth/v2/P4_SYNTHETIC_SAMPLE_EXPANSION.md",
  "docs/reporter-growth/v2/P4_EXPERIENCE_REDESIGN.md",
  "docs/reporter-growth/v2/P4_ACCEPTANCE.md",
  "docs/reporter-growth/v2/design-lock/reference-manifest.md",
  "docs/reporter-growth/v2/design-lock/reporter-growth-reference.html",
  "docs/reporter-growth/v2/tasks/data-expansion-p4.md",
  "docs/reporter-growth/v2/tasks/experience-redesign.md",
  "docs/reporter-growth/v2/tasks/domain-support-redesign.md",
  "docs/reporter-growth/v2/tasks/quality-redesign.md",
  registryPath,
  "scripts/verify-p4-readiness.mjs",
];

for (const relativePath of requiredFiles) {
  try {
    read(relativePath);
    execFileSync("git", ["ls-files", "--error-unmatch", relativePath], { cwd: root, stdio: "ignore" });
    check(true, `${relativePath} exists and is tracked.`);
  } catch {
    check(false, `${relativePath} must exist and be tracked before P4 is ready.`);
  }
}

const screenshotDir = path.join(root, "docs/reporter-growth/v2/design-lock/screenshots");
const screenshots = readdirSync(screenshotDir).filter((name) => name.endsWith(".png"));
check(screenshots.length === 17, "The locked reference must contain exactly 17 PNG comparison states.");

const checksumDir = path.join(root, "docs/reporter-growth/v2/design-lock");
const checksumRows = read("docs/reporter-growth/v2/design-lock/SHA256SUMS").trim().split("\n");
for (const row of checksumRows) {
  const [expected, relativePath] = row.trim().split(/\s+/, 2);
  const actual = createHash("sha256").update(readFileSync(path.join(checksumDir, relativePath))).digest("hex");
  check(actual === expected, `Checksum mismatch for design-lock/${relativePath}.`);
}

if (errors.length) {
  console.error(`P4 readiness verification failed (${errors.length}/${assertions} checks):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`P4 readiness verification passed (${assertions} checks).`);
