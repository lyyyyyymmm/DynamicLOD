# Frozen Experiment Protocol

Protocol version: `2.3.5`  
Freeze date: 2026-08-31

Protocol v2.3.5 is a pre-confirmatory protocol-execution revision after the
v2.3.4 PC-A pressure probe exposed an early measured-phase control decision on a
partially populated rolling frame-time window. The measured controller now waits
until the full 2-second P95 window is available before its first decision row.
The controller thresholds, datasets, camera paths, SSE ladder, request-pressure
logic, readiness gate, analysis taxonomy, and statistical plan remain unchanged
from v2.3.4. All v2.x probe and pilot records remain audit evidence until the
confirmatory matrix is deliberately started.

## Research Question

Can a lightweight scheduler combining short-term tail-frame prediction, public 3D Tiles request feedback, interaction state, and stability guards reduce P95 frame-time budget violations while retaining visual quality on physical desktop and Android Web clients?

The primary endpoint is the proportion of valid two-second control windows whose P95 frame time exceeds `1000/30 = 33.333... ms`. One complete browser run is the statistical unit. Frames and overlapping windows are not treated as independent observations.

## Frozen Controller

- Frame window: 2,000 ms; control interval: 500 ms; prediction horizon: 1,000 ms. Measured-phase control starts only after the first full frame window is available.
- Level estimator: `L_t = 0.4 P95_t + 0.6 L_(t-1)`.
- Trend: least-squares slope over the latest four level estimates.
- Forecast: `F_(t+1s) = max(P95_t, L_t + max(0, slope) * 1s)`.
- Public queue signal: the maximum `pendingRequests + processingTiles` observed from
  `loadProgress` within each 500 ms control interval. The interval-end queue is
  recorded separately for audit; this avoids losing requests that settle before a
  control tick.
- High pressure: two consecutive rises, a nonzero queue lasting 1,500 ms, or a single control-interval impulse `Q_t >= 24`; release after zero for 1,000 ms.
- SSE ladder: `4, 6, 8, 12, 16, 24, 32, 48, 64`; initial SSE: 16.
- Downgrade one level when current or forecast P95 exceeds the budget, and two levels above `1.2T`.
- Preemptive downgrade when the forecast exceeds `0.9T` and request pressure is high.
- Upgrade only after current and forecast P95 remain below `0.8T` for four updates, pressure is absent, and the interaction hold has expired.
- Interaction blocks upgrades but permits emergency downgrades; post-interaction hold is 1,500 ms.
- Downgrade and upgrade cooldowns: 500 and 1,500 ms.

Any controller change after confirmatory collection begins requires a protocol version increment and rerunning every affected condition.

## Data Roles

1. C0, Stanford Dragon discrete LOD: bundled calibration asset; excluded from confirmatory inference.
2. C1, generated 85-tile stress set: deterministic diagnostic and PI-tuning set; excluded from confirmatory inference.
3. D1, 3DBAG Amsterdam subset: primary real-world city dataset, 307 content tiles, approximately 193.6 MB.
4. D2, 3DBAG Rotterdam subset: spatially independent external-validation dataset, 244 content tiles, approximately 180.4 MB.
5. Helsinki Kalasatama: optional future cross-source validation; not ready and not in protocol v2.
6. Taipei 101 and Dayanta: optional demonstrations only. Their current `NOASSERTION` publication rights exclude them from statistics and manuscript evidence.

D1 and D2 are frozen from the official 3DBAG `v20250903` Cesium 3D Tiles repository under CC BY 4.0. Every local file is listed by path, byte size, and SHA-256 in `provenance.json`; the provenance file identity is also frozen in the experiment configuration.

## Methods and Tuning

The six confirmatory methods are fixed SSE 8, fixed SSE 16, Cesium dynamic SSE, reactive P95, discrete PI, and the proposed scheduler. The PI baseline was tuned once on C1/S2 with a `4 x 4` grid over `Kp={0.05,0.1,0.2,0.4}` and `Ki={0.01,0.02,0.05,0.1}`, four repeats per pair, under the diagnostic 40 ms response-delay profile. Selection minimizes violation rate, then time-weighted SSE and switching within a 0.01 absolute violation-rate band. The 64 unique valid PC-A tuning runs selected `Kp=0.40` and `Ki=0.05`; these gains are frozen before confirmatory collection.

Ablations remove prediction, request pressure, interaction awareness, or stability guards one component at a time.

## Scenarios and Matrix

- Before either scenario, unload the previous tileset and run a method-independent blank-scene readiness gate. The formal policy samples 2-second frame-time windows and requires two consecutive windows with P95 <= 25 ms within 60 seconds. A timeout records `pre-run-frame-instability`, retains the attempt as invalid audit evidence, and triggers the existing retry policy.
- After readiness passes, wait for the first tile for at most 60 seconds. This loading gate is outside warm-up and measurement; a timeout invalidates the attempt. The drawing-buffer target is `960 x 540`; a one-pixel browser rounding tolerance is allowed and the actual size is retained per telemetry row.
- S1: 10-second fixed-SSE warm-up followed by a 40-second uniform orbit.
- S2: the same warm-up followed by four cycles of a 6-second cross-direction monotonic approach from range multiplier 3.6 to 0.9 and a 4-second stationary near-view recovery.

Before a v2.3.5 full pilot, run one D1/S2 six-method `request-peak-probe` block.
The probe is pilot-only and records interval queue peaks plus `loadProgress` event counts.
The v2.1.1 probe confirmed that the retained peak reaches the controller, but the original
S2 path still produced only isolated queue pulses. v2.2.0 added a longer, cross-direction
close sweep; its probe remained below the 1.5-second persistence gate. v2.2.1 added
continuous recovery drift, but two PC-A probes loaded only the seven external roots.
Comparison with the stationary v2.2.0 recovery identified camera motion as the workload
defect. v2.2.2 therefore ends each monotonic approach at a near viewpoint and holds it
stationary during recovery. Its PC-A probe passed the workload and request-pressure gates,
but the smoothed projection lagged below the current P95 and missed the preemptive action.
Protocol v2.3.0 lower-bounded the forecast by current P95 without changing the workload
or decision thresholds. Its PC-A probe then showed active loading and large queue pulses,
but those pulses released before the 1.5-second persistence gate. Protocol v2.3.1 therefore
adds the `Q_t >= 24` pressure-impulse latch while preserving the forecast, workload,
thresholds, and baselines. The v2.3.1 PC-A probe satisfied the mechanism gate: the valid
proposed run reported high request pressure and one `predicted-tail-plus-request-pressure`
action. The v2.3.1 full pilot then failed the freeze gate because Proposed repeats
entered inconsistent workload regimes. Protocol v2.3.2 isolated fixed-SSE warmup from
measured controller state and removed no-op coarsest-SSE downgrade inflation. Its PC-A
full pilot stabilized Proposed across four valid repeats, but repeat-2 PI, fixed16,
and Cesium dynamic runs showed a consecutive system-level frame-time elevation without
matching request pressure. Protocol v2.3.3 therefore adds the pre-run blank-scene
readiness gate. Two PC-A v2.3.3 pressure probes then passed readiness and workload
gates but exposed that a single exact action name is too narrow as a mechanism
gate: one probe overlapped pressure with an already over-budget tail frame, while
the second observed pressure when tail risk was still low. Protocol v2.3.4
therefore revised only the analysis taxonomy. Its PC-A probe then produced
format-valid records, but the Proposed run downgraded on a partially filled
start-of-measurement P95 window before meaningful request pressure appeared.
Protocol v2.3.5 therefore delays the first measured controller update until the
full 2-second frame-time window is available. A new PC-A pressure probe and full
pilot must pass before Android or confirmatory collection begins.

All confirmatory runs use the `lan` profile. Artificial delay profiles are diagnostic-only and are rejected for D1/D2 by the server.

Per physical device, the main matrix contains 216 runs: D1/S1 has 8 paired repeats, D1/S2 has 12, D2/S1 has 8, and D2/S2 has 8; every block contains six methods in seed-shuffled order. The D1/S2 ablation matrix adds 32 runs per device. PI calibration adds 64 pilot runs on the designated tuning PC and is never pooled with confirmation data.

The SCI target design uses at least two distinct desktop PCs and one physical Android phone, all with hardware-accelerated Chrome, a fixed `960 x 540` drawing buffer, no terrain or imagery, and the same server assets. Device IDs represent physical devices, not browser viewport presets.

## Validity Rules

A run is invalid if the pre-run readiness gate times out, first content does not arrive within the 60-second loading gate, the page is hidden, focus is lost, the drawing buffer differs from the `960 x 540` target by more than one pixel, no valid windows are recorded, Resource Timing evidence is absent, or any tile fails. Invalid attempts remain in the audit trail and are automatically retried at most twice. Before each session record browser version, OS, CPU/SoC, GPU, RAM, refresh rate, power state, and connection type. Android viewport emulation is UI testing only.

## Metrics and Prediction Diagnostics

The primary metric is P95-window violation rate. Secondary metrics are frame P95/P99, over-budget-frame proportion, control-interval request-queue peak and AUC, `loadProgress` event count, resource count and bytes, time-weighted SSE, visible geometric error, first stable display, recovery time, switches per minute, reversals, and controller-state residence.

Forecast reporting includes one-second-horizon MAE, persistence-baseline MAE, violation precision/recall/F1, and warning lead time. Visual calibration uses six canonical views at every SSE level against SSE 4, reporting SSIM and, when the optional frozen LPIPS environment is installed, LPIPS. LPIPS is supplementary and cannot replace the prespecified SSIM non-inferiority decision.

## Statistical Analysis

Friedman tests use complete six-method blocks and are reported separately by physical device, dataset, and scenario. Planned two-sided paired Wilcoxon tests compare proposed against PI, reactive, and Cesium dynamic SSE within the same strata, followed by global Holm correction. Reports include Hodges-Lehmann paired differences, matched-pairs rank-biserial effects, and 10,000-resample paired bootstrap 95% confidence intervals with seed `20260823`. No pooled cross-device p value is used to satisfy the gate.

The minimum submission gate is evaluated on D1/S2: at least a 20% median relative violation-rate reduction versus reactive on every physical device; Holm-adjusted `p < 0.05` in the prespecified stratified comparisons; SSIM non-inferiority within 0.02; no higher switching frequency; forecast MAE below persistence MAE; and the same effect direction on D2. Failure of any gate is reported rather than repaired by post hoc parameter changes.
