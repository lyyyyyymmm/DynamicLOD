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
9. The Android identifiability diagnostic is complete. D1/S3 and D2/S3 fixed4 both reached request/content pressure but zero over-budget frames, so D-027 classifies S3 as unsuitable for Android-A efficacy comparison.
10. For the current v2.3.6 manuscript route, use Android-A only for cross-device executability, telemetry validity, and low-pressure boundary behavior. Do not run Android-A S3 confirmatory efficacy blocks and do not include fixed4 in six-method aggregation.
11. If Android efficacy becomes paper-critical, release a new protocol version with a platform-independent S4 sustained high-pressure traversal. Do not define S4 as "whatever makes Android drop frames"; define an admission criterion before running Proposed.
12. The PC-B server-topology fixed4 diagnostic is complete. The local-server condition produced stronger tail pressure and much burstier resource/tile arrivals than the remote LAN server condition, so treat remote LAN delivery as a material PC-B S3 confounder.
13. The PC-B local-server D1/S3 six-method pressure probe is complete and valid. It supports continuing the local-server desktop pilot route but not confirmatory collection by itself.
14. The PC-B local-server D1/S3 four-repeat full pilot is complete and valid. D-030 accepts it as passing the desktop S3 route/repeatability gate.
15. D-031 is now the approved desktop confirmatory release. The historical `Run main batch` button is disabled and marked legacy/do-not-use because it represents the older S1/S2 audit matrix. Use only `Run frozen desktop S3 confirmatory` for formal desktop collection.

Desktop Android emulation is UI validation only. It is never Android experimental evidence.

## 5. Confirmatory Collection

For the current v2.3.6 efficacy route, use exactly the frozen D-031 desktop scope:

- devices: `pc-a` and `pc-b`;
- server topology: local benchmark server on the same desktop under test;
- allowed origins: `http://localhost:8088/...` or `http://127.0.0.1:8088/...`;
- dataset/scenario matrix per device: D1 `bagAmsterdam + pressureBurst` x12 paired repeats and D2 `bagRotterdam + pressureBurst` x8 paired repeats;
- methods: `fixed8`, `fixed16`, `cesiumDynamic`, `reactive`, `pi`, `proposed`;
- seed: `20260823`;
- network profile: `lan`;
- study phase: `confirmatory`.

This is 120 runs per desktop and 240 planned desktop confirmatory runs. PC-B is registered as the second desktop candidate, and its 2026-09-02 run-day provenance records plugged-in power, Wi-Fi SSID `TP318`, Chrome GPU hardware acceleration / active Arc 140V evidence, and actual `960 x 540` drawing buffer. Android-A S3 evidence is retained only for executability and low-pressure boundary behavior unless a later S4 protocol is released.

PC-B has already produced a valid accidental D1/S3 full pilot: 24 valid `pc-b +
bagAmsterdam + pressureBurst` records in four complete six-method blocks. The result
shows meaningful request/content pressure but zero tail-frame violations across all
methods, so do not proceed directly to confirmatory collection. The later six-method
D1/S3 pressure-probe rerun is complete and valid but has `deviceId=unregistered` in the
raw manifests; keep it as audit evidence only and treat the manifest as the source of
truth over the filename.

The later PC-B local-server pressure probe and four-repeat full pilot are complete.
D-030 accepts the local-server full pilot as passing the desktop S3 route gate, and
D-031 releases the formal desktop S3 confirmatory entry point. Before collecting on
each desktop, verify the page is local (`localhost` or `127.0.0.1`), the displayed
buffer is `960 x 540`, the device ID is exactly `pc-a` or `pc-b`, Chrome hardware
acceleration is on, and the device is in its recorded power/network condition. The
formal button fails closed for wrong device IDs, remote origins, wrong protocol,
wrong queue, wrong dataset/scenario/method/network profile, and diagnostic or
legacy records. The earlier diagnostic-only
remote/local fixed4 A/B records have
`diagnosticPurpose=server-topology-identifiability` and
`excludeFromFormalAggregation=true`; `fixedDiagnostic` is not a seventh method and
is not part of pilot or confirmatory aggregation.

- Historical legacy main queue: 216 main attempts before automatic replacements: D1/S1 48, D1/S2 72, D2/S1 48, D2/S2 48. It remains in code only as audit trail and is not a current collection entry.
- Frozen D-031 ablation queue: 32 D1/S3 `confirmatory-ablation` attempts on PC-A using `noPrediction`, `noRequest`, `noInteraction`, and `noStability`; analyze separately from main efficacy.

All formal efficacy conditions use `networkProfile=lan`. Method order is shuffled inside each paired block. Keep the browser foregrounded and do not resize or rotate. Invalid attempts stay in the audit trail and are retried at most twice. If a future Android S4 protocol is released, use landscape orientation, close background apps, record thermal state, and cool the device between long blocks.

## 6. Quality Calibration

With the server running:

```powershell
npm run lod:capture-quality
npm run lod:quality
```

The existing static SSE-ladder output is six-view SSIM against SSE 4. The capture path uses a page-level canvas clip so the continuously rendered Cesium canvas does not block on Playwright element stability. D-031 also freezes the method-level quality evidence rule: sample predeclared canonical views/timestamps from D1/D2 confirmatory blocks where feasible, use same-view SSE 4 as the reference, apply the 0.02 SSIM non-inferiority margin, retain time-weighted SSE and visible geometric-error summaries, and do not choose screenshots after seeing outcomes. Until that method-level capture is fully implemented and analyzed, the visual non-inferiority claim remains unmeasured. LPIPS is supplementary:

```powershell
python -m pip install -r learnMapmost/analysis/requirements-lpips.txt
npm run lod:quality:lpips
```

Record the Python environment and model version if LPIPS is reported. The v2.3.5 required SSIM calibration has already produced 108 comparison rows; v2.3.6 does not require rerunning it unless the capture code, dataset, view definitions, or SSE ladder changes.

## 7. Analyze and Gate

```powershell
npm run lod:analyze
```

The script accepts incomplete data but does not manufacture complete blocks. It writes `results/analysis/STATUS.md`, not `analysis_status.json`. For D-031 formal efficacy, aggregation is restricted to valid rows with `confirmatoryRelease=D-031`, `studyPhase=confirmatory`, `deviceId` in `pc-a/pc-b`, D1/D2, S3 `pressureBurst`, six formal methods, `networkProfile=lan`, `serverTopology=local`, and local `pageOrigin/pageHost`. Pilot, diagnostic, Android, remote-server, legacy S1/S2, ablation, and smoke/audit records are excluded from main formal inference. Inspect device-stratified descriptive tables, Friedman output, Wilcoxon-Holm comparisons, effect sizes, confidence intervals, PI selection, and forecast diagnostics before updating either manuscript.

No positive result sentence is permitted until its row in `paper/claim_registry.md` has sufficient evidence. If the minimum D1/S2 gate fails, report the failure and revise the research claim only in a new protocol, never by silently retuning the confirmatory run.
