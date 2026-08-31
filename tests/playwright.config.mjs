import { defineConfig } from "@playwright/test";

const port = Number(process.env.LOD_TEST_PORT ?? 8091);

export default defineConfig({
  testDir: ".",
  testMatch: "lod-benchmark.e2e.spec.mjs",
  timeout: 90000,
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
  },
  webServer: {
    command: `node learnMapmost/benchmark-server.mjs --port=${port}`,
    cwd: "../..",
    url: `http://127.0.0.1:${port}/api/health`,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
