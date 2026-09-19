import type { DemoSnapshotStorage } from "../contracts/v2";

// Access the browser property inside each operation so the repository can report
// denied storage access without crashing application initialization.
export const v2BrowserStorage: DemoSnapshotStorage = {
  getItem: (key) => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  removeItem: (key) => globalThis.localStorage.removeItem(key),
};
