# Project State

Last updated: 2026-08-31  
Status: v2.3.5 full-window control gate implemented and automatically verified; physical PC-A probe pending

## Research Goal

- Chinese title: **面向尾部帧时约束的 Web 3D Tiles 预测式动态 LOD 调度方法**
- English title: **Predictive Dynamic LOD Scheduling for Web 3D Tiles under Tail Frame-Time Constraints**
- Question: can a lightweight online controller combine tail frame-time forecasting, public request feedback, interaction state, and stability control to reduce `P95 > 33.33 ms` violation rate while retaining visual quality on PC and Android?

The formal claim is deliberately narrow. This work does not claim to be the first dynamic LOD method, a culture-heritage-specific method, or a general heterogeneous-device solution.

## Current Evidence

| Item | Status | Evidence / boundary |
| --- | --- | --- |
| Web benchmark implementation | Ready | `LodController`, Cesium public `loadProgress` / `tileLoad` / `tileVisible` telemetry, CSV/JSON export, LAN server, and browser validation are in the project. |
| Methods | Ready | Fixed SSE 8, fixed SSE 16, Cesium dynamic SSE, reactive P95, PI, and proposed predictive controller. |
| Public datasets | Ready for pilot | D1 `bagAmsterdam` and D2 `bagRotterdam` use frozen 3DBAG subsets. C1 `publicStress` is diagnostic only. |
| Restricted datasets | Not for formal claim | `taipei101` and `dayanta` remain excluded until provenance and publication permission are resolved. |
| PC-A PI calibration | Frozen | `Kp=0.40`, `Ki=0.05`; see [PI_FREEZE.md](results/analysis/PI_FREEZE.md). |
| Device provenance | Recorded | PC-A and Android-A are documented in [device_registry.md](results/device_registry.md). PC-B is still unregistered. |
| Protocol v2.0 pilot | Audit evidence only | 25 raw PC-A records: 24 valid pilot records plus one invalid proposed run (`window-blur`) followed by a valid retry. It is not confirmatory evidence. |
| v2.1.0 PC-A pressure probe | Integration evidence invalid for controller mechanism | Seven records: six valid methods plus one invalid `window-blur` reactive attempt. Interval peaks existed, but the browser call omitted the peak field when invoking the controller. |
| v2.1.1 integration fix | Passed | `controller.update()` receives `tileStats.requestQueue`, the interval peak; the six-run probe confirmed the field reaches the controller. |
| v2.1.1 mechanism gate | Failed | All six records are valid and Proposed captured peak 44, but `requestPressureHigh` stayed false and no pressure-prediction action occurred. |
| v2.2.0 camera revision | Probe failed | Six valid records changed the request distribution, but nonzero queue activity still lasted at most about 1 second. |
| v2.2.1 workload refinement | Implemented and unit-tested | Recovery now continues a low-speed transition toward the next direction, preserving four 6-second sweeps, four 4-second recoveries, and 40 seconds total. |
| v2.2.1 PC-A probes | Workload failed | Both the original and controlled rerun remained at the 7 external tileset roots. The controlled rerun produced six valid records plus invalid `document-hidden` and `window-blur` attempts; every method transferred about 0.25 MB and Proposed had `requestQueuePeak=0`. |
| v2.2.2 camera revision | Implemented and unit-tested | Each interaction now approaches monotonically from range 3.6 to 0.9, followed by a stationary 4-second near-view recovery so refinement requests can complete instead of being cancelled by continuous camera motion. |
| v2.2.2 PC-A probe | Workload gate passed; preemptive-action gate failed | Six valid methods plus one invalid `window-blur` Reactive attempt. Proposed loaded 125 tiles (about 80.9 MB), reached queue peak 36, and recorded four high-pressure windows, but no `predicted-tail-plus-request-pressure` action. |
| v2.3.0 forecast correction | Implemented and verified | Forecast is lower-bounded by current P95 so EWMA lag cannot report a next-second forecast below an already observed rising tail. Full unit tests passed, desktop/android-landscape UI validation rendered at `960 x 540`, Playwright e2e passed, and `/api/health` reports protocol `2.3.0`. Workload, thresholds, pressure persistence, and baselines are unchanged. |
| v2.3.0 PC-A pressure probe | Workload gate passed; pressure-impulse gate failed | Six valid methods. Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, and had zero violation rate, but `requestPressureHigh` remained false in every row and no `predicted-tail-plus-request-pressure` action occurred. Large request pulses released before the 1.5-second persistence gate. |
| v2.3.1 pressure-impulse correction | Implemented and verified | A single control-interval queue pulse of at least 24 is now treated as high request pressure. This preserves the 1.5-second persistence rule, zero-release rule, frame thresholds, camera path, SSE actions, and baselines; preemptive downgrade still requires forecast P95 above `0.9T`. Full unit tests passed, desktop/android-landscape UI validation rendered at `960 x 540`, Playwright e2e passed, and `/api/health` reports protocol `2.3.1`. |
| v2.3.1 PC-A pressure probe | Mechanism gate passed | Six valid methods. Proposed loaded 96 tiles, transferred 62,659,162 bytes, reached `requestQueuePeak=36`, recorded three `requestPressureHigh=true` rows, and triggered one `DOWNGRADE_PREEMPTIVE` with reason `predicted-tail-plus-request-pressure` at 29.46 s. |
| v2.3.1 PC-A full pilot | Pilot freeze failed | Twenty-four valid full-pilot records were collected. Proposed repeats 1-3 loaded only seven external roots, transferred about 0.25 MB, kept `requestQueuePeak=0`, and were repeatedly driven to `SSE=64` by early tail-frame violations. Repeat 4 behaved like a real pressure run (`requestQueuePeak=36`, 96 tiles, about 59.7 MB). This inconsistency blocks Android and confirmatory collection. |
| v2.3.2 protocol-isolation fix | Implemented and verified | The 10-second warmup now holds fixed `SSE=16` without feeding the controller or rolling P95. At measurement start, the controller and frame-time window are reset, and the first control sample waits until the 500 ms control interval. Tail violations at the coarsest SSE are recorded as boundary holds rather than repeated downgrade actions. `npm.cmd test`, `npm.cmd run test:lod:py`, `npm.cmd run lod:analyze`, and `/api/health` passed; health reports protocol `2.3.2`, render `960 x 540`, window `2000 ms`, and control interval `500 ms`. |
| v2.3.2 PC-A pressure probe | Mechanism gate passed | Six valid methods. Proposed loaded 80 tiles, transferred about 46.2 MB, reached `requestQueuePeak=29`, recorded one `requestPressureHigh=true` row, and triggered one `DOWNGRADE_PREEMPTIVE` with reason `predicted-tail-plus-request-pressure` at 39.5 s. The first 6 seconds remained at `SSE=16` without early tail downgrades, so the v2.3.1 warmup/early-measurement contamination pattern was not reproduced. |
| v2.3.2 PC-A full pilot | Controller stability passed; run-environment stability failed | The 24 planned conditions completed, with one invalid Proposed `window-blur` attempt retained and a valid retry. All four valid Proposed repeats loaded 80-86 tiles, transferred about 46.2-51.1 MB, reached `requestQueuePeak=29-35`, and avoided the v2.3.1 seven-root/SSE64 collapse. Three repeats triggered `predicted-tail-plus-request-pressure`; repeat 2 correctly held because its forecast P95 was only 24.28 ms. However, repeat-2 PI, fixed16, and Cesium dynamic runs showed a consecutive system-level frame-time elevation without corresponding request pressure, followed by recovery in repeat 3. This exposes an uncontrolled pre-run device/browser state and prevents protocol freeze. |
| v2.3.3 pre-run readiness gate | Implemented and automatically verified; physical probe pending | Before each run, the benchmark unloads the prior tileset and samples a blank scene in 2-second windows until two consecutive windows have P95 <= 25 ms, or 60 seconds elapse. Timeout records `pre-run-frame-instability`, retains the attempt as invalid audit evidence, and triggers the existing retry policy. The readiness result and summary fields are saved in JSON/CSV. Headless smoke tests use a relaxed smoke-only policy because software-rendered Chromium cannot satisfy physical 60 Hz frame thresholds. Fresh checks on 2026-08-28 passed `npm.cmd test`, `npm.cmd run test:lod:py`, `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run test:lod:e2e -- --reporter=line` in the approved PowerShell environment, `npm.cmd run lod:validate-ui`, and `/api/health` with protocol `2.3.3`. |
| v2.3.3 PC-A pressure probe 1 | Readiness and workload gates passed; preemptive-action gate failed | Six valid D1/S2 pilot records were collected on PC-A. All six passed the formal readiness gate in two windows with readiness P95 about 16.8-16.9 ms. Proposed loaded 96 tiles, transferred 62,659,162 bytes, reached `requestQueuePeak=36`, and recorded `requestPressureWindowCount=3`; however, `pressurePreemptiveActionCount=0` and `tailDowngradeUnderPressureCount=3`. The request-pressure signal arrived when the current P95 had already crossed the 33.33 ms budget, so the higher-priority `tail-frame-violation` branch correctly fired before the preemptive branch could be named. |
| v2.3.3 PC-A pressure probe 2 | Readiness and workload gates passed; exact preemptive-action gate still failed | Six-method D1/S2 pilot probe completed on 2026-08-31. One Cesium dynamic attempt was invalid due to `window-blur` and its retry was valid, leaving six valid method records. Proposed (`pc-a-bagAmsterdam-burst-proposed-r1-mtgr7p36`) passed readiness in two windows (`preRunReadinessP95Ms=16.8`), loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, and had five pressure windows in `all_runs.csv`. No `predicted-tail-plus-request-pressure` action occurred. Row inspection shows pressure arrived when P95/prediction were low (`Q=36`, P95=16.9 ms at 29.3 s; `Q=26`, P95=22.0 ms at 39.4 s), while the later predicted tail event occurred after the request queue had cleared (`predicted=34.8 ms`, `Q=0` at 35.9 s). |
| v2.3.4 diagnostic taxonomy | Implemented and automatically verified | No controller decision rule changed. The analysis now exports `pressureSafeHoldCount`, `pressureTailOverlapCount`, `pressurePreemptiveOpportunityCount`, and `missedPreemptiveOpportunityCount` alongside the existing pressure-action fields. Reanalysis of v2.3.3 probe 2 classifies the Proposed record as five pressure windows, five safe pressure holds, zero pressure-tail overlap, zero preemptive opportunities, zero exact preemptive actions, and zero missed opportunities. Fresh checks passed `npm.cmd test` (78 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm run test:lod:e2e -- --reporter=line` in the approved PowerShell environment. `/api/health` reports protocol `2.3.4`. |
| v2.3.4 PC-A pressure probe | Format-valid but mechanism-invalid | Six valid method records were collected. Proposed (`pc-a-bagAmsterdam-burst-proposed-r1-mtgspsyx`) passed readiness but loaded only 8 tiles, transferred 813,058 bytes, reached `requestQueuePeak=1`, and produced no interpretable request-pressure taxonomy. Row inspection shows the first measured tail downgrade occurred at about 1.0 s, before the formal 2-second rolling P95 window was fully populated. This makes the run audit evidence for a protocol-execution defect, not evidence about the proposed request-pressure mechanism. |
| v2.3.5 full-window control gate | Implemented and automatically verified | The measured-phase control loop now waits until `elapsedMs >= windowMs` as well as the normal 500 ms control interval before calling the controller or writing a telemetry row. A unit test now guards this rule. No controller threshold, camera path, dataset, baseline, readiness gate, or analysis taxonomy was changed. Fresh checks passed `npm.cmd test` (79 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm run test:lod:e2e -- --reporter=line` in the approved PowerShell environment. `/api/health` reports protocol `2.3.5`, `windowMs=2000`, `controlIntervalMs=500`, and `bagAmsterdam` / `bagRotterdam` ready. |
| Formal experiment | Blocked | Confirmatory and Android collection remain blocked until a new v2.3.5 PC-A pressure probe and full pilot pass under the full-window control gate. |

## Why v2.1 Exists

The v2.0 pilot found zero request-queue peaks in the proposed-controller records. The prior 500 ms telemetry only retained the queue value at the end of an interval, so short request bursts could settle to zero before sampling. Therefore v2.0 cannot support a claim about request-pressure-aware control.

Protocol v2.1 records the maximum queue observed within each control interval (`requestQueuePeakInterval`) and separately retains the interval-end queue (`requestQueueEnd`). It also records `loadProgressEventCount`. This is a measurement correction, not a post-hoc result adjustment.

## v2.1.1 and v2.2.0 Mechanism-Gate Results

The PC-A D1/S2 `request-peak-probe` ran on 2026-08-26 with seed `20260823`.

- Six valid runs are correctly marked `protocolVersion: 2.1.0`, `studyPhase: pilot`, and `pilotPurpose: request-peak-probe`.
- One first-attempt reactive record is invalid because of `window-blur`; its retry is valid and remains the only reactive evidence for the probe.
- Queue peaks were nonzero for fixed SSE 8 (4), PI (43), proposed (44), and reactive retry (41). All six valid runs emitted at least two `loadProgress` events.
- However, no run reported `requestPressureHigh: true`. The proposed run had a queue peak of 44 at 19.37 s, with the queue returning to zero by the end of that interval. Its three downgrades occurred only after the following frame-time violation and used `tail-frame-violation`, never `predicted-tail-plus-request-pressure`.
- The proposed run had 10 SSE switches in 40 s. This is diagnostic evidence, not a comparison result.

The v2.1.1 integration correction passed its data-flow check: the proposed record received the retained interval peak. The v2.2.0 path changed the request distribution but still produced nonzero activity for no more than about one second in the proposed record. The six v2.1.1 and six v2.2.0 records remain pilot audit evidence and must not be pooled with confirmatory results.

The controlled v2.2.1 rerun reproduced the same low resource footprint: each valid method loaded `7` external tileset roots, recorded `8` resources and about `0.25 MB`, and generated no interval queue activity. The earlier v2.2.0 fixed-SSE-8 run loaded four content tiles as soon as `recovery-1` began, whereas v2.2.1 loaded none. Because the only intended path change was continuous recovery drift, the repeated result identifies the moving recovery as the workload defect rather than a browser-cache explanation. The invalid `document-hidden` and `window-blur` attempts remain audit evidence and their automatic retries are valid.

The v2.2.2 PC-A probe then established a valid moving-load workload. Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, and entered high request pressure for four control windows. At the first high-pressure window, current P95 was 33.27 ms while the EWMA-trend forecast was only 27.35 ms; at the next window current P95 had already exceeded the budget, so the tail-violation branch correctly took priority. The isolated run's lower violation rate than Reactive is feasibility evidence only and is not a comparative claim.

The v2.3.0 PC-A probe confirmed the forecast correction but exposed a second mechanism gap. All six records were valid. Proposed again loaded 125 tiles and transferred 84,849,002 bytes, with `requestQueuePeak=36` and later `requestQueue=29` near the frame-time budget. However, each large request pulse released too quickly to satisfy the 1.5-second persistence gate, so `requestPressureHigh` was false in every telemetry row. Protocol v2.3.1 therefore adds a pressure-impulse latch for `requestQueue >= 24`; this is a controller-state interpretation change, not a workload or baseline change.

The v2.3.1 PC-A probe passed the mechanism gate. Proposed reached `requestQueuePeak=36`, marked high request pressure for three control rows, and made the required preemptive action at `elapsedMs=29460.6`, `phaseId=recovery-3`, `P95=33.22 ms`, `predictedP95=33.22 ms`, `requestQueue=36`, `SSE=8`, `action=DOWNGRADE_PREEMPTIVE`, and `reason=predicted-tail-plus-request-pressure`. This validates the controller branch for pilot readiness only; the isolated run's zero violation rate remains feasibility evidence, not a manuscript result.

The v2.3.1 PC-A full pilot then failed the freeze gate. All 24 records were valid, but Proposed was internally inconsistent: repeats 1-3 loaded only seven roots and had no request queue while early tail-frame violations forced the controller to the coarsest `SSE=64`; repeat 4 loaded 96 tiles and reached a real request peak. This indicates that the protocol was still allowing pre-measurement or early-measurement frame spikes to dominate the controller before the intended request-pressure workload was observable. Protocol v2.3.2 therefore separates fixed-SSE warmup from measured control and prevents no-op boundary downgrades from inflating actions.

The v2.3.2 PC-A pressure probe passed the mechanism gate. The six methods were valid. Proposed loaded 80 tiles, transferred about 46.2 MB, reached `requestQueuePeak=29`, had `requestQueueAuc=36,979`, recorded one high-pressure row, and made the required `DOWNGRADE_PREEMPTIVE / predicted-tail-plus-request-pressure` action at 39.5 s after progressively upgrading from `SSE=16` to `SSE=4`. Its first control rows began at 0.5 s and remained stable at `P95≈16.9 ms`, `SSE=16`, and `requestQueue=0`, so the v2.3.1 early-tail collapse was not reproduced.

## Immediate Action

Do not start Android, full pilot, or confirmatory collection yet. v2.3.5 is now implemented and automatically verified. The next physical step, after server restart and health confirmation, is one PC-A D1/S2 pressure probe under protocol `2.3.5`. Analyze it before deciding whether to proceed to the four-repeat PC-A full pilot.

## Canonical References

- [RUNBOOK.md](RUNBOOK.md): operator procedure.
- [experiment_protocol.md](paper/experiment_protocol.md): formal protocol and gates.
- [data_dictionary.md](paper/data_dictionary.md): exported-field definitions.
- [claim_registry.md](paper/claim_registry.md): permitted and prohibited manuscript claims.
- [device_registry.md](results/device_registry.md): device and browser provenance.
- [PI_FREEZE.md](results/analysis/PI_FREEZE.md): frozen PI settings.

## Update Rule

Update this file after each meaningful collection or analysis event. Link to the raw artifact and state whether it is diagnostic, pilot, tuning, or confirmatory evidence. Do not overwrite historical conclusions; record a newer conclusion with its protocol version.

## Session Continuity

- Source rollout: `C:\Users\78630\.codex\sessions\2026\08\23\rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.jsonl`
- Markdown backup: `learnMapmost/session_backups/rollout-2026-08-23T16-38-48-01a02dc5-b9bf-72d3-bba4-02727dbe08b4.md`
- Watcher: `learnMapmost/rollout_backup.mjs` reads the source and exports only `response_item` messages whose role is `user` or `assistant`; known runtime-context wrapper messages and all internal event records are excluded. `start-rollout-backup.ps1` now passes an explicit output path so the watcher writes to the canonical `learnMapmost/session_backups` directory.
- Start command: `npm.cmd run lod:backup:watch`
- One-time export: `npm.cmd run lod:backup`
- The watcher is an external helper process. It must be restarted after a Windows reboot or when the source rollout path changes.
