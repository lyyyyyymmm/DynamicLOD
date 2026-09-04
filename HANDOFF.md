# HANDOFF: Web 3D Tiles Tail Frame-Time LOD Benchmark

Paste this file into a new Codex conversation and ask it to continue from here.

## Overall Goal

Develop an application-oriented graphics/WebGIS paper around:

- Chinese title: **面向尾部帧时约束的 Web 3D Tiles 预测式动态 LOD 调度方法**
- English title: **Predictive Dynamic LOD Scheduling for Web 3D Tiles under Tail Frame-Time Constraints**

Core research question: whether a lightweight online scheduler can combine short-term tail-frame prediction, public Cesium 3D Tiles request feedback, interaction state, and stability control to reduce `P95 > 33.33 ms` violation rate while retaining visual quality on PC and Android.

The current protocol is **v2.3.6**. Current status: **D-030 accepts the PC-B local-server D1/S3 four-repeat full pilot as valid pilot evidence and as passing the desktop S3 route/repeatability gate. This permits confirmatory-release preparation, not formal collection. Do not click the existing `Run main batch` entry yet because the historical main queue still schedules the older `steady` / `burst` matrix rather than the newly gated S3 `pressureBurst` route. D-028 completed the diagnostic-only PC-B remote-server versus local-server fixed-SSE-4 A/B check and diagnosed remote LAN delivery as a material PC-B S3 confounder. D-027 still classifies v2.3.6/S3 `pressureBurst` as unsuitable for Android-A tail-control efficacy because the Android diagnostic-only fixed-SSE-4 run produced zero over-budget frames despite substantial request/content pressure. Android-A is narrowed to cross-device executability, telemetry validity, and low-pressure boundary behavior for the current manuscript route. PC-B is registered and its run-day power/network/GPU/drawing-buffer provenance is recorded. A PC-B accidental D1/S3 full pilot is valid but low-pressure across all methods; the later D1/S3 pressure-probe rerun is complete but misregistered as `deviceId=unregistered`; both were remote-server/audit evidence, not a basis for confirmatory release.** Do not start confirmatory collection yet.

## What Has Been Implemented

- Modular benchmark system under `learnMapmost`.
- Web page: `learnMapmost/lod-benchmark.html`.
- Runtime controller interface: controller receives frame-time/request/interaction samples and outputs SSE decisions.
- Six methods: `fixed8`, `fixed16`, `cesiumDynamic`, `reactive`, `pi`, `proposed`.
- Cesium public telemetry via `loadProgress`, `tileLoad`, `tileVisible`, and `tileFailed`; no reliance on private `_statistics`.
- Stable result structures: manifest, telemetry rows, run summaries, CSV/JSON export.
- LAN benchmark server with isolated benchmark asset routes.
- Frozen datasets:
  - `bagAmsterdam`: D1, main pilot dataset, 3DBAG CC-BY-4.0, ready.
  - `bagRotterdam`: D2, external validation dataset, 3DBAG CC-BY-4.0, ready.
  - `publicStress`: diagnostic only.
  - `taipei101` and `dayanta`: optional demonstrations only; not for formal claims without rights/provenance.
- PI baseline frozen for PC-A: `Kp=0.40`, `Ki=0.05`.
- Pre-run blank-scene readiness gate: two consecutive 2-second P95 windows <= 25 ms, timeout 60 s.
- Warmup isolation: 10-second fixed `SSE=16` warmup is not fed into the adaptive controller or measured rolling P95.
- v2.3.5 full-window gate: measured-phase controller sampling waits until the first full 2,000 ms rolling frame-time window is available.
- v2.3.6 pressure-workload revision: adds separate `pressureBurst` / S3 scenario for the next PC-A pilot gate while preserving controller thresholds, datasets, baselines, readiness policy, and statistical plan.
- Android-A identifiability diagnostic: `Run Android fixed4 diagnostic` runs `fixedDiagnostic` at `SSE=4` on D1/S3 and D2/S3 with `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, and `excludeFromFormalAggregation=true`. It is not a seventh formal method and is not part of pilot or confirmatory aggregation.
- PC-B server-topology diagnostic: `Run server-topology fixed4 diagnostic` runs `fixedDiagnostic` at `SSE=4` on D1/S3 only with `studyPhase=diagnostic`, `diagnosticPurpose=server-topology-identifiability`, `fixedSse=4`, and `excludeFromFormalAggregation=true`. Open the same page from the PC-A LAN server for `serverTopology=remote`, then from PC-B `localhost:8088` for `serverTopology=local`. Analysis writes `results/analysis/server_topology_diagnostics.csv` with frame distribution, request pressure, tile/resource totals, and 100/250/500 ms delivery-bin summaries.
- Natural-language rollout backup:
  - Source rollout: `C:\Users\78630\.codex\sessions\2026\08\23\rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.jsonl`
  - Markdown backup: `learnMapmost/session_backups/rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.md`
  - One-time backup command: `npm.cmd run lod:backup`
  - Watcher command: `npm.cmd run lod:backup:watch`

## Files Changed / Important Files

Core runtime:

- `learnMapmost/experiment-config.mjs`
- `learnMapmost/lod-benchmark.mjs`
- `learnMapmost/lod-controller.mjs`
- `learnMapmost/lod-methods.mjs`
- `learnMapmost/lod-metrics.mjs`
- `learnMapmost/tileset-telemetry.mjs`
- `learnMapmost/controller-sample.mjs`
- `learnMapmost/benchmark-run-utils.mjs`
- `learnMapmost/benchmark-server.mjs`

Tests and validation:

- `learnMapmost/tests/*.test.mjs`
- `learnMapmost/tests/lod-benchmark.e2e.spec.mjs`
- `learnMapmost/analysis/tests/*.py`
- `learnMapmost/analysis/analyze_results.py`
- `learnMapmost/analysis/capture_quality.mjs`
- `learnMapmost/analysis/capture-quality-utils.mjs`
- `learnMapmost/analysis/capture_ui_validation.mjs`

Project records and paper files:

- `learnMapmost/PROJECT_STATE.md`
- `learnMapmost/DECISIONS.md`
- `learnMapmost/TODO.md`
- `learnMapmost/CHANGELOG.md`
- `learnMapmost/RUNBOOK.md`
- `learnMapmost/HANDOFF.md`
- `learnMapmost/paper/experiment_protocol.md`
- `learnMapmost/paper/data_dictionary.md`
- `learnMapmost/paper/manuscript_zh.md`
- `learnMapmost/paper/claim_registry.md`
- `learnMapmost/results/device_registry.md`
- `learnMapmost/results/analysis/PI_FREEZE.md`

Latest important raw results:

- `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r1-mth97ply.json`
- `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r1-mtha578r.json`
- `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r2-mthab6r5.json`
- `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r3-mthaqcrw.json`
- `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r4-mthasq6u.json`
- `learnMapmost/results/incoming/android-a-bagAmsterdam-pressureBurst-proposed-r1-mtib2jih.json`
- `learnMapmost/results/incoming/android-a-bagAmsterdam-pressureBurst-proposed-r2-mtib7a99.json`
- `learnMapmost/results/incoming/android-a-bagAmsterdam-pressureBurst-proposed-r3-mtibkprm.json`
- `learnMapmost/results/incoming/android-a-bagAmsterdam-pressureBurst-proposed-r4-mtibn36h.json`
- `learnMapmost/results/incoming/android-a-bagRotterdam-pressureBurst-proposed-r1-mtinglfn.json`
- `learnMapmost/results/incoming/android-a-bagRotterdam-pressureBurst-proposed-r2-mtinlc5m.json`
- `learnMapmost/results/incoming/android-a-bagRotterdam-pressureBurst-proposed-r3-mtinydio.json`
- `learnMapmost/results/incoming/android-a-bagRotterdam-pressureBurst-proposed-r4-mtio0qtl.json`

## Important Architectural / Design Decisions

- Keep the contribution narrow: this is not a new LOD concept, not a new mesh simplification method, and not a culture-heritage-only method. It is a Web 3D Tiles runtime scheduler on top of Cesium SSE refinement.
- Formal target: reduce tail-frame violation rate under `P95 <= 33.33 ms`, while retaining quality.
- One browser run is the statistical unit. Do not treat frames or overlapping windows as independent samples.
- Pilot/tuning/legacy records are audit evidence only. Formal claims require confirmatory runs.
- Invalid attempts are retained and retried; do not delete invalid JSON files.
- `taipei101` and `dayanta` are excluded from formal evidence because publication rights/provenance are unresolved.
- D1/D2 use official 3DBAG frozen subsets under CC-BY-4.0.
- v2.3.4 introduced analysis-only pressure taxonomy without changing controller decisions.
- v2.3.5 fixed a protocol-execution defect: the first measured control decision must wait for a full 2-second rolling P95 window.
- D-023 rejects freezing v2.3.5 after quality calibration because the full pilot still produced sparse high-pressure taxonomy across Proposed repeats.
- D-024 releases v2.3.6 `pressureBurst` as the next PC-A pilot workload and keeps Android/confirmatory collection blocked until the new pilot gate passes.
- D-025 freezes v2.3.6 for Android-A pilot only; confirmatory collection remains blocked.
- D-026 keeps Android-A D1/S3 and D2/S3 as valid low-pressure pilot evidence and adds a diagnostic-only fixed-SSE-4 identifiability gate.
- D-027 interprets the fixed4 diagnostic as Android-A S3 floor-effect evidence and narrows the current v2.3.6 Android claim to executability / low-pressure boundary behavior.
- D-028 adds and interprets the PC-B remote/local server-topology fixed4 diagnostic. The local-server diagnostic produced stronger tail pressure and burstier tile/resource arrivals, so remote LAN delivery is a material PC-B S3 confounder. Next step is a PC-B local-server D1/S3 six-method pressure probe, not confirmatory collection or S4 design.
- D-029 accepts the PC-B local-server D1/S3 six-method pressure probe as valid pilot evidence and sets the next gate to a PC-B local-server D1/S3 four-repeat full pilot. Confirmatory collection and S4 remain blocked.
- D-030 accepts the PC-B local-server D1/S3 four-repeat full pilot as valid pilot evidence and as passing the desktop S3 route/repeatability gate. Confirmatory collection is still blocked pending D-031, which must freeze and verify the intended formal matrix/run entry point.
- PC-B device registration was recorded on 2026-09-02: Intel Core Ultra 7 258V @ 2.20 GHz, Intel Arc 140V GPU (16 GB), 32.0 GB RAM (31.6 GB usable, 8533 MT/s), Windows 11 Home Chinese edition 25H2, Chrome 150.0.7871.115 (64-bit), 60 Hz display refresh, Wi-Fi, and Best performance power mode. Run-day provenance records plugged-in power, Wi-Fi SSID `TP318`, Chrome GPU hardware acceleration evidence, active Intel Arc 140V GPU evidence with driver `32.0.101.8860`, and actual benchmark drawing buffer `960 x 540`.
- PC-B D1/S3 evidence was recorded on 2026-09-02. The accidental `Run D1/S3 pressureBurst pilot` produced 24 valid `pc-b + bagAmsterdam + pressureBurst` pilot rows in four complete six-method blocks, but every method had zero tail-frame violations and P95 stayed about `16.8-16.9 ms`. The later six-method D1/S3 pressure-probe rerun is complete and valid but its raw manifests record `deviceId=unregistered`; keep it as audit evidence and treat the manifest as source of truth over the filename.
- Android-A v2.3.6 pilot setup conditions recorded on 2026-09-01: landscape orientation, 50% battery while charging, cooled / thermally stabilized state with exact temperature `[待填]`, 5 GHz Wi-Fi, Chrome 151.0.7922.173, hardware acceleration enabled, and `960 x 540` drawing-buffer target. Keep the charging/power state fixed for the pilot and do not mix it with the older unplugged readiness condition.
- The fixed `Run D1/S3 pressureBurst pilot` UI button uses `bagAmsterdam`; it does not collect D2/S3. A reported Android-A D2/S3 run on 2026-09-01 was verified as a second D1/S3 `bagAmsterdam` run. The later true D2/S3 run used the new `Run D2/S3 pressureBurst pilot` button and produced `bagRotterdam` records.
- Do not change controller thresholds, SSE ladder, camera paths, datasets, baselines, readiness policy, or statistical plan unless a new protocol version is deliberately created and documented.

## Current Git / Repo State

- Working directory: `D:\myCesium202510\Cesium-1.134\Apps`.
- `Apps` is **not a Git repository**, but `Apps/learnMapmost` is the Git worktree used for this benchmark. Inspect `git status` and `git diff` from `learnMapmost`; verify generated results by reading files and running tests.
- Node dependencies are present in `node_modules`.
- After restarting the benchmark server with current code, `http://127.0.0.1:8088/api/health` should report:
  - `protocolVersion = 2.3.6`
  - `windowMs = 2000`
  - `controlIntervalMs = 500`
  - `renderWidth = 960`
  - `renderHeight = 540`

## Tests Already Run And Results

Most recent v2.3.6 automatic verification:

- `npm.cmd test` -> 88 tests passed after adding the PC-B server-topology diagnostic path.
- `npm.cmd run test:lod:py` -> 19 Python tests passed after adding `server_topology_diagnostics.csv` export coverage.
- `npm.cmd run lod:analyze` -> completed after the diagnostic implementation and after the E2E smoke run; latest `STATUS.md`, `all_runs.csv`, `android_identifiability_diagnostics.csv`, and `server_topology_diagnostics.csv` regenerated.
- `npm.cmd run lod:verify-data` -> `bagAmsterdam: READY`, `bagRotterdam: READY`.
- `npm.cmd run lod:validate-ui` -> desktop and Android-landscape validation passed, both with `960 x 540` drawing buffer and nonblank render.
- `npm.cmd run test:lod:e2e -- --reporter=line` -> 2 Playwright tests passed after rerunning outside the sandbox; the first sandboxed attempt failed at browser launch with Windows `spawn EPERM`, not a test assertion.
- `/api/health` from any already-running stale server may still report an older protocol until that server is restarted; current source manifests and E2E smoke records use protocol `2.3.6`.
- `npm.cmd run lod:capture-quality` -> generated 108 canonical quality screenshots after repairing the dynamic-canvas screenshot path.
- `npm.cmd run lod:quality` -> generated 108 SSIM rows in `results/quality/quality_ssim.csv`.

Latest analysis status after the PC-B local-server D1/S3 four-repeat full pilot:

- Result files: 480
- Valid runs, all phases: 430
- Valid confirmatory runs: 0
- Valid pilot runs: 336
- Valid diagnostic runs: 4
- Valid tuning runs: 0
- Invalid runs: 50
- Complete six-method paired blocks: 0

The latest E2E-created `unregistered-publicStress` smoke audit records remain non-formal. The Android-A fixed4 diagnostic records are valid diagnostic rows in `results/analysis/android_identifiability_diagnostics.csv`, not pilot or confirmatory rows. `results/analysis/server_topology_diagnostics.csv` contains the two valid PC-B remote/local diagnostic rows and is excluded from formal aggregation.

## Latest PC-B Local-Server D1/S3 Full Pilot Gate

The user reported completing the PC-B local-server `Run D1/S3 pressureBurst pilot`
and `lod:analyze`. Inspection of `results/analysis/all_runs.csv` shows 24 valid
rows with:

- `deviceId=pc-b`;
- `dataset=bagAmsterdam`;
- `scenario=pressureBurst`;
- `protocolVersion=2.3.6`;
- `studyPhase=pilot`;
- `pilotPurpose=full-pilot-v2.3.6-pressure-burst`;
- `serverTopology=local`;
- `pageOrigin=http://localhost:8088`;
- no invalid reasons.

The four repeats each contain the complete frozen six-method set:
`cesiumDynamic`, `fixed16`, `fixed8`, `pi`, `proposed`, and `reactive`.

Key method evidence:

- `cesiumDynamic`: four valid repeats, violation `0.0` in every repeat, P95/P99 about `16.90/16.90 ms`, queue peak `1`, 9 tiles, about 0.8 MB.
- `fixed16`: four valid repeats, violation `0.0`, P95/P99 about `16.90/16.90 ms`, queue peak up to `13`, 30 tiles, about 14.7 MB.
- `fixed8`: four valid repeats, violation `0.0`, P95 about `16.90 ms`, P99 about `16.90-17.15 ms`, raw max up to `50.0 ms`, nonzero raw over-budget-frame rates, queue peaks `58/59/62/59`, 134-137 tiles, about 87.7-90.0 MB.
- `pi`: four valid repeats, violation rates `0.0533/0.0526/0.0526/0.0`, P95 about `21.77/21.02/21.02/21.00 ms`, P99 about `33.37/33.37/33.37/33.30 ms`, raw max up to `50.10 ms`, queue peaks `61/62/63/65`, 170-173 tiles, about 115.6-116.5 MB.
- `proposed`: four valid repeats, violation `0.0`, P95/P99 about `16.81-16.90/16.90-17.00 ms`, raw max `33.40 ms`, queue peak `42` in every repeat, 153-155 tiles, about 102.4-103.2 MB, pressure-safe holds `9/10/10/10`, and no pressure-tail overlap, preemptive opportunities, exact `predicted-tail-plus-request-pressure` actions, missed opportunities, or tail downgrades under pressure.
- `reactive`: four valid repeats, violation `0.0`, P95/P99 about `16.82-16.90/16.90-16.98 ms`, raw max up to `50.0 ms`, nonzero raw over-budget-frame rates, queue peaks `49/50/50/50`, 170-173 tiles, about 115.6-116.5 MB.

Interpretation: D-030 accepts this full pilot as passing the PC-B local-server
desktop S3 route/repeatability gate. S3 is not a universal floor-effect workload
on PC-B local delivery: PI shows repeatable measurable P95-window pressure and
Fixed8/Reactive show raw frame spikes under substantial request/content pressure,
while the system is not fully saturated. This supports preparing a desktop
confirmatory release, but it is not a method-effect claim. Proposed did not show
pressure-tail overlap or exact preemptive request-pressure actions on PC-B; those
mechanism claims still depend on PC-A pilot/probe evidence and future
confirmatory/ablation evidence.

Next step: prepare D-031. Freeze the formal desktop matrix, method order,
repeats, seeds, browser/device conditions, local-server requirement, and analysis
inputs. Update and verify the `Run main batch` queue before any formal collection,
because the current historical main queue still targets `steady` / `burst`, not
the intended S3 `pressureBurst` route.

## Latest PC-B D1/S3 PressureBurst Pilot / Probe Evidence

The user first intended to run the PC-B `D1/S3 pressureBurst probe` but accidentally
pressed `Run D1/S3 pressureBurst pilot`. This produced 24 valid records with:

- `deviceId=pc-b`;
- `dataset=bagAmsterdam`;
- `scenario=pressureBurst`;
- `protocolVersion=2.3.6`;
- `studyPhase=pilot`;
- `pilotPurpose=full-pilot-v2.3.6-pressure-burst`.

All four repeats contain the complete frozen six-method set and no invalid attempts.
Valid-method median results:

- `cesiumDynamic`: violation `0.0`, P95 about `16.86 ms`, queue peak `1`, tiles `9`, transfer bytes `829,762`.
- `fixed16`: violation `0.0`, P95 about `16.87 ms`, queue peak `12`, tiles `30`, transfer bytes `15,454,198`.
- `fixed8`: violation `0.0`, P95 about `16.82 ms`, queue peak `39.5`, tiles `133`, transfer bytes `92,030,598`.
- `pi`: violation `0.0`, P95 about `16.81 ms`, queue peak `41`, tiles `161.5`, transfer bytes `112,024,126`.
- `proposed`: violation `0.0`, P95 about `16.81 ms`, queue peak `39`, tiles `116`, transfer bytes `79,712,476`.
- `reactive`: violation `0.0`, P95 about `16.80 ms`, queue peak `40`, tiles `159`, transfer bytes `110,257,730`.

Proposed repeat-level evidence:

- repeat 1: `pc-b-bagAmsterdam-pressureBurst-proposed-r1-mtjpw7e8`, violation `0.0`, P95 `16.90 ms`, queue peak `39`, tiles `128`, transfer bytes `88,537,062`, pressure-safe holds `31`.
- repeat 2: `pc-b-bagAmsterdam-pressureBurst-proposed-r2-mtjq0ym6`, violation `0.0`, P95 `16.83 ms`, queue peak `39`, tiles `52`, transfer bytes `28,474,762`, pressure-safe holds `33`.
- repeat 3: `pc-b-bagAmsterdam-pressureBurst-proposed-r3-mtjqe279`, violation `0.0`, P95 `16.80 ms`, queue peak `39`, tiles `115`, transfer bytes `78,700,478`, pressure-safe holds `38`.
- repeat 4: `pc-b-bagAmsterdam-pressureBurst-proposed-r4-mtjqgfh2`, violation `0.0`, P95 `16.80 ms`, queue peak `40`, tiles `117`, transfer bytes `80,724,474`, pressure-safe holds `36`.

All valid Proposed repeats had `pressureTailOverlapCount=0`,
`pressurePreemptiveOpportunityCount=0`, `pressurePreemptiveActionCount=0`,
`missedPreemptiveOpportunityCount=0`, and `tailDowngradeUnderPressureCount=0`.

The user then reran the D1/S3 pressure probe and `lod:analyze`. The later six-method
probe is complete and valid, but the raw manifests record `deviceId=unregistered`
even though the filenames begin with `pc-b`. Treat raw manifest metadata as source of
truth: these rows are audit evidence only and must not be used as formal PC-B
provenance. The misregistered probe still corroborates low S3 pressure in that session:
Proposed had violation `0.0`, P95 about `16.90 ms`, request queue peak `38`, `98` tiles,
`65,254,806` bytes, and `37` pressure-safe holds.

Interpretation: this earlier remote-server PC-B evidence lacked tail-control
identifiability because the frame-time tail stayed near one 60 Hz frame for every
method despite meaningful content and queue pressure. Do not use it as evidence
against S3 under local delivery. The later server-topology diagnostic, local-server
probe, and local-server full pilot supersede this as the route decision evidence.

## PC-B Server-Topology Fixed4 Diagnostic Path

Physical A/B data are complete. The button was:

- `Run server-topology fixed4 diagnostic`

It schedules exactly one diagnostic-only run:

- `deviceId`: use `pc-b` in the page input;
- dataset: `bagAmsterdam`;
- scenario: `pressureBurst`;
- method: `fixedDiagnostic`;
- `fixedSse=4`;
- `networkProfile=lan`;
- `studyPhase=diagnostic`;
- `diagnosticPurpose=server-topology-identifiability`;
- `excludeFromFormalAggregation=true`.

Completed A/B records:

1. Remote condition: `pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtk2udpi`, `pageOrigin=http://192.168.0.112:8088`, `serverTopology=remote`, valid, P95/P99 `16.90/16.90 ms`, raw max `33.30 ms`, window violation `0/76`, frame-over-budget rate `0.0`, queue peak `40`, 159 tiles, 110.6 MB, resource/tile-load peaks 18/7 per 100 ms and 24/8 per 500 ms.
2. Local condition: `pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtlgfjw1`, `pageOrigin=http://localhost:8088`, `serverTopology=local`, valid, P95/P99 `21.03/33.40 ms`, raw max `50.10 ms`, window violation `4/76`, frame-over-budget rate `0.00378`, queue peak `61`, 174 tiles, 124.7 MB, resource/tile-load peaks 29/47 per 100 ms and 77/74 per 500 ms.

Interpretation gate:

Outcome: the diagnostic matches the "local produces more tail pressure or burstier arrivals" gate. Treat remote LAN delivery as a material PC-B S3 confounder. Do not use the earlier remote-server PC-B pilot/probe to conclude that S3 is inherently too light on PC-B. The later local-server probe and full pilot have now been completed; D-030 accepts the desktop S3 route gate while keeping formal collection blocked pending D-031.

## Latest PC-B Local-Server D1/S3 Pressure Probe

The user reported completing the PC-B local-server `Run D1/S3 pressureBurst probe`
and `lod:analyze`. Inspection of `results/analysis/all_runs.csv` and the six raw
JSON files showed:

- six valid `pc-b + bagAmsterdam + pressureBurst` pilot records;
- `pilotPurpose=request-peak-probe-v2.3.6-pressure-burst`;
- `serverTopology=local`;
- `pageOrigin=http://localhost:8088`;
- no invalid reasons;
- zero valid confirmatory runs overall.

Method results:

- `cesiumDynamic`: violation `0.0`, P95/P99 about `16.90/16.90 ms`, queue peak `1`, 9 tiles, 0.83 MB.
- `fixed16`: violation `0.0`, P95/P99 about `16.90/16.90 ms`, queue peak `13`, 30 tiles, 15.45 MB.
- `fixed8`: violation `0.0`, P95/P99 about `16.90/17.05 ms`, raw max `33.40 ms`, queue peak `60`, 134 tiles, 94.06 MB.
- `pi`: violation `0.0526` with 4/76 over-budget windows, P95/P99 about `21.02/33.37 ms`, raw max `50.10 ms`, queue peak `61`, 170 tiles, 121.23 MB.
- `proposed`: violation `0.0`, P95/P99 about `16.90/16.90 ms`, raw max `33.50 ms`, queue peak `42`, 153 tiles, 107.33 MB, 58 load-progress events, 9 pressure-safe-hold windows, and zero pressure-tail overlap / preemptive opportunity / exact request-pressure action.
- `reactive`: violation `0.0`, P95/P99 about `16.90/16.90 ms`, raw max `33.40 ms`, queue peak `49`, 170 tiles, 121.23 MB.

Interpretation: the PC-B local-server probe is valid pilot evidence and shows that
S3 has a usable local-server workload signal on PC-B. This probe set the D-029
full-pilot gate, which was later completed and accepted by D-030. Do not treat the
probe itself as a method-effect claim.

## Latest Android-A Fixed4 Identifiability Diagnostic

The user reported completing `Run Android fixed4 diagnostic`, then `android_identifiability_diagnostics.csv` was updated. Inspection of `results/analysis/STATUS.md`, the diagnostic CSV, and raw JSON files showed:

- `android-a-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtiqf2tx`: valid diagnostic record, `dataset=bagAmsterdam`, `scenario=pressureBurst`, `method=fixedDiagnostic`, `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, `excludeFromFormalAggregation=true`, `960 x 540` render target, readiness passed, no tile failures. P95 `16.7 ms`, P99 `16.7 ms`, raw max `33.1 ms`, `frameTimeOver20Rate=0.000415`, `frameBudgetViolationRate=0.0`, `requestQueuePeak=39`, `requestQueueAuc=246,976.6`, `tilesLoadedTotal=116`, `transferBytes=78,922,006`, `loadProgressEventCount=206`.
- `android-a-bagRotterdam-pressureBurst-fixedDiagnostic-r1-mtiqg9ix`: valid diagnostic record, `dataset=bagRotterdam`, `scenario=pressureBurst`, `method=fixedDiagnostic`, `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, `excludeFromFormalAggregation=true`, `960 x 540` render target, readiness passed, no tile failures. P95 `16.7 ms`, P99 `16.7 ms`, raw max `18.2 ms`, `frameTimeOver20Rate=0.0`, `frameBudgetViolationRate=0.0`, `requestQueuePeak=39`, `requestQueueAuc=233,590.4`, `tilesLoadedTotal=108`, `transferBytes=91,659,806`, `loadProgressEventCount=214`.

Interpretation: v2.3.6/S3 has a clear Android-A floor effect. The workload loads meaningful content and produces request pressure, but even fixed `SSE=4` does not create measurable tail-frame pressure on Android-A. Do not add S3 Android repeats or run Android-A S3 confirmatory efficacy blocks. Current route: report Android-A as cross-device executability, telemetry validity, and low-pressure boundary behavior; if Android efficacy becomes paper-critical later, define a new platform-independent S4 workload under a new protocol version before running Proposed.

The latest total includes retained audit/test records such as `unregistered-publicStress-pressureBurst-proposed-r1-mtidrply.json` and `unregistered-publicStress-pressureBurst-proposed-r1-mtie1u20.json`; these are not confirmatory evidence.

## Latest v2.3.6 Android-A D1/S3 PressureBurst Full Pilot

The user reported completing `Run D1/S3 pressureBurst pilot` on Android-A, then `npm.cmd run lod:analyze` was run again. The Android-A full pilot files are marked as:

- dataset: `bagAmsterdam`;
- scenario: `pressureBurst`;
- protocolVersion: `2.3.6`;
- deviceId: `android-a`;
- networkProfile: `lan`;
- pilotPurpose: `full-pilot-v2.3.6-pressure-burst`;
- render target in raw manifests: `960 x 540`;
- browser in raw manifests: Chrome mobile user-agent `Chrome/151.0.0.0`; manually recorded device condition: Chrome 151.0.7922.173.

The pilot produced 25 attempts: 24 valid records in four complete six-method paired blocks and one retained invalid attempt:

- `android-a-bagAmsterdam-pressureBurst-pi-r3-mtibfl5h`: `window-blur|document-hidden`;
- retry `android-a-bagAmsterdam-pressureBurst-pi-r3-mtibt0gy` was valid.

Every repeat has a complete valid six-method paired block: `fixed8`, `fixed16`, `cesiumDynamic`, `reactive`, `pi`, and `proposed`.

Valid-method median results in this Android-A pilot:

- `cesiumDynamic`: violation `0.0`, P95 about `16.7 ms`, queue peak `0`, tiles `7`, transfer bytes `259,482`.
- `fixed16`: violation `0.0`, P95 about `16.7 ms`, queue peak `1`, tiles `9`, transfer bytes `829,762`.
- `fixed8`: violation `0.0`, P95 about `16.7 ms`, queue peak `11`, tiles `30`, transfer bytes `15,454,198`.
- `pi`: violation `0.0`, P95 about `16.7 ms`, queue peak `40`, tiles `118`, transfer bytes `80,094,214`.
- `proposed`: violation `0.0`, P95 about `16.7 ms`, queue peak `34.5`, tiles `98`, transfer bytes `61,261,824`.
- `reactive`: violation `0.0`, P95 about `16.7 ms`, queue peak `38.5`, tiles `111.5`, transfer bytes `71,937,184`.

Proposed repeat-level evidence:

- repeat 1: violation `0.0`, queue peak `34`, tiles `96`, transfer bytes `59,430,530`, load-progress events `166`, pressure-safe holds `19`.
- repeat 2: violation `0.0`, queue peak `34`, tiles `98`, transfer bytes `60,780,990`, load-progress events `172`, pressure-safe holds `20`.
- repeat 3: violation `0.0`, queue peak `35`, tiles `98`, transfer bytes `61,742,658`, load-progress events `185`, pressure-safe holds `22`.
- repeat 4: violation `0.0`, queue peak `37`, tiles `101`, transfer bytes `64,361,750`, load-progress events `179`, pressure-safe holds `19`.

All valid Proposed repeats had `pressureTailOverlapCount=0`, `pressurePreemptiveOpportunityCount=0`, `pressurePreemptiveActionCount=0`, `missedPreemptiveOpportunityCount=0`, and `tailDowngradeUnderPressureCount=0`.

Interpretation: Android-A v2.3.6 D1/S3 pilot execution is valid as pilot evidence: metadata, render target, paired-block completeness, invalid-run retention/retry, and request-pressure exposure all look usable. However, the workload did not create measurable Android tail-frame stress: all valid methods had zero violation rate and P95 about one 60 Hz frame. Do not use this as confirmatory comparative evidence. Before any confirmatory release, decide whether to test D2/S3 under v2.3.6, revise the Android claim boundary, or create a deliberately versioned heavier Android workload.

## Reported Android-A D2/S3 Attempt Was Actually a D1/S3 Rerun

The user reported completing a D2/S3 pilot and `npm.cmd run lod:analyze`. Inspection of raw filenames and `results/analysis/all_runs.csv` showed:

- `android-a + bagRotterdam + pressureBurst + protocolVersion 2.3.6` rows: `0`.
- Android-A v2.3.6 `pressureBurst` full-pilot rows all use `dataset=bagAmsterdam`.
- The new second batch has run IDs with `mtic*` / `mtid*` suffixes and contains 24 additional valid D1/S3 records in four complete six-method paired blocks.

Second D1/S3 batch valid-method medians:

- `cesiumDynamic`: violation `0.0`, P95 about `16.7 ms`, queue peak `0`, tiles `7`, transfer bytes `259,482`.
- `fixed16`: violation `0.0`, P95 about `16.7 ms`, queue peak `1`, tiles `9`, transfer bytes `829,762`.
- `fixed8`: violation `0.0`, P95 about `16.7 ms`, queue peak `11`, tiles `30`, transfer bytes `15,454,198`.
- `pi`: violation `0.0`, P95 about `16.7 ms`, queue peak `41`, tiles `118`, transfer bytes `80,094,814`.
- `proposed`: violation `0.0`, P95 about `16.7 ms`, queue peak `34.5`, tiles `97.5`, transfer bytes `60,737,556`.
- `reactive`: violation `0.0`, P95 about `16.7 ms`, queue peak `39`, tiles `111`, transfer bytes `71,589,564`.

Second-batch Proposed repeats:

- repeat 1: `android-a-bagAmsterdam-pressureBurst-proposed-r1-mticfekf`, queue peak `34`, tiles `94`, transfer bytes `58,779,910`, pressure-safe holds `18`.
- repeat 2: `android-a-bagAmsterdam-pressureBurst-proposed-r2-mtick5a3`, queue peak `34`, tiles `98`, transfer bytes `60,780,090`, pressure-safe holds `20`.
- repeat 3: `android-a-bagAmsterdam-pressureBurst-proposed-r3-mticx6r2`, queue peak `35`, tiles `97`, transfer bytes `60,695,022`, pressure-safe holds `20`.
- repeat 4: `android-a-bagAmsterdam-pressureBurst-proposed-r4-mticzk4z`, queue peak `37`, tiles `101`, transfer bytes `64,441,710`, pressure-safe holds `21`.

All second-batch Proposed repeats again had zero violation rate, no pressure-tail overlap, no preemptive opportunities, no exact `predicted-tail-plus-request-pressure` actions, no missed opportunities, and no tail downgrades under pressure.

Interpretation: this second batch strengthens the audit conclusion that Android-A D1/S3 is low-pressure on this phone, but it is not D2/S3 evidence. Real Android-A D2/S3 was still pending at this point and was later collected with the new D2/S3 button.

## D2/S3 Pilot UI Path Added

To prevent another accidental D1 run, the benchmark UI now has a dedicated `Run D2/S3 pressureBurst pilot` button. Its queue builder, `buildD2S3PilotQueue()`, schedules:

- dataset: `bagRotterdam`;
- scenario: `pressureBurst`;
- methods: all six frozen methods;
- repeats: four by default;
- network profile: `lan`;
- study phase: `pilot`;
- pilot purpose: `full-pilot-v2.3.6-d2-pressure-burst`.

The regression test `D2/S3 pilot queue schedules Rotterdam pressureBurst paired blocks outside confirmation` guards the queue. The Playwright smoke test also checks that the D2/S3 button is visible. Fresh verification passed `npm.cmd test`, `npm.cmd run test:lod:py`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and E2E on isolated port 8095.

## Latest v2.3.6 Android-A D2/S3 PressureBurst Full Pilot

The user reported completing the true `Run D2/S3 pressureBurst pilot` on Android-A and then `npm.cmd run lod:analyze`. Inspection of raw filenames and `results/analysis/all_runs.csv` showed 24 rows with:

- dataset: `bagRotterdam`;
- scenario: `pressureBurst`;
- protocolVersion: `2.3.6`;
- deviceId: `android-a`;
- networkProfile: `lan`;
- studyPhase: `pilot`;
- pilotPurpose: `full-pilot-v2.3.6-d2-pressure-burst`.

The pilot produced 24 valid records in four complete six-method paired blocks and no invalid attempts. Every repeat has a complete valid block: `fixed8`, `fixed16`, `cesiumDynamic`, `reactive`, `pi`, and `proposed`.

Valid-method median results:

- `cesiumDynamic`: violation `0.0`, P95 about `16.7 ms`, queue peak `0`, tiles `4`, transfer bytes `206,642`.
- `fixed16`: violation `0.0`, P95 about `16.7 ms`, queue peak `0`, tiles `4`, transfer bytes `206,642`.
- `fixed8`: violation `0.0`, P95 about `16.7 ms`, queue peak `7`, tiles `14`, transfer bytes `8,159,090`.
- `pi`: violation `0.0`, P95 about `16.7 ms`, queue peak `40`, tiles `105`, transfer bytes `88,506,540`.
- `proposed`: violation `0.0`, P95 about `16.7 ms`, queue peak `40`, tiles `96.5`, transfer bytes `81,873,498`.
- `reactive`: violation `0.0`, P95 about `16.7 ms`, queue peak `39.5`, tiles `104.5`, transfer bytes `88,347,752`.

Proposed repeat-level evidence:

- repeat 1: `android-a-bagRotterdam-pressureBurst-proposed-r1-mtinglfn`, violation `0.0`, P95 `16.70 ms`, queue peak `41`, tiles `95`, transfer bytes `80,495,838`, load-progress events `197`, pressure-safe holds `23`.
- repeat 2: `android-a-bagRotterdam-pressureBurst-proposed-r2-mtinlc5m`, violation `0.0`, P95 `16.735 ms`, queue peak `39`, tiles `90`, transfer bytes `73,057,866`, load-progress events `205`, pressure-safe holds `27`.
- repeat 3: `android-a-bagRotterdam-pressureBurst-proposed-r3-mtinydio`, violation `0.0`, P95 `16.70 ms`, queue peak `40`, tiles `98`, transfer bytes `83,251,158`, load-progress events `196`, pressure-safe holds `24`.
- repeat 4: `android-a-bagRotterdam-pressureBurst-proposed-r4-mtio0qtl`, violation `0.0`, P95 `16.70 ms`, queue peak `40`, tiles `98`, transfer bytes `83,251,458`, load-progress events `176`, pressure-safe holds `27`.

All valid Proposed repeats had `pressureTailOverlapCount=0`, `pressurePreemptiveOpportunityCount=0`, `pressurePreemptiveActionCount=0`, `missedPreemptiveOpportunityCount=0`, and `tailDowngradeUnderPressureCount=0`.

Interpretation: the true D2/S3 pilot is valid Android pilot execution evidence and confirms the new button collected Rotterdam. However, it still does not create measurable Android tail-frame stress: request pressure is present, but tail-frame P95 remains at about one 60 Hz frame and every valid method has zero violation rate. Do not use this as confirmatory comparative evidence. Before any confirmatory release, make an explicit decision about Android claim scope or a deliberately versioned heavier Android workload.

## Latest v2.3.6 PC-A D1/S3 PressureBurst Full Pilot

The user reported completing `Run D1/S3 pressureBurst pilot`, then `npm.cmd run lod:analyze` was run. The full pilot files are correctly marked as:

- dataset: `bagAmsterdam`;
- scenario: `pressureBurst`;
- protocolVersion: `2.3.6`;
- deviceId: `pc-a`;
- networkProfile: `lan`;
- pilotPurpose: `full-pilot-v2.3.6-pressure-burst`.

The run produced 28 attempts: 24 valid records in four complete six-method paired blocks and four retained invalid attempts. Invalid attempts were:

- `pc-a-bagAmsterdam-pressureBurst-fixed8-r1-mtha7kva`: `pre-run-frame-instability`;
- `pc-a-bagAmsterdam-pressureBurst-fixed16-r2-mthag664`: `pre-run-frame-instability`;
- `pc-a-bagAmsterdam-pressureBurst-reactive-r1-mtha2q16`: `window-blur`;
- `pc-a-bagAmsterdam-pressureBurst-reactive-r4-mthaygf7`: `pre-run-frame-instability`.

Every valid record passed the pre-run readiness gate. The four valid paired blocks each contain `fixed8`, `fixed16`, `cesiumDynamic`, `reactive`, `pi`, and `proposed`.

Valid-method median violation rates in this PC-A pilot:

- `cesiumDynamic`: `0.0`
- `fixed16`: `0.0066`
- `proposed`: `0.0066`
- `fixed8`: `0.0992`
- `reactive`: `0.3387`
- `pi`: `0.6784`

Proposed repeat-level evidence:

- repeat 1: violation `0.0`, queue peak `38`, tiles `139`, transfer bytes `95,739,630`, pressure-safe holds `3`, tail-overlap `2`, preemptive actions `1`, missed opportunities `2`, tail downgrades under pressure `2`.
- repeat 2: violation `0.0`, queue peak `34`, tiles `139`, transfer bytes `95,739,630`, pressure-safe holds `5`, tail-overlap `0`, preemptive actions `1`, missed opportunities `0`, tail downgrades under pressure `0`.
- repeat 3: violation `0.0132`, queue peak `35`, tiles `119`, transfer bytes `80,932,294`, pressure-safe holds `9`, tail-overlap `0`, preemptive actions `0`, missed opportunities `0`, tail downgrades under pressure `0`.
- repeat 4: violation `0.1053`, queue peak `35`, tiles `97`, transfer bytes `64,016,718`, pressure-safe holds `3`, tail-overlap `2`, preemptive actions `1`, missed opportunities `0`, tail downgrades under pressure `2`.

Interpretation: the v2.3.6 PC-A full pilot passed the practical workload/repeatability gate. Unlike v2.3.5, every Proposed repeat loaded meaningful content, reached request-pressure peaks, and produced pressure taxonomy rows; exact preemptive request-pressure actions appeared in three of four Proposed repeats. D-025 freezes v2.3.6 for Android-A pilot based on this gate. This is still pilot evidence only. Do not convert it into a formal manuscript result, and do not start confirmatory collection yet.

## Latest v2.3.6 PC-A D1/S3 PressureBurst Pressure Probe

The user reported completing `Run D1/S3 pressureBurst probe` and asked whether a stale dataset dropdown showing `Public 85-tile stress benchmark` affected the run. Inspection of the latest raw JSON files and regenerated `results/analysis/all_runs.csv` showed the fixed probe queue correctly used:

- dataset: `bagAmsterdam`;
- scenario: `pressureBurst`;
- protocolVersion: `2.3.6`;
- deviceId: `pc-a`;
- networkProfile: `lan`;
- pilotPurpose: `request-peak-probe-v2.3.6-pressure-burst`.

Therefore the dataset dropdown did **not** invalidate this fixed-button probe. There are seven latest v2.3.6 PC-A D1/S3 JSON records because the first Reactive attempt was invalid due to `window-blur`; its retry was valid. The effective six-method block is complete.

Valid methods and key results:

- `fixed16`: violation rate `0.0`, queue peak `12`, tiles `30`, load-progress events `20`.
- `fixed8`: violation rate `0.7260`, queue peak `52`, tiles `115`, load-progress events `44`.
- `cesiumDynamic`: violation rate `0.0132`, queue peak `1`, tiles `9`, load-progress events `10`.
- `pi`: violation rate `0.3553`, queue peak `64`, tiles `170`, load-progress events `49`.
- `reactive`: violation rate `0.1067`, queue peak `39`, tiles `170`, load-progress events `71`.
- `proposed`: violation rate `0.0533`, queue peak `38`, tiles `129`, load-progress events `59`, transfer bytes `88,418,782`.

Critical Proposed evidence:

- File: `learnMapmost/results/incoming/pc-a-bagAmsterdam-pressureBurst-proposed-r1-mth97ply.json`
- Valid: `true`
- Readiness passed: two windows, P95 about `16.8 ms`.
- `requestQueuePeak = 38`
- `pressureSafeHoldCount = 3`
- `pressureTailOverlapCount = 3`
- `pressurePreemptiveOpportunityCount = 0`
- `pressurePreemptiveActionCount = 0`
- `tailDowngradeUnderPressureCount = 3`

Interpretation: v2.3.6 `pressureBurst` produced meaningful request-pressure exposure in the Proposed record and did not suffer from the stale publicStress dropdown concern. It did not produce an exact `predicted-tail-plus-request-pressure` action; pressure overlapped already over-budget tail behavior, so the next gate is repeatability in the four-repeat PC-A full pilot. This is pilot workload/mechanism evidence only, not formal paper effect evidence.

## Latest v2.3.5 PC-A Pressure Probe Result

The user reported `v2.3.5 PC-A pressure probe 完成`, then `npm.cmd run lod:analyze` was run.

Latest v2.3.5 PC-A D1/S2 pressure probe files included seven JSON records:

- One first-attempt `reactive` was invalid due to `window-blur`.
- The retry was valid.
- Final six-method effective block is complete and valid.

Valid methods and key results:

- `fixed16`: violation rate `0.0`, queue peak `9`, tiles `30`, bytes `14,438,758`.
- `fixed8`: violation rate `0.7027`, queue peak `45`, tiles `65`, bytes `35,777,750`.
- `cesiumDynamic`: violation rate `0.5733`, queue peak `1`, tiles `8`, bytes `813,058`.
- `pi`: violation rate `0.4`, queue peak `66`, tiles `177`, bytes `127,781,534`.
- `reactive`: violation rate `0.1067`, queue peak `33`, tiles `127`, bytes `98,715,118`.
- `proposed`: violation rate `0.0`, queue peak `36`, tiles `96`, bytes `62,659,162`.

Critical Proposed evidence:

- File: `learnMapmost/results/incoming/pc-a-bagAmsterdam-burst-proposed-r1-mtgyhczu.json`
- Valid: `true`
- Readiness passed: two windows, P95 about `16.9 ms`.
- First telemetry/control row: `elapsedMs = 2012.9 ms`, confirming the v2.3.5 full-window gate.
- `requestPressureWindowCount = 6`
- `pressureSafeHoldCount = 3`
- `pressurePreemptiveOpportunityCount = 3`
- `pressurePreemptiveActionCount = 1`
- `tailDowngradeUnderPressureCount = 2`
- Exact action occurred at about `29380.5 ms`: `DOWNGRADE_PREEMPTIVE / predicted-tail-plus-request-pressure`.

Interpretation: v2.3.5 pressure probe passed as pilot/mechanism evidence. It is **not** a formal paper effect result.

## Latest v2.3.5 PC-A D1/S2 Full Pilot Result

The four-repeat full pilot completed under the frozen v2.3.5 page and seed. It produced 35 attempts: 24 valid runs in four complete six-method paired blocks and 11 retained invalid attempts. The invalid attempts were 10 `pre-run-frame-instability` records and one `window-blur` record; valid retries were kept separately and no invalid JSON was deleted.

All 24 valid records passed the two-window readiness gate, retained the `960 x 540` drawing buffer, emitted `loadProgress` telemetry, and had the first measured telemetry/control row at or after 2,000 ms. Proposed repeats were:

- repeat 1: 53 tiles, 27,808,642 bytes, queue peak 13, no high-pressure taxonomy rows;
- repeat 2: 26 tiles, 11,559,954 bytes, queue peak 13, no high-pressure taxonomy rows;
- repeat 3: 56 tiles, 31,372,926 bytes, queue peak 21, three pressure-safe-hold rows;
- repeat 4: 56 tiles, 31,372,926 bytes, queue peak 21, no high-pressure taxonomy rows.

Interpretation: the v2.3.5 full pilot passed execution and content-stability checks and did not reproduce the earlier low-content collapse. It did not establish repeatable high-pressure taxonomy across Proposed repeats, and no full-pilot Proposed record made an exact preemptive request-pressure action. Therefore it remains pilot audit evidence; do not freeze parameters or start Android/confirmatory collection until the freeze decision is recorded. See `DECISIONS.md` D-021 and the regenerated `results/analysis/all_runs.csv`.

## Latest v2.3.5 Static Visual-Quality Calibration

The first `npm.cmd run lod:capture-quality` attempt failed at `analysis/capture_quality.mjs` during `locator("#cesiumContainer canvas").screenshot(...)`: Playwright waited for the continuously rendered Cesium canvas to become element-stable and timed out. The script now uses the canvas bounding box as a page-level screenshot clip, matching the already-working UI validation pattern, and a regression test covers this behavior.

After the repair:

- `npm.cmd run lod:capture-quality` generated 108 screenshots in `results/quality/captures` (`2 datasets x 9 SSE levels x 6 views`).
- `npm.cmd run lod:quality` generated 108 SSIM rows in `results/quality/quality_ssim.csv`.
- `bagAmsterdam`: 54 rows, minimum SSIM about 0.954, mean about 0.98.
- `bagRotterdam`: 54 rows, minimum SSIM about 0.952, mean about 0.97.

Interpretation: the static SSE-ladder calibration pipeline is complete and operational. This is not formal Proposed-vs-baseline SSIM non-inferiority evidence; confirmatory method-level quality evidence is still absent. See `DECISIONS.md` D-022.

## Latest Freeze/New-Protocol Decision

D-023 records the accepted post-pilot decision: do not freeze v2.3.5 for Android or confirmatory collection. Keep the v2.3.5 pressure probe, full pilot, and static quality calibration as audit evidence only. The next protocol must be explicitly versioned, and any change to camera path, scenario timing, workload intensity, request-pressure threshold, or gate criteria must be documented, tested, and passed through a fresh PC-A pilot before Android or confirmatory collection.

D-024 records the implemented revision: v2.3.6 adds `pressureBurst` as a separate S3 workload for the next PC-A pressure probe and full pilot. `pressureBurst` keeps four 10-second cycles but changes each cycle to a 4-second closer approach and a 6-second stationary near-view hold. It does not change controller thresholds, datasets, baselines, SSE ladder, readiness policy, request-pressure thresholds, frame budget, rolling window, control interval, or statistical plan. Automatic verification passed, the first PC-A pressure probe produced meaningful request-pressure exposure, and the four-repeat PC-A full pilot appears to pass repeatability.

D-025 records the accepted freeze decision: v2.3.6 is frozen for Android-A pilot. The PC-A pilot evidence remains pilot evidence only. Later Android-A evidence exposed a floor effect under S3 and narrowed Android to executability / low-pressure boundary behavior. PC-B remote-server evidence was initially low-pressure, but the server-topology diagnostic and later local-server probe/full pilot show that local-server S3 is viable enough for the desktop route. Confirmatory collection still requires D-031 and a verified formal run queue.

D-026 records the accepted Android-A identifiability-diagnostic decision: keep the completed Android-A D1/S3 and D2/S3 pilots as valid low-pressure pilot evidence, but do not claim Android tail-control efficacy from them. The fixed4 diagnostic uses `fixedDiagnostic` with `fixedSse=4`, writes `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, and `excludeFromFormalAggregation=true`, and is excluded from the formal methods and aggregation.

D-027 records the diagnostic interpretation and claim-boundary decision: v2.3.6/S3 is unsuitable for Android-A efficacy comparison; Android-A remains executability and low-pressure boundary evidence under the current manuscript route; S4 is only a future option if Android efficacy becomes paper-critical.

## Known Bugs / Issues

- No confirmatory evidence exists yet. Do not write positive manuscript result claims.
- Android-A D1/S3 pilot, a later D1/S3 rerun, and the true D2/S3 pilot under frozen v2.3.6 have been collected and analyzed; all passed execution checks but produced zero tail-frame violations across all valid methods.
- The Android fixed4 identifiability diagnostic is complete and supports a floor-effect interpretation for v2.3.6/S3 on Android-A.
- The earlier reported Android-A D2/S3 attempt was another D1/S3 run because the fixed D1/S3 pilot button uses `bagAmsterdam`; the later true D2/S3 run used the new `Run D2/S3 pressureBurst pilot` button and produced `bagRotterdam` records.
- PC-A full pilot under v2.3.5 is complete, but D-023 rejects parameter freeze because only one of four Proposed repeats contained high-pressure taxonomy rows.
- v2.3.6 physical PC-A `pressureBurst` pressure probe and full pilot are complete, and D-025 freezes v2.3.6 for Android-A pilot.
- Static quality calibration is complete, but it must not be promoted to formal method non-inferiority evidence.
- Prior v2.3.4 probe was format-valid but mechanism-invalid: Proposed loaded only eight tiles and downgraded early because control acted on a partially filled frame window.
- Prior v2.3.2 full pilot showed transient method-independent frame-time elevation, motivating readiness gating.
- `analysis_status.json` is not currently produced; the analysis script writes `STATUS.md` and CSV outputs. Treat missing `analysis_status.json` as non-blocking unless code has been intentionally changed to produce it.
- Invalid attempts such as `window-blur`, `document-hidden`, and `pre-run-frame-instability` can appear; they should remain in the audit trail.
- PC-B is registered and its run-day power/network/GPU/drawing-buffer provenance is recorded. Its accidental D1/S3 full pilot is valid pilot evidence but low-pressure across all methods; its later D1/S3 pressure-probe rerun is complete but misregistered as `deviceId=unregistered`.
- Helsinki dataset is not ready.
- Taipei 101 and Dayanta are not publication-ready formal datasets due to rights/provenance.

## Remaining Tasks In Priority Order

1. Prepare D-031: freeze the desktop confirmatory route, method order, repeats, seeds, browser/device conditions, local-server requirement, and analysis inputs.
2. Update and verify the formal run entry point before using `Run main batch`; the current historical main queue still targets `steady` / `burst`, not S3 `pressureBurst`.
3. Do not run Android-A S3 confirmatory efficacy blocks. Android-A v2.3.6/S3 is low-pressure boundary evidence only.
4. If Android or cross-device efficacy becomes paper-critical, create a new protocol version with a platform-independent S4 sustained high-pressure workload and admission criterion before running Proposed.
5. Do not pool pilot or diagnostic runs with confirmatory statistics.
6. Continue updating `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md`, `DECISIONS.md`, `RUNBOOK.md`, and this `HANDOFF.md`.
7. Run `npm.cmd run lod:backup` after meaningful conversation progress to preserve the natural-language transcript.

## Avoid Changing

- Do not change the SSE ladder `[4, 6, 8, 12, 16, 24, 32, 48, 64]`.
- Do not change the frame budget `33.33 ms`, `windowMs=2000`, `controlIntervalMs=500`, or prediction horizon `1000 ms`.
- Do not change request-pressure thresholds or impulse latch unless creating a new protocol version.
- Do not silently change historical S2 `burst`; v2.3.6 adds S3 `pressureBurst` as a separate workload so old records remain interpretable.
- Do not use Cesium private `_statistics`.
- Do not delete or overwrite invalid JSON runs.
- Do not reclassify pilot/tuning/legacy runs as confirmatory.
- Do not treat `fixedDiagnostic` as a formal seventh method or include it in pilot/confirmatory aggregation.
- Do not include `taipei101` or `dayanta` in formal results.
- Do not claim SCI-ready results before confirmatory statistics and visual quality calibration are complete.
- Do not depend on Git commands in the current `Apps` directory; it is not a Git repository.

## Useful Commands

From `D:\myCesium202510\Cesium-1.134\Apps`:

```powershell
npm.cmd run lod:serve
npm.cmd run lod:analyze
npm.cmd run lod:verify-data
npm.cmd test
npm.cmd run test:lod:py
npm.cmd run lod:validate-ui
npm.cmd run lod:backup
```

If the benchmark page is unavailable, restart the server:

```powershell
node learnMapmost/benchmark-server.mjs --port=8088
```

Health check:

```powershell
(Invoke-RestMethod -Uri "http://127.0.0.1:8088/api/health").protocol
```

## Best Next Prompt

```
Continue the Web 3D Tiles tail-frame LOD benchmark from learnMapmost/HANDOFF.md. The current protocol is v2.3.6. D-025 freezes v2.3.6 for Android-A pilot after the PC-A D1/S3 `pressureBurst` pressure probe and four-repeat full pilot passed the practical workload/repeatability gate. Android-A pilot setup conditions were recorded on 2026-09-01. Android-A D1/S3, its accidental D1/S3 rerun, true D2/S3, and fixed-SSE-4 diagnostic have been collected and analyzed; they support executability / low-pressure boundary behavior only, not Android S3 efficacy. D-027 already narrowed Android-A claims; do not run Android-A S3 confirmatory efficacy blocks.
D-028 diagnosed remote LAN server delivery as a material PC-B S3 confounder. D-029 accepted the PC-B local-server D1/S3 six-method pressure probe. D-030 accepts the completed PC-B local-server D1/S3 four-repeat full pilot as passing the desktop S3 route/repeatability gate, while keeping all pilot data non-confirmatory. Next prepare D-031: freeze the desktop confirmatory matrix, method order, repeats, seeds, browser/device conditions, local-server requirement, and analysis inputs; update and verify the formal run queue before using `Run main batch`, because the current historical main queue still targets `steady` / `burst` rather than S3 `pressureBurst`.
```
