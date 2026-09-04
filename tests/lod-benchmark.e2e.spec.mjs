import { test, expect } from "@playwright/test";

const port = Number(process.env.LOD_TEST_PORT ?? 8091);

test("benchmark page renders Cesium and completes a finite smoke run", async ({ page }) => {
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(`http://127.0.0.1:${port}/Apps/learnMapmost/lod-benchmark.html?smoke=1`);
  await expect(page.getByRole("heading", { name: "Tail Frame-Time LOD Benchmark" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run D1/S3 pressureBurst pilot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run D2/S3 pressureBurst pilot" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Android fixed4 diagnostic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run server-topology fixed4 diagnostic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Run D1/S3 pressureBurst probe" })).toBeVisible();
  await expect(page.locator("#scenario")).toContainText("S3 Pressure burst");
  await expect(page.locator("#cesiumContainer canvas")).toBeVisible();
  await expect(page.locator("#bufferSize")).toHaveText("960 × 540", { timeout: 20000 });

  await page.selectOption("#dataset", "publicStress");
  await page.selectOption("#method", "proposed");
  await page.selectOption("#scenario", "pressureBurst");
  await page.getByRole("button", { name: "Run single" }).click();
  await expect(page.locator("#runState")).toHaveText("Complete", { timeout: 75000 });

  const result = await page.evaluate(() => window.__lodBenchmark.getLastResult());
  expect(result.valid).toBe(true);
  expect(result.rows.length).toBeGreaterThan(0);
  expect(JSON.stringify(result)).not.toContain("NaN");
  expect(result.manifest.method).toBe("proposed");
  expect(result.manifest.protocolVersion).toBe("2.3.6");
  expect(result.manifest.readinessP95ThresholdMs).toBe(25);
  expect(result.readiness.ready).toBe(true);
  expect(result.readiness.policy).toEqual({
    windowMs: 250,
    requiredStableWindows: 2,
    p95ThresholdMs: 2000,
    timeoutMs: 2000,
  });
  expect(result.readiness.checkCount).toBeGreaterThanOrEqual(2);
  expect(result.readiness.windows).toHaveLength(result.readiness.checkCount);
  expect(result.summary.preRunReadinessReady).toBe(true);
  expect(result.summary.preRunReadinessWaitMs).toBeGreaterThan(0);
  expect(result.summary.preRunReadinessP95Ms).toBeLessThanOrEqual(2000);
  expect(result.summary.preRunReadinessCheckCount).toBe(result.readiness.checkCount);

  const capture = await page.evaluate(() =>
    window.__lodBenchmark.prepareQualityCapture("dragon", 16, 0),
  );
  expect(capture.drawingBufferWidth).toBe(960);
  expect(capture.drawingBufferHeight).toBe(540);
  expect(consoleErrors).toEqual([]);
});

test("both frozen 3DBAG subsets load through isolated benchmark routes", async ({ page }) => {
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${port}/Apps/learnMapmost/lod-benchmark.html`);
  await page.waitForFunction(() => Boolean(window.__lodBenchmark));
  for (const dataset of ["bagAmsterdam", "bagRotterdam"]) {
    const capture = await page.evaluate(
      (datasetId) => window.__lodBenchmark.prepareQualityCapture(datasetId, 64, 0, 30000),
      dataset,
    );
    expect(capture.tileFailureCount, dataset).toBe(0);
    expect(capture.tilesLoadedTotal, JSON.stringify({ dataset, capture })).toBeGreaterThan(0);
    expect(capture.drawingBufferWidth).toBe(960);
    expect(capture.drawingBufferHeight).toBe(540);
  }
  expect(errors).toEqual([]);
});
