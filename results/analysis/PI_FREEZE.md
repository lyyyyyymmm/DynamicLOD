# PI Baseline Freeze Record

Decision date: 2026-08-25  
Protocol: `2.0.0`  
Tuning device: `pc-a`

## Tuning Evidence

- Dataset/scenario/profile: C1 `publicStress`, S2 `burst`, `delay40`.
- Grid: `Kp={0.05,0.10,0.20,0.40}` and `Ki={0.01,0.02,0.05,0.10}`.
- Planned repetitions: four per gain pair.
- Unique valid tuning runs: 64.
- Excluded PC-A attempts: seven runs with `window-blur`; one of those also recorded
  `document-hidden`. They remain in the raw audit trail and were automatically retried.
- The analyzer deduplicates aggregate JSON exports against their per-run checkpoint by
  `runId`, preserving the checkpoint record. The selected gain pair therefore has four,
  not eight, observations.

## Selection

`results/analysis/pi_parameter_selection.csv` selected:

| Kp | Ki | Median violation rate | Median time-weighted SSE | Median switches/min | n |
| --- | --- | --- | --- | --- | --- |
| 0.40 | 0.05 | 0.0000 | 4.0495948336426 | 1.4863205325756468 | 4 |

The prespecified ordering was minimum violation rate, then time-weighted SSE, then
switching frequency within a 0.01 absolute violation-rate band. `PI_BASELINE_POLICY`
is frozen at `Kp=0.40`, `Ki=0.05` for all subsequent confirmatory runs.

## Android Acceptance Amendment

The three pre-amendment `android-a-smoke` attempts are invalid because no tile arrived
within the former 30-second first-content gate. Their later telemetry shows 85 loaded
tiles and no tile failure, but their measurement started before content arrived; they
are retained as invalid audit records and excluded from analysis. The corrected rule
waits up to 60 seconds for first content before the shared 10-second warm-up begins.
Android must pass one new single-run acceptance check before confirmatory collection.

The first amended Android acceptance retry reached first content successfully but was
invalid only because the physical renderer produced a stable `959 x 540` buffer. The
frozen protocol now records actual buffer size and accepts one-pixel browser rounding;
this Android acceptance must be rerun once under that rule.
