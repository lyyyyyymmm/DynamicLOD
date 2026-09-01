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

1. Capture all quality views and calculate SSIM. This is complete for v2.3.5 and does not need rerunning for v2.3.6 unless the capture code, dataset, view definitions, or SSE ladder changes.
2. Confirm `/api/health` reports protocol v2.3.6, set the physical device ID, keep the seed at `20260823`, and select `pressureBurst` for the next PC-A pressure-workload probe.
3. The v2.3.5 PC-A pressure probe and four-block D1/S2 full pilot are complete audit evidence only. The pilot produced 24 valid paired records plus retained invalid attempts, but high-pressure taxonomy was sparse across Proposed repeats.
4. Each v2.3.6 condition first unloads the previous tileset and waits for blank-scene readiness: two consecutive 2-second windows with P95 <= 25 ms, within 60 seconds.
   A timeout keeps the JSON as invalid with `pre-run-frame-instability` and triggers retry. Do not manually delete these records.
5. The v2.3.6 PC-A `pressureBurst` pressure probe is complete and used `bagAmsterdam`, not `publicStress`, despite any stale dataset dropdown state. The four-repeat PC-A full pilot is also complete: 24 valid records in four complete paired blocks plus four retained invalid attempts. Proposed produced repeatable request-pressure evidence across all four repeats.
   Require meaningful content growth and observable request-pressure evidence. The v2.3.4 analysis gate distinguishes exact preemptive actions from safe pressure holds, pressure-tail overlap, and missed preemptive opportunities.
   The two v2.3.3 PC-A probes passed readiness and workload gates but showed that requiring only the exact `predicted-tail-plus-request-pressure` action is too timing-dependent: one run reached pressure after tail violation, while the second reached pressure while tail risk was still low.
6. The v2.3.2 mechanism gate and Proposed repeat-stability gate passed on PC-A, but the earlier full pilot exposed a transient cross-run frame-time slowdown in the second randomized block. The v2.3.5 readiness gate prevented that pre-run instability from entering valid runs, although 11 invalid attempts remain in the audit trail.
   D-025 freezes v2.3.6 for Android-A pilot only. Android-A pilot setup conditions were recorded on 2026-09-01: landscape orientation, 50% battery while charging, cooled / thermally stabilized state with exact temperature `[待填]`, 5 GHz Wi-Fi, Chrome 151.0.7922.173, hardware acceleration enabled, and `960 x 540` drawing-buffer target. The Android-A D1/S3 pilot, a later D1/S3 rerun, and the true D2/S3 pilot have been collected and analyzed: execution and request-pressure exposure passed, but all valid methods had zero tail-frame violations. A reported earlier D2/S3 run was not D2 because the fixed `Run D1/S3 pressureBurst pilot` button uses `bagAmsterdam`; the later true D2/S3 pilot used the new `Run D2/S3 pressureBurst pilot` button and `bagRotterdam`. Confirmatory collection remains blocked; all existing checkpoints remain pilot audit evidence and are excluded from formal statistics.
7. Check request peak/AUC, controller actions, SSE occupancy, forecast MAE versus persistence, switches, reversals, recovery time, and invalid-run rate.
8. Run a four-repeat ablation pilot only if the components produce distinguishable actions.
9. Decide the Android low-tail-pressure handling before confirmatory collection: either narrow Android claims, release a deliberately versioned heavier Android workload, or explicitly treat Android as execution/generalization evidence rather than tail-pressure effect evidence.
10. Freeze all controller, camera, and analysis parameters before confirmatory collection.

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

The mandatory output is six-view SSIM against SSE 4. The capture path uses a page-level canvas clip so the continuously rendered Cesium canvas does not block on Playwright element stability. LPIPS is supplementary:

```powershell
python -m pip install -r learnMapmost/analysis/requirements-lpips.txt
npm run lod:quality:lpips
```

Record the Python environment and model version if LPIPS is reported. The v2.3.5 required SSIM calibration has already produced 108 comparison rows; v2.3.6 does not require rerunning it unless the capture code, dataset, view definitions, or SSE ladder changes.

## 7. Analyze and Gate

```powershell
npm run lod:analyze
```

The script accepts incomplete data but does not manufacture complete blocks. Inspect `analysis_status.json`, device-stratified descriptive tables, Friedman output, Wilcoxon-Holm comparisons, effect sizes, confidence intervals, PI selection, and forecast diagnostics before updating either manuscript.

No positive result sentence is permitted until its row in `paper/claim_registry.md` has sufficient evidence. If the minimum D1/S2 gate fails, report the failure and revise the research claim only in a new protocol, never by silently retuning the confirmatory run.
