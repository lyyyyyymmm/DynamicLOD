# HANDOFF: Web 3D Tiles Tail Frame-Time LOD Benchmark

Paste this file into a new Codex conversation and ask it to continue from here.

## Overall Goal

Develop an application-oriented graphics/WebGIS paper around:

- Chinese title: **面向尾部帧时约束的 Web 3D Tiles 预测式动态 LOD 调度方法**
- English title: **Predictive Dynamic LOD Scheduling for Web 3D Tiles under Tail Frame-Time Constraints**

Core research question: whether a lightweight online scheduler can combine short-term tail-frame prediction, public Cesium 3D Tiles request feedback, interaction state, and stability control to reduce `P95 > 33.33 ms` violation rate while retaining visual quality on PC and Android.

The current protocol is **v2.3.6**. Current status: **v2.3.6 `pressureBurst` is implemented and automatically verified, but no physical v2.3.6 PC-A evidence exists yet.** Do not start Android or confirmatory collection yet.

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

Latest important raw result:

- `learnMapmost/results/incoming/pc-a-bagAmsterdam-burst-proposed-r1-mtgyhczu.json`

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

- `npm.cmd test` -> 82 tests passed.
- `npm.cmd run test:lod:py` -> 17 Python tests passed.
- `npm.cmd run lod:analyze` -> completed after the v2.3.6 implementation; latest `STATUS.md` regenerated.
- `npm.cmd run lod:verify-data` -> `bagAmsterdam: READY`, `bagRotterdam: READY`.
- `npm.cmd run lod:validate-ui` -> desktop and Android-landscape validation passed, both with `960 x 540` drawing buffer and nonblank render.
- `npm.cmd run test:lod:e2e -- --reporter=line` on isolated port 8094 in the approved PowerShell environment -> 2 Playwright tests passed.
- `/api/health` from any already-running stale server may still report an older protocol until that server is restarted; current source manifests and E2E smoke records use protocol `2.3.6`.
- `npm.cmd run lod:capture-quality` -> generated 108 canonical quality screenshots after repairing the dynamic-canvas screenshot path.
- `npm.cmd run lod:quality` -> generated 108 SSIM rows in `results/quality/quality_ssim.csv`.

Latest analysis status after v2.3.5 PC-A full pilot:

- Result files: 303
- Valid runs, all phases: 259
- Valid confirmatory runs: 0
- Valid pilot runs: 174
- Valid tuning runs: 0
- Invalid runs: 44
- Complete six-method paired blocks: 0

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

D-024 records the implemented revision: v2.3.6 adds `pressureBurst` as a separate S3 workload for the next PC-A pressure probe and full pilot. `pressureBurst` keeps four 10-second cycles but changes each cycle to a 4-second closer approach and a 6-second stationary near-view hold. It does not change controller thresholds, datasets, baselines, SSE ladder, readiness policy, request-pressure thresholds, frame budget, rolling window, control interval, or statistical plan. Automatic verification passed, but physical PC-A v2.3.6 evidence has not been collected yet.

## Known Bugs / Issues

- No confirmatory evidence exists yet. Do not write positive manuscript result claims.
- Android pilot has not started under v2.3.6.
- PC-A full pilot under v2.3.5 is complete, but D-023 rejects parameter freeze because only one of four Proposed repeats contained high-pressure taxonomy rows.
- v2.3.6 physical PC-A `pressureBurst` probe and full pilot have not been run yet.
- Static quality calibration is complete, but it must not be promoted to formal method non-inferiority evidence.
- Prior v2.3.4 probe was format-valid but mechanism-invalid: Proposed loaded only eight tiles and downgraded early because control acted on a partially filled frame window.
- Prior v2.3.2 full pilot showed transient method-independent frame-time elevation, motivating readiness gating.
- `analysis_status.json` is not currently produced; the analysis script writes `STATUS.md` and CSV outputs. Treat missing `analysis_status.json` as non-blocking unless code has been intentionally changed to produce it.
- Invalid attempts such as `window-blur`, `document-hidden`, and `pre-run-frame-instability` can appear; they should remain in the audit trail.
- PC-B is not registered.
- Helsinki dataset is not ready.
- Taipei 101 and Dayanta are not publication-ready formal datasets due to rights/provenance.

## Remaining Tasks In Priority Order

1. Restart the local benchmark server if necessary and confirm the current source reports protocol `2.3.6`.
2. Run a fresh PC-A D1/S3 `pressureBurst` pressure probe under protocol v2.3.6.
3. Analyze the probe with `npm.cmd run lod:analyze`; inspect readiness, first measured row at or after 2,000 ms, content growth, request peak/AUC, `loadProgressEventCount`, and pressure taxonomy for Proposed.
4. If the pressure probe exposes meaningful request-pressure evidence, run the four-repeat PC-A `pressureBurst` full pilot.
5. Keep Android-A blocked until the v2.3.6 PC-A pilot passes and physical device conditions are reconfirmed: battery/power state, landscape orientation, 5 GHz Wi-Fi, Chrome version, thermal state, and `960 x 540` buffer.
6. Register PC-B or revise formal device scope if PC-B is not available.
7. Only after a separate pilot-freeze decision, start confirmatory collection. Do not pool pilot runs with confirmatory statistics.
8. Continue updating `PROJECT_STATE.md`, `TODO.md`, `CHANGELOG.md`, `DECISIONS.md`, `RUNBOOK.md`, and this `HANDOFF.md`.
9. Run `npm.cmd run lod:backup` after meaningful conversation progress to preserve the natural-language transcript.

## Avoid Changing

- Do not change the SSE ladder `[4, 6, 8, 12, 16, 24, 32, 48, 64]`.
- Do not change the frame budget `33.33 ms`, `windowMs=2000`, `controlIntervalMs=500`, or prediction horizon `1000 ms`.
- Do not change request-pressure thresholds or impulse latch unless creating a new protocol version.
- Do not silently change historical S2 `burst`; v2.3.6 adds S3 `pressureBurst` as a separate workload so old records remain interpretable.
- Do not use Cesium private `_statistics`.
- Do not delete or overwrite invalid JSON runs.
- Do not reclassify pilot/tuning/legacy runs as confirmatory.
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
Continue the Web 3D Tiles tail-frame LOD benchmark from learnMapmost/HANDOFF.md. The current protocol is v2.3.6. The v2.3.6 `pressureBurst` S3 workload has been implemented and automatically verified, but no physical v2.3.6 PC-A probe or full pilot has been collected yet. Next, restart/confirm the benchmark server protocol, run the PC-A D1/S3 `pressureBurst` pressure probe, analyze it, and only then decide whether to run the four-repeat PC-A full pilot. Do not start Android or confirmatory collection, and do not silently change thresholds, datasets, controller parameters, or historical S2 records.
```
