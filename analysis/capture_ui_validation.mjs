import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import sharp from "sharp";

import { createBenchmarkServer } from "../benchmark-server.mjs";

const port = 8090;
const outputDir = path.resolve("learnMapmost/results/visual");
await fs.mkdir(outputDir, { recursive: true });
const server = createBenchmarkServer({ port });
await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const configuration of [
    { name: "desktop", viewport: { width: 1440, height: 900 } },
    { name: "android-landscape", viewport: { width: 844, height: 390 } },
  ]) {
    const page = await browser.newPage({ viewport: configuration.viewport });
    await page.goto(`http://127.0.0.1:${port}/Apps/learnMapmost/lod-benchmark.html`);
    await page.waitForFunction(() => Boolean(window.__lodBenchmark));
    const capture = await page.evaluate(() =>
      window.__lodBenchmark.prepareQualityCapture("dragon", 16, 0),
    );
    const canvasBox = await page.locator("#cesiumContainer canvas").boundingBox();
    if (!canvasBox) throw new Error(`${configuration.name} canvas has no bounding box`);
    const canvasBuffer = await page.screenshot({ clip: canvasBox, animations: "disabled" });
    const statistics = await sharp(canvasBuffer).stats();
    const deviation = statistics.channels
      .slice(0, 3)
      .reduce((sum, channel) => sum + channel.stdev, 0);
    if (deviation < 3) throw new Error(`${configuration.name} canvas appears blank`);
    const screenshotPath = path.join(outputDir, `${configuration.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.push({
      ...configuration,
      screenshotPath,
      drawingBufferWidth: capture.drawingBufferWidth,
      drawingBufferHeight: capture.drawingBufferHeight,
      tilesLoadedTotal: capture.tilesLoadedTotal,
      rgbStandardDeviationSum: deviation,
    });
    await page.close();
  }
  await fs.writeFile(
    path.join(outputDir, "validation.json"),
    `${JSON.stringify(report, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
