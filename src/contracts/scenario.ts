export const FIXED_AS_OF_AT = "2026-02-16T17:00:00.000Z";

export const SCENARIO_IDS = {
  lateFirstJob: "scenario-lax-late-first-job",
  lateReporter: "reporter-lax-006",
  lateJob: "job-lax-late-simulated",
  laxStalledReporter: "reporter-lax-004",
  laxImprovement: "improvement-lax-screening-brief",
} as const;

export const TEST_ANCHORS = {
  app: "reporter-growth-app",
  marketSelector: "market-selector",
  marketsScreen: "markets-screen",
  reportersScreen: "reporters-screen",
  improvementsScreen: "improvements-screen",
  reporterDetail: "reporter-detail",
  demoDisclosure: "demo-disclosure",
} as const;
