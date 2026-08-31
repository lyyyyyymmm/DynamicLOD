import math
import json
import csv
import tempfile
import unittest
from pathlib import Path

from analyze_results import (
    PRIMARY_COMPARATORS,
    hodges_lehmann_paired,
    holm_adjust,
    paired_differences,
    rank_biserial_paired,
    result_to_row,
    run_analysis,
    select_pi_parameters,
    wilcoxon_signed_rank,
)


class StatisticalHelpersTest(unittest.TestCase):
    def test_holm_adjust_is_monotone_in_sorted_p_values(self):
        adjusted = holm_adjust([0.01, 0.04, 0.03])
        self.assertEqual([round(value, 4) for value in adjusted], [0.03, 0.06, 0.06])

    def test_hodges_lehmann_uses_walsh_averages(self):
        self.assertEqual(hodges_lehmann_paired([1, 2, 3]), 2)

    def test_paired_rank_biserial_preserves_direction(self):
        self.assertAlmostEqual(rank_biserial_paired([1, 2, -1]), 0.5)
        self.assertAlmostEqual(rank_biserial_paired([-1, -2, 1]), -0.5)

    def test_exact_wilcoxon_for_three_positive_differences(self):
        statistic, p_value = wilcoxon_signed_rank([1, 2, 3])
        self.assertEqual(statistic, 0)
        self.assertEqual(p_value, 0.25)

    def test_result_row_flattens_manifest_and_summary_without_nan(self):
        row = result_to_row(
            {
                "manifest": {
                    "runId": "run-1",
                    "method": "proposed",
                    "dataset": "publicStress",
                    "scenario": "burst",
                    "repeat": 1,
                    "seed": 7,
                    "userAgent": "test",
                    "deviceId": "pc-a",
                    "studyPhase": "pilot",
                    "pilotPurpose": "request-peak-probe",
                },
                "valid": True,
                "summary": {"violationRate": 0.1, "rawFrameTimeP95Ms": None},
            }
        )
        self.assertEqual(row["method"], "proposed")
        self.assertEqual(row["deviceId"], "pc-a")
        self.assertEqual(row["studyPhase"], "pilot")
        self.assertEqual(row["pilotPurpose"], "request-peak-probe")
        self.assertEqual(row["violationRate"], 0.1)
        self.assertTrue(math.isnan(row["rawFrameTimeP95Ms"]))

    def test_result_row_derives_request_pressure_mechanism_counts(self):
        row = result_to_row(
            {
                "manifest": {
                    "runId": "run-1",
                    "method": "proposed",
                    "dataset": "bagAmsterdam",
                    "scenario": "burst",
                    "repeat": 1,
                    "seed": 7,
                    "userAgent": "test",
                    "deviceId": "pc-a",
                    "studyPhase": "pilot",
                    "pilotPurpose": "request-peak-probe",
                },
                "valid": True,
                "summary": {"violationRate": 0.1},
                "rows": [
                    {"requestPressureHigh": False, "action": "HOLD", "reason": "deadband-or-stable"},
                    {
                        "requestPressureHigh": True,
                        "action": "DOWNGRADE_PREEMPTIVE",
                        "reason": "predicted-tail-plus-request-pressure",
                    },
                    {
                        "requestPressureHigh": True,
                        "action": "DOWNGRADE_TAIL",
                        "reason": "tail-frame-violation",
                    },
                ],
            }
        )
        self.assertEqual(row["requestPressureWindowCount"], 2)
        self.assertEqual(row["pressurePreemptiveActionCount"], 1)
        self.assertEqual(row["tailDowngradeUnderPressureCount"], 1)

    def test_result_row_separates_pressure_safe_holds_and_missed_opportunities(self):
        row = result_to_row(
            {
                "manifest": {
                    "runId": "run-2",
                    "method": "proposed",
                    "dataset": "bagAmsterdam",
                    "scenario": "burst",
                    "repeat": 1,
                    "seed": 7,
                    "userAgent": "test",
                    "deviceId": "pc-a",
                    "studyPhase": "pilot",
                    "pilotPurpose": "request-peak-probe",
                },
                "valid": True,
                "summary": {"violationRate": 0.0},
                "rows": [
                    {
                        "requestPressureHigh": True,
                        "action": "HOLD",
                        "reason": "request-pressure-hold",
                        "frameTimeP95Ms": 16.9,
                        "predictedFrameTimeP95Ms": 16.9,
                    },
                    {
                        "requestPressureHigh": True,
                        "action": "DOWNGRADE_PREEMPTIVE",
                        "reason": "predicted-tail-plus-request-pressure",
                        "frameTimeP95Ms": 31.0,
                        "predictedFrameTimeP95Ms": 31.0,
                    },
                    {
                        "requestPressureHigh": True,
                        "action": "HOLD",
                        "reason": "cooldown-hold",
                        "frameTimeP95Ms": 31.0,
                        "predictedFrameTimeP95Ms": 31.0,
                    },
                    {
                        "requestPressureHigh": True,
                        "action": "DOWNGRADE_TAIL",
                        "reason": "tail-frame-violation",
                        "frameTimeP95Ms": 34.0,
                        "predictedFrameTimeP95Ms": 34.0,
                    },
                ],
            }
        )
        self.assertEqual(row["requestPressureWindowCount"], 4)
        self.assertEqual(row["pressureSafeHoldCount"], 1)
        self.assertEqual(row["pressureTailOverlapCount"], 1)
        self.assertEqual(row["pressurePreemptiveOpportunityCount"], 2)
        self.assertEqual(row["pressurePreemptiveActionCount"], 1)
        self.assertEqual(row["missedPreemptiveOpportunityCount"], 1)
        self.assertEqual(row["tailDowngradeUnderPressureCount"], 1)

    def test_missing_comparator_produces_no_pairs(self):
        import pandas as pd

        frame = pd.DataFrame(
            [
                {
                    "deviceId": "pc-a",
                    "studyPhase": "confirmatory",
                    "dataset": "publicStress",
                    "scenario": "burst",
                    "repeat": 1,
                    "method": "proposed",
                    "violationRate": 0.1,
                }
            ]
        )
        self.assertEqual(paired_differences(frame, "reactive", "violationRate"), [])

    def test_pi_is_a_prespecified_primary_comparator(self):
        self.assertEqual(PRIMARY_COMPARATORS, ["pi", "reactive", "cesiumDynamic"])

    def test_pi_selection_uses_violation_band_then_quality_then_switching(self):
        import pandas as pd

        frame = pd.DataFrame([
            {"piKp": 0.05, "piKi": 0.01, "violationRate": 0.10, "timeWeightedMeanSse": 20, "switchesPerMinute": 3},
            {"piKp": 0.10, "piKi": 0.02, "violationRate": 0.105, "timeWeightedMeanSse": 12, "switchesPerMinute": 4},
            {"piKp": 0.20, "piKi": 0.05, "violationRate": 0.12, "timeWeightedMeanSse": 8, "switchesPerMinute": 1},
        ])
        selected = select_pi_parameters(frame)
        self.assertEqual(selected["piKp"], 0.10)
        self.assertEqual(selected["piKi"], 0.02)

    def test_incomplete_method_matrix_still_writes_analysis_status(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_dir = root / "input"
            output_dir = root / "output"
            input_dir.mkdir()
            payload = {
                "manifest": {
                    "runId": "run-1",
                    "method": "proposed",
                    "dataset": "publicStress",
                    "scenario": "burst",
                    "repeat": 1,
                    "seed": 7,
                    "userAgent": "pc",
                    "deviceId": "pc-a",
                    "studyPhase": "confirmatory",
                },
                "valid": True,
                "invalidReasons": [],
                "summary": {
                    "violationRate": 0.1,
                    "predictionMaeMs": 3.0,
                    "persistenceMaeMs": 5.0,
                    "violationPrecision": 0.8,
                    "violationRecall": 0.6,
                    "violationF1": 0.6857,
                    "meanWarningLeadMs": 500.0,
                },
            }
            (input_dir / "run-1.json").write_text(json.dumps(payload), encoding="utf-8")
            self.assertEqual(run_analysis(input_dir, output_dir), 0)
            self.assertIn("Complete six-method paired blocks: 0", (output_dir / "STATUS.md").read_text(encoding="utf-8"))
            forecast = (output_dir / "forecast_diagnostics.csv").read_text(encoding="utf-8")
            self.assertIn("predictionImprovementMs", forecast)
            self.assertIn("2.0", forecast)

    def test_pilot_blocks_are_excluded_from_formal_analysis(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_dir = root / "input"
            output_dir = root / "output"
            input_dir.mkdir()
            for method in ["fixed8", "fixed16", "cesiumDynamic", "reactive", "pi", "proposed"]:
                payload = {
                    "manifest": {
                        "runId": f"pilot-{method}",
                        "method": method,
                        "dataset": "bagAmsterdam",
                        "scenario": "burst",
                        "repeat": 1,
                        "seed": 7,
                        "userAgent": "pc",
                        "deviceId": "pc-a",
                        "studyPhase": "pilot",
                    },
                    "valid": True,
                    "invalidReasons": [],
                    "summary": {"violationRate": 0.1},
                }
                (input_dir / f"pilot-{method}.json").write_text(
                    json.dumps(payload), encoding="utf-8"
                )

            self.assertEqual(run_analysis(input_dir, output_dir), 0)
            status = (output_dir / "STATUS.md").read_text(encoding="utf-8")
            self.assertIn("Valid confirmatory runs: 0", status)
            self.assertIn("Complete six-method paired blocks: 0", status)

    def test_checkpoint_takes_precedence_over_aggregate_export_with_same_run_id(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_dir = root / "input"
            output_dir = root / "output"
            input_dir.mkdir()
            checkpoint = {
                "manifest": {
                    "runId": "run-1",
                    "method": "pi",
                    "dataset": "publicStress",
                    "scenario": "burst",
                    "repeat": 1,
                    "seed": 7,
                    "userAgent": "pc",
                    "deviceId": "pc-a",
                    "methodParameters": {"kp": 0.1, "ki": 0.02},
                },
                "valid": True,
                "invalidReasons": [],
                "summary": {
                    "violationRate": 0.1,
                    "timeWeightedMeanSse": 10.0,
                    "switchesPerMinute": 2.0,
                },
            }
            aggregate_copy = json.loads(json.dumps(checkpoint))
            aggregate_copy["summary"]["violationRate"] = 0.9
            (input_dir / "run-1.json").write_text(json.dumps(checkpoint), encoding="utf-8")
            (input_dir / "export.json").write_text(
                json.dumps([aggregate_copy]), encoding="utf-8"
            )

            self.assertEqual(run_analysis(input_dir, output_dir), 0)
            with (output_dir / "all_runs.csv").open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            self.assertEqual(len(rows), 1)
            self.assertEqual(float(rows[0]["violationRate"]), 0.1)


if __name__ == "__main__":
    unittest.main()
