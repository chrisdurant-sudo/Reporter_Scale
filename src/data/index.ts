import type { ActionResult, DemoRepository, DemoSnapshot } from "../contracts";

function notReady(): ActionResult<DemoSnapshot> {
  return {
    ok: false,
    message: "Demo data is not available in the setup baseline.",
    errors: [{ code: "SETUP_STUB", message: "The data lane has not been integrated." }],
  };
}

export function createDemoRepository(): DemoRepository {
  return {
    load: async () => notReady(),
    save: async () => notReady(),
    reset: async () => notReady(),
  };
}
