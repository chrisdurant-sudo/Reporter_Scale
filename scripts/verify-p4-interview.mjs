import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { inspectInterviewGates, inspectInterviewDispatch } from './p4-interview-gates.mjs';

export function verifyInterview(root, state, registry, dispatch = null) {
  const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const json = (file) => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const existsCommit = (sha) => { try { return /^[a-f0-9]{40}$/.test(sha ?? '') && Boolean(git('rev-parse', '--verify', `${sha}^{commit}`)); } catch { return false; } };
  const ancestor = (sha) => { try { git('merge-base', '--is-ancestor', sha, 'HEAD'); return true; } catch { return false; } };
  const evidence = (item) => {
    try {
      if (!item?.file || path.isAbsolute(item.file) || item.file.split('/').includes('..')) return false;
      git('ls-files', '--error-unmatch', item.file);
      return createHash('sha256').update(readFileSync(path.join(root, item.file))).digest('hex') === item.sha256;
    } catch { return false; }
  };
  errors.push(...(dispatch
    ? inspectInterviewDispatch(state, registry, dispatch.role, dispatch.kind, evidence)
    : inspectInterviewGates(state, registry, evidence)));
  check(path.resolve(root) === path.resolve(state.active_coordinator_worktree), 'Run governance in the recorded active coordinator checkout.');
  check(!root.split(path.sep).includes('node_modules'), 'An active worktree cannot be inside node_modules.');
  check(existsCommit(state.implementation_base_commit) && ancestor(state.implementation_base_commit), 'Amendment base must be an exact ancestor commit.');
  check(existsCommit(state.current_candidate?.commit) && ancestor(state.current_candidate.commit), 'Candidate must be an exact ancestor commit.');
  const amendment = state.interview_improvement_amendment;
  try { git('ls-files', '--error-unmatch', amendment.contract_packet); } catch { errors.push('The bounded contract packet must be tracked.'); }
  if (evidence(state.historical_p4)) {
    const history = json(state.historical_p4.file);
    check(history.gates.data.status === 'passed' && JSON.stringify(history.gates.data) === JSON.stringify(state.gates.data), 'Do not rewrite or repeat the historical SD01–SD07 result.');
  }
  if (existsCommit(state.implementation_base_commit)) {
    const originalPackage = JSON.parse(git('show', `${state.implementation_base_commit}:package.json`));
    const currentPackage = json('package.json');
    check(JSON.stringify(originalPackage.dependencies) === JSON.stringify(currentPackage.dependencies)
      && JSON.stringify(originalPackage.devDependencies) === JSON.stringify(currentPackage.devDependencies), 'New or changed dependencies are not authorized.');
    const changed = new Set([
      ...git('diff', '--name-only', `${state.implementation_base_commit}..HEAD`).split('\n'),
      ...git('diff', '--name-only', 'HEAD').split('\n'),
      ...git('ls-files', '--others', '--exclude-standard').split('\n'),
    ].filter(Boolean));
    const early = ['IP0_contract_preparation', 'IP1_serial_data_logic'].includes(state.current_phase);
    for (const file of changed) {
      check(file !== 'package-lock.json', 'Dependency changes are not authorized.');
      if (early) check(!/^(src\/(features|ui|shell|styles)\/|docs\/reporter-growth\/v2\/design-lock\/)/.test(file), `Presentation changed before the serial preparation gate: ${file}`);
      if (state.current_phase === 'IP0_contract_preparation') check(!/^src\/(data|logic\/(capacity|recruiting|network|team|programs))\//.test(file), `Lane production changed before runtime-verified dispatch: ${file}`);
      if (state.current_phase === 'IP2_visual_proof') check(!/^src\/features\/(reporters|team|programs)\//.test(file), `Specialist path changed before revised visual proof: ${file}`);
    }
  }
  for (const key of ['contracts', 'data_logic', 'baseline']) {
    const gate = state.gates[key];
    if (gate?.status === 'passed') {
      check(existsCommit(gate.candidate_commit) && ancestor(gate.candidate_commit), `${key} must name its exact verified commit.`);
      check(evidence(gate.evidence), `${key} needs checksum-valid evidence.`);
    }
  }
  const proof = state.gates.visual_proof;
  if (proof?.status === 'accepted') {
    check(existsCommit(proof.accepted_commit) && ancestor(proof.accepted_commit), 'Revised visual proof must name an integrated exact commit.');
    check(proof.accepted_commit !== state.implementation_base_commit, 'The planning baseline cannot be accepted as revised visual proof.');
    if (evidence(proof.evidence)) {
      const manifest = json(proof.evidence.file);
      check(manifest.captured_from_commit === proof.accepted_commit && manifest.worktree_clean_before_capture === true, 'The visual manifest must identify the clean accepted commit.');
      for (const surface of ['overview', 'funnel_people', 'funnel_bottlenecks']) {
        for (const [width, height] of [[1440, 900], [1024, 768], [768, 1024], [390, 844]]) {
          const artifact = manifest.artifacts?.find((item) => item.id === `${surface}_${width}x${height}`);
          check(artifact?.commit === proof.accepted_commit && artifact?.viewport?.width === width && artifact?.viewport?.height === height && artifact.route && artifact.state && evidence(artifact), `Missing or invalid revised ${surface} ${width}x${height} capture.`);
        }
      }
      const editor = manifest.artifacts?.find((item) => item.id === 'funnel_sla_editor');
      check(editor?.commit === proof.accepted_commit && evidence(editor), 'The revised proof requires the SLA editor state.');
      check(evidence(manifest.reference_evidence) && manifest.reference_evidence.file === proof.reference_manifest, 'The revised reference must be checksum-valid and match the proof.');
      if (evidence(manifest.interaction_evidence)) {
        const interactions = json(manifest.interaction_evidence.file);
        check(interactions.captured_from_commit === proof.accepted_commit && interactions.worktree_clean_before_capture === true, 'Interaction proof must match the clean visual candidate.');
        for (const id of ['market_selection', 'workspace_navigation', 'chart_pointer', 'chart_keyboard', 'chart_touch', 'status_filters', 'owner_waiting_filters', 'capacity_reconciliation', 'attention_destinations', 'sla_recomputation', 'mobile_390']) check(interactions.interactions?.some((item) => item.id === id && item.status === 'passed'), `Missing revised behavior proof: ${id}`);
        check(interactions.console_errors?.length === 0 && interactions.page_errors?.length === 0 && interactions.waivers?.length === 0, 'Interaction proof cannot contain errors or waivers.');
      } else errors.push('Revised proof requires checksum-valid interactions.');
    }
  }
  return errors;
}
