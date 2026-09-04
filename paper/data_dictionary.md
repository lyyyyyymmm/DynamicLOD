# Data Dictionary

## RunManifest

| Field | Meaning |
| --- | --- |
| `schemaVersion` | Result schema version. |
| `protocolVersion` | Frozen protocol identifier, currently `2.3.6`. |
| `runId` | Unique, filesystem-safe run identifier. |
| `createdAt` | ISO timestamp at manifest creation. |
| `method` | Baseline, proposed method, ablation identifier, or diagnostic-only identifier. `fixedDiagnostic` is not part of the formal six-method set. |
| `dataset` | Calibration/diagnostic or formal dataset identifier; protocol-v2 confirmation uses `bagAmsterdam` and `bagRotterdam`. |
| `scenario` | `steady`, `burst`, or v2.3.6 `pressureBurst`. |
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
| `studyPhase` | `tuning`, `pilot`, `diagnostic`, `confirmatory`, `confirmatory-ablation`, or `adHoc`; only D-031-approved `confirmatory` rows enter main formal statistical tests. Legacy records are retained as audit evidence. |
| `pilotPurpose` | `request-peak-probe`, `full-pilot`, `none`, or `legacy`; identifies the non-confirmatory pilot intent. |
| `diagnosticPurpose` | Diagnostic-only purpose label, such as `android-workload-identifiability`; `none` otherwise. |
| `confirmatoryRelease` | Formal release identity. Current main efficacy rows must be `D-031`; legacy S1/S2 queues are marked `legacy-s1s2-unreleased`. |
| `confirmatoryRole` | D-031 stratum role, such as `primary-efficacy`, `external-validation`, `mechanism-ablation`, or `none`. |
| `ablationPurpose` | Ablation-only purpose label, currently `d031-d1-s3-mechanism` for frozen D1/S3 mechanism ablations; `none` otherwise. |
| `fixedSse` | Fixed SSE value for diagnostic-only fixed-SSE runs, such as Android fixed4; empty otherwise. |
| `excludeFromFormalAggregation` | Boolean flag marking records that must be excluded from pilot, confirmatory, and six-method aggregation. Diagnostic fixed4 records set this to true. |
| `serverTopology` | Diagnostic server-delivery label, currently `remote`, `local`, or `unspecified`; used for PC-B server-topology identifiability checks only. |
| `pageOrigin`, `pageHost` | Benchmark page origin/host captured at runtime to audit whether a diagnostic run came from a LAN server or a local server. |
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
| `rawFrameTimeMaxMs` | Maximum measured rAF frame interval; diagnostic characterization only unless explicitly promoted in a later protocol. |
| `frameTimeOver20Rate` | Diagnostic proportion of individual frame intervals over 20 ms, useful for Android missed-frame characterization but not the formal protocol target. |
| `frameBudgetViolationRate` | Proportion of individual frame intervals over budget; secondary only. |
| `frameTimeHistogram` | Diagnostic frame-time histogram with bins around 20 ms, the 33.33 ms budget, 50 ms, and 66.67 ms. |
| `timeWeightedMeanSse` | Runtime quality-control proxy; lower is more detailed. |
| `requestQueuePeak`, `requestQueueAuc` | Peak and time integral of the control-interval request maxima. |
| `loadProgressEventCount` | Total public `loadProgress` event count across the run. |
| `switchCount`, `reversalCount`, `switchesPerMinute` | Controller stability metrics. |
| `firstStableDisplayMs` | Time from post-load initialization to one second of an empty queue after content load. |
| `resourceCount`, `transferBytes`, `encodedBodyBytes` | Resource Timing API totals for the unique run route. |
| `resourceCompletionPeak100Ms`, `resourceCompletionPeak250Ms`, `resourceCompletionPeak500Ms` | Diagnostic-only peak count of benchmark asset completions in 100, 250, and 500 ms bins. Used to compare delivery burstiness between remote and local server topology. |
| `resourceCompletionTransferBytesPeak100Ms`, `resourceCompletionTransferBytesPeak250Ms`, `resourceCompletionTransferBytesPeak500Ms` | Diagnostic-only peak transferred bytes completed in 100, 250, and 500 ms bins. |
| `tileLoadPeak100Ms`, `tileLoadPeak250Ms`, `tileLoadPeak500Ms` | Diagnostic-only peak public `tileLoad` event count in 100, 250, and 500 ms bins. |
| `loadProgressEventPeak100Ms`, `loadProgressEventPeak250Ms`, `loadProgressEventPeak500Ms` | Diagnostic-only peak public `loadProgress` event count in 100, 250, and 500 ms bins. |
| `loadProgressQueuePeak100Ms`, `loadProgressQueuePeak250Ms`, `loadProgressQueuePeak500Ms` | Diagnostic-only peak public request queue observed inside 100, 250, and 500 ms load-progress bins. |
| `resourceCompletionBins100Ms`, `resourceCompletionBins250Ms`, `resourceCompletionBins500Ms` | JSON diagnostic bin summaries for benchmark asset completion timing and bytes. |
| `tileLoadBins100Ms`, `tileLoadBins250Ms`, `tileLoadBins500Ms` | JSON diagnostic bin summaries for public `tileLoad` event timing. |
| `loadProgressBins100Ms`, `loadProgressBins250Ms`, `loadProgressBins500Ms` | JSON diagnostic bin summaries for public `loadProgress` event timing and request-queue peaks. |
| `stateWindowCounts` | Number of control windows in each controller state. |
| `predictionMaeMs`, `persistenceMaeMs` | One-second forecast MAE and current-P95 persistence baseline MAE. |
| `violationPrecision`, `violationRecall`, `violationF1` | Forecasted tail-violation classification diagnostics. |
| `meanWarningLeadMs` | Mean lead time of true-positive warnings before a future tail violation. |
| `preRunReadinessReady` | Flattened readiness pass/fail flag for CSV and analysis joins. |
| `preRunReadinessWaitMs` | Flattened readiness wait time. |
| `preRunReadinessP95Ms` | Flattened latest readiness-window P95. |
| `preRunReadinessCheckCount` | Flattened readiness-window count. |

Non-finite JavaScript values are converted to JSON `null`; CSV cells are left empty. Formal analysis must never silently replace missing values with zero.
