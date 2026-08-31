import test from "node:test";
import assert from "node:assert/strict";

import { getScenarioFrame } from "../scenario-driver.mjs";

test("steady orbit completes one deterministic revolution", () => {
  const start = getScenarioFrame("steady", 0, 7);
  const half = getScenarioFrame("steady", 20000, 7);
  const end = getScenarioFrame("steady", 40000, 7);

  assert.equal(start.interacting, false);
  assert.ok(Math.abs(half.headingRad - Math.PI) < 1e-9);
  assert.ok(Math.abs(end.headingRad - Math.PI * 2) < 1e-9);
  assert.equal(start.rangeMultiplier, end.rangeMultiplier);
});

test("burst path ends with a close sweep and holds the near view during recovery", () => {
  const early = getScenarioFrame("burst", 1000, 11);
  const middle = getScenarioFrame("burst", 3000, 11);
  const late = getScenarioFrame("burst", 5000, 11);
  const interactionEnd = getScenarioFrame("burst", 5999, 11);
  const recoveryStart = getScenarioFrame("burst", 6000, 11);
  const recovery = getScenarioFrame("burst", 7000, 11);
  assert.equal(early.interacting, true);
  assert.equal(middle.interacting, true);
  assert.equal(late.interacting, true);
  assert.equal(recoveryStart.interacting, false);
  assert.equal(recovery.interacting, false);
  assert.ok(Math.abs(middle.headingRad - early.headingRad) > Math.PI);
  assert.ok(early.rangeMultiplier > middle.rangeMultiplier);
  assert.ok(middle.rangeMultiplier > late.rangeMultiplier);
  assert.ok(late.rangeMultiplier > interactionEnd.rangeMultiplier);
  assert.ok(interactionEnd.rangeMultiplier < 1.0);
  assert.ok(Math.abs(recoveryStart.headingRad - interactionEnd.headingRad) < 0.01);
  assert.equal(recovery.headingRad, recoveryStart.headingRad);
  assert.equal(recovery.pitchRad, recoveryStart.pitchRad);
  assert.equal(recovery.rangeMultiplier, recoveryStart.rangeMultiplier);
  assert.deepEqual(
    getScenarioFrame("burst", 12345, 11),
    getScenarioFrame("burst", 12345, 11),
  );
});

test("pressure burst reaches a closer near-view hold earlier than burst", () => {
  const pressureApproachEnd = getScenarioFrame("pressureBurst", 3999, 11);
  const pressureHold = getScenarioFrame("pressureBurst", 4000, 11);
  const pressureLateHold = getScenarioFrame("pressureBurst", 9000, 11);
  const burstAtSameTime = getScenarioFrame("burst", 4000, 11);

  assert.equal(pressureApproachEnd.interacting, true);
  assert.equal(pressureHold.interacting, false);
  assert.equal(pressureLateHold.interacting, false);
  assert.ok(pressureHold.rangeMultiplier < 0.75);
  assert.ok(pressureHold.rangeMultiplier < burstAtSameTime.rangeMultiplier);
  assert.equal(pressureLateHold.headingRad, pressureHold.headingRad);
  assert.equal(pressureLateHold.pitchRad, pressureHold.pitchRad);
  assert.equal(pressureLateHold.rangeMultiplier, pressureHold.rangeMultiplier);
});
