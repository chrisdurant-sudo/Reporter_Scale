import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectInterviewGates, inspectInterviewDispatch, interviewViewports, interviewTouchRequired, DESKTOP_INTERVIEW_SCOPE, DESKTOP_ONLY_INTERVIEW_SCOPE, IP_IDS } from './p4-interview-gates.mjs';
const proof = { file: 'proof.json', sha256: 'verified' };
const verify = (item) => item?.file === proof.file && item.sha256 === proof.sha256;
const roles = ['data', 'capacity', 'recruiting', 'network', 'team', 'programs', 'experience', 'experience_reporters', 'experience_team', 'experience_programs', 'quality', 'reviewer'];
const role = (id) => ({ id, model: 'gpt-6-astra', reasoning_effort: ['quality', 'reviewer'].includes(id) ? 'xhigh' : 'high' });
function fixture(phase = 'IP0_contract_preparation') {
  const a = { implementation_authorized: true, authorization: { source: 'please start', thread_id: 'task', authorized_at: '2026-09-18' }, acceptance_ids: IP_IDS, sample_expansion: 'completed_do_not_repeat', contract_packet: 'contracts.md', runtime_probes: [], approved_contract_requests: [] };
  const state = { current_phase: phase, implementation_active: true, fanout_authorized: false, current_candidate: { commit: 'candidate' }, historical_p4: proof, interview_improvement_amendment: a, gates: { data: { status: 'passed', required_acceptance_ids: Array.from({ length: 7 }, (_, i) => `SD0${i + 1}`) }, contracts: { status: 'passed' }, data_logic: { status: 'passed' }, baseline: { status: 'passed' }, visual_proof: { status: 'pending' } } };
  const registry = { current_phase: phase, active_execution_sequence: 'interview_improvement', implementation_active: true, fanout_authorized: false, interview_improvement_amendment: { implementation_authorized: true }, lanes: roles.filter((r) => r !== 'reviewer').map(role), reviewer: role('reviewer') };
  return { state, registry };
}
const audit = ({ state, registry }) => inspectInterviewGates(state, registry, verify);
function ready() {
  const f = fixture('IP6_reviewer');
  f.state.fanout_authorized = f.registry.fanout_authorized = true;
  const a = f.state.interview_improvement_amendment;
  a.runtime_probes = roles.map((id) => ({ role: id, ...role(id), fork_turns: 'none', inherited_turns: 0, session_id: `session-${id}`, verified_at: '2026-09-19', evidence: proof }));
  f.state.gates.visual_proof = { status: 'accepted', scope: 'IP01-IP12_amendment', accepted_commit: 'visual', reference_manifest: 'amended-reference.json', evidence: proof, pointer_keyboard_touch_passed: true, mobile_390_passed: true, waivers: [] };
  f.state.gates.workspace_wave = { status: 'passed', candidate_commit: 'candidate', lead_reviews: Object.fromEntries(roles.filter((id) => id.startsWith('experience_')).map((id) => [id, { status: 'passed', evidence: proof }])) };
  f.state.gates.quality = { status: 'passed', candidate_commit: 'candidate', full_suite_passed: true, existing_acceptance_passed: true, waivers: [], acceptance: Object.fromEntries(IP_IDS.map((id) => [id, { status: 'passed', evidence: proof }])) };
  return f;
}
test('coordinator preparation can proceed while every worker is blocked', () => {
  const f = fixture(); assert.deepEqual(audit(f), []);
  for (const id of roles) assert.ok(inspectInterviewDispatch(f.state, f.registry, id, 'implementation', verify).length);
});
test('old active authorization cannot replace the explicit interview start', () => {
  const f = fixture(); f.state.interview_improvement_amendment.implementation_authorized = false;
  assert.ok(audit(f).some((e) => e.includes('explicit start')));
});
test('historical phase and accepted screenshots cannot reopen fan-out', () => {
  const f = fixture('P4.3_integration'); f.state.gates.visual_proof.status = 'accepted'; f.state.fanout_authorized = true;
  assert.ok(audit(f).some((e) => e.includes('historical P4 phase')));
  assert.ok(audit(f).some((e) => e.includes('Historical visual')));
});
test('configured Astra cannot substitute for loaded-role or runtime evidence', () => {
  const f = fixture('IP1_serial_data_logic'); const a = f.state.interview_improvement_amendment;
  a.runtime_catalog = { status: 'verified', evidence: proof, roles: { data: { model: 'gpt-5.6-luna', reasoning_effort: 'medium' } } };
  assert.ok(inspectInterviewDispatch(f.state, f.registry, 'data', 'probe', verify).some((e) => e.includes('Loaded data')));
});
test('a verified catalog permits a read-only probe, not an implementation', () => {
  const f = fixture(); f.state.interview_improvement_amendment.runtime_catalog = { status: 'verified', evidence: proof, roles: { data: role('data') } };
  assert.deepEqual(inspectInterviewDispatch(f.state, f.registry, 'data', 'probe', verify), []);
  assert.ok(inspectInterviewDispatch(f.state, f.registry, 'data', 'implementation', verify).length);
});
test('serial logic requires a frozen contract and approved bounded request', () => {
  const f = fixture('IP1_serial_data_logic'); f.state.gates.contracts.status = 'pending';
  assert.ok(inspectInterviewDispatch(f.state, f.registry, 'team', 'implementation', verify).some((e) => e.includes('frozen coordinator')));
  assert.ok(inspectInterviewDispatch(f.state, f.registry, 'team', 'implementation', verify).some((e) => e.includes('bounded contract')));
});
test('presentation cannot precede completed serial repairs', () => {
  const f = fixture('IP2_visual_proof'); f.state.gates.data_logic.status = 'pending';
  assert.ok(audit(f).some((e) => e.includes('serial data/logic')));
});
test('reviewer can receive a fully evidenced candidate', () => assert.deepEqual(audit(ready()), []));
test('any production repair invalidates the prior Quality commit', () => {
  const f = ready(); f.state.current_candidate.commit = 'repaired';
  assert.ok(audit(f).some((e) => e.includes('exact Quality-passed')));
});
test('missing IP verification or responsive waiver blocks Reviewer', () => {
  const f = ready(); delete f.state.gates.quality.acceptance.IP09; f.state.gates.visual_proof.waivers = ['mobile'];
  assert.ok(audit(f).some((e) => e.includes('IP09')));
  assert.ok(audit(f).some((e) => e.includes('without waivers')));
});
test('authorized desktop scope changes the required matrix without waiving interactions', () => {
  const f = ready();
  f.state.interview_improvement_amendment.presentation_scope = { id: DESKTOP_INTERVIEW_SCOPE, authorization: { source: 'Phone optimization not needed', thread_id: 'task', authorized_at: '2026-09-19' }, evidence: proof };
  f.registry.interview_improvement_amendment.presentation_scope = DESKTOP_INTERVIEW_SCOPE;
  delete f.state.gates.visual_proof.mobile_390_passed;
  assert.deepEqual(interviewViewports(f.state), [[1440, 900], [1024, 768], [768, 1024]]);
  assert.deepEqual(audit(f), []);
  f.state.gates.visual_proof.pointer_keyboard_touch_passed = false;
  assert.ok(audit(f).some((e) => e.includes('pointer, keyboard and touch')));
});
test('phone requirements cannot be silently removed or replaced with an unknown scope', () => {
  const f = ready(); delete f.state.gates.visual_proof.mobile_390_passed;
  assert.ok(audit(f).some((e) => e.includes('390px')));
  f.state.interview_improvement_amendment.presentation_scope = { id: DESKTOP_INTERVIEW_SCOPE };
  assert.ok(audit(f).some((e) => e.includes('user authorization')));
  assert.ok(audit(f).some((e) => e.includes('registry scope')));
  f.state.interview_improvement_amendment.presentation_scope.id = 'anything';
  assert.ok(interviewViewports(f.state).some(([width]) => width === 390));
});
test('latest authorized desktop-only scope needs desktop pointer and keyboard proof', () => {
  const f = ready();
  f.state.interview_improvement_amendment.presentation_scope = { id: DESKTOP_ONLY_INTERVIEW_SCOPE, authorization: { source: 'Only desktop needed, not tablet', thread_id: 'task', authorized_at: '2026-09-19' }, evidence: proof };
  f.registry.interview_improvement_amendment.presentation_scope = DESKTOP_ONLY_INTERVIEW_SCOPE;
  delete f.state.gates.visual_proof.mobile_390_passed;
  delete f.state.gates.visual_proof.pointer_keyboard_touch_passed;
  assert.deepEqual(interviewViewports(f.state), [[1440, 900]]);
  assert.equal(interviewTouchRequired(f.state), false);
  assert.ok(audit(f).some((e) => e.includes('pointer and keyboard proof')));
  f.state.gates.visual_proof.pointer_keyboard_passed = true;
  assert.deepEqual(audit(f), []);
});
test('inherited or stale probes cannot authorize the specialist wave', () => {
  const f = ready(); const p = f.state.interview_improvement_amendment.runtime_probes.find((p) => p.role === 'experience_team');
  p.fork_turns = 'all'; p.inherited_turns = 1;
  assert.ok(audit(f).some((e) => e.includes('experience_team runtime probe')));
  p.fork_turns = 'none'; p.inherited_turns = 0; p.verified_at = '2026-09-17';
  assert.ok(audit(f).some((e) => e.includes('experience_team runtime probe')));
});
test('tampered historical evidence and a repeated seed expansion are rejected', () => {
  const f = fixture(); f.state.historical_p4 = { ...proof, sha256: 'changed' }; f.state.interview_improvement_amendment.sample_expansion = 'add_50';
  assert.ok(audit(f).some((e) => e.includes('checksum')));
  assert.ok(audit(f).some((e) => e.includes('must not be repeated')));
});
test('IP0 test repair requires explicit bounded authorization and a fresh Quality probe', () => {
  const f = fixture(); const a = f.state.interview_improvement_amendment;
  a.runtime_catalog = { status: 'verified', evidence: proof, roles: { quality: role('quality') } };
  a.runtime_probes = [{ role: 'quality', ...role('quality'), fork_turns: 'none', inherited_turns: 0, session_id: 'quality-probe', verified_at: '2026-09-19', evidence: proof }];
  a.browser_prerequisite_repair = { status: 'authorized', role: 'quality', authorization: { source: 'Approve the narrow test-repair exception', thread_id: 'task', authorized_at: '2026-09-19' }, allowed_paths: ['tests/e2e/reporter-growth.browser.spec.ts'], independent_quality_gate_retained: true, waivers: [], proposal: proof, diagnostic: proof };
  f.state.gates.baseline.status = 'failed';
  const check = () => inspectInterviewDispatch(f.state, f.registry, 'quality', 'implementation', verify);
  assert.deepEqual(check(), []);
  a.browser_prerequisite_repair.allowed_paths.push('src/'); assert.ok(check().length);
  a.browser_prerequisite_repair.allowed_paths.pop();
  a.browser_prerequisite_repair.authorization = null; assert.ok(check().length);
});
test('IP0 exception cannot waive independent acceptance or reuse an inherited probe', () => {
  const f = fixture(); const a = f.state.interview_improvement_amendment;
  a.runtime_catalog = { status: 'verified', evidence: proof, roles: { quality: role('quality') } };
  a.runtime_probes = [{ role: 'quality', ...role('quality'), fork_turns: 'all', inherited_turns: 1, session_id: 'quality-probe', verified_at: '2026-09-19', evidence: proof }];
  a.browser_prerequisite_repair = { status: 'authorized', role: 'quality', authorization: { source: 'approved', thread_id: 'task', authorized_at: '2026-09-19' }, allowed_paths: ['tests/e2e/reporter-growth.browser.spec.ts'], independent_quality_gate_retained: false, waivers: ['browser'], proposal: proof, diagnostic: proof };
  const errors = inspectInterviewDispatch(f.state, f.registry, 'quality', 'implementation', verify);
  assert.ok(errors.some((e) => e.includes('fresh zero-inheritance')));
  assert.ok(errors.some((e) => e.includes('cannot run during')));
});
test('interview test alignment needs standing authorization, a fixed diagnostic and stopped workers', () => {
  const f = fixture('IP2_visual_proof'); const a = f.state.interview_improvement_amendment;
  f.state.current_candidate.commit = 'a'.repeat(40);
  a.runtime_catalog = { status: 'verified', evidence: proof, roles: { quality: role('quality') } };
  a.runtime_probes = [{ role: 'quality', ...role('quality'), fork_turns: 'none', inherited_turns: 0, session_id: 'quality-probe', verified_at: '2026-09-19', evidence: proof }];
  a.test_alignment = { status: 'authorized', role: 'quality', authorization: { source: 'Approve these bounded test-alignment passes', thread_id: 'task', authorized_at: '2026-09-19' }, allowed_paths: ['tests/acceptance/reporter-growth.integration.test.tsx', 'tests/e2e/reporter-growth.browser.spec.ts'], independent_quality_gate_retained: true, reviewer_gate_retained: true, waivers: [], proposal: proof, current_pass: { status: 'prepared', serial_workers_stopped: true, candidate_commit: f.state.current_candidate.commit, diagnostic: proof, scope: proof } };
  const check = () => inspectInterviewDispatch(f.state, f.registry, 'quality', 'implementation', verify);
  assert.deepEqual(check(), []);
  for (const [field, value] of [['authorization', null], ['reviewer_gate_retained', false], ['independent_quality_gate_retained', false], ['waivers', ['browser']], ['allowed_paths', ['src/']]]) {
    const prior = a.test_alignment[field]; a.test_alignment[field] = value; assert.ok(check().length, field); a.test_alignment[field] = prior;
  }
  for (const [field, value] of [['serial_workers_stopped', false], ['candidate_commit', 'b'.repeat(40)], ['diagnostic', null], ['scope', null]]) {
    const prior = a.test_alignment.current_pass[field]; a.test_alignment.current_pass[field] = value; assert.ok(check().length, field); a.test_alignment.current_pass[field] = prior;
  }
  f.state.current_phase = f.registry.current_phase = 'IP1_serial_data_logic';
  assert.ok(check().some((e) => e.includes('cannot run during')));
  assert.ok(inspectInterviewDispatch(f.state, f.registry, 'experience_reporters', 'implementation', verify).some((e) => e.includes('cannot run during')));
});
