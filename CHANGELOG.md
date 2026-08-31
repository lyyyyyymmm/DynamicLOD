# Changelog

All notable protocol, implementation, and research-workflow changes are recorded here. Historical entries reconstructed from conversation and project records are marked accordingly.

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
- Reanalysis still reports zero valid confirmatory runs; all physical v2.0-v2.3.5 records remain pilot, tuning, legacy, or audit evidence only.

### Decision Gate

- Run the v2.3.6 PC-A `pressureBurst` pressure probe first, then the four-repeat PC-A full pilot if the probe exposes meaningful request-pressure evidence.
- Keep Android and confirmatory collection blocked until the v2.3.6 PC-A pilot gate passes and a separate freeze decision is recorded.

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
