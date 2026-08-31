# TODO

Last reviewed: 2026-08-31

## In Progress

- [x] Design, implement, and automatically verify protocol v2.3.6 with a separate `pressureBurst` S3 workload for the next PC-A pilot gate.
- [x] Record D-024 and keep v2.3.5 as pilot/quality audit evidence only.
- [ ] Run the v2.3.6 PC-A `pressureBurst` pressure probe before any full pilot, Android run, or confirmatory collection.
- [ ] If the v2.3.6 pressure probe passes, run the four-repeat PC-A `pressureBurst` full pilot and analyze repeatability.

## Decision Gates

- [x] Require every v2.3.1 pressure-probe record to have valid metadata and preserve any invalid retry as audit evidence.
- [x] Require observable queue peaks and `loadProgress` events, then additionally require a valid proposed record with `requestPressureHigh: true`.
- [x] Require at least one proposed action with reason `predicted-tail-plus-request-pressure` before launching a full pilot.
- [x] Rerun the full D1/S2 PC-A pilot only after the v2.3.2 pressure probe passes.
- [x] Require v2.3.3 readiness fields before interpreting any new physical-device run.
- [x] Reject v2.3.5 parameter freeze after the PC-A full pilot because high-pressure taxonomy was sparse across Proposed repeats.
- [ ] Require the v2.3.6 PC-A `pressureBurst` pressure probe to show meaningful request-pressure evidence before starting the v2.3.6 full pilot.
- [ ] Require the v2.3.6 PC-A full pilot to pass repeatability before Android or confirmatory collection.

## Before Confirmatory Collection

- [x] Design, implement, and automatically verify the deliberately versioned v2.3.6 `pressureBurst` workload revision.
- [ ] Freeze v2.3.6 only after its PC-A pressure probe and full pilot pass.
- [ ] Confirm D1/D2 scenario difficulty provides measurable but not saturated frame-time pressure.
- [x] Complete the required visual-quality calibration and preserve reference images/SSIM artifacts.
- [ ] Register PC-B if it will be part of the cross-PC evidence; otherwise revise the formal device scope before collection.
- [ ] Reconfirm Android-A conditions immediately before its pilot and confirmatory blocks.
- [ ] Freeze method order, repeats, seeds, browser conditions, and statistical-analysis inputs in the protocol.

## Completed

- [x] Establish the paper route and bounded contribution.
- [x] Build the benchmark controller, public Cesium telemetry path, exports, and LAN service.
- [x] Freeze public-data candidates and restrict unlicensed/uncertain assets.
- [x] Calibrate and freeze the PC-A PI baseline.
- [x] Complete Android-A readiness/acceptance check.
- [x] Preserve v2.0 pilot records as audit evidence only.
- [x] Implement and verify the v2.1 interval-peak telemetry correction and pressure-probe entry point.
- [x] Run and analyze the PC-A v2.1 D1/S2 pressure probe: telemetry activity observed, request-pressure mechanism not activated.
- [x] Identify and correct the v2.1 controller-input integration omission; add a regression test for forwarding the interval queue peak.
- [x] Run the PC-A v2.1.1 corrected pressure probe: all six records valid, peak telemetry present, mechanism gate not activated.
- [x] Implement and unit-test the v2.2.0 continuous cross-direction close-sweep S2 workload.
- [x] Run and analyze the PC-A v2.2.0 probe: all six records valid, request activity changed but the 1.5-second pressure gate did not activate.
- [x] Implement and unit-test the v2.2.1 low-speed recovery drift refinement.
- [x] Inspect the first v2.2.1 probe: technically valid records had no meaningful cold-cache activity and were retained as audit evidence only.
- [x] Reproduce the v2.2.1 failure under the controlled rerun and identify continuous recovery motion as the workload defect.
- [x] Implement and unit-test the v2.2.2 monotonic approach plus stationary near-view recovery.
- [x] Run and analyze the v2.2.2 PC-A probe: workload and request-pressure gates passed; preemptive-action gate failed because the EWMA forecast lagged below current P95.
- [x] Add the v2.3.0 current-P95 forecast floor and its failing-first regression test.
- [x] Complete v2.3.0 verification, restart the benchmark, and confirm `/api/health` reports protocol v2.3.0.
- [x] Run and analyze the v2.3.0 PC-A pressure probe: all six records valid and workload active, but pressure impulses released before the 1.5-second persistence gate and no preemptive request-pressure action occurred.
- [x] Add the v2.3.1 request-pressure impulse latch and its failing-first regression test.
- [x] Complete v2.3.1 verification, restart the benchmark, and confirm `/api/health` reports protocol v2.3.1.
- [x] Run and analyze the v2.3.1 PC-A pressure probe: all six records valid; Proposed had `requestPressureHigh=true` in three rows and one `predicted-tail-plus-request-pressure` action.
- [x] Run and analyze the v2.3.1 PC-A full pilot: all 24 records valid, but Proposed was unstable across repeats and cannot be frozen.
- [x] Implement v2.3.2 protocol isolation: fixed-SSE warmup is no longer fed to controller/P95, measurement starts with reset control state, and coarsest-SSE tail no-ops are boundary holds.
- [x] Complete v2.3.2 verification: JS unit tests, Python analysis tests, `lod:analyze`, and `/api/health` all pass.
- [x] Run and analyze the v2.3.2 PC-A pressure probe: all six records valid; Proposed loaded 80 tiles, reached `requestQueuePeak=29`, had one `requestPressureHigh=true` row, and triggered `predicted-tail-plus-request-pressure`.
- [x] Run and analyze the v2.3.2 PC-A full pilot: Proposed was stable across four valid repeats, but a consecutive repeat-2 PI/fixed16/Cesium-dynamic slowdown exposed an uncontrolled pre-run device/browser state and blocked protocol freeze.
- [x] Add `python-runner.mjs` so `lod:analyze`, quality analysis, and Python tests prefer bundled Codex Python before falling back to system Python.
- [x] Create durable project-local handover documents.
- [x] Add a natural-language-only rollout exporter, real-file regression tests, and a background watcher for the current source rollout.
- [x] Implement v2.3.3 pre-run blank-scene readiness gating without changing controller thresholds, camera paths, datasets, or baselines.
- [x] Add readiness unit/e2e coverage and record readiness policy, windows, invalid reason, and summary fields.
- [x] Fix the rollout watcher launcher so future updates write to the canonical `learnMapmost/session_backups` directory.
- [x] Run and analyze the v2.3.3 PC-A pressure probe: readiness and workload gates passed, but the target preemptive action did not occur because pressure coincided with already over-budget tail frames.
- [x] Rerun and analyze the v2.3.3 PC-A pressure probe: readiness and workload gates passed again, but the exact target action still did not occur because pressure windows and near-budget prediction did not coincide in time.
- [x] Decide that the next step is v2.3.4 diagnostic taxonomy rather than another same-protocol repeat or a full pilot.
- [x] Implement v2.3.4 diagnostic/action taxonomy without changing controller decisions.
- [x] Add analysis counts for pressure-safe holds, pressure-tail overlap, preemptive opportunities, exact preemptive actions, and missed opportunities.
- [x] Complete v2.3.4 automatic verification: JS tests, Python analysis tests, analysis regeneration, dataset verification, UI validation, E2E, and `/api/health`.
- [x] Run and analyze the v2.3.4 PC-A pressure probe: six records were valid, but Proposed collapsed to a low-content coarse-SSE regime before request pressure was observable.
- [x] Diagnose the v2.3.4 failure as premature measured-phase control on a partially filled 2-second rolling frame-time window.
- [x] Add a failing-first unit test for full rolling-window control readiness and implement the v2.3.5 control-sampling gate.
- [x] Complete v2.3.5 automatic verification: JS tests, Python analysis tests, analysis regeneration, dataset verification, UI validation, and E2E.
- [x] Run and analyze the v2.3.5 PC-A pressure probe: six valid methods passed readiness and full-window control timing; Proposed loaded 96 tiles, reached `requestQueuePeak=36`, recorded one exact preemptive request-pressure action, and avoided the v2.3.4 low-content collapse.
- [x] Run and analyze the v2.3.5 PC-A D1/S2 full pilot: 35 attempts yielded 24 valid runs in four complete paired blocks; all valid execution gates passed, Proposed avoided low-content collapse, and invalid attempts were retained and retried.
- [x] Complete static D1/D2 visual-quality calibration under v2.3.5: 108 canonical screenshots and 108 SSIM rows generated; minimum SSIM was about 0.954 for Amsterdam and 0.952 for Rotterdam.
- [x] Record D-023: do not freeze v2.3.5; require a new deliberately versioned pressure-workload protocol before Android or confirmatory collection.
- [x] Implement v2.3.6 `pressureBurst`: protocol bump, scenario registration, D1 pilot/probe queue routing, UI option, failing-first tests, analysis regeneration, dataset verification, UI validation, and E2E.

## Update Rule

Move items only when the raw artifact, analysis output, or linked decision supports completion. Keep failed or invalid runs visible as audit evidence rather than deleting them from the workflow.
