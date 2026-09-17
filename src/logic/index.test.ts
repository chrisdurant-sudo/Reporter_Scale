import { describe, expect, it } from "vitest";
import type { CommandContext, DemoSnapshot, Market, Reporter } from "../contracts";
import { SCENARIO_IDS } from "../contracts";
import { createRulesEngine } from "./index";

const market: Market = {
  id: "LAX", code: "LAX", name: "Los Angeles",
  planningWindow: { startAt: "2026-02-17T00:00:00.000Z", endAt: "2026-03-31T00:00:00.000Z" },
  firstJobGoal: 4,
  assumptions: { screeningPassRate: 0.5, onboardingStartRate: 0.5, firstJobWithin14DaysRate: 0.5, leadTimeDays: 7 },
  observedIssue: "Illustrative screening delay", nextAction: "Review follow-ups", provenance: "synthetic-demo",
};
const person = (id: string, name: string): Reporter => ({
  id, fictionalName: name, recruitingMarketId: "LAX", serviceMarketIds: ["LAX"], foundThrough: "Synthetic referral",
  preferences: { availability: "Weekdays", travel: "Local", proceedingTypes: ["Illustrative"], notes: "" },
  createdAt: "2026-01-01T00:00:00.000Z", provenance: "synthetic-demo",
});
function snapshot(): DemoSnapshot {
  return {
    schemaVersion: 1, revision: 0, fixedAsOfAt: "2026-02-16T17:00:00.000Z",
    simulation: { simulatedAsOfAt: "2026-02-16T17:00:00.000Z", replayedScenarioIds: [] },
    markets: [market], reporters: [person("reporter-001", "Avery Reed"), person(SCENARIO_IDS.lateReporter, "Jordan Vale")],
    lifecycleEvents: [
      { id: "event-1", reporterId: "reporter-001", occurredAt: "2026-01-01T00:00:00.000Z", stage: "onboarding", reason: "Started", author: "team-1", recruitingMarketIdAtEntry: "LAX" },
      { id: "event-2", reporterId: SCENARIO_IDS.lateReporter, occurredAt: "2026-01-10T00:00:00.000Z", stage: "onboarding", reason: "Started", author: "team-1", recruitingMarketIdAtEntry: "LAX" },
    ],
    screeningReviews: [],
    jobs: [
      { id: "first", reporterId: "reporter-001", marketId: "LAX", status: "completed", scheduledAt: "2026-01-10T00:00:00.000Z", completedAt: "2026-01-12T00:00:00.000Z", provenance: "synthetic-demo" },
      { id: "repeat", reporterId: "reporter-001", marketId: "LAX", status: "completed", scheduledAt: "2026-01-13T00:00:00.000Z", completedAt: "2026-01-13T00:00:00.000Z", provenance: "synthetic-demo" },
      { id: "canceled", reporterId: SCENARIO_IDS.lateReporter, marketId: "LAX", status: "canceled", scheduledAt: "2026-01-15T00:00:00.000Z", completedAt: "2026-01-15T00:00:00.000Z", provenance: "synthetic-demo" },
      { id: "future", reporterId: SCENARIO_IDS.lateReporter, marketId: "LAX", status: "completed", scheduledAt: "2026-03-01T00:00:00.000Z", completedAt: "2026-03-01T00:00:00.000Z", provenance: "synthetic-demo" },
    ],
    followUps: [], teamMembers: [{ id: "team-1", name: "Morgan Lee", role: "Operator" }], coachingNotes: [],
    improvements: [{
      id: "improvement-1", title: "Illustrative change", marketIds: ["LAX"], changeType: "screening",
      hypothesis: "Clearer brief may help", changeSummary: "Test a brief", ownerId: "team-1", partnerDeliverable: "Share example",
      reviewAt: "2026-02-20T00:00:00.000Z", observationWindow: { startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-02-20T00:00:00.000Z" },
      samples: [{ label: "Illustrative sample", reporterCount: 2, completedCount: 1, observationComplete: false, note: "Still observing" }],
      limitations: ["Synthetic example"],
    }],
    improvementDecisions: [], processDrafts: [], savedMarketPlans: [],
  };
}
function context(commandId: string, expectedRevision = 0): CommandContext {
  return { commandId, expectedRevision, actorId: "team-1", occurredAt: "2026-02-16T17:00:00.000Z" };
}

describe("Reporter Growth rules", () => {
  it("counts only the earliest completed job for each reporter before the as-of date", () => {
    const jobs = createRulesEngine().selectFirstJobs(snapshot());
    expect(jobs).toEqual([{ reporterId: "reporter-001", jobId: "first", marketId: "LAX", completedAt: "2026-01-12T00:00:00.000Z" }]);
  });

  it("keeps mature 14-day cohort history fixed when the late simulation runs", () => {
    const engine = createRulesEngine();
    const before = engine.calculateHistorical14DayRate(snapshot(), "LAX");
    const simulated = engine.runSimulation(snapshot(), { scenarioId: SCENARIO_IDS.lateFirstJob }, context("simulate"));
    expect(simulated.ok).toBe(true);
    if (!simulated.ok) return;
    expect(engine.calculateHistorical14DayRate(simulated.value, "LAX")).toMatchObject(before);
    expect(engine.selectFirstJobs(simulated.value)).toHaveLength(2);
    const replay = engine.runSimulation(simulated.value, { scenarioId: SCENARIO_IDS.lateFirstJob }, context("simulate", 1));
    expect(replay.ok && replay.value.jobs).toHaveLength(5);
  });

  it("completes a seeded scheduled late-job target once without changing its stable ID", () => {
    const engine = createRulesEngine();
    const seeded = snapshot();
    seeded.jobs.push({
      id: SCENARIO_IDS.lateJob, reporterId: SCENARIO_IDS.lateReporter, marketId: "LAX", status: "scheduled",
      scheduledAt: "2026-02-18T00:00:00.000Z", completedAt: null, provenance: "synthetic-demo",
    });
    const completed = engine.runSimulation(seeded, { scenarioId: SCENARIO_IDS.lateFirstJob }, context("seeded-simulation"));
    expect(completed.ok).toBe(true);
    if (!completed.ok) return;
    const target = completed.value.jobs.filter((job) => job.id === SCENARIO_IDS.lateJob);
    expect(target).toHaveLength(1);
    expect(target[0]).toMatchObject({ status: "completed", scheduledAt: "2026-02-18T00:00:00.000Z", provenance: "demo-simulation" });
    expect(completed.value.lifecycleEvents.filter((event) => event.id === `${SCENARIO_IDS.lateFirstJob}-event`)).toHaveLength(1);
    const replay = engine.runSimulation(completed.value, { scenarioId: SCENARIO_IDS.lateFirstJob }, context("seeded-simulation", completed.value.revision));
    expect(replay).toMatchObject({ ok: true, revision: completed.value.revision });
    if (replay.ok) {
      expect(replay.value.jobs).toHaveLength(completed.value.jobs.length);
      expect(replay.value.lifecycleEvents).toHaveLength(completed.value.lifecycleEvents.length);
    }
  });

  it("validates and rounds fresh-recruiting plan requirements without changing jobs", () => {
    const engine = createRulesEngine();
    const input = { marketId: "LAX" as const, goal: 3, assumptions: { screeningPassRate: 0.5, onboardingStartRate: 0.5, firstJobWithin14DaysRate: 0.5, leadTimeDays: 7 }, planningWindow: market.planningWindow };
    expect(engine.previewMarketPlan(snapshot(), input)).toMatchObject({ ok: true, value: { requiredReadyReporters: 6, requiredOnboardingStarts: 12, requiredScreeningStarts: 24 } });
    const saved = engine.saveMarketPlan(snapshot(), input, context("plan"));
    expect(saved.ok && saved.value.jobs).toHaveLength(4);
    expect(engine.previewMarketPlan(snapshot(), { ...input, goal: 2.5 })).toMatchObject({ ok: false });
  });

  it("previews an underway planning period from the current demo date", () => {
    const engine = createRulesEngine();
    const input = {
      marketId: "LAX" as const,
      goal: 3,
      assumptions: { screeningPassRate: 0.5, onboardingStartRate: 0.5, firstJobWithin14DaysRate: 0.5, leadTimeDays: 7 },
      planningWindow: { startAt: "2026-01-01T00:00:00.000Z", endAt: "2026-03-31T23:59:59.000Z" },
    };
    expect(engine.previewMarketPlan(snapshot(), input)).toMatchObject({
      ok: true,
      value: { earliestExpectedFirstJobAt: "2026-02-23T17:00:00.000Z" },
    });
  });

  it("requires reasoned verified screening and keeps duplicate follow-up clicks from creating outcomes", () => {
    const engine = createRulesEngine();
    const incomplete = engine.saveScreening(snapshot(), {
      reporterId: "reporter-001", reviewerId: "team-1", reason: "Review", outcome: "verified",
      checks: [{ id: "check", label: "Illustrative check", required: true, status: "needs-information", note: "" }], unresolvedInformation: ["Need sample"],
    }, context("screen"));
    expect(incomplete).toMatchObject({ ok: false });
    const followed = engine.updateFollowUp(snapshot(), {
      reporterId: "reporter-001", nextStep: "Call back", assignedTeamMemberId: "team-1", dueAt: "2026-02-18T00:00:00.000Z", state: "open", note: "Waiting on availability",
    }, context("follow"));
    expect(followed.ok).toBe(true);
    if (!followed.ok) return;
    const repeated = engine.updateFollowUp(followed.value, {
      reporterId: "reporter-001", nextStep: "Call back", assignedTeamMemberId: "team-1", dueAt: "2026-02-18T00:00:00.000Z", state: "open", note: "Waiting on availability",
    }, context("follow", 1));
    expect(repeated.ok && repeated.value.followUps).toHaveLength(1);
    expect(repeated.ok && repeated.value.jobs).toHaveLength(4);
    expect(engine.buildMarketsView(followed.value, "LAX").selectedPlan?.marketId).toBe("LAX");
    expect(engine.buildReportersView(followed.value, "LAX").reporters).toHaveLength(2);
    expect(engine.buildImprovementsView(followed.value, "LAX").weeklyReview.evidence[0]?.sourceRecordIds).toEqual(["first"]);
  });
});
