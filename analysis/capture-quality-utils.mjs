export async function captureCanvasScreenshot(page, outputPath) {
  const canvasBox = await page.locator("#cesiumContainer canvas").boundingBox();
  if (!canvasBox) throw new Error("Quality capture canvas has no bounding box");
  await page.screenshot({
    path: outputPath,
    clip: canvasBox,
    animations: "disabled",
  });
}
