import assert from "node:assert/strict";
import { test } from "node:test";

import { captureCanvasScreenshot } from "../analysis/capture-quality-utils.mjs";

test("captures canvas using a page clip instead of an element screenshot", async () => {
  const screenshotCalls = [];
  const canvasBox = { x: 10, y: 20, width: 960, height: 540 };
  const page = {
    locator(selector) {
      assert.equal(selector, "#cesiumContainer canvas");
      return {
        async boundingBox() {
          return canvasBox;
        },
        async screenshot() {
          throw new Error("element screenshot should not be used for dynamic Cesium canvas");
        },
      };
    },
    async screenshot(options) {
      screenshotCalls.push(options);
      return Buffer.from("png");
    },
  };

  await captureCanvasScreenshot(page, "quality.png");

  assert.deepEqual(screenshotCalls, [
    {
      path: "quality.png",
      clip: canvasBox,
      animations: "disabled",
    },
  ]);
});
