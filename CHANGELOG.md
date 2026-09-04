# Changelog

All notable protocol, implementation, and research-workflow changes are recorded here. Historical entries reconstructed from conversation and project records are marked accordingly.

## PC-B local-server D1/S3 full pilot gate - 2026-09-04

- The PC-B local-server D1/S3 `pressureBurst` full pilot was completed and reanalyzed. It added 24 valid pilot rows in four complete six-method paired blocks, all correctly marked `deviceId=pc-b`, `dataset=bagAmsterdam`, `scenario=pressureBurst`, `protocolVersion=2.3.6`, `studyPhase=pilot`, `pilotPurpose=full-pilot-v2.3.6-pressure-burst`, `serverTopology=local`, and `pageOrigin=http://localhost:8088`, with no invalid reasons.
- PI produced repeatable measurable tail pressure in three of four repeats: violation rates `0.0533/0.0526/0.0526/0.0`, P95 about `21.77/21.02/21.02/21.00 ms`, P99 about `33.37/33.37/33.37/33.30 ms`, raw max up to `50.10 ms`, queue peaks `61/62/63/65`, 170-173 loaded tiles, and about 115.6-116.5 MB transferred.
- Proposed stayed below the formal P95-window budget in all four repeats while still seeing meaningful request/content pressure: P95/P99 about `16.81-16.90/16.90-17.00 ms`, raw max `33.40 ms`, queue peak `42` in every repeat, 153-155 loaded tiles, about 102.4-103.2 MB transferred, and pressure-safe-hold counts `9/10/10/10`. It did not produce pressure-tail overlap, preemptive opportunities, or exact `predicted-tail-plus-request-pressure` actions on PC-B.
- Fixed8 and Reactive also showed substantial request/content pressure and raw frame spikes up to about `50 ms`, but zero P95-window violations.
- Interpretation: D-030 accepts the PC-B local-server full pilot as passing the desktop S3 route/repeatability gate. This supports confirmatory-release preparation, not a method-effect claim. Do not click the existing `Run main batch` entry yet, because the historical main queue still schedules the older `steady` / `burst` matrix rather than the newly gated S3 `pressureBurst` route.

## PC-B local-server D1/S3 pressure probe - 2026-09-03

- The PC-B local-server D1/S3 `pressureBurst` pressure probe was completed and reanalyzed. The six rows are valid and correctly marked `deviceId=pc-b`, `dataset=bagAmsterdam`, `scenario=pressureBurst`, `protocolVersion=2.3.6`, `studyPhase=pilot`, `pilotPurpose=request-peak-probe-v2.3.6-pressure-burst`, `serverTopology=local`, and `pageOrigin=http://localhost:8088`.
- PI produced measurable tail pressure: 4 of 76 over-budget control windows (`violationRate=0.0526`), frame-window P95/P99 `21.02/33.37 ms`, raw max `50.10 ms`, request queue peak `61`, 170 loaded tiles, 121.2 MB transferred, and 37 load-progress events.
- Proposed remained below the formal P95-window budget in this single probe while still seeing meaningful request/content pressure: violation rate `0.0`, P95/P99 `16.90/16.90 ms`, raw max `33.5 ms`, frame-over-budget rate `0.000417`, request queue peak `42`, 153 loaded tiles, 107.3 MB transferred, 58 load-progress events, and 9 pressure-safe-hold windows.
- Fixed8 and Reactive also showed meaningful local-server content pressure with zero P95-window violations but nonzero raw over-budget frames. Cesium dynamic and Fixed16 remained light.
- Interpretation: PC-B local-server delivery makes S3 potentially informative enough to continue the desktop pilot route, but this one-block probe is not a confirmatory release. D-029 required a PC-B local-server D1/S3 four-repeat full pilot before deciding whether S3 can enter desktop confirmatory collection; that follow-up full pilot was later completed and accepted by D-030. S4 remains paused for the current desktop route.

## PC-B server-topology diagnostic result - 2026-09-03

- The PC-B D1/S3 fixed4 server-topology diagnostic was completed and reanalyzed. `results/analysis/server_topology_diagnostics.csv` now contains two valid diagnostic-only rows, both `deviceId=pc-b`, `dataset=bagAmsterdam`, `scenario=pressureBurst`, `method=fixedDiagnostic`, `studyPhase=diagnostic`, `diagnosticPurpose=server-topology-identifiability`, `fixedSse=4`, and `excludeFromFormalAggregation=True`.
- Remote-server run `pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtk2udpi` used `pageOrigin=http://192.168.0.112:8088`, had zero over-budget control windows, frame-window P95/P99 `16.90/16.90 ms`, raw max `33.30 ms`, frame-over-budget rate `0.0`, request queue peak `40`, 159 tiles, 110.6 MB transferred, and resource/tile-load peaks of 18/7 events per 100 ms and 24/8 per 500 ms.
- Local-server run `pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtlgfjw1` used `pageOrigin=http://localhost:8088`, produced 4 of 76 over-budget control windows (`violationRate=0.0526`), frame-window P95/P99 `21.03/33.40 ms`, raw max `50.10 ms`, frame-over-budget rate `0.00378`, request queue peak `61`, 174 tiles, 124.7 MB transferred, and resource/tile-load peaks of 29/47 events per 100 ms and 77/74 per 500 ms.
- Interpretation: this matches the preregistered "local produces more tail pressure / burstier arrivals" outcome. Treat the remote LAN server path as a material confounder for PC-B S3 identifiability. The earlier remote-server PC-B D1/S3 low-pressure pilot/probe must not be used to conclude that S3 is inherently uninformative on PC-B.
- Next step: run one PC-B local-server D1/S3 six-method `pressureBurst` pressure probe with correct `deviceId=pc-b`. Do not enter confirmatory collection or design S4 until that local-server probe is interpreted.

## PC-B server-topology diagnostic path - 2026-09-02

- Added a diagnostic-only PC-B remote-server versus local-server fixed-SSE-4 A/B path for the unresolved v2.3.6/S3 low-pressure result.
- The new `Run server-topology fixed4 diagnostic` button schedules exactly one D1/S3 `bagAmsterdam + pressureBurst` run using `fixedDiagnostic` at `SSE=4`, `networkProfile=lan`, `studyPhase=diagnostic`, `diagnosticPurpose=server-topology-identifiability`, and `excludeFromFormalAggregation=true`.
- The browser infers and records `serverTopology=remote` when the benchmark page is opened from a LAN host such as `192.168.0.102:8088`, and `serverTopology=local` when opened from `localhost` / `127.0.0.1`. The manifest also records `pageOrigin` and `pageHost`.
- Added temporal delivery diagnostics: resource completion, public `tileLoad`, and public `loadProgress` event structures are summarized into 100/250/500 ms bins, with peak counts/bytes exported in run summaries.
- `lod:analyze` now writes `results/analysis/server_topology_diagnostics.csv`. This diagnostic CSV is separate from Android identifiability output and from formal confirmatory aggregation.
- D-028 records the gate: do not enter confirmatory collection, do not add more PC-B/S3 repeats, and do not design S4 until the PC-B remote/local fixed4 diagnostic is run and interpreted.
- Fresh checks passed `npm.cmd test` (88 tests), `npm.cmd run test:lod:py` (19 tests), `npm.cmd run lod:analyze`, and `npm.cmd run test:lod:e2e -- --reporter=line` (2 tests) outside the sandbox after the sandboxed Playwright launch failed with `spawn EPERM`.

## PC-B device registration - 2026-09-02

- Registered `pc-b` as the second desktop candidate for the current v2.3.6 desktop efficacy route.
- Recorded PC-B hardware and environment: Intel Core Ultra 7 258V @ 2.20 GHz, Intel Arc 140V GPU (16 GB), 32.0 GB RAM (31.6 GB usable, 8533 MT/s), Windows 11 Home Chinese edition 25H2, Chrome 150.0.7871.115 (64-bit), 60 Hz display refresh, Wi-Fi, and Best performance power mode.
- Added PC-B run-day provenance from the supplied 2026-09-02 screenshot and user notes: plugged-in power, Wi-Fi SSID `TP318`, benchmark drawing buffer `960 x 540`, Canvas/WebGL/WebGPU hardware acceleration, active Intel Arc 140V GPU evidence, and driver `32.0.101.8860`.
- At registration time, confirmatory collection remained closed pending PC-B v2.3.6/S3 readiness/pilot evidence.

## PC-B D1/S3 pilot/probe evidence - 2026-09-02

- The accidental PC-B `Run D1/S3 pressureBurst pilot` produced 24 valid `pc-b + bagAmsterdam + pressureBurst` pilot records in four complete six-method paired blocks and no invalid attempts.
- PC-B full-pilot medians remained low-pressure: every method had violation rate `0.0` and frame-time P95 about `16.8-16.9 ms`. Proposed loaded 128/52/115/117 tiles, transferred 88.5/28.5/78.7/80.7 MB, reached request-queue peaks 39/39/39/40, and recorded pressure-safe holds 31/33/38/36, with no pressure-tail overlap or exact request-pressure actions.
- The later six-method D1/S3 pressure-probe rerun is complete and valid but misregistered: raw manifests record `deviceId=unregistered`, even though the filenames begin with `pc-b`. It is retained as audit evidence only and must not be treated as formal PC-B provenance.
- Interpretation: PC-B v2.3.6/S3 currently lacks tail-control identifiability. Do not proceed to confirmatory collection before deciding whether to narrow the desktop efficacy scope or define a new platform-independent higher-pressure protocol.

## Android-A fixed4 diagnostic result and claim narrowing - 2026-09-01

- The physical Android-A `Run Android fixed4 diagnostic` run completed and `lod:analyze` regenerated `results/analysis/android_identifiability_diagnostics.csv`.
- Both diagnostic records are valid and correctly marked `method=fixedDiagnostic`, `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, and `excludeFromFormalAggregation=True`.
- D1/S3 `bagAmsterdam + pressureBurst + fixedDiagnostic`: P95 `16.7 ms`, P99 `16.7 ms`, raw max `33.1 ms`, `frameTimeOver20Rate=0.000415`, `frameBudgetViolationRate=0.0`, `requestQueuePeak=39`, `requestQueueAuc=246,976.6`, `tilesLoadedTotal=116`, `transferBytes=78,922,006`, and `loadProgressEventCount=206`.
- D2/S3 `bagRotterdam + pressureBurst + fixedDiagnostic`: P95 `16.7 ms`, P99 `16.7 ms`, raw max `18.2 ms`, `frameTimeOver20Rate=0.0`, `frameBudgetViolationRate=0.0`, `requestQueuePeak=39`, `requestQueueAuc=233,590.4`, `tilesLoadedTotal=108`, `transferBytes=91,659,806`, and `loadProgressEventCount=214`.
- Interpretation: the current S3 `pressureBurst` workload has a floor effect on Android-A. Even fixed `SSE=4` with substantial request/content pressure did not create measurable `>33.33 ms` tail-frame pressure. Therefore S3 is unsuitable for Android-A efficacy comparison.
- D-027 narrows the current v2.3.6 Android claim to cross-device executability and low-pressure boundary behavior. Do not open confirmatory collection for Android efficacy under S3. A future Android efficacy claim would require a new protocol version with a platform-independent S4 workload and an admission criterion defined before running Proposed.

## Android-A identifiability diagnostic path - 2026-09-01

- Accepted the Android-A identifiability-diagnostic gate after both D1/S3 and true D2/S3 v2.3.6 pilots produced valid low-pressure evidence: the benchmark ran correctly and produced request-pressure exposure, but all valid methods remained at zero `P95 > 33.33 ms` violations.
- Added a diagnostic-only fixed-SSE-4 entry point using `fixedDiagnostic`. It reuses the fixed controller at `SSE=4`, runs only `bagAmsterdam + pressureBurst` and `bagRotterdam + pressureBurst`, and records `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, and `excludeFromFormalAggregation=true`.
- `fixedDiagnostic` is explicitly not part of the frozen six-method formal method set and is omitted from the ordinary method dropdown, pilot queues, confirmatory queues, and six-method aggregation.
- The browser UI now exposes `Run Android fixed4 diagnostic` as a dedicated diagnostic button.
- Analysis now exports Android identifiability diagnostics to `results/analysis/android_identifiability_diagnostics.csv`, including frame-time distribution, P99/max, `P(frameTime > 20 ms)`, `P(frameTime > 33.33 ms)`, request-queue peak/AUC, loaded tiles, transferred bytes, and load-progress count.
- Fresh checks passed `npm.cmd test` (85 tests), `npm.cmd run test:lod:py` (18 tests), `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm.cmd run test:lod:e2e -- --reporter=line` on isolated port 8097 in the approved PowerShell environment. A follow-up `npm.cmd run lod:analyze` regenerated `STATUS.md`, `all_runs.csv`, and the new empty diagnostic CSV; `STATUS.md` reports 415 result files, 365 valid all-phase runs, zero valid confirmatory runs, and zero valid diagnostic runs before the physical fixed4 collection.
- Decision boundary: do not enter confirmatory collection. After the physical fixed4 diagnostic is collected and analyzed, decide whether Android claims should be narrowed to cross-device executability / low-pressure boundary behavior, or whether a new protocol version should introduce a platform-independent S4 sustained high-pressure traversal.

## Android-A true D2/S3 pressureBurst pilot - 2026-09-01

- The true Android-A D2/S3 pilot was collected with the new `Run D2/S3 pressureBurst pilot` button and reanalyzed. The new records are correctly marked `deviceId=android-a`, `dataset=bagRotterdam`, `scenario=pressureBurst`, `protocolVersion=2.3.6`, `networkProfile=lan`, `studyPhase=pilot`, and `pilotPurpose=full-pilot-v2.3.6-d2-pressure-burst`.
- The pilot produced 24 valid records in four complete six-method paired blocks and no invalid attempts.
- All valid methods had median violation rate `0.0` and median frame-time P95 about `16.7 ms`.
- Proposed repeats loaded 95, 90, 98, and 98 tiles; transferred 80,495,838, 73,057,866, 83,251,158, and 83,251,458 bytes; reached request-queue peaks 41, 39, 40, and 40; and recorded pressure-safe holds 23, 27, 24, and 27.
- No Proposed repeat produced pressure-tail overlap, preemptive opportunities, exact `predicted-tail-plus-request-pressure` actions, missed opportunities, or tail downgrades under pressure.
- Interpretation: D2/S3 execution is valid as Android pilot evidence, but it reproduces the Android low-tail-pressure problem. It does not support formal Android comparative effect claims.

### Next Step

- Decide how to handle Android-A low-tail-pressure before confirmatory release: narrow Android claims, release a deliberately versioned heavier Android workload, or treat Android as execution/generalization evidence rather than tail-pressure effect evidence.

## D2/S3 pilot UI path - 2026-09-01

- Added a dedicated `Run D2/S3 pressureBurst pilot` button and `buildD2S3PilotQueue()` so Android-A D2/S3 can be collected without relying on the dataset dropdown while using the fixed D1/S3 button.
- The D2/S3 pilot queue is explicitly `bagRotterdam + pressureBurst`, six methods, four repeats, `networkProfile=lan`, `studyPhase=pilot`, and `pilotPurpose=full-pilot-v2.3.6-d2-pressure-burst`.
- Added a regression test to ensure the D2/S3 pilot queue cannot silently run `bagAmsterdam`, and updated the Playwright smoke test to require the D2/S3 button to be visible.
- Fresh checks passed `npm.cmd test` (83 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm.cmd run test:lod:e2e -- --reporter=line` on isolated port 8095 in the approved PowerShell environment. A follow-up `npm.cmd run lod:analyze` regenerated `STATUS.md` / `all_runs.csv` after the E2E smoke left an additional retained `unregistered-publicStress` audit result.

### Follow-up

- The true D2/S3 pilot was later collected with this new button; see the newer Android-A true D2/S3 entry above.

## Android-A attempted D2/S3 check - 2026-09-01

- The user reported completing a D2/S3 Android-A pilot and `npm.cmd run lod:analyze`, but the regenerated analysis and raw filenames show no `android-a + bagRotterdam + pressureBurst` records. All Android-A v2.3.6 `pressureBurst` full-pilot rows are still `dataset=bagAmsterdam`.
- The new second batch contains 24 additional valid Android-A D1/S3 records in four complete six-method paired blocks, with no new invalid attempts. Median violation rate remained `0.0` for every method, with median frame-time P95 about `16.7 ms`.
- Proposed in the second D1/S3 batch loaded 94, 98, 97, and 101 tiles; transferred 58,779,910, 60,780,090, 60,695,022, and 64,441,710 bytes; reached request-queue peaks 34, 34, 35, and 37; and again produced pressure-safe holds without pressure-tail overlap or exact request-pressure actions.
- Interpretation: this is useful repeatability/audit evidence for Android-A D1/S3 low-tail-pressure behavior, but it is not D2/S3 evidence. Real Android-A D2/S3 was still uncollected at this point; it was later collected with the new D2/S3 button.

### Next Step

- Do not start confirmatory collection. Add or use an unambiguous D2/S3 pilot path before collecting D2, because the current `Run D1/S3 pressureBurst pilot` button is fixed to `bagAmsterdam`.

## Android-A v2.3.6 pressureBurst pilot - 2026-09-01

- The Android-A D1/S3 `pressureBurst` full pilot was collected and reanalyzed under protocol v2.3.6. The raw files are marked `deviceId=android-a`, `dataset=bagAmsterdam`, `scenario=pressureBurst`, `protocolVersion=2.3.6`, `networkProfile=lan`, and `pilotPurpose=full-pilot-v2.3.6-pressure-burst`.
- The run produced 25 attempts: 24 valid records in four complete six-method paired blocks and one retained invalid PI repeat-3 attempt (`window-blur|document-hidden`) followed by a valid retry.
- All valid Android-A methods had median violation rate `0.0` and median frame-time P95 about `16.7 ms`. Proposed repeats loaded 96, 98, 98, and 101 tiles; transferred 59,430,530, 60,780,990, 61,742,658, and 64,361,750 bytes; reached request-queue peaks 34, 34, 35, and 37; and recorded pressure-safe holds 19, 20, 22, and 19.
- No valid Proposed Android-A repeat produced pressure-tail overlap, preemptive opportunities, exact `predicted-tail-plus-request-pressure` actions, missed opportunities, or tail downgrades under pressure.
- Interpretation: the Android-A pilot passed execution, metadata, readiness, paired-block, and request-pressure exposure checks, but D1/S3 did not create measurable tail-frame pressure on this phone. It is therefore low-pressure pilot evidence only, not confirmatory comparative evidence.
- A later attempted D2/S3 run was found to be a second D1/S3 run because the fixed D1/S3 pilot button uses `bagAmsterdam`; true D2/S3 was still pending at this point and was later collected with the new D2/S3 button.

### Next Step

- Before any confirmatory release, decide how to handle Android-A low-tail-pressure behavior: test whether D2/S3 is more informative under the already implemented v2.3.6 protocol, revise the Android claim boundary, or create a deliberately versioned heavier workload if needed.
- Keep confirmatory collection blocked until Android-A workload difficulty and formal device scope are resolved.

## Android-A pilot setup conditions - 2026-09-01

- Reconfirmed and recorded Android-A setup conditions for the frozen v2.3.6 pilot: landscape orientation, 50% battery while charging, cooled / thermally stabilized state with exact temperature `[待填]`, 5 GHz Wi-Fi, Chrome 151.0.7922.173, hardware acceleration enabled, and `960 x 540` drawing-buffer target.
- This condition record differs from the earlier 2026-08-25 Android readiness state of 100% battery, not charging, and Chrome 151.0.7922.171. Interpret the upcoming Android-A pilot under the 2026-09-01 recorded conditions; do not mix it with older readiness evidence or treat it as confirmatory evidence.

### Next Step

- The Android-A `pressureBurst` pilot has now been run and analyzed. Keep the 2026-09-01 condition record attached to that pilot when interpreting it.
- Keep confirmatory collection blocked until Android-A workload difficulty and formal device scope are resolved.

## v2.3.6 - 2026-08-31

### Changed

- Added `pressureBurst` as a separate S3 workload instead of silently changing the existing `burst` scenario.
- Bumped `FROZEN_PROTOCOL.protocolVersion` to `2.3.6` and registered `pressureBurst` in the frozen scenario list.
- Updated the D1 pilot and pressure-probe queues to use `pressureBurst` with explicit pilot purposes: `full-pilot-v2.3.6-pressure-burst` and `request-peak-probe-v2.3.6-pressure-burst`.
- Added the UI option `S3 Pressure burst` and updated the E2E smoke run to exercise it.
- Kept controller thresholds, SSE ladder, datasets, baselines, frame budget, rolling window, control interval, request-pressure thresholds, readiness policy, and statistical plan unchanged.

### Evidence

- Failing-first tests were added for protocol registration, v2.3.6 manifest provenance, pilot/probe queue routing, and the new pressure-burst camera path.
- Fresh checks passed `npm.cmd test` (82 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm.cmd run test:lod:e2e -- --reporter=line` on isolated port 8094 in the approved PowerShell environment.
- Reanalysis still reports zero valid confirmatory runs; all physical v2.0-v2.3.6 records remain pilot, tuning, legacy, or audit evidence only.
- The PC-A D1/S3 `pressureBurst` pressure probe completed under protocol v2.3.6. The latest records are `bagAmsterdam`, not `publicStress`; one first-attempt Reactive run was invalid due to `window-blur` and its retry was valid. Proposed loaded 129 tiles, transferred 88,418,782 bytes, reached `requestQueuePeak=38`, recorded three pressure-safe holds and three pressure-tail-overlap windows, but no exact preemptive request-pressure action.
- The four-repeat PC-A D1/S3 `pressureBurst` full pilot completed with 28 attempts: 24 valid records in four complete six-method paired blocks and four retained invalid attempts. Proposed repeats loaded 139, 139, 119, and 97 tiles; reached queue peaks 38, 34, 35, and 35; and produced pressure taxonomy in all four repeats. Exact `predicted-tail-plus-request-pressure` actions appeared in three of four Proposed repeats.
- D-025 freezes v2.3.6 for Android-A pilot after the PC-A pressure probe and full pilot passed the practical workload/repeatability gate. This is not a release for confirmatory collection.

### Decision Gate

- Reconfirm Android-A physical device conditions, then run Android-A pilot under frozen v2.3.6.
- Keep confirmatory collection blocked until Android-A pilot evidence and formal device scope are resolved.

## v2.3.5 - 2026-08-31

### Changed

- Delayed measured-phase controller sampling until the rolling frame-time window is fully populated for the formal 2,000 ms window.
- Added `isControlWindowReady()` as the shared runtime/test guard for the full-window rule.
- Repaired quality screenshot capture for continuously rendered Cesium canvases by using the canvas bounding box as a page-level screenshot clip instead of Playwright's element screenshot path.
- Kept controller thresholds, camera paths, datasets, baselines, readiness policy, method set, and analysis taxonomy unchanged from v2.3.4.
- Bumped `FROZEN_PROTOCOL.protocolVersion` to `2.3.5` so new physical runs are separated from the v2.3.4 probe.

### Evidence

- The v2.3.4 PC-A pressure probe produced six valid method records, but Proposed loaded only eight tiles, transferred 813,058 bytes, reached `requestQueuePeak=1`, and was driven to coarse SSE by tail downgrades starting around 1.0 s.
- Row inspection showed the first Proposed downgrade used a not-yet-mature 2-second rolling frame-time window (`elapsedMs` about 1,008 ms), so the run was format-valid but not mechanism-valid for request-pressure evaluation.
- A failing-first unit test now requires control sampling to wait until `elapsedMs >= windowMs` and the normal control interval has elapsed.
- Fresh checks passed `npm.cmd test` (79 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm run test:lod:e2e -- --reporter=line` in the approved PowerShell environment.
- The 8088 benchmark server was restarted and `/api/health` returned protocol `2.3.5`, `windowMs=2000`, `controlIntervalMs=500`, and ready D1/D2 datasets.
- The PC-A D1/S2 pressure probe then passed: the six valid methods began measured control at about 2.01 s, and Proposed loaded 96 tiles, transferred 62,659,162 bytes, reached `requestQueuePeak=36`, recorded six pressure windows, and triggered one `DOWNGRADE_PREEMPTIVE / predicted-tail-plus-request-pressure`.
- The v2.3.5 PC-A D1/S2 full pilot completed with 35 attempts: 24 valid runs formed four complete six-method paired blocks and 11 invalid attempts were retained and retried. All valid runs passed readiness, began measured control at or after 2,000 ms, kept the `960 x 540` buffer, and emitted load-progress telemetry. Proposed repeats loaded 26-56 tiles, transferred 11.6-31.4 MB, and reached queue peaks of 13-21, avoiding the earlier low-content collapse.
- The full pilot did not reproduce high request pressure consistently: only one of four valid Proposed repeats contained three pressure-safe-hold windows, and no full-pilot Proposed run made an exact preemptive request-pressure action. The dedicated v2.3.5 pressure probe remains the mechanism evidence; the repeatability/freeze gate is not yet closed.
- Static D1/D2 quality calibration completed after the screenshot repair: `npm.cmd run lod:capture-quality` generated 108 canonical screenshots and `npm.cmd run lod:quality` generated 108 SSIM rows. Minimum SSIM was about 0.954 on `bagAmsterdam` and 0.952 on `bagRotterdam`; this calibrates the SSE ladder and is not formal Proposed-vs-baseline non-inferiority evidence.
- D-023 records the post-pilot decision: v2.3.5 is not frozen for Android or confirmatory collection. The next step is a deliberately versioned pressure-workload revision with fresh tests and a PC-A pilot gate.

### Decision Gate

- Design the next deliberately versioned pressure-workload protocol before changing camera paths, scenario timing, request-pressure thresholds, or gate criteria.
- Keep Android and confirmatory collection blocked until the new protocol passes its PC-A pilot gate; do not claim full-pilot mechanism effects from the v2.3.5 pilot audit data.

## v2.3.4 - 2026-08-31

### Changed

- Added analysis-only request-pressure taxonomy fields: `pressureSafeHoldCount`, `pressureTailOverlapCount`, `pressurePreemptiveOpportunityCount`, and `missedPreemptiveOpportunityCount`.
- Kept controller behavior, datasets, camera paths, SSE ladder, request-pressure logic, readiness policy, method set, and statistical plan unchanged from v2.3.3.
- Bumped `FROZEN_PROTOCOL.protocolVersion` to `2.3.4` so new physical runs are clearly separated from the v2.3.3 diagnostic probes.
- Relaxed only the `smoke=1` readiness threshold used by headless Playwright flow tests to 2000 ms. Formal physical-device readiness remains `2 x 2000 ms <= 25 ms`.

### Evidence

- Reanalysis of `pc-a-bagAmsterdam-burst-proposed-r1-mtgr7p36` reports five request-pressure windows, five safe pressure holds, zero pressure-tail-overlap windows, zero preemptive opportunities, zero exact preemptive actions, and zero missed opportunities.
- Fresh checks passed `npm.cmd test` (78 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm run test:lod:e2e -- --reporter=line` in the approved PowerShell environment.
- `/api/health` on port 8088 returned protocol `2.3.4` with formal readiness policy unchanged.

### Decision Gate

- Run one PC-A D1/S2 pressure probe under v2.3.4 before any full pilot.
- Do not begin Android or confirmatory collection until the v2.3.4 PC-A pressure probe and full pilot pass.

## v2.3.3 - 2026-08-28

### Changed

- Added a method-independent pre-run frame-readiness gate before every condition.
- The benchmark unloads the previous tileset, samples blank-scene frame time in 2-second windows, and requires two consecutive windows with P95 <= 25 ms before interpreting the run as valid.
- Readiness timeout after 60 seconds records `pre-run-frame-instability`, keeps the attempt as invalid audit evidence, and uses the existing retry policy.
- Result JSON/CSV now include readiness policy, wait time, latest readiness P95, check count, stable-window count, and the full readiness-window trace.
- Headless smoke tests use a relaxed smoke-only readiness policy because software-rendered Chromium cannot satisfy the physical-device 25 ms gate; this policy is never used as research evidence.
- Fixed `start-rollout-backup.ps1` so the natural-language transcript watcher writes to the canonical `learnMapmost/session_backups` directory.

### Evidence

- v2.3.2 PC-A full pilot showed stable Proposed request-pressure behavior, but a consecutive repeat-2 PI/fixed16/Cesium-dynamic slowdown exposed method-independent pre-run frame instability.
- The v2.3.3 code path has unit and browser coverage for readiness success, streak reset, timeout invalidation, JSON/CSV fields, and smoke-mode separation.
- Fresh checks on 2026-08-28 passed `npm.cmd test` (78 tests), `npm.cmd run test:lod:py` (15 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run test:lod:e2e -- --reporter=line` in the approved PowerShell environment (2 tests), and `npm.cmd run lod:validate-ui` for desktop and Android-landscape `960 x 540` rendering.
- `/api/health` on port 8088 returned `ok=true`, protocol `2.3.3`, readiness policy `2 x 2000 ms <= 25 ms`, and both `bagAmsterdam` and `bagRotterdam` ready.
- The v2.3.3 PC-A pressure probe produced six valid D1/S2 pilot records. All six passed readiness in two windows. Proposed loaded 96 tiles, transferred 62,659,162 bytes, reached `requestQueuePeak=36`, and recorded three request-pressure windows, but the target preemptive action count was zero because three pressure windows were handled by the higher-priority tail-frame violation branch.
- A second v2.3.3 PC-A pressure probe on 2026-08-31 again passed readiness and workload gates. Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, recorded five pressure windows in the regenerated analysis table, and had `violationRate=0`. The exact preemptive action still did not occur: the largest pressure windows happened while P95/prediction were below the preemptive threshold, and the later predicted tail event happened after the request queue had cleared.

### Decision Gate

- Do not begin Android or confirmatory collection yet.
- Do not start the full pilot yet. The next change should be v2.3.4 diagnostic taxonomy: separate pressure observability, safe pressure holds, pressure-tail overlap, exact preemptive actions, and missed preemptive opportunities before collecting more pilot data.

## v2.3.2 - 2026-08-27

### Changed

- Kept the 10-second warmup fixed at `SSE=16`, but stopped feeding warmup frames into the adaptive controller and measured rolling P95 window.
- Reset controller state and the frame-time window at measurement start, then wait for the first 500 ms control period before recording the first control sample.
- Report tail violations at the coarsest SSE as boundary `HOLD` decisions instead of repeated no-op downgrade actions.
- Added a small Python runner so `lod:analyze`, quality analysis, and Python tests prefer the bundled Codex Python and avoid local Miniconda permission failures.

### Evidence

- The v2.3.1 PC-A full pilot produced 24 valid records, but Proposed repeats 1-3 loaded only seven external roots, transferred about 0.25 MB, and had `requestQueuePeak=0`, while repeat 4 loaded 96 tiles and reached `requestQueuePeak=36`.
- Early tail-frame downgrades could drive Proposed to `SSE=64` before the intended request-pressure workload became observable.
- Verification passed with `npm.cmd test`, `npm.cmd run test:lod:py`, `npm.cmd run lod:analyze`, and `/api/health` reporting protocol `2.3.2`.
- The v2.3.2 PC-A pressure probe passed: Proposed loaded 80 tiles, transferred about 46.2 MB, reached `requestQueuePeak=29`, recorded one `requestPressureHigh=true` row, and triggered `DOWNGRADE_PREEMPTIVE / predicted-tail-plus-request-pressure`.
- The v2.3.2 PC-A full pilot completed 24 planned conditions plus one invalid Proposed `window-blur` attempt and its valid retry. All four valid Proposed repeats loaded 80-86 tiles, transferred about 46.2-51.1 MB, and reached queue peaks of 29-35; the prior seven-root/SSE64 collapse did not recur.
- The second randomized block contained a consecutive PI/fixed16/Cesium-dynamic frame-time elevation without matching request pressure. PI began measurement with rolling P95 around 50 ms and later reached 93.2 ms run-level P95; fixed16 and Cesium dynamic also rose despite loading only 9 and 7 tiles. The next block returned to about 16.9 ms, indicating a transient run-environment state rather than a Proposed-controller failure.

### Decision Gate

- The six-method pressure probe gate has passed.
- Proposed repeat stability has passed, but the PC-A pilot exposed cross-run environmental carryover.
- Do not begin Android or confirmatory collection until a method-independent pre-run frame-readiness gate is approved, implemented, and validated in a new PC-A pilot.

## v2.3.1 - 2026-08-27

### Changed

- Added a request-pressure impulse latch: a single control-interval queue observation of at least 24 now sets `requestPressureHigh=true`.
- Preserved the v2.3.0 forecast definition, v2.2.2 workload, 1.5-second persistence rule, zero-release rule, frame thresholds, SSE ladder, cooldowns, and baselines.
- Added a failing-first regression test for the observed PC-A pattern: large request pulse plus P95 near budget should trigger `predicted-tail-plus-request-pressure` before hard tail violation.

### Evidence

- The v2.3.0 PC-A pressure probe produced six valid records and active content loading.
- Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached queue peak 36, and later reached `Q=29` at P95 33.14 ms, but `requestPressureHigh` stayed false in every telemetry row because the pulse released before the 1.5-second persistence gate.

### Decision Gate

- The v2.3.1 PC-A pressure probe passed: all six methods were valid, Proposed had `requestQueuePeak=36`, three `requestPressureHigh=true` rows, and one `predicted-tail-plus-request-pressure` action.
- Full v2.3.1 D1/S2 pilot may begin, but confirmatory collection remains blocked until pilot analysis and parameter freeze.

## v2.3.0 - 2026-08-27

### Changed

- Lower-bounded the one-second positive-trend forecast by the current rolling P95: `forecast = max(currentP95, projectedLevel)`.
- Preserved the v2.2.2 workload, request-pressure persistence, thresholds, SSE ladder, cooldowns, and baseline implementations.
- Added a failing-first regression test for a sudden tail rise under sustained request pressure.

### Evidence

- The v2.2.2 Proposed probe loaded 125 tiles (84,849,002 bytes), reached queue peak 36, and produced four high-pressure windows.
- In the first high-pressure window, current P95 was 33.27 ms while the lagging forecast was 27.35 ms; the next tick had already crossed the 33.33 ms budget and therefore used the tail-violation branch.

### Decision Gate

- Run one new six-method v2.3.0 pressure probe before any full pilot.
- Require `requestPressureHigh=true` and at least one `predicted-tail-plus-request-pressure` action in the valid Proposed record.

## v2.2.2 - 2026-08-26

### Changed

- Replaced the out-and-back interaction range with a monotonic 6-second approach from 3.6 to 0.9 times the tileset bounding-sphere radius.
- Replaced low-speed recovery drift with a stationary 4-second near-view hold so refinement requests can remain selected and complete.
- Preserved the 40-second duration, controller thresholds, method parameters, dataset, seed, and drawing-buffer conditions.

### Evidence

- The controlled v2.2.1 rerun again left all six valid methods at 7 external roots, 8 resources, about 0.25 MB, and zero queue activity; invalid `document-hidden` and `window-blur` attempts were retried and retained.
- In v2.2.0, fixed SSE 8 loaded four content tiles at the start of stationary `recovery-1`; in v2.2.1 the same method loaded none after recovery became continuously moving. This isolates recovery motion as the workload defect.

### Decision Gate

- Run one new six-method v2.2.2 pressure probe before any full pilot.
- Keep the prespecified 1.5-second request-pressure threshold unchanged.

## v2.2.1 - 2026-08-26

### Changed

- Extended each recovery phase with a low-speed transition toward the next direction so delayed tile requests can remain observable across control intervals.
- Preserved the 40-second duration, 6-second close sweeps, controller thresholds, baselines, and measurement resolution.

### Decision Gate

- The v2.2.0 probe was valid and produced queue activity, but did not sustain nonzero pressure for the prespecified 1.5 seconds.
- A new v2.2.1 pressure probe must show `requestPressureHigh: true` and `predicted-tail-plus-request-pressure` before a full pilot.

The first v2.2.1 batch loaded only the initial 7 tiles in every method and is retained as a cold-cache readiness audit, not as a mechanism result.

## v2.2.0 - 2026-08-26

### Changed

- Revised S2 to four 6-second interaction sweeps followed by four 4-second recovery phases while preserving the 40-second measurement duration.
- Each interaction sweep crosses multiple directions, varies pitch, and reaches a close range before returning to the recovery viewpoint.
- Kept the v2.1.1 controller-input correction so interval queue peaks continue to reach the live controller.

### Decision Gate

- The PC-A v2.1.1 probe confirmed peak forwarding but still produced no `requestPressureHigh` interval.
- The next six-method pressure probe must show `requestPressureHigh: true` and a `predicted-tail-plus-request-pressure` action in the proposed record before a full pilot.

## v2.1.1 - 2026-08-26

### Fixed

- Forwarded `tileStats.requestQueue` from the benchmark telemetry layer into the live controller sample.
- Added a regression test that preserves a transient interval queue peak at the controller boundary.

### Decision Gate

- Retained the v2.1 S2 camera path while the corrected integration is tested.
- A clean pressure probe must show `requestPressureHigh: true` and at least one `predicted-tail-plus-request-pressure` action in the proposed run.
- The v2.2.0 continuous cross-direction camera revision is conditional on failure of this corrected probe.

This entry is superseded by the v2.2.0 release above after the corrected probe failed the mechanism gate.

## 2026-08-26 - Natural-Language Session Backup

### Added

- Added `rollout_backup.mjs` to export only user and Codex `response_item` messages to Markdown.
- Added runtime-context filtering for injected wrapper messages and exclusion of internal event records.
- Added `start-rollout-backup.ps1` and `lod:backup` / `lod:backup:watch` commands.
- Added regression tests for duplicate-event exclusion, context-wrapper exclusion, Markdown rendering, and real-file export.

### Verified

- The supplied rollout was exported to `learnMapmost/session_backups` and the watcher observed later appended messages.
- The watcher error log was empty during verification.

## 2026-08-26 - v2.1 Pressure-Probe Decision

### Measured

- PC-A ran the D1/S2 v2.1 `request-peak-probe`: six valid method records and one invalid `window-blur` reactive attempt followed by a valid retry.
- Interval queue peaks and public `loadProgress` events were observed. The peak queue was 44 in the proposed run.
- No valid run entered `requestPressureHigh`; the proposed controller made only tail-frame and recovery decisions, not a request-pressure preemptive decision.

### Decision

- Do not run the full v2.1 pilot. The next S2 workload must be released as v2.2.0 and pass a mechanism-activation probe first.

## 2026-08-26 - Durable Handover Records

### Added

- `PROJECT_STATE.md` as the current experiment snapshot and recovery entry point.
- `DECISIONS.md` as an append-only record of protocol and claim-boundary decisions.
- `TODO.md` as the operator-facing next-action and gate list.
- This `CHANGELOG.md` as the version history.

## v2.1.0 - 2026-08-26

### Changed

- Replaced interval-end-only request telemetry with interval peak telemetry for controller input.
- Retained the interval-end queue separately as `requestQueueEnd`.
- Added `loadProgressEventCount` and `loadProgressEventsInterval` to expose whether public Cesium load-progress feedback occurred.
- Added `pilotPurpose` to distinguish the targeted diagnostic from a full pilot.

### Added

- **Run D1/S2 pressure probe**, a six-method, one-repeat diagnostic queue marked `studyPhase: pilot` and `pilotPurpose: request-peak-probe`.
- Tests for transient queue-peak retention, controller use of the peak, and probe metadata.

### Evidence Boundary

- v2.0 pilot files remain readable audit evidence but are not interchangeable with v2.1 pilot or confirmatory records.

## v2.0.0 - 2026-08-25

### Added

- Formal run-manifest, telemetry-row, run-summary, CSV/JSON export, and analysis workflow.
- Six-method comparison: fixed SSE 8, fixed SSE 16, Cesium dynamic SSE, reactive P95, PI, and proposed predictive scheduling.
- Public Cesium event-based telemetry instead of private `_statistics` fields.
- PC-A PI calibration gate and frozen baseline record.
- Device registry, Chinese draft material, claim registry, protocol, data dictionary, and operator runbook.

### Pilot Outcome

- PC-A D1/S2 pilot produced 25 raw records: 24 valid pilot records and one invalid proposed run caused by `window-blur`, followed by a valid retry.
- Analysis identified measurement and workload-readiness issues; it did not establish manuscript claims.

## Pre-protocol Foundation - Historical Reconstruction

### Existing Work Identified at Project Start

- QEM/octree model simplification.
- GLB-to-3D-Tiles conversion.
- Offline geometric-quality metrics.
- Cesium performance-collection page.
- Reactive threshold controller and an initial EWMA prediction prototype.

These assets motivated the current research route but are not themselves protocol-comparable runtime evidence.

## Update Rule

Add an entry for every protocol-version change, implementation change that affects measured data, dataset-scope change, or completed collection milestone. Do not use this file to silently rewrite prior results.
