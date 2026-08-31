# Data Dictionary

## RunManifest

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Result schema version. |
| `protocolVersion` | Frozen protocol identifier, currently `2.3.5`. |
| `runId` | Unique, filesystem-safe run identifier. |
| `createdAt` | ISO timestamp at manifest creation. |
| `method` | Baseline, proposed method, or ablation identifier. |
| `dataset` | Calibration/diagnostic or formal dataset identifier; protocol-v2 confirmation uses `bagAmsterdam` and `bagRotterdam`. |
| `scenario` | `steady` or `burst`. |
| `repeat` | Independent repetition number within a paired block. |
| `retryAttempt` | Zero for the scheduled attempt, one or two for automatic invalid-run replacements. |
| `seed` | Method-order and path seed. |
| `renderWidth`, `renderHeight` | Required drawing-buffer dimensions. |
| `warmupMs`, `measurementMs` | Frozen standard durations. |
| `initialContentTimeoutMs` | Maximum pre-warm-up wait for the first requested tile; 60,000 ms in protocol v2. |
| `drawingBufferTolerancePx` | Allowed browser rounding around the `960 x 540` drawing-buffer target; one pixel. |
| `readinessWindowMs` | Formal pre-run blank-scene readiness window length; 2,000 ms. |
| `readinessRequiredStableWindows` | Consecutive readiness windows required before a run proceeds normally; two windows. |
| `readinessP95ThresholdMs` | Maximum P95 frame time allowed in each formal readiness window; 25 ms. |
| `readinessTimeoutMs` | Maximum wait for pre-run readiness before invalidating the attempt; 60,000 ms. |
| `actualWarmupMs`, `actualMeasurementMs` | Actual durations; differ only in smoke tests. |
| `frameBudgetMs` | Tail-frame budget, `1000/30` ms. |
| `datasetVersion`, `sourceSha256`, `sourceLicense` | Frozen data identity and publication-rights fields. |
| `deviceId` | Researcher-assigned physical device identifier used for statistical strata. |
| `networkProfile` | `lan`, `delay40`, or `delay80`; delay profiles are diagnostic-only. |
| `studyPhase` | `tuning`, `pilot`, `confirmatory`, or `adHoc`; only `confirmatory` rows enter formal statistical tests. Legacy records are retained as audit evidence. |
| `pilotPurpose` | `request-peak-probe`, `full-pilot`, `none`, or `legacy`; identifies the non-confirmatory pilot intent. |
| `browserVersion`, `gpuRenderer` | Captured browser and WebGL renderer identity. |
| `methodParameters` | Frozen method-specific parameters, including PI gains during calibration. |
| `userAgent` | Browser and operating-system identifier. |
| `hardwareConcurrency`, `deviceMemoryGb` | Browser-exposed device metadata when available. |

## PreRunReadiness

| Field | Meaning |
| --- | --- |
| `policy.windowMs` | Actual readiness-window duration used by this run. Formal physical-device runs use 2,000 ms; smoke tests may use a shorter non-evidence policy. |
| `policy.requiredStableWindows` | Number of consecutive passing readiness windows required. |
| `policy.p95ThresholdMs` | P95 threshold for a readiness window. Formal runs use 25 ms. |
| `policy.timeoutMs` | Readiness timeout for this run. Formal runs use 60,000 ms. |
| `ready`, `timedOut` | Whether readiness passed or timed out. |
| `waitMs` | Time spent in the readiness gate before load/warm-up began or timeout was recorded. |
| `p95Ms` | P95 of the latest readiness window. |
| `checkCount`, `stableWindows` | Total readiness windows checked and current consecutive passing-window streak. |
| `windows` | Full auditable trace of readiness-window P95 values and pass/fail flags. |

## TelemetryRow

| Field | Meaning |
| --- | --- |
| `elapsedMs` | Time since measurement start. In protocol v2.3.5 and later, adaptive control rows are not recorded until the first full 2,000 ms frame-time window is available. |
| `phaseId`, `interacting` | Deterministic scenario phase and interaction flag. |
| `frameTimeMeanMs`, `frameTimeP95Ms`, `frameTimeP99Ms` | Two-second rAF window statistics. |
| `levelFrameTimeP95Ms` | EWMA level estimate. |
| `predictedFrameTimeP95Ms` | One-second positive-trend forecast, lower-bounded by the current window P95. |
| `pendingRequests`, `processingTiles` | Public `loadProgress` values at the end of a control interval. |
| `requestQueue` | Maximum public request queue observed during the control interval; this is the controller input and the basis of queue peak/AUC metrics. |
| `requestQueueEnd` | Public request queue at the control-interval end, retained to audit transient requests. |
| `loadProgressEventCount`, `loadProgressEventsInterval` | Cumulative and interval-local public `loadProgress` event counts. |
| `requestPressureHigh` | Queue-pressure state used by the controller. |
| `tilesLoadedTotal` | Cumulative public `tileLoad` event count. |
| `visibleTileEvents` | Number of `tileVisible` events in the control interval. |
| `visibleGeometricErrorMean`, `visibleGeometricErrorMax` | Public visible-tile geometric-error summaries. |
| `sse` | Applied `maximumScreenSpaceError`. |
| `controllerState`, `action`, `reason` | Auditable controller decision. |
| `drawingBufferWidth`, `drawingBufferHeight` | Per-window resolution validity check. |

## RunSummary

| Field | Meaning |
| --- | --- |
| `validWindowCount` | Number of measured control windows. |
| `violationWindowCount`, `violationRate` | Tail-budget violation count and proportion. |
| `requestPressureWindowCount` | Analysis-derived number of telemetry windows where `requestPressureHigh` was true. |
| `pressureSafeHoldCount` | Analysis-derived number of pressure windows where the controller held because both current and predicted P95 were below the preemptive threshold. |
| `pressureTailOverlapCount` | Analysis-derived number of pressure windows where current or predicted P95 exceeded the 33.33 ms tail budget. |
| `pressurePreemptiveOpportunityCount` | Analysis-derived number of pressure windows where predicted P95 exceeded 0.9 times the budget while current P95 had not yet exceeded the budget. |
| `pressurePreemptiveActionCount` | Analysis-derived number of `predicted-tail-plus-request-pressure` preemptive actions. |
| `missedPreemptiveOpportunityCount` | Analysis-derived number of preemptive-opportunity windows that were not labeled as `predicted-tail-plus-request-pressure`. |
| `tailDowngradeUnderPressureCount` | Analysis-derived number of tail-violation downgrades that occurred while request pressure was high. |
| `rawFrameTimeP95Ms`, `rawFrameTimeP99Ms` | Percentiles over measured rAF frame intervals. |
| `frameBudgetViolationRate` | Proportion of individual frame intervals over budget; secondary only. |
| `timeWeightedMeanSse` | Runtime quality-control proxy; lower is more detailed. |
| `requestQueuePeak`, `requestQueueAuc` | Peak and time integral of the control-interval request maxima. |
| `loadProgressEventCount` | Total public `loadProgress` event count across the run. |
| `switchCount`, `reversalCount`, `switchesPerMinute` | Controller stability metrics. |
| `firstStableDisplayMs` | Time from post-load initialization to one second of an empty queue after content load. |
| `resourceCount`, `transferBytes`, `encodedBodyBytes` | Resource Timing API totals for the unique run route. |
| `stateWindowCounts` | Number of control windows in each controller state. |
| `predictionMaeMs`, `persistenceMaeMs` | One-second forecast MAE and current-P95 persistence baseline MAE. |
| `violationPrecision`, `violationRecall`, `violationF1` | Forecasted tail-violation classification diagnostics. |
| `meanWarningLeadMs` | Mean lead time of true-positive warnings before a future tail violation. |
| `preRunReadinessReady` | Flattened readiness pass/fail flag for CSV and analysis joins. |
| `preRunReadinessWaitMs` | Flattened readiness wait time. |
| `preRunReadinessP95Ms` | Flattened latest readiness-window P95. |
| `preRunReadinessCheckCount` | Flattened readiness-window count. |

Non-finite JavaScript values are converted to JSON `null`; CSV cells are left empty. Formal analysis must never silently replace missing values with zero.
