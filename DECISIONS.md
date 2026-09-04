# Decisions

This is an append-only decision log. A decision may be superseded, but must not be rewritten or silently removed.

## D-001: Narrow the paper contribution

Date: 2026-08-23 (historical reconstruction)  
Decision: study predictive dynamic `maximumScreenSpaceError` scheduling for Web 3D Tiles under a tail frame-time constraint.

Reason: the existing QEM/octree simplification, GLB-to-3D-Tiles conversion, offline geometry assessment, Cesium telemetry page, reactive controller, and EWMA prototype form useful groundwork. The publishable incremental contribution is the bounded runtime scheduling method and its controlled evaluation, not a claim of inventing dynamic LOD.

## D-002: Keep the contribution device-aware but not "heterogeneous-device" universal

Date: 2026-08-23 (historical reconstruction)  
Decision: validate on PC and Android, but do not place "heterogeneous terminals" in the title or make a universal cross-device generalization.

Reason: two representative device classes support an application-oriented evaluation, not a broad hardware-generalization claim.

## D-003: Select datasets by provenance, not visual appeal

Date: 2026-08-24 (historical reconstruction)  
Decision: use frozen public 3DBAG Amsterdam and Rotterdam subsets as formal D1/D2 candidates. Keep `publicStress` diagnostic only. Exclude `taipei101` and `dayanta` from formal paper claims pending documented source and publication authorization.

Reason: the Taipei 101 asset originated from a WeChat/Netdisk distribution path and presently has no paper-suitable license record. Cultural-heritage relevance cannot substitute for reproducibility or authorization.

## D-004: Require a frozen PI baseline

Date: 2026-08-25  
Decision: the PI controller cannot enter the main comparison while its gains are provisional. PC-A calibration froze `Kp=0.40` and `Ki=0.05`.

Reason: tuning during a comparison would invalidate the baseline. See [PI_FREEZE.md](results/analysis/PI_FREEZE.md).

## D-005: Separate evidence classes

Date: 2026-08-25  
Decision: encode `studyPhase` and distinguish diagnostic, pilot, tuning, and confirmatory records. Do not pool them for formal statistical claims.

Reason: early runs establish feasibility and detect measurement defects; they are not independent confirmatory samples.

## D-006: Treat the v2.0 PC-A pilot as an audit, not a result

Date: 2026-08-25  
Decision: retain the 24 valid v2.0 pilot runs and one invalid `window-blur` run, but do not use them to support the manuscript's main quantitative claims.

Reason: the pilot exposed zero request-queue signals, very low violation pressure in many baselines, forecast error warnings, and excess proposed-controller switching. These are design findings, not pass/fail evidence for the paper.

## D-007: Correct transient request measurement before changing the camera path

Date: 2026-08-26  
Decision: release protocol v2.1.0 with interval queue peaks and a six-method D1/S2 pressure probe before redesigning the workload.

Reason: v2.0 observed only an interval-end queue, which could erase a short burst. v2.1 supplies `requestQueuePeakInterval`, `requestQueueEnd`, and `loadProgressEventCount` so the cause of zero pressure can be diagnosed.

## D-008: Make project-local handover records canonical

Date: 2026-08-26  
Decision: maintain `PROJECT_STATE.md`, `DECISIONS.md`, `TODO.md`, and `CHANGELOG.md` in `learnMapmost`.

Reason: Codex session history can be incomplete after refresh. Project-local records must preserve the experiment state independently of chat continuity.

## D-009: Do not run the full v2.1 pilot after the PC-A pressure probe

Date: 2026-08-26  
Decision: close v2.1.0 for full-pilot use and revise the S2 camera workload under protocol v2.2.0 before collecting more pilot records.

Evidence: the PC-A `request-peak-probe` produced six valid records and one invalid `window-blur` reactive attempt. v2.1 correctly captured transient queue peaks (up to 44) and `loadProgress` events, but `requestPressureHigh` was false in every valid record. In the proposed record, the peak-44 interval ended at zero; the later three downgrades used `tail-frame-violation`, not `predicted-tail-plus-request-pressure`.

Reason: the original v2.1 gate only distinguished missing telemetry from observable request activity. For a paper that claims request-pressure-aware scheduling, the workload must additionally activate that control branch. Repeating a 24-run pilot before this happens would add volume, not evidence.

## D-010: Correct controller input integration before revising S2

Date: 2026-08-26  
Decision: supersede the immediate v2.2.0 camera-path revision. Release protocol v2.1.1 with the existing S2 path and forward the retained interval request-queue peak into `LodController.update(sample)`.

Evidence: v2.1.0 result rows contained nonzero `requestQueuePeakInterval` values and `loadProgress` events, including a proposed-run peak of 44, but the browser benchmark passed only interval-end `pendingRequests` and `processingTiles` to the controller. The controller therefore saw a zero queue at the decision boundary and could not enter the request-pressure branch.

Reason: the previous probe did not identify whether S2 failed to generate pressure or the controller failed to receive it. Changing the camera before correcting this data-flow defect would confound workload and implementation effects. The v2.1.1 mechanism gate therefore requires a clean proposed run with `requestPressureHigh: true` and at least one `predicted-tail-plus-request-pressure` action. Only a clean failure permits a new v2.2 camera revision.

## D-011: Revise S2 after the corrected v2.1.1 probe still fails the mechanism gate

Date: 2026-08-26  
Decision: release protocol v2.2.0 with a 40-second S2 workload composed of four 6-second cross-direction close sweeps and four 4-second recovery phases. Do not start the full pilot until the new six-method pressure probe passes.

Evidence: PC-A v2.1.1 produced six valid records, all with protocol metadata and content. The proposed record had `requestQueuePeak=44` and `loadProgressEventCount=32`, confirming that the corrected peak reaches the controller, but no row reported `requestPressureHigh=true` and no proposed action used `predicted-tail-plus-request-pressure`.

Reason: the corrected implementation ruled out the prior data-flow defect. The remaining failure is workload-level: the original S2 generated an isolated queue pulse rather than sustained pressure. The v2.2 path increases the interaction dwell, crosses previously unvisited directions, and adds a near-range sweep while keeping total duration and measurement conditions fixed.

## D-012: Extend recovery motion after the v2.2.0 probe remains below the pressure duration gate

Date: 2026-08-26  
Decision: release protocol v2.2.1. Keep the v2.2.0 6-second cross-direction close sweep, but let each 4-second recovery phase continue a low-speed transition toward the next direction. Run a new pressure probe before any full pilot.

Evidence: all six v2.2.0 PC-A records were valid. The proposed record had `requestQueuePeak=31` and `loadProgressEventCount=29`, but its nonzero queue lasted at most two consecutive 500 ms snapshots, so `requestPressureHigh` remained false.

Reason: the result indicates delayed tile requests arrive near the end of the interaction sweep. Recovery drift preserves the interaction/recovery distinction while keeping the camera moving long enough to test the prespecified 1.5-second pressure persistence rule. No controller threshold or baseline parameter is changed.

## D-013: Treat the first v2.2.1 batch as a cold-cache readiness failure

Date: 2026-08-26  
Decision: do not use the first v2.2.1 six-method batch to accept or reject the mechanism gate. Rerun the same probe from a new browser context with cache disabled or cleared.

Evidence: all six records were technically valid, but every method loaded exactly 7 tiles, recorded only 2 or 3 `loadProgress` events, transferred about 0.25 MB, and the proposed method had `requestQueuePeak=0`. The preceding v2.2.0 proposed record loaded 59 tiles, transferred about 29.16 MB, and recorded a queue peak of 31.

Reason: the v2.2.1 records show no meaningful moving-load activity and therefore cannot test the camera-path hypothesis. The rerun must first demonstrate resource growth; only then can `requestPressureHigh` and the target action be interpreted.

## D-014: Replace continuous recovery drift with a stationary near-view hold

Date: 2026-08-26  
Decision: release protocol v2.2.2. Make each 6-second interaction a monotonic far-to-near sweep ending at range multiplier 0.9, then hold that near viewpoint for the 4-second recovery. Keep all controller thresholds and method parameters unchanged.

Evidence: the controlled v2.2.1 rerun again produced six valid methods with exactly 7 loaded external roots, 8 resources, about 0.25 MB transferred, and zero request queue. It also retained invalid `document-hidden` and `window-blur` attempts followed by valid retries. By contrast, v2.2.0 fixed SSE 8 loaded four content tiles immediately after entering its stationary first recovery; v2.2.1 fixed SSE 8 loaded none after recovery became continuously moving.

Reason: the out-and-back close sweep returned to a distant view before recovery, while continuous recovery motion repeatedly changed tile selection. A near stationary hold directly tests whether selected refinement requests can persist for the prespecified 1.5-second pressure gate. This is a workload correction, not a post-hoc relaxation of the controller.

## D-015: Prevent the trend forecast from lagging below the current tail observation

Date: 2026-08-27  
Decision: release protocol v2.3.0 and define the forecast as `max(current P95, projected EWMA level)`. Keep the v2.2.2 camera path, the 30 ms preemptive threshold, the 1.5-second request-persistence rule, all SSE actions, and all baselines unchanged.

Evidence: the v2.2.2 PC-A probe produced six valid method records plus one invalid `window-blur` Reactive attempt. Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached queue peak 36, and reported four high-pressure windows. At the first high-pressure window, current P95 was 33.27 ms but the EWMA-trend forecast was 27.35 ms; one control period later current P95 was already 35.96 ms and the higher-priority tail-violation action fired. Thus the workload and pressure detector worked, but smoothing made the forecast contradict the current rising observation.

Reason: a one-second upper-tail forecast intended for early warning should not be lower than the already observed current P95 during a rise. The lower bound corrects estimator lag without relaxing any decision threshold or using device-specific tuning. The v2.2.2 results remain pilot audit evidence and are not pooled with v2.3.0.

## D-016: Treat large single-window request peaks as pressure impulses

Date: 2026-08-27  
Decision: release protocol v2.3.1 and add a request-pressure impulse latch: any control-interval queue observation `Q_t >= 24` sets `requestPressureHigh=true`. Preserve the 1.5-second persistence rule, the 1-second zero-release rule, the v2.2.2 camera path, the v2.3.0 forecast definition, frame thresholds, SSE ladder, cooldowns, and all baselines.

Evidence: the v2.3.0 PC-A pressure probe produced six valid records. Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, and later observed `Q_t=29` with current and forecast P95 at 33.14 ms. Nevertheless `requestPressureHigh` was false in every row because the queue pulse released before the 1.5-second persistence latch. The preemptive request-pressure action therefore remained untested despite meaningful public `loadProgress` activity.

Reason: browser 3D Tiles loading can create high-magnitude, short-lived request bursts. Treating all such bursts as low pressure makes the request-feedback component blind exactly when a large backlog is visible but not yet fully reflected in tail frame time. The new impulse latch is gated by magnitude and still cannot cause a downgrade unless the forecast also exceeds `0.9T`, so it does not turn arbitrary small queue noise into quality loss. The v2.3.0 records remain pilot audit evidence and are not pooled with v2.3.1.

## D-017: Isolate fixed-SSE warmup from measured controller state

Date: 2026-08-27  
Decision: release protocol v2.3.2. The 10-second warmup remains fixed at `SSE=16`, but it no longer updates the adaptive controller or the measured rolling P95 window. At measurement start, reset the controller and frame-time window, clear the telemetry interval, and delay the first control decision until one 500 ms control period has elapsed. Also report tail violations at the coarsest SSE as `HOLD` with a boundary reason instead of repeated no-op downgrade actions.

Evidence: the v2.3.1 PC-A full pilot produced 24 valid records, but Proposed repeats 1-3 loaded only seven external roots, transferred about 0.25 MB, had `requestQueuePeak=0`, and were driven to `SSE=64` by early tail-frame violations. Proposed repeat 4 loaded 96 tiles, transferred about 59.7 MB, and reached `requestQueuePeak=36`. The same method, dataset, scenario, and device therefore produced two different workload regimes inside one pilot block, so v2.3.1 cannot be frozen for confirmatory collection.

Reason: the protocol promise is "fixed SSE16 warmup, warmup data excluded, then measured online control." Feeding warmup frames into the controller and starting control from the first post-warmup animation frame made the early tail estimate too sensitive to run-start and transition spikes. The v2.3.2 change repairs protocol execution and action accounting without changing datasets, method set, SSE ladder, frame budget, request thresholds, or statistical plan. The v2.3.1 full pilot remains audit evidence only.

## D-018: Gate every measured run with method-independent frame readiness

Date: 2026-08-28  
Decision: release protocol v2.3.3. Before each condition, unload the previous tileset and sample a blank scene in 2-second windows. A run may proceed normally only after two consecutive readiness windows have P95 frame time at or below 25 ms. If readiness is not achieved within 60 seconds, record `pre-run-frame-instability`, retain the attempt as invalid audit evidence, and use the existing retry policy.

Evidence: the v2.3.2 PC-A full pilot removed the Proposed seven-root collapse and produced stable Proposed request-pressure behavior, but repeat-2 PI, fixed16, and Cesium dynamic conditions showed a consecutive frame-time elevation without matching request pressure. The next randomized block returned to normal. This pattern points to a method-independent browser/device state before some runs rather than a Proposed-controller mechanism.

Reason: the readiness gate is a pre-treatment, method-independent criterion based on a blank scene rather than on the measured method outcome. It prevents a transient browser or device state from being mistaken for a controller effect while preserving invalid attempts for audit. The controller, prediction rule, request-pressure logic, SSE ladder, datasets, scenarios, baselines, and statistical plan are unchanged.

## D-019: Replace the single exact-action mechanism gate with a diagnostic taxonomy

Date: 2026-08-31
Decision: release v2.3.4 as a pre-confirmatory diagnostic-taxonomy revision. Keep the controller behavior unchanged unless a focused regression test exposes a true logic defect. The analysis gate must separately count pressure observability, pressure-safe holds, pressure-tail overlap, exact `predicted-tail-plus-request-pressure` actions, and missed preemptive opportunities.

Evidence: two physical PC-A v2.3.3 pressure probes passed readiness and workload gates but did not both produce the exact preemptive action. Probe 1 showed request pressure arriving after the current P95 had already crossed the 33.33 ms tail budget, so the higher-priority tail branch fired. Probe 2 showed request pressure arriving while P95 and prediction were still comfortably below the preemptive threshold, then a later predicted tail event after the request queue had cleared. In probe 2, Proposed loaded 125 tiles, transferred 84,849,002 bytes, reached `requestQueuePeak=36`, recorded five pressure windows in `all_runs.csv`, and had `violationRate=0`.

Reason: an exact action name is too narrow as the sole pre-confirmatory mechanism gate. It conflates three different mechanisms: no pressure signal, pressure that is safely ignored because tail risk is low, and pressure that overlaps tail risk but is handled by a higher-priority branch. A taxonomy preserves auditability without retroactively changing controller decisions or broadening confirmatory claims.

## D-020: Wait for a full measured frame-time window before controller sampling

Date: 2026-08-31
Decision: release protocol v2.3.5. During the measured phase, do not call the method controller or record a telemetry decision row until the 2-second rolling frame-time window is fully available. Keep the v2.3.4 controller behavior, thresholds, datasets, camera paths, baselines, readiness gate, and analysis taxonomy unchanged.

Evidence: the v2.3.4 PC-A pressure probe produced six valid JSON records, but the valid Proposed run (`pc-a-bagAmsterdam-burst-proposed-r1-mtgspsyx`) loaded only eight tiles, transferred 813,058 bytes, reached `requestQueuePeak=1`, and entered coarse-SSE tail handling before any meaningful request-pressure workload emerged. Its first tail downgrade occurred at about 1,008 ms with `P95=33.2 ms` and `predictedP95=36.48 ms`, before the formal 2,000 ms rolling P95 window could be fully populated.

Reason: the protocol describes a 2-second rolling P95 control signal. Acting on a partially filled start-of-measurement window makes early jitter disproportionately powerful and can suppress later tile refinement, creating the same low-content collapse that the previous protocol revisions were trying to remove. The fix repairs protocol execution rather than retuning the controller or weakening the request-pressure gate.

## D-021: Keep the v2.3.5 freeze gate open after the PC-A full pilot

Date: 2026-08-31
Decision: accept the v2.3.5 PC-A D1/S2 full pilot as complete pilot audit evidence and as passing the readiness, full-window timing, content-growth, and Proposed repeat-stability checks. Do not yet freeze parameters or release Android/confirmatory collection because high request-pressure taxonomy was observed in only one of four valid Proposed repeats.

Evidence: 35 v2.3.5 full-pilot attempts yielded 24 valid records in four complete six-method paired blocks and 11 retained invalid attempts (10 `pre-run-frame-instability`, 1 `window-blur`). Every valid run passed the two-window readiness gate, had its first measured row at or after 2,000 ms, used a `960 x 540` drawing buffer, and emitted load-progress telemetry. Proposed repeats loaded 26-56 tiles, transferred 11,559,954-31,372,926 bytes, and reached queue peaks of 13-21; none reproduced the earlier seven-root/coarse-SSE collapse. Only repeat 3 had high-pressure taxonomy rows (three safe holds), and no full-pilot Proposed run made an exact preemptive request-pressure action; the dedicated v2.3.5 pressure probe remains the focused mechanism evidence.

Reason: the readiness gate repaired the prior method-independent start-state problem, and the full pilot is sufficiently complete to audit repeat stability. However, sparse high-pressure observations across the four Proposed repeats do not justify claiming repeatable request-pressure behavior or silently treating the pressure probe as a full-pilot effect. Complete quality calibration and record a deliberate freeze or new protocol decision before Android or confirmatory collection.

## D-022: Treat v2.3.5 static quality calibration as complete but non-inferential

Date: 2026-08-31

Decision: accept the D1/D2 static SSE-ladder quality calibration artifacts as complete for the current pre-freeze review, while keeping them separate from formal Proposed-vs-baseline visual non-inferiority evidence.

Evidence: `npm.cmd run lod:capture-quality` generated 108 canonical screenshots under `results/quality/captures`, covering `bagAmsterdam` and `bagRotterdam` across nine SSE levels and six views. `npm.cmd run lod:quality` generated 108 SSIM rows in `results/quality/quality_ssim.csv`. Dataset-level minimum SSIM values were about 0.954 for Amsterdam and 0.952 for Rotterdam, with means about 0.98 and 0.97. The capture script was repaired to use the canvas bounding box as a page screenshot clip after Playwright's element screenshot path timed out while waiting for the continuously rendered Cesium canvas to become stable.

Reason: these artifacts verify that the fixed canonical viewpoints and SSE reference/candidate pipeline are operational and reproducible. They do not by themselves prove that the Proposed controller preserves quality relative to reactive or PI during confirmatory runs, because no confirmatory method-level quality analysis exists yet.

## D-023: Do not freeze v2.3.5; design a deliberately versioned pressure-workload revision

Date: 2026-08-31

Decision: do not freeze v2.3.5 for Android or confirmatory collection. Treat the v2.3.5 pressure probe, PC-A full pilot, and static quality calibration as audit evidence showing that the harness is operational, while requiring a new explicitly versioned pressure-workload protocol before any formal collection. Any change to camera path, scenario timing, workload intensity, request-pressure threshold, or gate criteria must be released under a new protocol version and verified with fresh tests and a PC-A pilot.

Evidence: D-021 shows that the v2.3.5 PC-A full pilot passed readiness, full-window timing, content-growth, and static execution checks, but high-pressure taxonomy appeared in only one of four valid Proposed repeats and no full-pilot Proposed record made an exact preemptive request-pressure action. D-022 shows that the D1/D2 static SSE-ladder quality pipeline is complete, with 108 screenshots and 108 SSIM rows, but that result is not formal method-level non-inferiority evidence.

Reason: freezing v2.3.5 would turn sparse pilot taxonomy into a formal protocol despite the stated mechanism gate remaining weak. Starting Android or confirmatory collection now would multiply a known ambiguity across devices. A deliberately versioned revision keeps the evidence trail clean: v2.3.5 remains valid pilot/quality audit evidence, and the next protocol can target a repeatable pressure workload without silently rewriting prior results.

## D-024: Release v2.3.6 pressureBurst as a pre-confirmatory workload revision

Date: 2026-08-31

Decision: release protocol v2.3.6 with a new `pressureBurst` scenario for the next PC-A pressure probe and full pilot. Keep the existing `burst` scenario available for historical compatibility and do not change controller thresholds, SSE ladder, datasets, baselines, frame budget, rolling frame-time window, control interval, request-pressure thresholds, readiness policy, or statistical analysis plan. The new scenario uses four 4-second interaction approaches and four 6-second stationary near-view holds, ending each approach closer to the tileset than the existing burst path.

Evidence: v2.3.6 was implemented with failing-first JavaScript tests that require the protocol version bump, scenario registration, D1 pilot/probe queues to use `pressureBurst`, and the new camera path to reach a closer near-view hold earlier than `burst`. Fresh verification on 2026-08-31 passed `npm.cmd test` (82 tests), `npm.cmd run test:lod:py` (17 tests), `npm.cmd run lod:analyze`, `npm.cmd run lod:verify-data`, `npm.cmd run lod:validate-ui`, and `npm.cmd run test:lod:e2e -- --reporter=line` on isolated port 8094 in the approved PowerShell environment.

Reason: v2.3.5 established that the harness, readiness gate, full-window control gate, and static quality calibration are operational, but the full pilot did not expose request-pressure taxonomy repeatably across Proposed repeats. `pressureBurst` is a deliberately versioned workload-intensity change that should increase cold-cache request-pressure exposure without retuning the controller or rewriting historical v2.3.5 evidence. Android and confirmatory collection remain blocked until the new PC-A pilot gate passes and a separate freeze decision is recorded.

## D-025: Freeze v2.3.6 for Android-A pilot after PC-A pressureBurst gate

Date: 2026-08-31

Decision: freeze protocol v2.3.6 for the next Android-A pilot. Keep `pressureBurst` as the S3 pressure-workload path and keep controller thresholds, datasets, baselines, SSE ladder, readiness policy, request-pressure thresholds, frame budget, rolling window, control interval, and statistical plan unchanged. This decision permits Android-A pilot preparation and collection after physical device conditions are reconfirmed. It does not release confirmatory collection and does not convert PC-A pilot records into formal manuscript results.

Evidence: the v2.3.6 PC-A D1/S3 pressure probe used `bagAmsterdam`, `pressureBurst`, protocol `2.3.6`, device `pc-a`, and pilot purpose `request-peak-probe-v2.3.6-pressure-burst`; the effective six-method block was complete after one invalid Reactive `window-blur` retry. Proposed loaded 129 tiles, transferred 88,418,782 bytes, reached `requestQueuePeak=38`, and produced pressure-tail-overlap evidence. The subsequent v2.3.6 PC-A full pilot produced 28 attempts: 24 valid records in four complete six-method paired blocks and four retained invalid attempts. Every valid run passed readiness. Proposed repeats loaded 139, 139, 119, and 97 tiles; reached queue peaks 38, 34, 35, and 35; and produced pressure taxonomy rows in all four repeats, with exact `predicted-tail-plus-request-pressure` actions in three of four repeats. Reanalysis after the full pilot reported 338 result files, 289 valid all-phase runs, 204 valid pilot runs, 49 invalid runs, and zero valid confirmatory runs.

Reason: the PC-A pilot gate repaired the v2.3.5 weakness: request-pressure exposure is now repeatable across Proposed repeats rather than sparse. Freezing v2.3.6 at this point preserves the successful workload/controller configuration for cross-device pilot validation. However, evidence remains pre-confirmatory and single-PC; Android behavior, cross-device stability, and eventual confirmatory statistics must still be collected under the frozen protocol before manuscript effect claims are allowed.

## D-026: Gate Android-A low-tail-pressure with diagnostic-only identifiability checks

Date: 2026-09-01

Decision: keep the completed Android-A D1/S3 and D2/S3 v2.3.6 pressureBurst pilots as valid low-pressure pilot evidence, but do not use them to claim Android tail-control efficacy. Add a diagnostic-only fixed-SSE-4 Android entry point to test whether the current S3 workload can push Android-A into an informative tail-pressure region. The diagnostic reuses `FixedController`, records `studyPhase=diagnostic`, `diagnosticPurpose=android-workload-identifiability`, `fixedSse=4`, and `excludeFromFormalAggregation=true`, and is excluded from the formal six-method set, pilot queues, confirmatory queues, and six-method aggregation.

Evidence: the completed Android-A D1/S3 pilot, second D1/S3 rerun, and true D2/S3 pilot all produced complete valid six-method pilot blocks with request-pressure exposure in PI/Reactive/Proposed, but every valid method had zero `P95 > 33.33 ms` tail-frame violations and frame-time P95 around one 60 Hz frame. This establishes cross-device executability and low-pressure boundary behavior, not comparative Android efficacy.

Reason: adding fixed SSE 4 as a seventh formal method would pollute the predeclared method set, while moving directly to confirmatory collection would knowingly collect an Android efficacy experiment with poor identifiability. A diagnostic-only fixed4 gate separates workload characterization from formal inference. If fixed4 remains near 16.7 ms with near-zero over-budget frames despite substantial queue/byte/tile pressure, the project should either narrow Android claims to executability and low-pressure behavior or introduce a new deliberately versioned, platform-independent S4 sustained high-pressure traversal before making Android efficacy claims.

## D-027: Treat v2.3.6/S3 as unsuitable for Android-A efficacy and narrow Android claims

Date: 2026-09-01

Decision: do not use v2.3.6 S3 `pressureBurst` for Android-A tail-control efficacy claims or Android confirmatory efficacy collection. For the current manuscript route, Android evidence is narrowed to cross-device executability, telemetry validity, and low-pressure boundary behavior. Desktop devices carry any future S3 efficacy comparison unless a later protocol version defines a platform-independent S4 workload with an admission criterion before running Proposed.

Evidence: the diagnostic-only fixed-SSE-4 Android-A records are both valid, use `fixedDiagnostic`, and are excluded from formal aggregation. D1/S3 loaded 116 tiles, transferred 78,922,006 bytes, reached `requestQueuePeak=39`, and still had P95/P99 `16.7 ms`, raw max `33.1 ms`, and `frameBudgetViolationRate=0.0`. D2/S3 loaded 108 tiles, transferred 91,659,806 bytes, reached `requestQueuePeak=39`, and still had P95/P99 `16.7 ms`, raw max `18.2 ms`, and `frameBudgetViolationRate=0.0`. These results agree with the prior Android-A D1/S3 and D2/S3 six-method pilots, where all valid methods had zero `P95 > 33.33 ms` violations despite request-pressure exposure.

Reason: repeating S3 on Android-A would add volume but little comparative information because the workload sits at the floor of the phone's observed frame-time distribution. Narrowing the Android claim avoids a false cross-platform efficacy statement and is methodologically cleaner than post-hoc tuning a workload specifically until Android drops frames. S4 remains a valid future path only if the paper strategy requires mobile efficacy; it must be versioned and defined by platform-independent traversal/load criteria rather than by the observed Android result.

## D-028: Diagnose PC-B server topology before desktop route or S4 decisions

Date: 2026-09-02

Decision: add and complete a diagnostic-only PC-B fixed-SSE-4 server-topology A/B check before any confirmatory collection, additional remote-server PC-B/S3 repeats, or S4 design. The diagnostic uses the existing `fixedDiagnostic` method at `SSE=4`, D1 `bagAmsterdam`, S3 `pressureBurst`, `networkProfile=lan`, seed `20260823`, and records `studyPhase=diagnostic`, `diagnosticPurpose=server-topology-identifiability`, `fixedSse=4`, `excludeFromFormalAggregation=true`, `serverTopology`, `pageOrigin`, and `pageHost`. It is excluded from the frozen six-method method set, pilot queues, confirmatory queues, and six-method aggregation.

Evidence: PC-B has one valid accidental D1/S3 six-method full pilot with complete paired blocks but zero tail-frame violations across all methods despite substantial request/content pressure, and one later low-pressure six-method probe that is audit-only because the raw manifests record `deviceId=unregistered`. This created an unresolved confounder because PC-B was using a remote LAN server path. The completed diagnostic has two valid records in `results/analysis/server_topology_diagnostics.csv`. The remote-server run (`pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtk2udpi`, `pageOrigin=http://192.168.0.112:8088`) stayed at zero window violations with frame-window P95/P99 `16.90/16.90 ms`, raw max `33.30 ms`, frame-over-budget rate `0.0`, request queue peak `40`, 159 tiles, 110.6 MB transferred, and resource/tile-load peaks of 18/7 events per 100 ms and 24/8 per 500 ms. The local-server run (`pc-b-bagAmsterdam-pressureBurst-fixedDiagnostic-r1-mtlgfjw1`, `pageOrigin=http://localhost:8088`) produced 4 of 76 over-budget control windows (`violationRate=0.0526`), frame-window P95/P99 `21.03/33.40 ms`, raw max `50.10 ms`, frame-over-budget rate `0.00378`, request queue peak `61`, 174 tiles, 124.7 MB transferred, and much burstier resource/tile-load peaks of 29/47 events per 100 ms and 77/74 per 500 ms. The first local over-budget window coincided with a `requestQueue=61` burst in `recovery-1`, followed by rolling-window tail persistence.

Reason: the diagnostic supports the second preregistered outcome: local-server delivery produces measurably stronger and burstier tail/request/content pressure than the remote LAN server path. Therefore the earlier remote-server PC-B D1/S3 low-pressure pilot/probe cannot be used to conclude that S3 is inherently uninformative on PC-B. Treat remote server topology as a material confounder for PC-B S3 identifiability. The next low-cost route is a PC-B local-server D1/S3 six-method pressure probe with correct `deviceId=pc-b`; confirmatory collection and S4 design remain blocked until that local-server probe is interpreted.

## D-029: Accept PC-B local-server D1/S3 probe and require a local full pilot gate

Date: 2026-09-03

Decision: accept the PC-B local-server D1/S3 `pressureBurst` six-method pressure probe as valid pilot evidence that S3 is not automatically rejected for PC-B once the remote-server topology confounder is removed. Do not enter confirmatory collection yet and do not design S4 yet. The next gate is a PC-B local-server D1/S3 four-repeat full pilot using the fixed `Run D1/S3 pressureBurst pilot` path, correct `deviceId=pc-b`, seed `20260823`, and `pageOrigin=http://localhost:8088`.

Evidence: the local-server pressure probe produced six valid `pc-b + bagAmsterdam + pressureBurst` pilot rows with `pilotPurpose=request-peak-probe-v2.3.6-pressure-burst`, `serverTopology=local`, `pageOrigin=http://localhost:8088`, and no invalid reasons. PI produced 4 of 76 over-budget control windows (`violationRate=0.0526`), frame-window P95/P99 `21.02/33.37 ms`, raw max `50.10 ms`, request queue peak `61`, 170 tiles, and 121.2 MB transferred. Fixed8, Reactive, and Proposed had zero P95-window violations but nonzero raw over-budget frames and meaningful request/content pressure: Fixed8 queue peak `60`, 134 tiles, 94.1 MB; Reactive queue peak `49`, 170 tiles, 121.2 MB; Proposed queue peak `42`, 153 tiles, 107.3 MB, 58 load-progress events, and 9 pressure-safe-hold windows. Cesium dynamic and Fixed16 remained light, as expected for coarser or dynamic refinement.

Reason: the local probe establishes a usable workload signal on PC-B local-server delivery, but one paired block is not enough to freeze the desktop route or make method-effect claims. Proposed avoided P95-window violations while PI showed measurable tail pressure, but Proposed did not produce pressure-tail overlap, preemptive opportunities, or exact `predicted-tail-plus-request-pressure` actions in this single probe. A four-repeat local full pilot is the proportionate next step to test repeatability before deciding whether PC-B S3 can join the desktop confirmatory route. The earlier remote-server PC-B full pilot and misregistered probe remain audit evidence only for topology confounding, not evidence against S3 under local delivery.

## D-030: Accept PC-B local-server D1/S3 full pilot as passing the desktop S3 route gate

Date: 2026-09-04

Decision: accept the PC-B local-server D1/S3 `pressureBurst` four-repeat full pilot as valid pilot evidence and as passing the desktop S3 route/repeatability gate. The current desktop efficacy route can proceed to a separate confirmatory-release preparation step using local-server desktop collection. Do not start confirmatory collection yet, and do not click the existing `Run main batch` entry until a new confirmatory-release decision has frozen the intended matrix, method order, repeats, seeds, browser/device conditions, server-topology requirement, and analysis inputs. The existing Android-A v2.3.6/S3 claim remains narrowed to executability and low-pressure boundary behavior.

Evidence: the PC-B local-server full pilot added 24 valid `pc-b + bagAmsterdam + pressureBurst` pilot rows in four complete six-method paired blocks, all with `serverTopology=local`, `pageOrigin=http://localhost:8088`, `pilotPurpose=full-pilot-v2.3.6-pressure-burst`, and no invalid reasons. PI showed repeatable measurable tail pressure in three of four repeats: violation rates `0.0533/0.0526/0.0526/0.0`, P95 about `21.77/21.02/21.02/21.00 ms`, P99 about `33.37/33.37/33.37/33.30 ms`, raw max up to `50.10 ms`, queue peaks `61/62/63/65`, 170-173 tiles, and about 115.6-116.5 MB transferred. Proposed had zero P95-window violations in all four repeats, P95/P99 about `16.81-16.90/16.90-17.00 ms`, raw max `33.40 ms`, queue peak `42` in every repeat, 153-155 tiles, about 102.4-103.2 MB transferred, and 9/10/10/10 pressure-safe-hold windows. Fixed8 and Reactive showed substantial request/content pressure with queue peaks up to `62` and `50`, nonzero raw over-budget-frame rates, and raw max up to about `50 ms`, but zero P95-window violations.

Reason: the local full pilot closes the D-029 uncertainty: under PC-B local-server delivery, S3 is not a floor-effect workload for every high-quality/adaptive reference, and it remains below complete saturation. This is enough to prepare a desktop confirmatory route, especially when combined with the earlier PC-A v2.3.6 full pilot that showed stronger tail pressure and repeatable Proposed pressure taxonomy. It is still not a manuscript effect claim: PC-B Proposed did not show pressure-tail overlap, preemptive opportunities, or exact `predicted-tail-plus-request-pressure` actions in the full pilot, so mechanism claims must remain tied to the PC-A pilot/probe and future confirmatory/ablation evidence. S4 is not needed for the current desktop route, but remains a future option only if Android efficacy becomes paper-critical.

## Update Rule

Add a new decision when the protocol, datasets, evidence boundary, frozen parameters, or manuscript claim boundary changes. Reference the supporting file or raw result when available.
