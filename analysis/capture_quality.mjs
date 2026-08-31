import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

import { captureCanvasScreenshot } from "./capture-quality-utils.mjs";

const argumentsMap = new Map(
  process.argv.slice(2).map((argument) => {
    const [key, value = "1"] = argument.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const baseUrl = argumentsMap.get("base-url") ?? "http://127.0.0.1:8088";
const outputDir = path.resolve(
  argumentsMap.get("output") ?? "learnMapmost/results/quality/captures",
);
const datasets = (argumentsMap.get("datasets") ?? "bagAmsterdam,bagRotterdam")
  .split(",")
  .filter(Boolean);
const sseLadder = [4, 6, 8, 12, 16, 24, 32, 48, 64];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${baseUrl}/Apps/learnMapmost/lod-benchmark.html`);
  await page.waitForFunction(() => Boolean(window.__lodBenchmark));
  for (const dataset of datasets) {
    for (const sse of sseLadder) {
      for (let view = 0; view < 6; view += 1) {
        const capture = await page.evaluate(
          ({ datasetId, sseValue, viewIndex }) =>
            window.__lodBenchmark.prepareQualityCapture(datasetId, sseValue, viewIndex),
          { datasetId: dataset, sseValue: sse, viewIndex: view },
        );
        if (!capture.settled || capture.tileFailureCount > 0) {
          throw new Error(`Quality capture did not settle: ${JSON.stringify(capture)}`);
        }
        const filename = `${dataset}__sse-${sse}__view-${view}.png`;
        await captureCanvasScreenshot(page, path.join(outputDir, filename));
        process.stdout.write(`${filename}\n`);
      }
    }
  }
} finally {
  await browser.close();
}
