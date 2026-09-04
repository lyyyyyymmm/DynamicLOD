# Predictive Dynamic LOD Scheduling for Web 3D Tiles under Tail Frame-Time Constraints

## Abstract

Interactive Web 3D applications must balance visual detail, frame-time stability, and asynchronous tile loading across devices with different rendering capacities. Existing screen-space-error selection provides view-dependent refinement, but a fixed threshold cannot respond to transient rendering and request pressure. This paper presents a lightweight runtime scheduler for Web 3D Tiles that adjusts the maximum screen-space error under a P95 frame-time budget. The method combines a one-second positive-trend forecast of rolling P95 frame time, public tile-request feedback, interaction-aware asymmetric decisions, and hysteresis-based stability control. Under the current evidence route, efficacy is evaluated against two fixed thresholds, Cesium's dynamic screen-space-error option, a reactive P95 controller, and a discrete PI controller on informative desktop Web clients, while the physical Android phone is reported as executability and low-pressure boundary evidence because the v2.3.6/S3 fixed4 diagnostic showed a floor effect. **[RESULT_REQUIRED: insert paired violation-rate effect, adjusted p value, SSIM non-inferiority result, and stability result only after the formal matrix is complete.]** The study is positioned as a client-side scheduling method rather than a new mesh simplification or 3D Tiles encoding technique.

**Keywords:** Web 3D; 3D Tiles; level of detail; tail frame time; runtime adaptation; WebGIS

## 1. Introduction

Web-based visualization increasingly delivers photogrammetry, buildings, engineering models, and cultural-heritage assets directly to commodity browsers. Hierarchical level of detail is essential because the complete geometry and texture payload often exceeds the memory, bandwidth, or rendering capacity available in a single frame. The 3D Tiles standard represents refinement through geometric error and screen-space error (SSE), enabling clients to decide whether a visible tile is sufficiently detailed for the current view [@OGC3DTiles2022]. In practice, however, a fixed maximum SSE expresses a quality preference rather than an explicit runtime performance constraint.

Adaptive display under a target frame time has a long history in interactive graphics. Funkhouser and Sequin formulated display selection as maximizing quality within a user-specified frame-time budget [@Funkhouser1993]. Modern Web 3D clients add two complications. First, frame-time distributions are heavy-tailed during camera movement, resource decoding, JavaScript work, and GPU synchronization, so a mean frame rate can hide visible stalls. Second, hierarchical tile refinement triggers asynchronous network and processing queues whose short-term pressure is not represented by the current frame time alone.

This study asks whether a lightweight, interpretable controller can use recent P95 frame time, its short-term trend, public request feedback, and interaction state to reduce budget violations without excessive detail loss or control oscillation. The actuator is Cesium's `maximumScreenSpaceError`; Cesium remains responsible for geometric-error projection, visibility, and tile refinement. The method therefore augments rather than replaces the standard 3D Tiles selection pipeline.

The contributions are:

1. A tail-constrained Web 3D Tiles controller that forecasts one-second P95 load from a rolling, smoothed trend.
2. A request- and interaction-aware decision rule that permits emergency degradation during interaction while delaying quality recovery until both frame and request pressure are stable.
3. A reproducible paired evaluation protocol using two frozen real-world 3DBAG subsets, fixed rendering resolution, deterministic camera paths, public Cesium telemetry, a tuned PI baseline, component ablations, physical desktop efficacy testing, and Android executability / boundary characterization.

## 2. Related Work

### 2.1 Level of detail and Web delivery

Quadric error metrics provide an efficient basis for generating simplified mesh representations [@Garland1997] and support the offline preparation pipeline used by our controlled models. This offline contribution is distinct from runtime scheduling. Mobile and WebGL terrain studies have shown that camera movement, memory, and rendering workload interact with LOD selection across iOS, Android, and browser implementations [@Suarez2015]. Cultural-heritage systems likewise use semantically organized multiresolution representations to make detailed assets accessible through Web interfaces [@Auer2014]. These studies motivate multiresolution delivery but do not directly regulate tail frame time using live 3D Tiles request pressure.

### 2.2 Runtime quality adaptation

Early adaptive rendering selected representations to maintain an interactive target frame time [@Funkhouser1993]. Yang et al. continuously adjusted framebuffer LOD through a simple target-frame-rate control mechanism [@Yang2008], while Zhang et al. combined online prediction and runtime quality estimation under a power budget on desktop and mobile platforms [@Zhang2018]. These studies justify both feedback-control and predictive baselines. Our work targets browser tail frame time and uses lightweight signals exposed during 3D Tiles streaming rather than framebuffer resolution or power as the controlled objective.

## 3. Method

### 3.1 Objective and telemetry

Let `T = 33.333 ms` denote the 30 FPS frame-time budget. Frame intervals are sampled with `requestAnimationFrame`. Every 500 ms, the client computes `P_t`, the 95th percentile over the latest two-second window. The primary constraint is `P_t <= T`; the quality objective is to select the smallest feasible maximum SSE from the discrete ladder `{4, 6, 8, 12, 16, 24, 32, 48, 64}`.

Request pressure is observed through the public `Cesium3DTileset.loadProgress` event. At update `t`, `Q_t` is the sum of pending requests and tiles being processed. Public `tileLoad` and `tileVisible` events provide loading and visible-geometric-error diagnostics without relying on private engine statistics.

Before each measured condition, the previous tileset is unloaded and a method-independent blank-scene readiness gate is evaluated. The formal gate requires two consecutive two-second windows with P95 frame time at or below 25 ms within a 60 s timeout. A timeout is recorded as `pre-run-frame-instability`, retained as an invalid audit attempt, and retried under the existing policy. After readiness passes, the target tileset is loaded and a ten-second fixed-SSE-16 warm-up is executed without updating the adaptive controller or the formal rolling-P95 window; controller state and frame history are reset at measurement start.

### 3.2 Short-term forecast

The controller maintains an exponentially smoothed level

`L_t = 0.4 P_t + 0.6 L_(t-1)`.

A least-squares slope is fitted to the latest four level estimates. Only a positive trend contributes to the one-second forecast:

`F_(t+1) = max(P_t, L_t + max(0, slope_t) * 1 s)`.

This asymmetric forecast treats rising load as an early-warning signal, prevents a falling trend from triggering premature quality recovery, and ensures that smoothing cannot place the forecast below the already observed current tail.

### 3.3 Request and interaction states

Request pressure becomes high when `Q_t` rises for two consecutive updates, remains nonzero for 1.5 s, or reaches a single-interval impulse of at least 24 queued requests/processing tiles. It is released only after a zero queue persists for 1 s. Interaction state is supplied by the deterministic scenario driver during experiments and by browser input events in interactive use.

During interaction, upgrades are blocked, but frame-budget violations may still trigger emergency downgrades. Recovery begins 1.5 s after interaction ends. This asymmetry reflects the higher cost of a stall during active navigation and the lower urgency of restoring detail immediately after motion.

### 3.4 Stable control

If the current or forecast P95 exceeds `T`, SSE moves down one quality level. If it exceeds `1.2T`, SSE moves down two levels. If the forecast exceeds `0.9T` while request pressure is high, one preemptive downgrade is applied. An upgrade is permitted only when current and forecast P95 are below `0.8T`, request pressure is absent, interaction hold has expired, and four consecutive updates remain eligible. Downgrade and upgrade cooldowns are 0.5 and 1.5 s. The resulting states are `WARMUP`, `STABLE`, `PRESSURE`, `INTERACTING`, and `RECOVERY`.

## 4. Experimental Design

### 4.1 Systems and data

**[RESULT_REQUIRED: insert the complete desktop efficacy and physical-Android boundary-characterization hardware/browser table.]** All runs use hardware-accelerated Chrome and a fixed `960 x 540` drawing buffer. Terrain, imagery, and unrelated widgets are disabled.

The bundled Stanford Dragon discrete-LOD sample (C0) is used only for quality calibration. A four-level, 85-tile generated stress set (C1) is used only for deterministic diagnostics and PI tuning. Confirmatory inference uses two frozen subsets from the official 3DBAG `v20250903` Cesium 3D Tiles repository under CC BY 4.0 [@Peters2022; @ThreeDBAGCopyright2025]: Amsterdam (D1; 307 content tiles; approximately 193.6 MB) and a spatially independent Rotterdam subset (D2; 244 content tiles; approximately 180.4 MB). Every local asset is covered by a SHA-256 provenance manifest. Assets with unresolved publication rights, including the currently held Taipei 101 and Dayanta copies, are excluded from inferential evidence.

### 4.2 Baselines, scenarios, and ablations

The baselines are fixed SSE 8, fixed SSE 16, Cesium dynamic SSE initialized at 16, the existing reactive P95 controller, and a discrete PI controller. PI gains are selected once on C1/S2 from a prespecified `4 x 4` grid with four repeats per pair and are frozen before confirmation. The proposed method is additionally compared with four ablations that remove prediction, request pressure, interaction awareness, or stability guards.

S1 consists of the readiness gate, a ten-second warm-up, and a 40-second uniform orbit. S2 consists of the same readiness and warm-up phases followed by four interaction-recovery cycles. Each six-second interaction performs a cross-direction monotonic approach from 3.6 to 0.9 times the tileset bounding-sphere radius; the resulting near viewpoint is held stationary for the four-second recovery so selected refinement requests can complete. The current v2.3.6 pilot protocol also adds S3 `pressureBurst`, which shortens each approach to four seconds, moves closer to the tileset, and extends the stationary near-view hold to six seconds. S3 remains valid desktop pilot workload evidence, but Android-A S3 is not an efficacy condition because the fixed-SSE-4 diagnostic produced no measurable tail pressure. Method order is randomized within paired blocks. Per desktop efficacy device, D1/S1, D2/S1, and D2/S2 use eight six-method repeats; the primary D1/S2 condition uses twelve, yielding 216 main runs plus 32 ablation runs. All confirmatory runs use LAN routing; artificial response delays are restricted to diagnostics.

### 4.3 Metrics and analysis

The primary metric is the proportion of measured control windows with P95 frame time above `T`. Secondary metrics include raw-frame P95/P99, individual-frame budget violations, request peak and area under the queue curve, bytes transferred, time-weighted SSE, tile geometric error, switch rate, reversals, and recovery time. Visual quality is calibrated at six canonical views using windowed SSIM against an SSE 4 reference; LPIPS is a supplementary perceptual diagnostic when its software environment is frozen.

Invalidity rules are declared before collection: readiness timeout, first-content timeout, hidden page, lost focus, drawing-buffer deviation beyond one pixel, missing valid windows, absent Resource Timing evidence, or tile failure invalidate the attempt. Invalid attempts remain in the audit trail and are retried at most twice; no run is removed post hoc because its performance outcome is favorable or unfavorable.

Complete six-method blocks are analyzed with Friedman tests separately for each physical-device, dataset, and scenario stratum. Planned paired comparisons of the proposed method against PI, reactive, and Cesium dynamic SSE use two-sided Wilcoxon signed-rank tests followed by Holm correction. We report Hodges-Lehmann paired differences, matched-pairs rank-biserial effects, and paired bootstrap 95% confidence intervals. Forecast diagnostics include one-second-horizon MAE against persistence, violation precision/recall/F1, and warning lead time.

## 5. Results

### 5.1 Tail-frame constraint

**[RESULT_REQUIRED: device-stratified `descriptive_violation_rate.csv`, six-method Friedman results, proposed-versus-PI/reactive/Cesium Wilcoxon-Holm comparisons, effect sizes, and confidence intervals.]**

### 5.2 Quality-performance trade-off

**[RESULT_REQUIRED: time-weighted SSE, six-view SSIM, visible geometric error, and the predeclared 0.02 non-inferiority decision.]**

### 5.3 Stability and recovery

**[RESULT_REQUIRED: switches per minute, reversal count, and recovery latency for reactive and proposed controllers.]**

### 5.4 Ablation study

**[RESULT_REQUIRED: D1/S2 results for no-prediction, no-request, no-interaction, and no-stability variants on all physical devices.]**

### 5.5 Independent-dataset validation

**[RESULT_REQUIRED: D2 Rotterdam effects, uncertainty, and consistency relative to primary D1 Amsterdam findings.]**

## 6. Discussion

The proposed design is intentionally lightweight: it neither trains a device-specific model nor modifies the Cesium refinement implementation. Any measured advantage must therefore be interpreted as evidence for combining short-horizon tail forecasting and streaming state around an existing SSE actuator, not as evidence that a new LOD representation was invented.

The study has four predeclared limitations. First, two PCs and one phone do not represent the full hardware population, and the current Android-A S3 evidence supports executability and low-pressure boundary behavior rather than efficacy. Second, `requestAnimationFrame` measures user-observed browser cadence rather than isolated GPU time. Third, SSIM and LPIPS at canonical views are screen-space proxies and do not replace geometric error analysis. Fourth, D1 and D2 share the same 3DBAG production pipeline, so Rotterdam provides spatial transfer rather than a strong cross-source generalization test.

**[RESULT_REQUIRED: discuss only effects supported by the completed claim registry, including failures or trade-offs.]**

## 7. Conclusion

This paper defined and implemented an interpretable, tail-constrained dynamic LOD scheduler for Web 3D Tiles. The controller integrates a rolling P95 forecast, public request feedback, interaction-aware asymmetric decisions, and explicit stability guards through Cesium's standard SSE actuator. **[RESULT_REQUIRED: add a one-sentence evidence-based conclusion only after C1-C4 are resolved.]** Future work may evaluate more devices, refresh rates, network profiles, and learned predictors, but these extensions are outside the present claim scope.
