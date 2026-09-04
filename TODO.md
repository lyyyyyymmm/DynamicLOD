# TODO

Last reviewed: 2026-09-04

## In Progress

- [x] Design, implement, and automatically verify protocol v2.3.6 with a separate `pressureBurst` S3 workload for the next PC-A pilot gate.
- [x] Record D-024 and keep v2.3.5 as pilot/quality audit evidence only.
- [x] Run and analyze the v2.3.6 PC-A `pressureBurst` pressure probe before any full pilot, Android run, or confirmatory collection.
- [x] Run and analyze the four-repeat PC-A `pressureBurst` full pilot.
- [x] Record D-025: freeze v2.3.6 for Android-A pilot based on the PC-A pressure probe and full-pilot evidence.
- [x] Reconfirm Android-A physical conditions for the v2.3.6 Android-A pilot setup.
- [x] Run and analyze the v2.3.6 Android-A `pressureBurst` pilot under the recorded 2026-09-01 phone conditions.
- [x] Inspect the reported Android-A D2/S3 pilot and identify it as a second D1/S3 `bagAmsterdam` run, not D2 evidence.
- [x] Add an unambiguous Android-A D2/S3 `bagRotterdam + pressureBurst` pilot path before collecting D2.
- [x] Run and analyze true Android-A D2/S3 with the new `Run D2/S3 pressureBurst pilot` button.
- [x] Accept the Android-A identifiability-diagnostic gate while preserving D1/S3 and D2/S3 as valid low-pressure pilot evidence.
- [x] Add a diagnostic-only fixed-SSE-4 Android path outside the formal six methods, pilot queues, confirmatory queues, and six-method aggregation.
- [x] Run and analyze the Android-A fixed-SSE-4 identifiability diagnostic.
- [x] Decide the current route: narrow Android claims to cross-device executability and low-pressure boundary behavior under v2.3.6/S3; keep S4 only as a future protocol option if Android efficacy becomes paper-critical.
- [x] Resolve the desktop efficacy device scope by registering PC-B as the second desktop candidate.
- [x] Reconfirm PC-B run-day power/network/GPU/drawing-buffer conditions.
- [x] Inspect the accidental PC-B D1/S3 full pilot and later D1/S3 pressure-probe rerun.
- [x] Add a diagnostic-only PC-B remote-server versus local-server fixed-SSE-4 server-topology path outside formal aggregation.
- [x] Run and analyze the PC-B D1/S3 server-topology fixed4 diagnostic once from the remote PC-A server URL and once from the PC-B local server URL.
- [x] Decide desktop route after the PC-B server-topology diagnostic: local-server delivery produced more tail pressure and burstier tile/resource arrivals, so treat remote delivery as a PC-B S3 confounder.
- [x] Run and analyze one PC-B local-server D1/S3 six-method `pressureBurst` pressure probe with `deviceId=pc-b` before any confirmatory release or S4 design.
- [x] Run and analyze the PC-B local-server D1/S3 four-repeat `pressureBurst` full pilot before any confirmatory release or S4 design.
- [x] Record D-030: PC-B local-server full pilot passes the desktop S3 route/repeatability gate; S4 is not needed for the current desktop route.
- [ ] Prepare the D-031 confirmatory-release decision before any formal collection. Freeze the intended desktop matrix, method order, repeats, seeds, browser/device conditions, local-server requirement, and statistical-analysis inputs.
- [ ] Update and verify the confirmatory run entry point before using `Run main batch`; the current historical main queue still schedules `steady` / `burst`, not the newly gated S3 `pressureBurst` route.

## Decision Gates

- [x] Require every v2.3.1 pressure-probe record to have valid metadata and preserve any invalid retry as audit evidence.
- [x] Require observable queue peaks and `loadProgress` events, then additionally require a valid proposed record with `requestPressureHigh: true`.
- [x] Require at least one proposed action with reason `predicted-tail-plus-request-pressure` before launching a full pilot.
- [x] Rerun the full D1/S2 PC-A pilot only after the v2.3.2 pressure probe passes.
- [x] Require v2.3.3 readiness fields before interpreting any new physical-device run.
- [x] Reject v2.3.5 parameter freeze after the PC-A full pilot because high-pressure taxonomy was sparse across Proposed repeats.
- [x] Require the v2.3.6 PC-A `pressureBurst` pressure probe to show meaningful request-pressure evidence before starting the v2.3.6 full pilot.
- [x] Require the v2.3.6 PC-A full pilot to pass repeatability before Android or confirmatory collection.
- [x] Interpret the Android-A fixed-SSE-4 diagnostic: S3 is unsuitable for Android-A efficacy comparison because fixed `SSE=4` still produced zero over-budget frames under substantial request/content pressure.
- [x] Interpret the PC-B local-server D1/S3 four-repeat full pilot: D-030 accepts it as passing the desktop S3 route/repeatability gate, while keeping confirmatory collection blocked pending D-031.

## Before Confirmatory Collection

- [x] Design, implement, and automatically verify the deliberately versioned v2.3.6 `pressureBurst` workload revision.
- [x] Freeze v2.3.6 for Android-A pilot after D-025 records the PC-A full-pilot gate as accepted.
- [x] Resolve Android-A S3 claim scope before confirmatory collection: D1/S3, its rerun, true D2/S3, and fixed-SSE-4 diagnostics all show request/content pressure but no meaningful Android tail-frame pressure.
- [x] Complete the required visual-quality calibration and preserve reference images/SSIM artifacts.
- [x] Register PC-B as the second desktop candidate for the current desktop efficacy route.
- [x] Confirm PC-B plugged-in state, Wi-Fi SSID `TP318`, Chrome GPU renderer / hardware acceleration, and actual `960 x 540` benchmark drawing buffer.
- [x] Retain the accidental PC-B D1/S3 full pilot as valid pilot/audit evidence: 24 valid `pc-b + bagAmsterdam + pressureBurst` rows in four complete six-method blocks, all with zero tail-frame violations.
- [x] Retain the later D1/S3 pressure-probe rerun as misregistered audit evidence: the six methods are valid and complete, but raw manifests record `deviceId=unregistered`, so these rows must not be used as formal PC-B provenance.
- [x] Complete the PC-B remote/local fixed4 topology diagnostic and record the outcome in D-028: remote delivery is a material PC-B S3 confounder.
- [x] Interpret the PC-B local-server six-method D1/S3 pressure probe before entering confirmatory or designing S4.
- [x] Complete and interpret the PC-B local-server D1/S3 full pilot repeatability gate before entering confirmatory or designing S4.
- [ ] Record a confirmatory-release decision after D-030, then update the run queue/UI so the formal button cannot silently collect the historical S1/S2 matrix when the intended release route is S3 `pressureBurst`.
- [x] Reconfirm Android-A conditions immediately before the v2.3.6 Android-A pilot setup.
- [ ] Reconfirm Android-A conditions again immediately before any later confirmatory block.
- [ ] Freeze method order, repeats, seeds, browser conditions, server topology, and statistical-analysis inputs in the protocol.

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
- [x] Run and analyze the v2.3.6 PC-A D1/S3 pressure probe: six effective valid methods after one invalid Reactive `window-blur` retry; Proposed loaded 129 tiles, reached `requestQueuePeak=38`, and produced pressure-tail-overlap evidence.
- [x] Run and analyze the v2.3.6 PC-A D1/S3 full pilot: 24 valid records in four complete paired blocks, four retained invalid attempts, and repeatable Proposed request-pressure evidence across all four repeats.
- [x] Record D-025: v2.3.6 is frozen for Android-A pilot only; confirmatory collection and manuscript effect claims remain blocked.
- [x] Record Android-A v2.3.6 pilot setup conditions on 2026-09-01: landscape orientation, 50% battery while charging, cooled / thermally stabilized state with exact temperature `[待填]`, 5 GHz Wi-Fi, Chrome 151.0.7922.173, hardware acceleration enabled, and `960 x 540` drawing-buffer target.
- [x] Run and analyze the Android-A v2.3.6 D1/S3 full pilot: 25 attempts, 24 valid records in four complete paired blocks, one retained invalid PI repeat-3 attempt (`window-blur|document-hidden`) followed by a valid retry, and zero tail-frame violations across all valid methods.
- [x] Inspect the reported Android-A D2/S3 pilot after `lod:analyze`: no `bagRotterdam + pressureBurst` Android-A records were produced; the new batch is 24 additional valid D1/S3 `bagAmsterdam` records and remains audit evidence only.
- [x] Add a dedicated D2/S3 pilot queue and UI button: `Run D2/S3 pressureBurst pilot` now schedules `bagRotterdam + pressureBurst`, six methods, four repeats, `networkProfile=lan`, and pilot purpose `full-pilot-v2.3.6-d2-pressure-burst`.
- [x] Run and analyze the true Android-A v2.3.6 D2/S3 pilot: 24 valid `bagRotterdam + pressureBurst` records in four complete paired blocks, no invalid attempts, request-pressure exposure in Proposed/PI/Reactive, and zero tail-frame violations across all valid methods.
- [x] Add a diagnostic-only Android fixed-SSE-4 path: `Run Android fixed4 diagnostic` runs `fixedDiagnostic` on D1/S3 and D2/S3 with `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, and formal aggregation exclusion metadata.
- [x] Run and analyze the Android-A fixed4 diagnostic: D1/S3 and D2/S3 were both valid, reached queue peaks of 39 with 78.9 MB and 91.7 MB transferred, but remained at P95/P99 about 16.7 ms with zero over-budget frames.
- [x] Record D-027: treat v2.3.6/S3 as unsuitable for Android-A efficacy comparison and narrow Android claims for the current manuscript route.

## Update Rule

Move items only when the raw artifact, analysis output, or linked decision supports completion. Keep failed or invalid runs visible as audit evidence rather than deleting them from the workflow.
