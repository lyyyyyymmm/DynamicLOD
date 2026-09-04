# Frozen Experiment Protocol

Protocol version: `2.3.6`
Freeze date for Android-A pilot: 2026-08-31

Protocol v2.3.6 is a frozen Android-A pilot protocol after the
v2.3.5 PC-A full pilot showed that high request-pressure taxonomy was not
repeatable across Proposed repeats. It adds `pressureBurst` as a separate S3
candidate workload; the PC-A pressure probe and full pilot passed their
pre-confirmatory workload/repeatability gates. The
controller thresholds, datasets, SSE ladder, request-pressure logic, readiness
gate, analysis taxonomy, and statistical plan remain unchanged from v2.3.5. All
v2.x probe and pilot records remain audit evidence until the confirmatory matrix
is separately frozen and started.

D-026 adds an Android-A workload-identifiability diagnostic after the v2.3.6
Android-A D1/S3 and D2/S3 pilots both produced valid low-pressure evidence. This
diagnostic uses fixed `SSE=4` through `fixedDiagnostic`, records
`studyPhase=diagnostic`, and is explicitly excluded from the formal six-method
method set, pilot aggregation, confirmatory aggregation, and manuscript efficacy
claims.

D-027 interprets the completed diagnostic as a floor effect on Android-A under
v2.3.6/S3. Android-A is retained for cross-device executability, telemetry
validity, and low-pressure boundary behavior, but not for S3 tail-control
efficacy. A future Android efficacy claim requires a new protocol version with a
platform-independent high-pressure workload and predeclared admission criterion.

D-028 adds and completes a PC-B server-topology diagnostic after PC-B D1/S3
pilot/probe evidence also showed low tail pressure. The diagnostic compares the
same D1/S3 fixed `SSE=4` condition when PC-B receives benchmark assets from the
remote LAN server versus a PC-B local server. It records
`diagnosticPurpose=server-topology-identifiability` and remains outside the
formal six-method method set, pilot aggregation, confirmatory aggregation, and
efficacy claims. The completed diagnostic shows stronger tail/request/content
pressure under PC-B local-server delivery, so remote LAN delivery is treated as
a material confounder for PC-B S3 identifiability.

D-029 accepts the follow-up PC-B local-server D1/S3 six-method pressure probe as
valid pilot evidence. It shows that S3 can produce a usable pressure signal under
PC-B local delivery, including measurable PI tail pressure and substantial
Proposed request/content exposure. It does not release confirmatory collection:
PC-B still requires a local-server four-repeat D1/S3 full pilot before a desktop
route/freeze decision.

D-030 accepts the completed PC-B local-server D1/S3 four-repeat full pilot as
passing the desktop S3 route/repeatability gate. The desktop route can now move
to confirmatory-release preparation, but formal collection is still closed until
D-031 freezes the intended matrix and verifies the run entry point. The current
historical main-batch queue must not be used blindly because it still targets
the older `steady` / `burst` matrix rather than the newly gated S3
`pressureBurst` route.

## Research Question

Can a lightweight scheduler combining short-term tail-frame prediction, public 3D Tiles request feedback, interaction state, and stability guards reduce P95 frame-time budget violations while retaining visual quality on informative physical desktop Web clients? Under v2.3.6/S3, Android-A is used to characterize executability and low-pressure boundary behavior rather than efficacy.

The primary endpoint is the proportion of valid two-second control windows whose P95 frame time exceeds `1000/30 = 33.333... ms`. One complete browser run is the statistical unit. Frames and overlapping windows are not treated as independent observations.

## Frozen Controller

- Frame window: 2,000 ms; control interval: 500 ms; prediction horizon: 1,000 ms. Measured-phase control starts only after the first full frame window is available.
- Level estimator: `L_t = 0.4 P95_t + 0.6 L_(t-1)`.
- Trend: least-squares slope over the latest four level estimates.
- Forecast: `F_(t+1s) = max(P95_t, L_t + max(0, slope) * 1s)`.
- Public queue signal: the maximum `pendingRequests + processingTiles` observed from
  `loadProgress` within each 500 ms control interval. The interval-end queue is
  recorded separately for audit; this avoids losing requests that settle before a
  control tick.
- High pressure: two consecutive rises, a nonzero queue lasting 1,500 ms, or a single control-interval impulse `Q_t >= 24`; release after zero for 1,000 ms.
- SSE ladder: `4, 6, 8, 12, 16, 24, 32, 48, 64`; initial SSE: 16.
- Downgrade one level when current or forecast P95 exceeds the budget, and two levels above `1.2T`.
- Preemptive downgrade when the forecast exceeds `0.9T` and request pressure is high.
- Upgrade only after current and forecast P95 remain below `0.8T` for four updates, pressure is absent, and the interaction hold has expired.
- Interaction blocks upgrades but permits emergency downgrades; post-interaction hold is 1,500 ms.
- Downgrade and upgrade cooldowns: 500 and 1,500 ms.

Any controller change after confirmatory collection begins requires a protocol version increment and rerunning every affected condition.

## Data Roles

1. C0, Stanford Dragon discrete LOD: bundled calibration asset; excluded from confirmatory inference.
2. C1, generated 85-tile stress set: deterministic diagnostic and PI-tuning set; excluded from confirmatory inference.
3. D1, 3DBAG Amsterdam subset: primary real-world city dataset, 307 content tiles, approximately 193.6 MB.
4. D2, 3DBAG Rotterdam subset: spatially independent external-validation dataset, 244 content tiles, approximately 180.4 MB.
5. Helsinki Kalasatama: optional future cross-source validation; not ready and not in protocol v2.
6. Taipei 101 and Dayanta: optional demonstrations only. Their current `NOASSERTION` publication rights exclude them from statistics and manuscript evidence.

D1 and D2 are frozen from the official 3DBAG `v20250903` Cesium 3D Tiles repository under CC BY 4.0. Every local file is listed by path, byte size, and SHA-256 in `provenance.json`; the provenance file identity is also frozen in the experiment configuration.

## Methods and Tuning

The six confirmatory methods are fixed SSE 8, fixed SSE 16, Cesium dynamic SSE, reactive P95, discrete PI, and the proposed scheduler. The PI baseline was tuned once on C1/S2 with a `4 x 4` grid over `Kp={0.05,0.1,0.2,0.4}` and `Ki={0.01,0.02,0.05,0.1}`, four repeats per pair, under the diagnostic 40 ms response-delay profile. Selection minimizes violation rate, then time-weighted SSE and switching within a 0.01 absolute violation-rate band. The 64 unique valid PC-A tuning runs selected `Kp=0.40` and `Ki=0.05`; these gains are frozen before confirmatory collection.

`fixedDiagnostic` at `SSE=4` is diagnostic-only. It reuses the fixed controller to characterize whether Android-A can be pushed into an informative tail-pressure region under D1/S3 and D2/S3, and whether PC-B D1/S3 low pressure is sensitive to remote versus local benchmark-server topology. It is not a seventh formal benchmark method.

Ablations remove prediction, request pressure, interaction awareness, or stability guards one component at a time.

## Scenarios and Matrix

- Before either scenario, unload the previous tileset and run a method-independent blank-scene readiness gate. The formal policy samples 2-second frame-time windows and requires two consecutive windows with P95 <= 25 ms within 60 seconds. A timeout records `pre-run-frame-instability`, retains the attempt as invalid audit evidence, and triggers the existing retry policy.
- After readiness passes, wait for the first tile for at most 60 seconds. This loading gate is outside warm-up and measurement; a timeout invalidates the attempt. The drawing-buffer target is `960 x 540`; a one-pixel browser rounding tolerance is allowed and the actual size is retained per telemetry row.
- S1: 10-second fixed-SSE warm-up followed by a 40-second uniform orbit.
- S2: the same warm-up followed by four cycles of a 6-second cross-direction monotonic approach from range multiplier 3.6 to 0.9 and a 4-second stationary near-view recovery.
- S3 `pressureBurst`: the same warm-up followed by four cycles of a 4-second cross-direction monotonic approach from range multiplier 3.2 to 0.7 and a 6-second stationary near-view hold. This is the frozen v2.3.6 Android-A pilot workload and the accepted desktop-route candidate after D-030, but it is not confirmatory evidence until D-031 releases the formal matrix and run entry point.

Before a v2.3.6 full pilot, run one D1/S3 six-method `request-peak-probe` block.
The probe is pilot-only and records interval queue peaks plus `loadProgress` event counts.
The v2.1.1 probe confirmed that the retained peak reaches the controller, but the original
S2 path still produced only isolated queue pulses. v2.2.0 added a longer, cross-direction
close sweep; its probe remained below the 1.5-second persistence gate. v2.2.1 added
continuous recovery drift, but two PC-A probes loaded only the seven external roots.
Comparison with the stationary v2.2.0 recovery identified camera motion as the workload
defect. v2.2.2 therefore ends each monotonic approach at a near viewpoint and holds it
stationary during recovery. Its PC-A probe passed the workload and request-pressure gates,
but the smoothed projection lagged below the current P95 and missed the preemptive action.
Protocol v2.3.0 lower-bounded the forecast by current P95 without changing the workload
or decision thresholds. Its PC-A probe then showed active loading and large queue pulses,
but those pulses released before the 1.5-second persistence gate. Protocol v2.3.1 therefore
adds the `Q_t >= 24` pressure-impulse latch while preserving the forecast, workload,
thresholds, and baselines. The v2.3.1 PC-A probe satisfied the mechanism gate: the valid
proposed run reported high request pressure and one `predicted-tail-plus-request-pressure`
action. The v2.3.1 full pilot then failed the freeze gate because Proposed repeats
entered inconsistent workload regimes. Protocol v2.3.2 isolated fixed-SSE warmup from
measured controller state and removed no-op coarsest-SSE downgrade inflation. Its PC-A
full pilot stabilized Proposed across four valid repeats, but repeat-2 PI, fixed16,
and Cesium dynamic runs showed a consecutive system-level frame-time elevation without
matching request pressure. Protocol v2.3.3 therefore adds the pre-run blank-scene
readiness gate. Two PC-A v2.3.3 pressure probes then passed readiness and workload
gates but exposed that a single exact action name is too narrow as a mechanism
gate: one probe overlapped pressure with an already over-budget tail frame, while
the second observed pressure when tail risk was still low. Protocol v2.3.4
therefore revised only the analysis taxonomy. Its PC-A probe then produced
format-valid records, but the Proposed run downgraded on a partially filled
start-of-measurement P95 window before meaningful request pressure appeared.
Protocol v2.3.5 therefore delays the first measured controller update until the
full 2-second frame-time window is available. Its PC-A full pilot passed
execution checks but did not expose high-pressure taxonomy repeatably across
Proposed repeats. Protocol v2.3.6 therefore adds S3 `pressureBurst` as a
deliberately versioned workload-intensity revision. The v2.3.6 PC-A pressure
probe and full pilot passed the pre-confirmatory workload gate, so D-025 freezes
v2.3.6 for Android-A pilot. The later Android-A pilots and fixed4 diagnostic
showed a floor effect, so S3 Android efficacy is removed from the current
confirmatory route. PC-B then required a server-topology diagnostic because its
first remote-server pilot was low-pressure; local-server diagnostic/probe/full
pilot evidence now shows that S3 is viable enough for the desktop route. Formal
collection still requires a separate D-031 release decision and queue
verification.

All confirmatory runs use the `lan` profile. Artificial delay profiles are diagnostic-only and are rejected for D1/D2 by the server.

The historical main matrix in the current implementation contains 216 runs per physical device: D1/S1 has 8 paired repeats, D1/S2 has 12, D2/S1 has 8, and D2/S2 has 8; every block contains six methods in seed-shuffled order. This entry point predates the D-030 S3 route decision and is not approved for new formal collection. D-031 must either explicitly freeze this older matrix or update the run queue/UI to the intended S3 `pressureBurst` desktop matrix before `Run main batch` is used. The ablation matrix likewise requires D-031 release if the primary route changes to S3. PI calibration adds 64 pilot runs on the designated tuning PC and is never pooled with confirmation data.

The current SCI target design uses at least two distinct desktop PCs for efficacy and one physical Android phone for executability / low-pressure boundary characterization, all with hardware-accelerated Chrome, a fixed `960 x 540` drawing buffer, no terrain or imagery, and the same server assets. PC-B was registered on 2026-09-02 with Intel Core Ultra 7 258V CPU, Intel Arc 140V GPU, 32 GB RAM, Windows 11 Home Chinese edition 25H2, Chrome 150.0.7871.115, 60 Hz display refresh, Wi-Fi, and Best performance power mode. Its run-day provenance records plugged-in power, Wi-Fi SSID `TP318`, Chrome GPU hardware acceleration with active Intel Arc 140V evidence, and actual `960 x 540` benchmark drawing buffer. Device IDs represent physical devices, not browser viewport presets. A subsequent PC-B D1/S3 pilot remained near one 60 Hz frame with zero over-budget frames across all methods despite substantial request/content pressure. Because that PC-B evidence used a remote LAN server path, D-028 required a remote/local server-topology fixed4 diagnostic. The completed diagnostic showed that local-server delivery produced stronger tail pressure and much burstier resource/tile arrivals. D-029 then accepted a PC-B local-server six-method pressure probe as valid pilot evidence, and D-030 accepts the PC-B local-server four-repeat full pilot as passing the desktop S3 route gate. Formal desktop efficacy collection remains closed until D-031 freezes and verifies the confirmatory matrix and local-server operation.

## Validity Rules

A run is invalid if the pre-run readiness gate times out, first content does not arrive within the 60-second loading gate, the page is hidden, focus is lost, the drawing buffer differs from the `960 x 540` target by more than one pixel, no valid windows are recorded, Resource Timing evidence is absent, or any tile fails. Invalid attempts remain in the audit trail and are automatically retried at most twice. Before each session record browser version, OS, CPU/SoC, GPU, RAM, refresh rate, power state, and connection type. Android viewport emulation is UI testing only.

## Metrics and Prediction Diagnostics

The primary metric is P95-window violation rate. Secondary metrics are frame P95/P99, over-budget-frame proportion, control-interval request-queue peak and AUC, `loadProgress` event count, resource count and bytes, time-weighted SSE, visible geometric error, first stable display, recovery time, switches per minute, reversals, and controller-state residence.

Forecast reporting includes one-second-horizon MAE, persistence-baseline MAE, violation precision/recall/F1, and warning lead time. Visual calibration uses six canonical views at every SSE level against SSE 4, reporting SSIM and, when the optional frozen LPIPS environment is installed, LPIPS. LPIPS is supplementary and cannot replace the prespecified SSIM non-inferiority decision.

## Statistical Analysis

Friedman tests use complete six-method blocks and are reported separately by physical device, dataset, and scenario. Planned two-sided paired Wilcoxon tests compare proposed against PI, reactive, and Cesium dynamic SSE within the same strata, followed by global Holm correction. Reports include Hodges-Lehmann paired differences, matched-pairs rank-biserial effects, and 10,000-resample paired bootstrap 95% confidence intervals with seed `20260823`. No pooled cross-device p value is used to satisfy the gate.

The minimum submission gate will be evaluated on the D-031 frozen desktop efficacy matrix: at least a 20% median relative violation-rate reduction versus reactive on every efficacy device in the primary pressure stratum; Holm-adjusted `p < 0.05` in the prespecified stratified comparisons; SSIM non-inferiority within 0.02; no higher switching frequency; forecast MAE below persistence MAE; and the same effect direction on the frozen external-validation dataset/stratum. Failure of any gate is reported rather than repaired by post hoc parameter changes.

Android-A v2.3.6 D1/S3 and D2/S3 pressureBurst pilots are retained as valid low-pressure pilot evidence. The completed fixed-SSE-4 diagnostic remained near one 60 Hz frame with zero over-budget frames despite substantial request/content pressure, so S3 is unsuitable for Android efficacy comparison. The current manuscript route narrows Android claims to executability and low-pressure boundary behavior. If Android efficacy becomes necessary later, the project must define a new platform-independent S4 workload under a new protocol version before running Proposed.

PC-B v2.3.6 D1/S3 pressureBurst pilot/probe evidence was low-pressure under the
remote-server path, but the completed server-topology fixed4 diagnostic shows that
PC-B local-server delivery produces stronger and burstier tail/request/content pressure.
Therefore remote LAN server delivery is a material confounder for PC-B S3
identifiability. This diagnostic remains an exploratory validity check only and does
not enter formal statistical tests. The follow-up local-server six-method pressure
probe and four-repeat full pilot were valid and showed pilot-level pressure
observability/repeatability, so D-030 accepts the desktop S3 route gate. A separate
D-031 confirmatory-release decision is still required before any formal PC-B or
cross-desktop S3 collection.
