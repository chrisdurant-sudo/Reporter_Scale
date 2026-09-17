import {
  SCENARIO_IDS,
  type ActionError, type ActionResult, type CoachingNote, type CommandContext,
  type DemoSnapshot, type FirstJobMetric, type FollowUp,
  type HistoricalRateMetric, type ImprovementDecision, type ImprovementsViewModel,
  type LifecycleEvent, type LifecycleStage, type Market, type MarketId, type MarketPlanInput,
  type MarketPlanPreview, type MarketsViewModel, type OutreachPreview, type ProcessDraft,
  type Reporter, type ReportersViewModel, type RulesEngine,
  type SavedMarketPlan, type ScreeningReview, type SelectedMarket,
} from "../contracts";

const DAY = 86_400_000;
const WINDOW = 14 as const;
const err = (code: string, message: string, field?: string): ActionError => ({ code, message, ...(field ? { field } : {}) });
const fail = <T = never>(message: string, errors: ActionError[]): ActionResult<T> => ({ ok: false, message, errors });
const ok = <T>(value: T, message: string, revision?: number): ActionResult<T> => ({ ok: true, value, message, ...(revision === undefined ? {} : { revision }) });
const date = (value: string): Date | null => { const result = new Date(value); return Number.isNaN(result.getTime()) ? null : result; };
const labelDate = (value: string) => { const result = date(value); return result ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(result) : "Unknown date"; };
const windowLabel = (start: string, end: string) => `${labelDate(start)} – ${labelDate(end)}`;
const currentAt = (snapshot: DemoSnapshot) => date(snapshot.simulation.simulatedAsOfAt) ?? date(snapshot.fixedAsOfAt) ?? new Date(0);
const fixedAt = (snapshot: DemoSnapshot) => date(snapshot.fixedAsOfAt) ?? new Date(0);
const inMarket = (id: MarketId, selected: SelectedMarket) => selected === "ALL" || selected === id;
const market = (snapshot: DemoSnapshot, id: MarketId) => snapshot.markets.find((item) => item.id === id);
const reporter = (snapshot: DemoSnapshot, id: string) => snapshot.reporters.find((item) => item.id === id);
const teamName = (snapshot: DemoSnapshot, id: string) => snapshot.teamMembers.find((item) => item.id === id)?.name ?? "Unassigned";
const clone = (snapshot: DemoSnapshot) => structuredClone(snapshot);
const revise = (snapshot: DemoSnapshot): DemoSnapshot => ({ ...snapshot, revision: snapshot.revision + 1 });
function ordered<T extends { id: string }>(items: T[], timestamp: (item: T) => string): T[] {
  return [...items].sort((a, b) => (date(timestamp(a))?.getTime() ?? 0) - (date(timestamp(b))?.getTime() ?? 0) || a.id.localeCompare(b.id));
}
function contextValid(snapshot: DemoSnapshot, context: CommandContext): ActionResult<undefined> {
  const errors: ActionError[] = [];
  if (!context.commandId.trim()) errors.push(err("COMMAND_ID_REQUIRED", "A command ID is required.", "commandId"));
  if (!context.actorId.trim()) errors.push(err("ACTOR_REQUIRED", "An actor is required.", "actorId"));
  if (!date(context.occurredAt)) errors.push(err("INVALID_DATE", "The command time must be a valid UTC timestamp.", "occurredAt"));
  if (context.expectedRevision !== snapshot.revision) errors.push(err("STALE_REVISION", "This change is based on an older version of the demo. Refresh and try again.", "expectedRevision"));
  return errors.length ? fail("The change could not be saved.", errors) : ok(undefined, "Command is valid.");
}
function eventsFor(snapshot: DemoSnapshot, reporterId: string): LifecycleEvent[] {
  const asOf = currentAt(snapshot).getTime();
  return ordered(snapshot.lifecycleEvents.filter((item) => item.reporterId === reporterId && (date(item.occurredAt)?.getTime() ?? Infinity) <= asOf), (item) => item.occurredAt);
}
function stageFor(snapshot: DemoSnapshot, person: Reporter): { stage: LifecycleStage; event: LifecycleEvent | null } {
  const event = eventsFor(snapshot, person.id).at(-1) ?? null;
  return { stage: event?.stage ?? "prospect", event };
}
const stageLabel = (stage: LifecycleStage) => ({ prospect: "Prospect", screening: "Screening", onboarding: "Onboarding", "ready-for-first-job": "Ready for first job", "first-job-completed": "First job completed", paused: "Paused" })[stage];
const stageTone = (stage: LifecycleStage): "neutral" | "info" | "success" | "warning" => stage === "first-job-completed" ? "success" : stage === "paused" ? "warning" : stage === "screening" ? "info" : "neutral";
function latestReview(snapshot: DemoSnapshot, reporterId: string): ScreeningReview | null { return ordered(snapshot.screeningReviews.filter((item) => item.reporterId === reporterId), (item) => item.reviewedAt).at(-1) ?? null; }
function latestFollowUp(snapshot: DemoSnapshot, reporterId: string): FollowUp | null { return ordered(snapshot.followUps.filter((item) => item.reporterId === reporterId), (item) => item.history.at(-1)?.changedAt ?? item.dueAt).at(-1) ?? null; }
function planFor(snapshot: DemoSnapshot, item: Market): Pick<MarketPlanInput, "goal" | "assumptions" | "planningWindow"> {
  const saved = ordered(snapshot.savedMarketPlans.filter((plan) => plan.marketId === item.id), (plan) => plan.savedAt).at(-1);
  return saved ? { goal: saved.goal, assumptions: saved.assumptions, planningWindow: saved.planningWindow } : { goal: item.firstJobGoal, assumptions: item.assumptions, planningWindow: item.planningWindow };
}
function firstJobsAt(snapshot: DemoSnapshot, asOf: Date): FirstJobMetric[] {
  const people = new Set(snapshot.reporters.map((item) => item.id));
  const markets = new Set(snapshot.markets.map((item) => item.id));
  const winners = new Map<string, (typeof snapshot.jobs)[number]>();
  for (const job of snapshot.jobs) {
    const completed = job.completedAt ? date(job.completedAt) : null;
    if (job.status !== "completed" || !completed || completed > asOf || !people.has(job.reporterId) || !markets.has(job.marketId)) continue;
    const previous = winners.get(job.reporterId);
    const previousAt = previous?.completedAt ? date(previous.completedAt)?.getTime() ?? Infinity : Infinity;
    if (!previous || completed.getTime() < previousAt || (completed.getTime() === previousAt && job.id.localeCompare(previous.id) < 0)) winners.set(job.reporterId, job);
  }
  return [...winners.values()].map((job) => ({ reporterId: job.reporterId, jobId: job.id, marketId: job.marketId, completedAt: job.completedAt! })).sort((a, b) => a.completedAt.localeCompare(b.completedAt) || a.reporterId.localeCompare(b.reporterId));
}
function preview(snapshot: DemoSnapshot, input: MarketPlanInput): ActionResult<MarketPlanPreview> {
  const errors: ActionError[] = [];
  if (!market(snapshot, input.marketId)) errors.push(err("UNKNOWN_MARKET", "Choose one of the five demo markets.", "marketId"));
  if (!Number.isInteger(input.goal) || input.goal < 0) errors.push(err("INVALID_GOAL", "Goal must be a nonnegative whole number.", "goal"));
  const rates: [keyof MarketPlanInput["assumptions"], string][] = [["screeningPassRate", "screening pass rate"], ["onboardingStartRate", "onboarding start rate"], ["firstJobWithin14DaysRate", "first-job-within-14-days rate"]];
  for (const [key, name] of rates) if (!Number.isFinite(input.assumptions[key]) || input.assumptions[key] <= 0 || input.assumptions[key] > 1) errors.push(err("INVALID_RATE", `The ${name} must be greater than 0% and at most 100%.`, `assumptions.${key}`));
  if (!Number.isInteger(input.assumptions.leadTimeDays) || input.assumptions.leadTimeDays < 0) errors.push(err("INVALID_LEAD_TIME", "Lead time must be a nonnegative whole number of days.", "assumptions.leadTimeDays"));
  const start = date(input.planningWindow.startAt); const end = date(input.planningWindow.endAt);
  if (!start || !end || start >= end) errors.push(err("INVALID_WINDOW", "Planning start must be before planning end.", "planningWindow"));
  else {
    const effectiveStart = new Date(Math.max(start.getTime(), currentAt(snapshot).getTime()));
    if (effectiveStart.getTime() + input.assumptions.leadTimeDays * DAY > end.getTime()) errors.push(err("INFEASIBLE_WINDOW", "The planning window ends before the assumed lead time.", "planningWindow.endAt"));
  }
  if (errors.length) return fail("The plan needs correction before it can be previewed.", errors);
  const ready = Math.ceil(input.goal / input.assumptions.firstJobWithin14DaysRate);
  const onboarding = Math.ceil(ready / input.assumptions.onboardingStartRate);
  const effectiveStart = new Date(Math.max(start!.getTime(), currentAt(snapshot).getTime()));
  return ok({ marketId: input.marketId, goal: input.goal, requiredReadyReporters: ready, requiredOnboardingStarts: onboarding, requiredScreeningStarts: Math.ceil(onboarding / input.assumptions.screeningPassRate), earliestExpectedFirstJobAt: new Date(effectiveStart.getTime() + input.assumptions.leadTimeDays * DAY).toISOString(), limitation: "Fresh-recruiting scenario only; it does not credit the existing pipeline." }, "Plan preview is ready. It is a synthetic planning scenario, not an actual outcome.");
}
function repeated(snapshot: DemoSnapshot, context: CommandContext, kind: string): ActionResult<DemoSnapshot> | null {
  const id = context.commandId;
  const found = kind === "plan" ? snapshot.savedMarketPlans.some((x) => x.id === id)
    : kind === "screening" ? snapshot.screeningReviews.some((x) => x.id === id)
    : kind === "follow-up" ? snapshot.followUps.some((x) => x.id === id || x.history.some((entry) => entry.id === id))
    : kind === "coaching" ? snapshot.coachingNotes.some((x) => x.id === id)
    : kind === "decision" ? snapshot.improvementDecisions.some((x) => x.id === id)
    : snapshot.processDrafts.some((x) => x.id === id);
  return found ? ok(snapshot, "This command was already applied; no duplicate record was created.", snapshot.revision) : null;
}
function mutation(snapshot: DemoSnapshot, context: CommandContext, kind: string): ActionResult<DemoSnapshot> | null {
  const prior = repeated(snapshot, context, kind);
  if (prior) return prior;
  const validation = contextValid(snapshot, context);
  return validation.ok ? null : validation;
}

export function createRulesEngine(): RulesEngine {
  return {
    selectFirstJobs: (snapshot) => firstJobsAt(snapshot, currentAt(snapshot)),
    calculateHistorical14DayRate(snapshot, selected): HistoricalRateMetric {
      const cutoff = fixedAt(snapshot); let matureEntrants = 0; let successfulEntrants = 0; let observingEntrants = 0;
      const first = new Map(firstJobsAt(snapshot, cutoff).map((job) => [job.reporterId, job]));
      for (const person of snapshot.reporters.filter((item) => inMarket(item.recruitingMarketId, selected))) {
        const entry = ordered(snapshot.lifecycleEvents.filter((item) => item.reporterId === person.id && item.stage === "onboarding" && (date(item.occurredAt)?.getTime() ?? Infinity) <= cutoff.getTime()), (item) => item.occurredAt)[0];
        if (!entry) continue;
        const entered = date(entry.occurredAt)!; const deadline = entered.getTime() + WINDOW * DAY;
        if (deadline > cutoff.getTime()) { observingEntrants += 1; continue; }
        matureEntrants += 1; const job = first.get(person.id); const completed = job ? date(job.completedAt) : null;
        if (completed && completed.getTime() >= entered.getTime() && completed.getTime() <= deadline) successfulEntrants += 1;
      }
      const scope = selected === "ALL" ? "all recruiting markets" : selected;
      const rate = matureEntrants ? successfulEntrants / matureEntrants : null;
      return { marketId: selected, windowDays: WINDOW, matureEntrants, successfulEntrants, observingEntrants, rate, explanation: rate === null ? `No mature 14-day onboarding entrants in ${scope}; ${observingEntrants} entrant(s) are still observing.` : `${successfulEntrants} of ${matureEntrants} mature onboarding entrants in ${scope} completed a first job within 14 days; ${observingEntrants} entrant(s) are still observing. Historical classification is anchored to ${labelDate(snapshot.fixedAsOfAt)}.` };
    },
    previewMarketPlan: preview,
    buildMarketsView(snapshot, selected): MarketsViewModel {
      const first = firstJobsAt(snapshot, currentAt(snapshot));
      const rows = snapshot.markets.map((item) => {
        const plan = planFor(snapshot, item); const completed = first.filter((job) => job.marketId === item.id && date(job.completedAt)! >= date(plan.planningWindow.startAt)! && date(job.completedAt)! <= date(plan.planningWindow.endAt)!);
        const supportingRecords = completed.map((job) => ({ id: job.jobId, label: "First job completed", occurredAt: job.completedAt }));
        if (!supportingRecords.length) { const event = ordered(snapshot.lifecycleEvents.filter((x) => x.recruitingMarketIdAtEntry === item.id), (x) => x.occurredAt).at(-1); if (event) supportingRecords.push({ id: event.id, label: event.reason, occurredAt: event.occurredAt }); }
        return { marketId: item.id, code: item.code, name: item.name, periodLabel: windowLabel(plan.planningWindow.startAt, plan.planningWindow.endAt), firstJobsCompleted: completed.length, goal: plan.goal, remaining: Math.max(0, plan.goal - completed.length), progressPercent: plan.goal ? Math.min(100, Math.round(100 * completed.length / plan.goal)) : 100, observedIssue: item.observedIssue, nextAction: item.nextAction, supportingRecords };
      });
      const chosen = selected === "ALL" ? undefined : market(snapshot, selected); const plan = chosen ? planFor(snapshot, chosen) : null;
      return { status: "ready", selectedMarket: selected, rows, selectedPlan: chosen && plan ? { marketId: chosen.id, marketName: chosen.name, goal: plan.goal, assumptions: plan.assumptions, planningStartAt: plan.planningWindow.startAt, planningEndAt: plan.planningWindow.endAt, actualFirstJobsCompleted: rows.find((x) => x.marketId === chosen.id)?.firstJobsCompleted ?? 0, populationNote: "Goal progress counts unique first jobs in the job's actual market. Pipeline views use the reporter's recruiting-market owner.", leadTimeNote: "Fresh-recruiting preview only; existing pipeline is not credited." } : null, statusMessage: "First jobs are counted once per reporter in the actual job market and planning period." };
    },
    buildReportersView(snapshot, selected): ReportersViewModel {
      const people = snapshot.reporters.filter((item) => inMarket(item.recruitingMarketId, selected)); const asOf = currentAt(snapshot);
      const withStage = people.map((person) => ({ person, ...stageFor(snapshot, person) }));
      const reporters = withStage.map(({ person, stage, event }) => { const followUp = latestFollowUp(snapshot, person.id); return { id: person.id, name: person.fictionalName, recruitingMarketId: person.recruitingMarketId, marketLabel: market(snapshot, person.recruitingMarketId)?.name ?? person.recruitingMarketId, stage, stageLabel: stageLabel(stage), waitDays: event ? Math.max(0, Math.floor((asOf.getTime() - (date(event.occurredAt)?.getTime() ?? asOf.getTime())) / DAY)) : 0, blocker: event?.reason ?? "No recorded blocker", nextStep: followUp?.nextStep ?? "Choose a next step", assignedTo: followUp ? teamName(snapshot, followUp.assignedTeamMemberId) : "Unassigned", dueAt: followUp?.dueAt ?? "", tone: stageTone(stage) }; });
      const reporterDetails = people.map((person) => {
        const { stage, event } = stageFor(snapshot, person); const review = latestReview(snapshot, person.id); const followUp = latestFollowUp(snapshot, person.id);
        const history = [
          ...eventsFor(snapshot, person.id).map((item) => ({ id: item.id, occurredAt: item.occurredAt, label: stageLabel(item.stage), reason: item.reason, author: item.author })),
          ...snapshot.screeningReviews.filter((item) => item.reporterId === person.id).map((item) => ({ id: item.id, occurredAt: item.reviewedAt, label: `Screening: ${item.outcome}`, reason: item.reason, author: teamName(snapshot, item.reviewerId) })),
          ...snapshot.followUps.filter((item) => item.reporterId === person.id).flatMap((item) => item.history.map((entry) => ({ id: entry.id, occurredAt: entry.changedAt, label: `Follow-up: ${entry.state}`, reason: entry.note || item.nextStep, author: teamName(snapshot, entry.changedBy) }))),
        ];
        return { id: person.id, name: person.fictionalName, marketLabel: market(snapshot, person.recruitingMarketId)?.name ?? person.recruitingMarketId, serviceMarketsLabel: person.serviceMarketIds.map((id) => market(snapshot, id)?.name ?? id).join(", "), foundThrough: person.foundThrough, preferences: [{ label: "Availability", value: person.preferences.availability }, { label: "Travel", value: person.preferences.travel }, { label: "Proceeding types", value: person.preferences.proceedingTypes.join(", ") || "Not recorded" }, { label: "Notes", value: person.preferences.notes || "No notes recorded" }], blocker: event?.reason ?? "No recorded blocker", stageLabel: stageLabel(stage), screeningReviewId: review?.id ?? null, screeningOutcome: review?.outcome ?? "pending", screeningReason: review?.reason ?? "No screening reason recorded.", unresolvedInformation: review?.unresolvedInformation ?? [], checks: review?.checks ?? [], followUpId: followUp?.id ?? null, nextStep: followUp?.nextStep ?? "", assignedTeamMemberId: followUp?.assignedTeamMemberId ?? "", dueAt: followUp?.dueAt ?? "", history: ordered(history, (item) => item.occurredAt).reverse() };
      });
      const ids = new Set(people.map((item) => item.id)); const teamWorkload = snapshot.teamMembers.map((member) => { const assigned = snapshot.followUps.filter((item) => item.assignedTeamMemberId === member.id && ids.has(item.reporterId)); const open = assigned.filter((item) => item.state === "open"); const overdue = open.filter((item) => (date(item.dueAt)?.getTime() ?? Infinity) < asOf.getTime()); return { teamMemberId: member.id, name: member.name, openFollowUps: open.length, overdueFollowUps: overdue.length, workloadNote: overdue.length ? `${overdue.length} open follow-up(s) are overdue.` : `${open.length} open follow-up(s) in this view.`, coachingNotes: snapshot.coachingNotes.filter((item) => item.teamMemberId === member.id && (!item.reporterId || ids.has(item.reporterId))).map((item) => ({ id: item.id, note: item.note, nextAction: item.nextAction, dueAt: item.dueAt })) }; });
      const stages: LifecycleStage[] = ["prospect", "screening", "onboarding", "ready-for-first-job", "first-job-completed", "paused"];
      return { status: "ready", selectedMarket: selected, marketLabel: selected === "ALL" ? "All markets" : market(snapshot, selected)?.name ?? selected, asOfLabel: labelDate(asOf.toISOString()), populationNote: "Pipeline stages and the 14-day cohort use the reporter's recruiting-market owner. First-job goal progress uses the actual job market.", stages: stages.map((stage) => ({ stage, label: stageLabel(stage), count: withStage.filter((item) => item.stage === stage).length, note: "Current-stage snapshot" })), reporters: reporters.sort((a, b) => b.waitDays - a.waitDays || a.name.localeCompare(b.name)), reporterDetails, teamMemberOptions: snapshot.teamMembers.map((item) => ({ id: item.id, name: item.name })), teamWorkload, statusMessage: `${people.length} fictional reporter record(s) in the selected recruiting-market view.` };
    },
    buildImprovementsView(snapshot, selected): ImprovementsViewModel {
      const improvements = snapshot.improvements.filter((item) => selected === "ALL" || item.marketIds.includes(selected));
      const cards = improvements.map((item) => { const decision = ordered(snapshot.improvementDecisions.filter((x) => x.improvementId === item.id), (x) => x.decidedAt).at(-1); const draft = ordered(snapshot.processDrafts.filter((x) => x.improvementId === item.id), (x) => x.updatedAt).at(-1); return { id: item.id, title: item.title, marketIds: item.marketIds, marketLabel: item.marketIds.map((id) => market(snapshot, id)?.name ?? id).join(", "), changeTypeLabel: ({ screening: "Screening", onboarding: "Onboarding", "first-job-support": "First-job support" })[item.changeType], hypothesis: item.hypothesis, changeSummary: item.changeSummary, ownerId: item.ownerId, ownerName: teamName(snapshot, item.ownerId), partnerDeliverable: item.partnerDeliverable, reviewAt: item.reviewAt, observationWindowLabel: windowLabel(item.observationWindow.startAt, item.observationWindow.endAt), results: item.samples.map((sample) => ({ label: sample.label, reporterCount: sample.reporterCount, completedCount: sample.completedCount, rateLabel: sample.reporterCount ? `${sample.completedCount}/${sample.reporterCount} (${Math.round(100 * sample.completedCount / sample.reporterCount)}%)` : "Not enough results yet", observationComplete: sample.observationComplete, note: sample.note })), limitations: item.limitations, currentDecision: decision?.decision ?? null, decisionRationale: decision?.rationale ?? "No decision recorded yet.", canSaveAsProcess: decision?.decision === "continue" && Boolean(decision.rationale.trim()), processDraft: draft ? { id: draft.id, title: draft.title, ownerId: draft.ownerId, ownerName: teamName(snapshot, draft.ownerId), trigger: draft.trigger, steps: draft.steps, updatedAt: draft.updatedAt } : null }; });
      const ids = new Set(snapshot.reporters.filter((item) => inMarket(item.recruitingMarketId, selected)).map((item) => item.id)); const jobs = firstJobsAt(snapshot, currentAt(snapshot)).filter((item) => inMarket(item.marketId, selected)); const follows = snapshot.followUps.filter((item) => item.state === "open" && ids.has(item.reporterId));
      return { status: "ready", selectedMarket: selected, improvements: cards, teamMemberOptions: snapshot.teamMembers.map((item) => ({ id: item.id, name: item.name })), weeklyReview: { windowLabel: `As of ${labelDate(currentAt(snapshot).toISOString())}`, summary: `${jobs.length} current first job(s) and ${follows.length} open follow-up(s) are represented in this synthetic weekly review. Results are descriptive, not causal proof.`, evidence: [{ label: "First jobs completed", value: String(jobs.length), sourceRecordIds: jobs.map((item) => item.jobId) }, { label: "Open follow-ups", value: String(follows.length), sourceRecordIds: follows.map((item) => item.id) }, { label: "Improvements under review", value: String(improvements.length), sourceRecordIds: improvements.map((item) => item.id) }], nextActions: improvements.map((item) => item.partnerDeliverable).filter(Boolean) }, statusMessage: "Improvement results are descriptive; incomplete observation windows remain visible." };
    },
    previewOutreach(snapshot, reporterId): ActionResult<OutreachPreview> {
      const person = reporter(snapshot, reporterId); if (!person) return fail("Outreach preview is unavailable.", [err("UNKNOWN_REPORTER", "Reporter was not found.", "reporterId")]);
      const followUp = latestFollowUp(snapshot, reporterId); const next = followUp?.nextStep ?? "Arrange the next check-in"; const due = followUp?.dueAt ? ` by ${labelDate(followUp.dueAt)}` : "";
      return ok({ reporterId, recipientLabel: person.fictionalName, subject: "Next step for your reporter-growth onboarding", body: `Hello ${person.fictionalName},\n\nThe proposed next step is: ${next}${due}. This is a synthetic demo preview and will not be sent.`, disclosure: "Preview only — no message will be sent." }, "Outreach preview is ready. No message was sent.");
    },
    saveMarketPlan(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "plan"); if (blocker) return blocker; const result = preview(snapshot, input); if (!result.ok) return result;
      const next = clone(snapshot); next.savedMarketPlans.push({ id: context.commandId, ...input, savedAt: context.occurredAt, savedBy: context.actorId } satisfies SavedMarketPlan); const revised = revise(next); return ok(revised, "Plan saved. Actual completed jobs were not changed.", revised.revision);
    },
    saveScreening(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "screening"); if (blocker) return blocker; const errors: ActionError[] = [];
      if (!reporter(snapshot, input.reporterId)) errors.push(err("UNKNOWN_REPORTER", "Reporter was not found.", "reporterId")); if (!snapshot.teamMembers.some((item) => item.id === input.reviewerId)) errors.push(err("UNKNOWN_REVIEWER", "Choose a demo team member as reviewer.", "reviewerId")); if (!input.reason.trim()) errors.push(err("REASON_REQUIRED", "Record the reason for this screening review.", "reason")); if (!input.checks.length) errors.push(err("CHECKS_REQUIRED", "Record the illustrative screening checks.", "checks"));
      if (input.outcome === "verified" && input.checks.some((check) => check.required && check.status !== "complete")) errors.push(err("REQUIRED_CHECK_INCOMPLETE", "Required sample checks must be complete before marking a review verified.", "checks"));
      if (input.outcome === "verified" && input.unresolvedInformation.some((item) => item.trim())) errors.push(err("UNRESOLVED_INFORMATION", "Unresolved information must be cleared before marking a review verified.", "unresolvedInformation"));
      if (errors.length) return fail("The screening review needs correction before it can be saved.", errors);
      const next = clone(snapshot); next.screeningReviews.push({ id: context.commandId, ...input, reason: input.reason.trim(), reviewedAt: context.occurredAt } satisfies ScreeningReview); const revised = revise(next); return ok(revised, "Screening review saved. No completed job was created.", revised.revision);
    },
    updateFollowUp(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "follow-up"); if (blocker) return blocker; const errors: ActionError[] = []; const existing = input.followUpId ? snapshot.followUps.find((item) => item.id === input.followUpId) : undefined;
      if (!reporter(snapshot, input.reporterId)) errors.push(err("UNKNOWN_REPORTER", "Reporter was not found.", "reporterId")); if (!snapshot.teamMembers.some((item) => item.id === input.assignedTeamMemberId)) errors.push(err("UNKNOWN_ASSIGNEE", "Choose a demo team member.", "assignedTeamMemberId")); if (!input.nextStep.trim()) errors.push(err("NEXT_STEP_REQUIRED", "Record a next step.", "nextStep")); if (!input.note.trim()) errors.push(err("FOLLOW_UP_REASON_REQUIRED", "Record why this follow-up changed.", "note")); if (!date(input.dueAt)) errors.push(err("INVALID_DATE", "Due date must be a valid UTC timestamp.", "dueAt")); if (input.followUpId && (!existing || existing.reporterId !== input.reporterId)) errors.push(err("UNKNOWN_FOLLOW_UP", "That follow-up does not belong to this reporter.", "followUpId"));
      if (errors.length) return fail("The follow-up needs correction before it can be saved.", errors);
      const next = clone(snapshot); const history = { id: context.commandId, changedAt: context.occurredAt, changedBy: context.actorId, note: input.note.trim(), state: input.state }; const index = input.followUpId ? next.followUps.findIndex((item) => item.id === input.followUpId) : -1;
      if (index >= 0) { const old = next.followUps[index]!; next.followUps[index] = { ...old, nextStep: input.nextStep.trim(), assignedTeamMemberId: input.assignedTeamMemberId, dueAt: input.dueAt, state: input.state, history: [...old.history, history] }; } else next.followUps.push({ id: context.commandId, reporterId: input.reporterId, nextStep: input.nextStep.trim(), assignedTeamMemberId: input.assignedTeamMemberId, dueAt: input.dueAt, state: input.state, history: [history] });
      const revised = revise(next); return ok(revised, "Follow-up saved. No message or completed job was created.", revised.revision);
    },
    saveCoaching(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "coaching"); if (blocker) return blocker; const errors: ActionError[] = [];
      if (!snapshot.teamMembers.some((item) => item.id === input.teamMemberId)) errors.push(err("UNKNOWN_TEAM_MEMBER", "Choose a demo team member.", "teamMemberId")); if (input.reporterId && !reporter(snapshot, input.reporterId)) errors.push(err("UNKNOWN_REPORTER", "Reporter was not found.", "reporterId")); if (!input.note.trim()) errors.push(err("COACHING_NOTE_REQUIRED", "Record a coaching or clarification note.", "note")); if (!input.nextAction.trim()) errors.push(err("NEXT_ACTION_REQUIRED", "Record the next action.", "nextAction")); if (!date(input.dueAt)) errors.push(err("INVALID_DATE", "Due date must be a valid UTC timestamp.", "dueAt"));
      if (errors.length) return fail("The coaching note needs correction before it can be saved.", errors); const next = clone(snapshot); next.coachingNotes.push({ id: context.commandId, ...input, note: input.note.trim(), nextAction: input.nextAction.trim(), createdAt: context.occurredAt, createdBy: context.actorId } satisfies CoachingNote); const revised = revise(next); return ok(revised, "Coaching note saved.", revised.revision);
    },
    recordDecision(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "decision"); if (blocker) return blocker; const errors: ActionError[] = []; if (!snapshot.improvements.some((item) => item.id === input.improvementId)) errors.push(err("UNKNOWN_IMPROVEMENT", "Improvement was not found.", "improvementId")); if (!input.rationale.trim()) errors.push(err("RATIONALE_REQUIRED", "Record a rationale for Continue, Change, or Stop.", "rationale")); if (errors.length) return fail("The decision needs correction before it can be saved.", errors);
      const next = clone(snapshot); next.improvementDecisions.push({ id: context.commandId, ...input, rationale: input.rationale.trim(), decidedAt: context.occurredAt, decidedBy: context.actorId } satisfies ImprovementDecision); const revised = revise(next); return ok(revised, "Decision saved. The change was not rolled out automatically.", revised.revision);
    },
    createProcessDraft(snapshot, input, context) {
      const blocker = mutation(snapshot, context, "draft"); if (blocker) return blocker; const errors: ActionError[] = []; const decision = ordered(snapshot.improvementDecisions.filter((item) => item.improvementId === input.improvementId), (item) => item.decidedAt).at(-1);
      if (!snapshot.improvements.some((item) => item.id === input.improvementId)) errors.push(err("UNKNOWN_IMPROVEMENT", "Improvement was not found.", "improvementId")); if (!decision || decision.decision !== "continue" || !decision.rationale.trim()) errors.push(err("CONTINUE_DECISION_REQUIRED", "Save as process requires a recorded Continue decision with rationale.", "improvementId")); if (!snapshot.teamMembers.some((item) => item.id === input.ownerId)) errors.push(err("UNKNOWN_OWNER", "Choose a demo team member as owner.", "ownerId")); if (!input.title.trim()) errors.push(err("TITLE_REQUIRED", "Draft title is required.", "title")); if (!input.trigger.trim()) errors.push(err("TRIGGER_REQUIRED", "Draft trigger is required.", "trigger")); if (!input.steps.length || input.steps.some((step) => !step.instruction.trim())) errors.push(err("STEPS_REQUIRED", "Add at least one editable instruction step.", "steps"));
      if (errors.length) return fail("The process draft needs correction before it can be saved.", errors); const next = clone(snapshot); next.processDrafts.push({ id: context.commandId, ...input, title: input.title.trim(), trigger: input.trigger.trim(), steps: input.steps.map((step, index) => ({ ...step, order: index + 1, instruction: step.instruction.trim() })), status: "draft", updatedAt: context.occurredAt } satisfies ProcessDraft); const revised = revise(next); return ok(revised, "Editable process draft saved. It has not been rolled out.", revised.revision);
    },
    updateProcessDraft(snapshot, input, context) {
      const contextResult = contextValid(snapshot, context); if (!contextResult.ok) return contextResult as ActionResult<DemoSnapshot>; const errors: ActionError[] = []; const existing = snapshot.processDrafts.find((item) => item.id === input.draftId);
      if (!existing) errors.push(err("UNKNOWN_DRAFT", "Process draft was not found.", "draftId")); if (!snapshot.teamMembers.some((item) => item.id === input.ownerId)) errors.push(err("UNKNOWN_OWNER", "Choose a demo team member as owner.", "ownerId")); if (!input.title.trim()) errors.push(err("TITLE_REQUIRED", "Draft title is required.", "title")); if (!input.trigger.trim()) errors.push(err("TRIGGER_REQUIRED", "Draft trigger is required.", "trigger")); if (!input.steps.length || input.steps.some((step) => !step.instruction.trim())) errors.push(err("STEPS_REQUIRED", "Add at least one editable instruction step.", "steps")); if (errors.length) return fail("The process draft needs correction before it can be saved.", errors);
      const next = clone(snapshot); const index = next.processDrafts.findIndex((item) => item.id === input.draftId); next.processDrafts[index] = { ...next.processDrafts[index]!, ...input, title: input.title.trim(), trigger: input.trigger.trim(), steps: input.steps.map((step, position) => ({ ...step, order: position + 1, instruction: step.instruction.trim() })), updatedAt: context.occurredAt }; const revised = revise(next); return ok(revised, "Process draft updated. It remains an editable draft.", revised.revision);
    },
    runSimulation(snapshot, input, context) {
      if (input.scenarioId !== SCENARIO_IDS.lateFirstJob) return fail("Simulation is unavailable.", [err("UNKNOWN_SCENARIO", "Choose the documented late-first-job simulation.", "scenarioId")]);
      const existingLateJob = snapshot.jobs.find((item) => item.id === SCENARIO_IDS.lateJob);
      if (snapshot.simulation.replayedScenarioIds.includes(input.scenarioId) || (existingLateJob?.status === "completed" && Boolean(existingLateJob.completedAt))) return ok(snapshot, "This simulation was already applied; no duplicate job or event was created.", snapshot.revision);
      const contextResult = contextValid(snapshot, context); if (!contextResult.ok) return contextResult as ActionResult<DemoSnapshot>; const person = reporter(snapshot, SCENARIO_IDS.lateReporter); if (!person) return fail("Simulation is unavailable.", [err("MISSING_SCENARIO_REPORTER", "The late-first-job demo reporter is missing.")]);
      const entry = ordered(snapshot.lifecycleEvents.filter((item) => item.reporterId === person.id && item.stage === "onboarding"), (item) => item.occurredAt)[0]; const completedAt = new Date(Math.max(currentAt(snapshot).getTime() + DAY, (date(entry?.occurredAt ?? "")?.getTime() ?? currentAt(snapshot).getTime()) + 15 * DAY)).toISOString();
      const next = clone(snapshot);
      const targetIndex = next.jobs.findIndex((item) => item.id === SCENARIO_IDS.lateJob);
      if (targetIndex >= 0) {
        const target = next.jobs[targetIndex]!;
        next.jobs[targetIndex] = { ...target, status: "completed", completedAt, provenance: "demo-simulation" };
      } else {
        next.jobs.push({ id: SCENARIO_IDS.lateJob, reporterId: person.id, marketId: person.recruitingMarketId, status: "completed", scheduledAt: completedAt, completedAt, provenance: "demo-simulation" });
      }
      const completionEventId = `${input.scenarioId}-event`;
      if (!next.lifecycleEvents.some((item) => item.id === completionEventId)) next.lifecycleEvents.push({ id: completionEventId, reporterId: person.id, occurredAt: completedAt, stage: "first-job-completed", reason: "Late first-job simulation completed after the historical 14-day window.", author: context.actorId, recruitingMarketIdAtEntry: person.recruitingMarketId });
      next.simulation = { simulatedAsOfAt: completedAt, replayedScenarioIds: [...next.simulation.replayedScenarioIds, input.scenarioId] };
      const revised = revise(next);
      return ok(revised, "Simulation advanced the demo and completed one late first job. Historical 14-day classification remains fixed.", revised.revision);
    },
  };
}
