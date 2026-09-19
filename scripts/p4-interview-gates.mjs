// Amendment gates are separate from the retained September 17/18 proof.
export const INTERVIEW_PHASES = [
  'IP0_contract_preparation', 'IP1_serial_data_logic', 'IP2_visual_proof',
  'IP3_workspace_wave', 'IP4_integration', 'IP5_quality', 'IP6_reviewer', 'IP_complete',
];
export const IP_IDS = Array.from({ length: 12 }, (_, i) => `IP${String(i + 1).padStart(2, '0')}`);
const specialists = ['experience_reporters', 'experience_team', 'experience_programs'];
const support = ['data', 'capacity', 'recruiting', 'network', 'team', 'programs'];
export const DESKTOP_INTERVIEW_SCOPE = 'desktop_interview_2026_09_19';
export function interviewViewports(state) {
  const viewports = [[1440, 900], [1024, 768], [768, 1024]];
  return state.interview_improvement_amendment?.presentation_scope?.id === DESKTOP_INTERVIEW_SCOPE
    ? viewports : [...viewports, [390, 844]];
}

export function inspectInterviewGates(state, registry, verifyEvidence = () => false) {
  const errors = [];
  const check = (condition, message) => { if (!condition) errors.push(message); };
  const amendment = state.interview_improvement_amendment;
  const index = INTERVIEW_PHASES.indexOf(state.current_phase);
  check(index >= 0, 'Authorized interview work must use an IP phase, never a historical P4 phase.');
  check(amendment?.implementation_authorized === true, 'Interview implementation needs its own explicit start.');
  check(Boolean(amendment?.authorization?.source && amendment?.authorization?.thread_id && amendment?.authorization?.authorized_at), 'The interview start must identify its source, task, and date.');
  check(registry.interview_improvement_amendment?.implementation_authorized === amendment?.implementation_authorized, 'Registry and ledger must agree on interview authorization.');
  check(registry.active_execution_sequence === 'interview_improvement', 'The active routing sequence must identify the interview amendment.');
  check(registry.current_phase === state.current_phase, 'Registry and ledger phases must agree.');
  check(registry.fanout_authorized === state.fanout_authorized, 'Registry and ledger fan-out gates must agree.');
  check(state.implementation_active === true && registry.implementation_active === true, 'Authorized amendment must be active.');
  check(JSON.stringify(amendment?.acceptance_ids) === JSON.stringify(IP_IDS), 'The amendment must require every IP01–IP12 criterion.');
  check(amendment?.sample_expansion === 'completed_do_not_repeat', 'The completed 50-person expansion must not be repeated.');
  check(state.gates?.data?.status === 'passed' && state.gates.data.required_acceptance_ids?.join(',') === 'SD01,SD02,SD03,SD04,SD05,SD06,SD07', 'Retain the completed SD01–SD07 gate.');
  check(Boolean(state.historical_p4?.file && state.historical_p4?.sha256) && verifyEvidence(state.historical_p4), 'Historical P4 state must be preserved with a valid checksum.');
  check(Boolean(amendment?.contract_packet), 'The bounded contract packet must be named before workers start.');
  const presentationScope = amendment?.presentation_scope;
  if (presentationScope) {
    check(presentationScope.id === DESKTOP_INTERVIEW_SCOPE && registry.interview_improvement_amendment?.presentation_scope === presentationScope.id,
      'The desktop interview scope must match the approved registry scope.');
    check(Boolean(presentationScope.authorization?.source && presentationScope.authorization?.thread_id && presentationScope.authorization?.authorized_at)
      && verifyEvidence(presentationScope.evidence), 'Changing phone requirements needs recorded user authorization and checksum-valid scope evidence.');
  }
  const proof = state.gates?.visual_proof;
  const wave = state.gates?.workspace_wave;
  const quality = state.gates?.quality;
  const reviewer = state.gates?.reviewer;
  check(state.fanout_authorized === (index >= 3), 'Fan-out stays closed until the revised Overview/Funnel proof passes.');
  if (index < 3) check(proof?.status !== 'accepted', 'Historical visual acceptance cannot satisfy the new proof.');
  if (index >= 2) {
    check(state.gates?.contracts?.status === 'passed', 'Presentation requires a frozen contract baseline.');
    check(state.gates?.data_logic?.status === 'passed', 'Presentation requires completed serial data/logic repairs.');
    check(state.gates?.baseline?.status === 'passed', 'Presentation requires a compiling, tested baseline.');
  }
  if (index >= 3) {
    check(proof?.status === 'accepted' && proof.scope === 'IP01-IP12_amendment', 'The workspace wave requires amendment-specific visual acceptance.');
    check(Boolean(proof?.accepted_commit && proof?.reference_manifest) && verifyEvidence(proof?.evidence), 'Revised proof needs an exact commit, versioned reference and verified evidence.');
    check(proof?.reference_manifest !== 'docs/reporter-growth/v2/design-lock/reference-manifest.md', 'Retain the historical reference; version the changed states separately.');
    check(proof?.pointer_keyboard_touch_passed === true && proof?.waivers?.length === 0, 'Visual acceptance requires pointer, keyboard and touch proof without waivers.');
    if (interviewViewports(state).some(([width]) => width === 390)) check(proof?.mobile_390_passed === true, 'The original scope still requires 390px proof.');
    for (const role of ['experience', ...specialists]) check(validProbe(amendment, registry, role, verifyEvidence), `The workspace wave needs a fresh ${role} runtime probe.`);
  }
  if (index >= 5) {
    check(wave?.status === 'passed' && wave?.candidate_commit === state.current_candidate?.commit, 'Quality requires one fixed integrated workspace candidate.');
    for (const role of specialists) check(wave?.lead_reviews?.[role]?.status === 'passed' && verifyEvidence(wave?.lead_reviews?.[role]?.evidence), `Quality needs the Lead's recorded ${role} screenshot review.`);
  }
  if (index >= 6) {
    check(quality?.status === 'passed' && quality?.candidate_commit === state.current_candidate?.commit, 'Reviewer must examine the exact Quality-passed commit.');
    check(quality?.waivers?.length === 0 && quality?.full_suite_passed === true && quality?.existing_acceptance_passed === true, 'Quality must pass the complete suite and applicable existing acceptance without waivers.');
    for (const id of IP_IDS) check(quality?.acceptance?.[id]?.status === 'passed' && verifyEvidence(quality?.acceptance?.[id]?.evidence), `${id} needs independent Quality evidence.`);
  }
  if (state.current_phase === 'IP_complete') check(reviewer?.status === 'passed' && reviewer?.candidate_commit === quality?.candidate_commit && verifyEvidence(reviewer?.evidence), 'Completion requires Reviewer evidence for the exact Quality-passed commit.');
  return errors;
}

function validProbe(amendment, registry, role, verifyEvidence) {
  const lane = [...registry.lanes, registry.reviewer].find((item) => item.id === role);
  const probe = amendment?.runtime_probes?.find((item) => item.role === role);
  return Boolean(lane && probe && probe.model === lane.model && probe.reasoning_effort === lane.reasoning_effort
    && probe.fork_turns === 'none' && probe.inherited_turns === 0 && probe.session_id
    && probe.verified_at >= amendment.authorization.authorized_at && verifyEvidence(probe.evidence));
}

export function inspectInterviewDispatch(state, registry, role, kind, verifyEvidence = () => false) {
  const errors = inspectInterviewGates(state, registry, verifyEvidence);
  const amendment = state.interview_improvement_amendment;
  const lane = [...registry.lanes, registry.reviewer].find((item) => item.id === role);
  if (!lane) return [...errors, `Unknown role: ${role}`];
  if (!['probe', 'implementation'].includes(kind)) return [...errors, 'Dispatch kind must be probe or implementation.'];
  const catalog = amendment?.runtime_catalog;
  const loaded = catalog?.roles?.[role];
  if (catalog?.status !== 'verified' || loaded?.model !== lane.model || loaded?.reasoning_effort !== lane.reasoning_effort || !verifyEvidence(catalog?.evidence)) errors.push(`Loaded ${role} metadata is not verified; configuration text cannot authorize dispatch.`);
  if (kind === 'probe') return errors;
  if (!validProbe(amendment, registry, role, verifyEvidence)) errors.push(`${role} requires a fresh zero-inheritance runtime probe before implementation.`);
  const phase = state.current_phase;
  const repair = amendment?.browser_prerequisite_repair;
  const prerequisiteRepair = phase === 'IP0_contract_preparation' && role === 'quality'
    && repair?.status === 'authorized' && repair.role === 'quality'
    && repair.authorization?.source && repair.authorization?.thread_id && repair.authorization?.authorized_at
    && JSON.stringify(repair.allowed_paths) === JSON.stringify(['tests/e2e/reporter-growth.browser.spec.ts'])
    && repair.independent_quality_gate_retained === true && repair.waivers?.length === 0
    && verifyEvidence(repair.proposal) && verifyEvidence(repair.diagnostic);
  const permitted = prerequisiteRepair || (phase === 'IP1_serial_data_logic' && support.includes(role))
    || (phase === 'IP2_visual_proof' && role === 'experience')
    || (phase === 'IP3_workspace_wave' && ['experience', ...specialists].includes(role))
    || (phase === 'IP5_quality' && role === 'quality')
    || (phase === 'IP6_reviewer' && role === 'reviewer');
  if (!permitted) errors.push(`${role} implementation cannot run during ${phase}.`);
  if (phase === 'IP1_serial_data_logic' && state.gates?.contracts?.status !== 'passed') errors.push('Serial repairs require the frozen coordinator contract packet.');
  if (support.includes(role) && !amendment?.approved_contract_requests?.some((request) => request.role === role && request.status === 'approved')) errors.push(`${role} requires an approved bounded contract request.`);
  return errors;
}
