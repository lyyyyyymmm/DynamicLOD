# Claim Registry

| ID | Planned claim | Required evidence | Current status |
| --- | --- | --- | --- |
| C1 | The proposed method lowers P95-window violation rate versus reactive and PI control on informative desktop Web clients. | Complete six-method D-031 confirmatory blocks on `pc-a` and `pc-b`, local-server only, D1/S3 x12 and D2/S3 x8, device-stratified Wilcoxon-Holm results, effect sizes and CIs. Android-A v2.3.6/S3 is excluded from this efficacy claim because the fixed4 diagnostic showed a floor effect. | `UNMEASURED` |
| C2 | The improvement is not obtained through unacceptable visual-quality loss. | D-031 method-level quality evidence using predeclared D1/D2 canonical views or timestamps, same-view SSE 4 reference, SSIM 0.02 non-inferiority rule, time-weighted SSE, visible geometric error, and optional supplementary LPIPS. Static SSE-ladder calibration alone is insufficient. | `UNMEASURED` |
| C3 | Stability controls reduce oscillation. | Switches/minute and reversal-count comparison plus no-stability ablation. | `UNMEASURED` |
| C4 | Request feedback provides additional value during cold-cache interaction or pressure-burst workloads on informative desktop Web clients. | Frozen D-031 D1/S3 `confirmatory-ablation` queue on PC-A with `noRequest`, separated from main Friedman/Wilcoxon aggregation. | `UNMEASURED` |
| C5 | The effect direction transfers from Amsterdam to an independent Rotterdam subset. | Complete D2 paired runs, frozen CC BY 4.0 provenance, and device-stratified effects. | `UNMEASURED` |
| C6 | The implementation is reproducible without Cesium private statistics. | Public-event code, automated unit tests, dataset hash validation, and browser smoke test. | `SUPPORTED_BY_IMPLEMENTATION` |
| C7 | The one-second predictor adds information beyond persistence. | D-031 D1/S3 and D2/S3 forecast MAE below persistence MAE plus violation precision/recall and the frozen no-prediction ablation. | `UNMEASURED` |
| C8 | Android-A v2.3.6 S3 evidence supports cross-device executability and low-pressure boundary behavior. | Completed Android-A D1/S3 and D2/S3 pilots plus valid diagnostic-only fixed-SSE-4 identifiability evidence, all separated from confirmatory inference. | `SUPPORTED_AS_LOW_PRESSURE_BOUNDARY_ONLY` |
| C9 | PC-B v2.3.6 S3 low-pressure behavior has been checked for server-topology sensitivity. | One valid PC-B D1/S3 fixed-SSE-4 diagnostic from the remote LAN server and one from a PC-B local server, analyzed in `server_topology_diagnostics.csv`; diagnostic-only and excluded from formal aggregation. | `SUPPORTED_DIAGNOSTIC_ONLY_REMOTE_TOPOLOGY_CONFOUNDER` |
| C10 | PC-B local-server S3 can produce a usable pressure signal for desktop confirmatory-release preparation. | One valid PC-B local-server D1/S3 six-method pressure probe plus one valid four-repeat full pilot with correct local-server provenance. | `SUPPORTED_AS_DESKTOP_PILOT_GATE_PASSED` |
| C11 | The desktop S3 confirmatory route has been frozen before formal collection. | D-031 decision record, `buildDesktopS3ConfirmatoryQueue()`, disabled legacy main button, fail-closed validator, D-031 analysis isolation, and freeze artifacts with queue-plan SHA-256. | `SUPPORTED_BY_PROTOCOL_RELEASE` |

No `UNMEASURED` claim may be rewritten as a positive finding in the abstract, Results, Discussion, or Conclusion.

Do not claim Android tail-control efficacy from the current D1/S3 or D2/S3 v2.3.6 pilots or the fixed4 diagnostic. They are valid low-pressure boundary evidence only. A future Android efficacy claim requires a new protocol version with a platform-independent higher-pressure scenario.

Do not claim PC-B S3 tail-control efficacy from the accidental PC-B D1/S3 full pilot or the later misregistered D1/S3 pressure probe. The PC-B full pilot is valid pilot evidence, but all methods had zero over-budget frames under S3; the later probe records `deviceId=unregistered` in raw manifests and is audit evidence only.

The completed PC-B remote/local fixed4 diagnostic supports the claim that remote LAN server delivery is a material confounder for PC-B S3 identifiability. Do not treat those diagnostic runs as formal method comparisons.

The completed PC-B local-server pressure probe and full pilot supported desktop S3 confirmatory-release preparation, not a manuscript effect claim. D-031 now freezes the formal route, but this is still not efficacy evidence. Do not state that Proposed is superior on PC-B or across desktops until formal confirmatory evidence exists. Use only `Run frozen desktop S3 confirmatory`; the legacy main button remains disabled and is not an approved collection entry.
