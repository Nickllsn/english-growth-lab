import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4311",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:4311",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      EGL_DATA_DIR: resolve("e2e/.tmp")
    }
  }
});
