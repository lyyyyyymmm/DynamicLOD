# LOD Benchmark Runbook

## 1. Prepare and Verify

From `Cesium-1.134/Apps`:

```powershell
npm run lod:generate
npm run lod:verify-data
npm test
npm run test:lod:py
npm run lod:serve
```

Desktop URL: `http://localhost:8088/Apps/learnMapmost/lod-benchmark.html`

The server prints LAN URLs for physical Android access. Before any formal session, record a stable physical `deviceId`, OS, CPU/SoC, GPU, RAM, display refresh rate, Chrome version, power state, and connection type.

## 2. Device Readiness Test

1. Open the page normally; `?smoke=1` is reserved for automated desktop UI checks and
   does not exercise the physical-device loading gate.
2. Select `publicStress`, `burst`, `lan`, and `proposed`, then run one full condition.
3. Confirm the `960 x 540` target within the displayed one-pixel tolerance, status `Complete`, result `Valid`, and a JSON checkpoint under `results/incoming`.
4. Run `npm run test:lod:e2e` on the desktop before a collection day.

## 3. Freeze the PI Baseline

On the designated tuning PC, choose `Run PI calibration`. This executes 64 C1/S2 pilot runs over the frozen `4 x 4` gain grid with four repeats and diagnostic `delay40` routing. Then run:

```powershell
npm run lod:analyze
```

`lod:analyze` uses `learnMapmost/python-runner.mjs`, which prefers bundled Codex Python and falls back to system `python`; set `LOD_PYTHON` only if an explicit interpreter is needed. Read `results/analysis/pi_parameter_selection.csv`. PC-A calibration on 2026-08-25 selected `Kp=0.40` and `Ki=0.05` from 64 unique valid tuning runs. These values are now frozen in `PI_BASELINE_POLICY`; do not reuse tuning runs as confirmatory observations.

## 4. Desktop-Only Readiness Work

While a physical Android phone is unavailable, complete only these tasks:

1. Capture all quality views and calculate SSIM.
2. Confirm `/api/health` reports protocol v2.3.5, set the physical device ID, keep the seed at `20260823`, then select `Run D1/S2 pressure probe`.
   It runs one shuffled six-method D1/S2 block (six planned runs) through the LAN route and records control-interval request peaks.
3. Each v2.3.5 condition first unloads the previous tileset and waits for blank-scene readiness: two consecutive 2-second windows with P95 <= 25 ms, within 60 seconds.
   A timeout keeps the JSON as invalid with `pre-run-frame-instability` and triggers retry. Do not manually delete these records.
4. Run `npm run lod:analyze`, then inspect the six probe JSON files for readiness (`preRunReadinessReady=true`, readiness P95 <= 25 ms), first measured control row at or after 2,000 ms, nonzero `requestQueuePeak`, `loadProgressEventCount`, and the proposed controller's request-pressure taxonomy fields.
   Require meaningful content growth and observable request-pressure evidence. The v2.3.4 analysis gate distinguishes exact preemptive actions from safe pressure holds, pressure-tail overlap, and missed preemptive opportunities.
   The two v2.3.3 PC-A probes passed readiness and workload gates but showed that requiring only the exact `predicted-tail-plus-request-pressure` action is too timing-dependent: one run reached pressure after tail violation, while the second reached pressure while tail risk was still low.
5. The v2.3.2 mechanism gate and Proposed repeat-stability gate passed on PC-A, but the full pilot exposed a transient cross-run frame-time slowdown in the second randomized block.
   Pause Android and confirmatory collection until the v2.3.5 PC-A pressure probe and full pilot pass. All existing checkpoints remain pilot audit evidence and are excluded from formal statistics.
6. Check request peak/AUC, controller actions, SSE occupancy, forecast MAE versus persistence, switches, reversals, recovery time, and invalid-run rate.
7. Run a four-repeat ablation pilot only if the components produce distinguishable actions.
8. Freeze all controller, camera, and analysis parameters before confirmatory collection.

Desktop Android emulation is UI validation only. It is never Android experimental evidence.

## 5. Confirmatory Collection

Use at least two distinct PCs and one physical Android phone. Every device runs:

- 216 main attempts before automatic replacements: D1/S1 48, D1/S2 72, D2/S1 48, D2/S2 48.
- 32 additional D1/S2 ablation attempts.

All formal conditions use `networkProfile=lan`. Method order is shuffled inside each paired block. Keep the browser foregrounded and do not resize or rotate. Invalid attempts stay in the audit trail and are retried at most twice. On Android, use landscape orientation, close background apps, record thermal state, and cool the device between long blocks.

## 6. Quality Calibration

With the server running:

```powershell
npm run lod:capture-quality
npm run lod:quality
```

The mandatory output is six-view SSIM against SSE 4. LPIPS is supplementary:

```powershell
python -m pip install -r learnMapmost/analysis/requirements-lpips.txt
npm run lod:quality:lpips
```

Record the Python environment and model version if LPIPS is reported.

## 7. Analyze and Gate

```powershell
npm run lod:analyze
```

The script accepts incomplete data but does not manufacture complete blocks. Inspect `analysis_status.json`, device-stratified descriptive tables, Friedman output, Wilcoxon-Holm comparisons, effect sizes, confidence intervals, PI selection, and forecast diagnostics before updating either manuscript.

No positive result sentence is permitted until its row in `paper/claim_registry.md` has sufficient evidence. If the minimum D1/S2 gate fails, report the failure and revise the research claim only in a new protocol, never by silently retuning the confirmatory run.
