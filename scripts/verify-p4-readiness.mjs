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
check(registry.fanout_authorized === false, "The configured P4 wave must remain inactive until authorization and proof.");
check(registry.current_phase === "P4_ready_awaiting_explicit_implementation_authorization", "Registry phase must be P4 ready/awaiting authorization.");
check(registry.execution_model === "serial_gates_with_bounded_parallel_workspace_wave", "P4 must use serial gates with one bounded workspace wave.");
check(registry.spawn_context_policy?.name === "zero_inheritance", "P4 must declare a zero-inheritance spawn policy.");
check(registry.spawn_context_policy?.required_fork_turns === "none", "Every P4 spawn must require fork_turns=none.");
check(JSON.stringify(registry.spawn_context_policy?.forbidden_fork_turns) === JSON.stringify(["all", "bounded_history"]), "Full and bounded-history forks must be forbidden.");
check(registry.spawn_context_policy?.applies_to === "every_routed_probe_and_worker_spawn", "Zero inheritance must cover probes and workers.");
check(registry.max_concurrent_lane_workers === 4, "P4 must cap the workspace wave at four lane workers.");
check(registry.max_concurrent_spawned_agents_excluding_coordinator === 4, "P4 spawn limit must be four.");
check(registry.workers_may_spawn === false, "P4 workers must not spawn children.");
check(registry.implementation_requires.includes("explicit_P4_implementation_authorization"), "Explicit P4 authorization must be a registry gate.");
check(registry.implementation_requires.includes("ZERO_INHERITANCE_SPAWN_POLICY_VERIFIED"), "Zero inheritance must be an implementation gate.");
check(registry.implementation_requires.includes("RUNTIME_ROUTING_PROBE_VERIFIED_BEFORE_FIRST_WORKER"), "Runtime routing probe must be a registry gate.");

const expectedSequence = [
  ["data"],
  ["experience"],
  ["experience", "experience_reporters", "experience_team", "experience_programs"],
  ["quality"],
  ["reviewer"],
];
check(JSON.stringify(registry.p4_execution_sequence.map((step) => step.roles)) === JSON.stringify(expectedSequence), "P4 order must be Data → Lead proof → bounded workspace wave → Quality → Reviewer.");
check(registry.p4_execution_sequence.every((step, index) => index === 2 || step.roles.length === 1), "Only P4.2 may contain parallel roles.");

const data = lanes.get("data");
check(data?.task === "docs/reporter-growth/v2/tasks/data-expansion-p4.md", "Data must use the P4 expansion brief.");
check(JSON.stringify(data?.allowed_directory_prefixes) === JSON.stringify(["src/data/"]), "Data must own only src/data/.");
check(data?.start_phase === "P4.0b_serial_sample_expansion", "Data must be the serial first lane.");
check(JSON.stringify(data?.acceptance_ids) === JSON.stringify(["SD01", "SD02", "SD03", "SD04", "SD05"]), "Data must own SD01-SD05.");

const experience = lanes.get("experience");
const leadPaths = ["src/ui/", "src/shell/", "src/styles/", "src/features/markets/", "src/features/recruiting/"];
check(experience?.task === "docs/reporter-growth/v2/tasks/experience-redesign.md", "Experience Lead must use the P4 Lead brief.");
check(JSON.stringify(experience?.allowed_directory_prefixes) === JSON.stringify(leadPaths), "Experience Lead must own shared UI plus Overview/Funnel only.");
check(experience?.start_phase === "P4.1_after_data_integration", "Experience Lead must start only after Data integration.");
check(experience?.model === "gpt-5.6-terra" && experience?.reasoning_effort === "medium", "Experience Lead must use Terra/medium.");

const specialistExpectations = {
  experience_reporters: {
    path: "src/features/reporters/",
    task: "docs/reporter-growth/v2/tasks/experience-reporters.md",
  },
  experience_team: {
    path: "src/features/team/",
    task: "docs/reporter-growth/v2/tasks/experience-team.md",
  },
  experience_programs: {
    path: "src/features/programs/",
    task: "docs/reporter-growth/v2/tasks/experience-programs.md",
  },
};

for (const [id, expected] of Object.entries(specialistExpectations)) {
  const lane = lanes.get(id);
  check(lane?.start_phase === "P4.2_after_visual_proof", `${id} must start only after visual proof.`);
  check(lane?.task === expected.task, `${id} must use its workspace brief.`);
  check(JSON.stringify(lane?.allowed_directory_prefixes) === JSON.stringify([expected.path]), `${id} must own one feature path only.`);
  check(lane?.model === "gpt-5.6-terra" && lane?.reasoning_effort === "medium" && lane?.service_tier === "default", `${id} must use Terra/medium/default.`);

  const roleText = read(`.codex/agents/${id}.toml`);
  check(includesAll(roleText, [expected.task.split("docs/reporter-growth/v2/")[1], expected.path, "shared components", "Experience Lead", "screenshot checkpoints", 'service_tier = "default"']), `${id} role lacks required ownership or coordination controls.`);
  check(roleText.includes('model = "gpt-5.6-terra"') && roleText.includes('model_reasoning_effort = "medium"'), `${id} role model must match the registry.`);

  const taskText = read(expected.task);
  check(includesAll(taskText, ["after", "visual proof", expected.path, "Experience Lead", "candidate screenshots", "Communication does not expand"]), `${id} task brief lacks proof, path, or Lead-review controls.`);
}

const presentationLanes = [experience, ...Object.keys(specialistExpectations).map((id) => lanes.get(id))];
const presentationPaths = presentationLanes.flatMap((lane) => lane.allowed_directory_prefixes);
check(new Set(presentationPaths).size === presentationPaths.length, "P4 presentation write paths must not overlap.");

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
check(quality?.acceptance_ids.includes("XR01-XR41"), "Quality must verify XR01-XR41.");
check(registry.reviewer.task === "docs/reporter-growth/v2/tasks/reviewer.md", "Reviewer must use the fixed-candidate brief.");
check(registry.reviewer.read_only === true, "Reviewer must remain read-only.");

const roleExpectations = {
  data: ["tasks/data-expansion-p4.md", "exactly 50 canonical fictional people", "src/data/"],
  experience: ["tasks/experience-redesign.md", "design-lock/reference-manifest.md", "src/features/markets/", "src/features/recruiting/", "P4_VISUAL_PROOF_READY", "design steward"],
  quality: ["tasks/quality-redesign.md", "design-lock/reference-manifest.md", "XR01-XR41", "SD01-SD05"],
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
check(config.includes("max_concurrent_threads_per_session = 4"), "Project runtime must cap the P4.2 wave at four.");
check(config.includes("P4 Experience Lead"), "Experience description must identify the Lead.");
check(includesAll(config, ["[agents.experience_reporters]", "[agents.experience_team]", "[agents.experience_programs]"]), "Project config must register all three Experience specialists.");
check(config.includes("P4 serial data-preparation lane"), "Data description must identify the serial preparation step.");

const acceptance = read("docs/reporter-growth/v2/P4_ACCEPTANCE.md");
check(includesAll(acceptance, ["XR41", "Experience Lead alone edits shared", "candidate/reference screenshot checkpoints"]), "Acceptance must enforce Lead-only shared changes and specialist screenshot review.");
const agentInstructions = read("AGENTS.md");
check(includesAll(agentInstructions, ["Zero-inheritance policy", 'fork_turns="none"', 'fork_turns="all"', "bounded history fork", "zero coordinator"]), "AGENTS.md must enforce zero inherited coordinator turns.");
const readiness = read("docs/reporter-growth/v2/P4_READINESS.md");
check(includesAll(readiness, ["serial gates", "bounded parallel", "Models and why each lane uses them", "four concurrent workers", "Zero inheritance", 'fork_turns="none"']), "Readiness must explain gates, concurrency, models, and zero inheritance.");
const laneDocs = read("docs/reporter-growth/v2/LANES.md");
check(includesAll(laneDocs, ["bounded parallel presentation wave", "experience_reporters", "Experience Lead", "candidate/reference", "zero-inheritance policy", 'fork_turns="none"']), "Lane docs must describe the Lead/specialist workflow and zero inheritance.");

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
  "docs/reporter-growth/v2/tasks/experience-reporters.md",
  "docs/reporter-growth/v2/tasks/experience-team.md",
  "docs/reporter-growth/v2/tasks/experience-programs.md",
  "docs/reporter-growth/v2/tasks/domain-support-redesign.md",
  "docs/reporter-growth/v2/tasks/quality-redesign.md",
  ".codex/agents/experience_reporters.toml",
  ".codex/agents/experience_team.toml",
  ".codex/agents/experience_programs.toml",
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
