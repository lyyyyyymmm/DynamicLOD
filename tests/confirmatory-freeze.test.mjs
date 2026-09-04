import test from "node:test";
import assert from "node:assert/strict";

import { createConfirmatoryFreezeArtifact } from "../confirmatory-freeze.mjs";

test("confirmatory freeze artifact records a stable D-031 two-device queue plan hash", () => {
  const artifact = createConfirmatoryFreezeArtifact({
    createdAt: "2026-09-04T00:00:00.000Z",
  });

  assert.equal(artifact.freezeDecision, "D-031");
  assert.equal(artifact.protocolVersion, "2.3.6");
  assert.deepEqual(artifact.efficacyDevices, ["pc-a", "pc-b"]);
  assert.equal(artifact.perDeviceRunCount, 120);
  assert.equal(artifact.totalRunCount, 240);
  assert.equal(artifact.queuePlan.length, 40);
  assert.equal(artifact.queuePlan[0].deviceId, "pc-a");
  assert.equal(artifact.queuePlan[0].dataset, "bagAmsterdam");
  assert.equal(artifact.queuePlan[0].repeat, 1);
  assert.equal(artifact.queuePlan[0].blockSeed, 20260823);
  assert.deepEqual(artifact.queuePlan[0].methodOrder, [
    "reactive",
    "fixed16",
    "proposed",
    "pi",
    "fixed8",
    "cesiumDynamic",
  ]);
  assert.equal(artifact.queuePlan.at(-1).deviceId, "pc-b");
  assert.equal(artifact.queuePlan.at(-1).dataset, "bagRotterdam");
  assert.equal(artifact.queuePlan.at(-1).repeat, 8);
  assert.match(artifact.queuePlanSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    createConfirmatoryFreezeArtifact({ createdAt: "2026-09-04T12:00:00.000Z" }).queuePlanSha256,
    artifact.queuePlanSha256,
  );
});
