import { buildScenarioTimeline } from "./experiment-config.mjs";

const TWO_PI = Math.PI * 2;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getScenarioFrame(scenario, elapsedMs, seed = 0) {
  const elapsed = clamp(Number(elapsedMs) || 0, 0, 40000);
  if (scenario === "steady") {
    return Object.freeze({
      phaseId: "steady-orbit",
      interacting: false,
      headingRad: TWO_PI * (elapsed / 40000),
      pitchRad: (-25 * Math.PI) / 180,
      rangeMultiplier: 2.4,
    });
  }

  const timeline = buildScenarioTimeline(scenario);
  const phase = timeline.find((item) => elapsed >= item.startMs && elapsed < item.endMs) ?? timeline.at(-1);
  const phaseProgress = clamp(
    (elapsed - phase.startMs) / (phase.endMs - phase.startMs),
    0,
    1,
  );
  const cycle = Number(phase.id.split("-").at(-1)) - 1;
  const seedOffset = ((Number(seed) % 360) * Math.PI) / 180;
  const cycleHeading = seedOffset + cycle * (Math.PI / 2);
  const sweepRadians = TWO_PI * 1.75;

  if (phase.interacting) {
    const approach = phaseProgress * phaseProgress * (3 - 2 * phaseProgress);
    return Object.freeze({
      phaseId: phase.id,
      interacting: true,
      headingRad: cycleHeading + phaseProgress * sweepRadians,
      pitchRad: ((-12 - 28 * approach) * Math.PI) / 180,
      rangeMultiplier: 3.6 - 2.7 * approach,
    });
  }

  return Object.freeze({
    phaseId: phase.id,
    interacting: false,
    headingRad: cycleHeading + sweepRadians,
    pitchRad: (-40 * Math.PI) / 180,
    rangeMultiplier: 0.9,
  });
}
