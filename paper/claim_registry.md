# Claim Registry

| ID | Planned claim | Required evidence | Current status |
| --- | --- | --- | --- |
| C1 | The proposed method lowers P95-window violation rate versus reactive and PI control on informative desktop Web clients. | Complete six-method confirmatory blocks on the frozen desktop efficacy devices and the frozen desktop scenario matrix, device-stratified Wilcoxon-Holm results, effect sizes and CIs. Android-A v2.3.6/S3 is excluded from this efficacy claim because the fixed4 diagnostic showed a floor effect. | `UNMEASURED` |
| C2 | The improvement is not obtained through unacceptable visual-quality loss. | Six-view SSIM calibration on D1/D2 and the 0.02 non-inferiority comparison; optional LPIPS is supplementary. | `UNMEASURED` |
| C3 | Stability controls reduce oscillation. | Switches/minute and reversal-count comparison plus no-stability ablation. | `UNMEASURED` |
| C4 | Request feedback provides additional value during cold-cache interaction or pressure-burst workloads on informative desktop Web clients. | D1 pressure-workload no-request ablation on the frozen desktop efficacy devices after the v2.3.6 PC-A pilot gate is frozen. | `UNMEASURED` |
| C5 | The effect direction transfers from Amsterdam to an independent Rotterdam subset. | Complete D2 paired runs, frozen CC BY 4.0 provenance, and device-stratified effects. | `UNMEASURED` |
| C6 | The implementation is reproducible without Cesium private statistics. | Public-event code, automated unit tests, dataset hash validation, and browser smoke test. | `SUPPORTED_BY_IMPLEMENTATION` |
| C7 | The one-second predictor adds information beyond persistence. | D1/S2 forecast MAE below persistence MAE plus violation precision/recall and no-prediction ablation. | `UNMEASURED` |
| C8 | Android-A v2.3.6 S3 evidence supports cross-device executability and low-pressure boundary behavior. | Completed Android-A D1/S3 and D2/S3 pilots plus valid diagnostic-only fixed-SSE-4 identifiability evidence, all separated from confirmatory inference. | `SUPPORTED_AS_LOW_PRESSURE_BOUNDARY_ONLY` |
| C9 | PC-B v2.3.6 S3 low-pressure behavior has been checked for server-topology sensitivity. | One valid PC-B D1/S3 fixed-SSE-4 diagnostic from the remote LAN server and one from a PC-B local server, analyzed in `server_topology_diagnostics.csv`; diagnostic-only and excluded from formal aggregation. | `SUPPORTED_DIAGNOSTIC_ONLY_REMOTE_TOPOLOGY_CONFOUNDER` |
| C10 | PC-B local-server S3 can produce a usable pressure signal for desktop confirmatory-release preparation. | One valid PC-B local-server D1/S3 six-method pressure probe plus one valid four-repeat full pilot with correct local-server provenance; confirmatory release still requires D-031 and queue verification. | `SUPPORTED_AS_DESKTOP_PILOT_GATE_PASSED` |

No `UNMEASURED` claim may be rewritten as a positive finding in the abstract, Results, Discussion, or Conclusion.

Do not claim Android tail-control efficacy from the current D1/S3 or D2/S3 v2.3.6 pilots or the fixed4 diagnostic. They are valid low-pressure boundary evidence only. A future Android efficacy claim requires a new protocol version with a platform-independent higher-pressure scenario.

Do not claim PC-B S3 tail-control efficacy from the accidental PC-B D1/S3 full pilot or the later misregistered D1/S3 pressure probe. The PC-B full pilot is valid pilot evidence, but all methods had zero over-budget frames under S3; the later probe records `deviceId=unregistered` in raw manifests and is audit evidence only.

The completed PC-B remote/local fixed4 diagnostic supports the claim that remote LAN server delivery is a material confounder for PC-B S3 identifiability. Do not treat those diagnostic runs as formal method comparisons.

The completed PC-B local-server pressure probe and full pilot support desktop S3 confirmatory-release preparation, not a manuscript effect claim. Do not state that Proposed is superior on PC-B until formal confirmatory evidence exists. Do not use the existing `Run main batch` entry for formal collection until its queue is explicitly frozen and verified for the intended release route.
