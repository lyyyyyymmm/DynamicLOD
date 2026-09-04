"""Analyze LOD benchmark JSON results without treating windows as independent runs."""

from __future__ import annotations

import argparse
import html
import json
import math
import random
from pathlib import Path
from statistics import median
from typing import Iterable, Sequence
from urllib.parse import urlparse


PRIMARY_METHODS = ["fixed8", "fixed16", "cesiumDynamic", "reactive", "pi", "proposed"]
PRIMARY_COMPARATORS = ["pi", "reactive", "cesiumDynamic"]
APPROVED_CONFIRMATORY_DEVICES = {"pc-a", "pc-b"}
APPROVED_CONFIRMATORY_DATASETS = {"bagAmsterdam", "bagRotterdam"}
APPROVED_LOCAL_HOSTNAMES = {"localhost", "127.0.0.1", "::1"}
D031_CONFIRMATORY_RELEASE = "D-031"


def holm_adjust(p_values: Sequence[float]) -> list[float]:
    """Return Holm step-down adjusted p-values in the original order."""
    count = len(p_values)
    order = sorted(range(count), key=lambda index: p_values[index])
    adjusted = [0.0] * count
    running_max = 0.0
    for rank, index in enumerate(order):
        candidate = min(1.0, float(p_values[index]) * (count - rank))
        running_max = max(running_max, candidate)
        adjusted[index] = running_max
    return adjusted


def hodges_lehmann_paired(differences: Sequence[float]) -> float:
    """One-sample Hodges-Lehmann estimator from Walsh averages."""
    finite = [float(value) for value in differences if math.isfinite(float(value))]
    if not finite:
        return math.nan
    walsh = [
        (finite[left] + finite[right]) / 2
        for left in range(len(finite))
        for right in range(left, len(finite))
    ]
    return float(median(walsh))


def _average_ranks(values: Sequence[float]) -> list[float]:
    order = sorted(range(len(values)), key=lambda index: values[index])
    ranks = [0.0] * len(values)
    cursor = 0
    while cursor < len(order):
        end = cursor + 1
        while end < len(order) and values[order[end]] == values[order[cursor]]:
            end += 1
        average = ((cursor + 1) + end) / 2
        for position in range(cursor, end):
            ranks[order[position]] = average
        cursor = end
    return ranks


def rank_biserial_paired(differences: Sequence[float]) -> float:
    """Matched-pairs rank-biserial effect; positive means positive differences."""
    finite = [float(value) for value in differences if math.isfinite(float(value)) and value != 0]
    if not finite:
        return 0.0
    ranks = _average_ranks([abs(value) for value in finite])
    positive = sum(rank for rank, value in zip(ranks, finite) if value > 0)
    negative = sum(rank for rank, value in zip(ranks, finite) if value < 0)
    total = positive + negative
    return (positive - negative) / total if total else 0.0


def wilcoxon_signed_rank(differences: Sequence[float]) -> tuple[float, float]:
    """Two-sided paired Wilcoxon test with exact enumeration for n <= 20."""
    finite = [float(value) for value in differences if math.isfinite(float(value)) and value != 0]
    if not finite:
        return 0.0, 1.0
    ranks = _average_ranks([abs(value) for value in finite])
    positive = sum(rank for rank, value in zip(ranks, finite) if value > 0)
    negative = sum(rank for rank, value in zip(ranks, finite) if value < 0)
    statistic = min(positive, negative)
    if len(finite) <= 20:
        extreme = 0
        total_rank = sum(ranks)
        assignments = 1 << len(ranks)
        for mask in range(assignments):
            rank_sum = sum(rank for index, rank in enumerate(ranks) if mask & (1 << index))
            if min(rank_sum, total_rank - rank_sum) <= statistic + 1e-12:
                extreme += 1
        return statistic, min(1.0, extreme / assignments)
    mean = sum(ranks) / 2
    variance = sum(rank * rank for rank in ranks) / 4
    z_score = max(0.0, abs(positive - mean) - 0.5) / math.sqrt(variance)
    return statistic, math.erfc(z_score / math.sqrt(2))


def _regularized_gamma_q(shape: float, value: float) -> float:
    """Regularized upper incomplete gamma for chi-square tail probabilities."""
    if value < 0 or shape <= 0:
        return math.nan
    if value == 0:
        return 1.0
    epsilon = 3e-14
    tiny = 1e-300
    log_factor = -value + shape * math.log(value) - math.lgamma(shape)
    if value < shape + 1:
        term = 1 / shape
        total = term
        current_shape = shape
        for _ in range(10000):
            current_shape += 1
            term *= value / current_shape
            total += term
            if abs(term) < abs(total) * epsilon:
                break
        return max(0.0, min(1.0, 1 - total * math.exp(log_factor)))
    b_value = value + 1 - shape
    c_value = 1 / tiny
    d_value = 1 / b_value
    fraction = d_value
    for index in range(1, 10000):
        coefficient = -index * (index - shape)
        b_value += 2
        d_value = coefficient * d_value + b_value
        if abs(d_value) < tiny:
            d_value = tiny
        c_value = b_value + coefficient / c_value
        if abs(c_value) < tiny:
            c_value = tiny
        d_value = 1 / d_value
        delta = d_value * c_value
        fraction *= delta
        if abs(delta - 1) < epsilon:
            break
    return max(0.0, min(1.0, math.exp(log_factor) * fraction))


def friedman_test(blocks: Sequence[Sequence[float]]) -> tuple[float, float]:
    if len(blocks) < 2 or not blocks:
        return math.nan, math.nan
    method_count = len(blocks[0])
    if method_count < 2 or any(len(block) != method_count for block in blocks):
        return math.nan, math.nan
    rank_sums = [0.0] * method_count
    for block in blocks:
        ranks = _average_ranks([float(value) for value in block])
        rank_sums = [total + rank for total, rank in zip(rank_sums, ranks)]
    block_count = len(blocks)
    statistic = (
        12 / (block_count * method_count * (method_count + 1))
    ) * sum(value * value for value in rank_sums) - 3 * block_count * (method_count + 1)
    p_value = _regularized_gamma_q((method_count - 1) / 2, statistic / 2)
    return statistic, p_value


def bootstrap_median_ci(
    differences: Sequence[float], confidence: float = 0.95, samples: int = 10000, seed: int = 20260823
) -> tuple[float, float]:
    finite = [float(value) for value in differences if math.isfinite(float(value))]
    if not finite:
        return math.nan, math.nan
    generator = random.Random(seed)
    estimates = sorted(
        median(generator.choices(finite, k=len(finite))) for _ in range(samples)
    )
    tail = (1 - confidence) / 2
    lower = estimates[max(0, int(tail * samples))]
    upper = estimates[min(samples - 1, int((1 - tail) * samples) - 1)]
    return float(lower), float(upper)


def infer_device(user_agent: str) -> str:
    return "android" if "android" in user_agent.lower() else "pc"


def _numeric_row_value(row: dict, *keys: str) -> float:
    for key in keys:
        value = row.get(key)
        try:
            number = float(value)
        except (TypeError, ValueError):
            continue
        if math.isfinite(number):
            return number
    return math.nan


def request_pressure_mechanism_counts(rows: Sequence[dict]) -> dict:
    frame_budget_ms = 1000 / 30
    preemptive_threshold_ms = frame_budget_ms * 0.9
    pressure_rows = [
        row for row in rows
        if isinstance(row, dict) and bool(row.get("requestPressureHigh", False))
    ]
    pressure_tail_overlap_rows = []
    pressure_preemptive_opportunity_rows = []
    pressure_safe_hold_rows = []
    for row in pressure_rows:
        current_p95 = _numeric_row_value(row, "frameTimeP95Ms", "p95Ms")
        predicted_p95 = _numeric_row_value(
            row,
            "predictedFrameTimeP95Ms",
            "predictedP95Ms",
            "predictedP95",
        )
        tail_overlap = current_p95 > frame_budget_ms or predicted_p95 > frame_budget_ms
        preemptive_opportunity = (
            current_p95 <= frame_budget_ms
            and predicted_p95 > preemptive_threshold_ms
        )
        safe_hold = (
            str(row.get("action", "")) == "HOLD"
            and current_p95 <= frame_budget_ms
            and predicted_p95 <= preemptive_threshold_ms
        )
        if tail_overlap:
            pressure_tail_overlap_rows.append(row)
        if preemptive_opportunity:
            pressure_preemptive_opportunity_rows.append(row)
        if safe_hold:
            pressure_safe_hold_rows.append(row)
    return {
        "requestPressureWindowCount": len(pressure_rows),
        "pressureSafeHoldCount": len(pressure_safe_hold_rows),
        "pressureTailOverlapCount": len(pressure_tail_overlap_rows),
        "pressurePreemptiveOpportunityCount": len(pressure_preemptive_opportunity_rows),
        "pressurePreemptiveActionCount": sum(
            1
            for row in rows
            if isinstance(row, dict)
            and row.get("reason") == "predicted-tail-plus-request-pressure"
        ),
        "missedPreemptiveOpportunityCount": sum(
            1
            for row in pressure_preemptive_opportunity_rows
            if row.get("reason") != "predicted-tail-plus-request-pressure"
        ),
        "tailDowngradeUnderPressureCount": sum(
            1
            for row in pressure_rows
            if str(row.get("action", "")).startswith("DOWNGRADE")
            and row.get("reason") == "tail-frame-violation"
        ),
    }


def result_to_row(result: dict) -> dict:
    manifest = result.get("manifest", {})
    summary = result.get("summary", {})
    row = {
        "runId": manifest.get("runId"),
        "method": manifest.get("method"),
        "dataset": manifest.get("dataset"),
        "scenario": manifest.get("scenario"),
        "repeat": manifest.get("repeat"),
        "seed": manifest.get("seed"),
        "deviceId": manifest.get("deviceId") or infer_device(str(manifest.get("userAgent", ""))),
        "deviceClass": infer_device(str(manifest.get("userAgent", ""))),
        "protocolVersion": manifest.get("protocolVersion"),
        "networkProfile": manifest.get("networkProfile", "lan"),
        "studyPhase": manifest.get("studyPhase", "legacy"),
        "pilotPurpose": manifest.get("pilotPurpose", "legacy"),
        "diagnosticPurpose": manifest.get("diagnosticPurpose", "none"),
        "confirmatoryRelease": manifest.get("confirmatoryRelease", "none"),
        "confirmatoryRole": manifest.get("confirmatoryRole", "none"),
        "ablationPurpose": manifest.get("ablationPurpose", "none"),
        "fixedSse": manifest.get("fixedSse", math.nan),
        "excludeFromFormalAggregation": bool(manifest.get("excludeFromFormalAggregation", False)),
        "serverTopology": manifest.get("serverTopology", "unspecified"),
        "pageOrigin": manifest.get("pageOrigin", "unknown"),
        "pageHost": manifest.get("pageHost", "unknown"),
        "piKp": (manifest.get("methodParameters") or {}).get("kp", math.nan),
        "piKi": (manifest.get("methodParameters") or {}).get("ki", math.nan),
        "valid": bool(result.get("valid", False)),
        "invalidReasons": "|".join(result.get("invalidReasons", [])),
    }
    row.update(request_pressure_mechanism_counts(result.get("rows", [])))
    for key, value in summary.items():
        if isinstance(value, (dict, list)):
            row[key] = json.dumps(value, ensure_ascii=False, sort_keys=True)
        elif value is None:
            row[key] = math.nan
        else:
            row[key] = value
    return row


def _is_local_origin(page_origin: object, page_host: object = "") -> bool:
    origin = str(page_origin or "")
    try:
        parsed = urlparse(origin)
        if parsed.hostname in APPROVED_LOCAL_HOSTNAMES:
            return True
    except ValueError:
        pass
    raw_host = str(page_host or "").strip().lower()
    if raw_host.startswith("[") and "]" in raw_host:
        host = raw_host[1 : raw_host.index("]")]
    else:
        host = raw_host.split(":", maxsplit=1)[0]
    return host in APPROVED_LOCAL_HOSTNAMES


def select_d031_confirmatory(frame):
    if frame.empty:
        return frame.copy()
    required_columns = [
        "studyPhase",
        "confirmatoryRelease",
        "deviceId",
        "dataset",
        "scenario",
        "method",
        "networkProfile",
        "serverTopology",
        "pageOrigin",
        "pageHost",
        "excludeFromFormalAggregation",
    ]
    filtered = frame.copy()
    for column in required_columns:
        if column not in filtered.columns:
            filtered[column] = math.nan
    mask = (
        filtered["studyPhase"].eq("confirmatory")
        & filtered["confirmatoryRelease"].eq(D031_CONFIRMATORY_RELEASE)
        & filtered["deviceId"].isin(APPROVED_CONFIRMATORY_DEVICES)
        & filtered["dataset"].isin(APPROVED_CONFIRMATORY_DATASETS)
        & filtered["scenario"].eq("pressureBurst")
        & filtered["method"].isin(PRIMARY_METHODS)
        & filtered["networkProfile"].eq("lan")
        & filtered["serverTopology"].eq("local")
        & (~filtered["excludeFromFormalAggregation"].astype(bool))
        & filtered.apply(
            lambda row: _is_local_origin(row.get("pageOrigin"), row.get("pageHost")),
            axis=1,
        )
    )
    return filtered[mask].copy()


def load_results(input_dir: Path) -> list[dict]:
    records_with_source: list[tuple[int, str, int, dict]] = []
    for path in sorted(input_dir.rglob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        payload_results = payload if isinstance(payload, list) else [payload]
        for index, result in enumerate(payload_results):
            if isinstance(result, dict) and "manifest" in result and "summary" in result:
                run_id = str(result.get("manifest", {}).get("runId") or "").strip()
                source_priority = 0 if run_id and path.stem == run_id else 1
                records_with_source.append((source_priority, str(path), index, result))

    records = []
    seen_run_ids = set()
    for _priority, _path, _index, result in sorted(records_with_source, key=lambda item: item[:3]):
        run_id = str(result.get("manifest", {}).get("runId") or "").strip()
        if run_id:
            if run_id in seen_run_ids:
                continue
            seen_run_ids.add(run_id)
        records.append(result)
    return records


def paired_differences(frame, comparator: str, metric: str) -> list[float]:
    keys = ["deviceId", "dataset", "scenario", "repeat"]
    selected = frame[frame["method"].isin(["proposed", comparator])]
    pivot = selected.pivot_table(index=keys, columns="method", values=metric, aggfunc="first")
    if "proposed" not in pivot.columns or comparator not in pivot.columns:
        return []
    pivot = pivot.dropna(subset=["proposed", comparator])
    return (pivot["proposed"] - pivot[comparator]).astype(float).tolist()


def select_pi_parameters(frame) -> dict | None:
    required = {"piKp", "piKi", "violationRate", "timeWeightedMeanSse", "switchesPerMinute"}
    if frame.empty or not required.issubset(frame.columns):
        return None
    finite = frame.dropna(subset=list(required)).copy()
    if finite.empty:
        return None
    grouped = (
        finite.groupby(["piKp", "piKi"], as_index=False)
        .agg(
            violationRate=("violationRate", "median"),
            timeWeightedMeanSse=("timeWeightedMeanSse", "median"),
            switchesPerMinute=("switchesPerMinute", "median"),
            nRuns=("violationRate", "count"),
        )
    )
    best_violation = float(grouped["violationRate"].min())
    eligible = grouped[grouped["violationRate"] <= best_violation + 0.01 + 1e-12]
    selected = eligible.sort_values(
        ["timeWeightedMeanSse", "switchesPerMinute", "piKp", "piKi"],
        kind="stable",
    ).iloc[0]
    return selected.to_dict()


def write_boxplot_svg(groups: dict[str, Sequence[float]], output_path: Path) -> None:
    width, height = 900, 500
    left, right, top, bottom = 90, 30, 35, 80
    finite_groups = {
        label: [float(value) for value in values if math.isfinite(float(value))]
        for label, values in groups.items()
    }
    all_values = [value for values in finite_groups.values() for value in values]
    if not all_values:
        return
    maximum = max(0.05, max(all_values) * 1.08)
    plot_height = height - top - bottom
    plot_width = width - left - right
    labels = list(finite_groups)
    step = plot_width / max(1, len(labels))

    def y_coordinate(value: float) -> float:
        return top + plot_height * (1 - value / maximum)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="white"/>',
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height-bottom}" stroke="#222"/>',
        f'<line x1="{left}" y1="{height-bottom}" x2="{width-right}" y2="{height-bottom}" stroke="#222"/>',
    ]
    for tick in range(6):
        value = maximum * tick / 5
        y_value = y_coordinate(value)
        parts.append(f'<line x1="{left}" y1="{y_value:.2f}" x2="{width-right}" y2="{y_value:.2f}" stroke="#d8ddd9"/>')
        parts.append(f'<text x="{left-10}" y="{y_value+4:.2f}" text-anchor="end" font-family="Arial" font-size="12">{value:.2f}</text>')
    for index, label in enumerate(labels):
        values = sorted(finite_groups[label])
        if not values:
            continue
        x_value = left + step * (index + 0.5)
        q1 = values[round((len(values) - 1) * 0.25)]
        middle = median(values)
        q3 = values[round((len(values) - 1) * 0.75)]
        low, high = min(values), max(values)
        parts.extend([
            f'<line x1="{x_value:.2f}" y1="{y_coordinate(low):.2f}" x2="{x_value:.2f}" y2="{y_coordinate(high):.2f}" stroke="#315d45"/>',
            f'<rect x="{x_value-28:.2f}" y="{y_coordinate(q3):.2f}" width="56" height="{max(1, y_coordinate(q1)-y_coordinate(q3)):.2f}" fill="#9bc9ad" stroke="#315d45"/>',
            f'<line x1="{x_value-28:.2f}" y1="{y_coordinate(middle):.2f}" x2="{x_value+28:.2f}" y2="{y_coordinate(middle):.2f}" stroke="#111" stroke-width="2"/>',
            f'<text x="{x_value:.2f}" y="{height-bottom+25}" text-anchor="middle" font-family="Arial" font-size="12">{html.escape(label)}</text>',
        ])
    parts.append(f'<text x="20" y="{height/2}" transform="rotate(-90 20 {height/2})" text-anchor="middle" font-family="Arial" font-size="14">P95 window violation rate</text>')
    parts.append("</svg>")
    output_path.write_text("\n".join(parts) + "\n", encoding="utf-8")


def run_analysis(input_dir: Path, output_dir: Path) -> int:
    import pandas as pd

    output_dir.mkdir(parents=True, exist_ok=True)
    records = load_results(input_dir)
    rows = [result_to_row(result) for result in records]
    frame = pd.DataFrame(rows)
    if frame.empty:
        (output_dir / "STATUS.md").write_text(
            "# Analysis status\n\nNo benchmark result JSON files were found.\n",
            encoding="utf-8",
        )
        return 2

    frame.to_csv(output_dir / "all_runs.csv", index=False)
    valid = frame[frame["valid"] == True].copy()  # noqa: E712
    confirmatory_candidates = valid[valid["studyPhase"] == "confirmatory"].copy()
    confirmatory = select_d031_confirmatory(valid)
    diagnostic = valid[valid["studyPhase"] == "diagnostic"].copy()
    metric = "violationRate"
    if valid.empty or metric not in valid:
        (output_dir / "STATUS.md").write_text(
            "# Analysis status\n\nResults exist, but no valid runs contain violationRate.\n",
            encoding="utf-8",
        )
        return 3

    grouped = (
        confirmatory.groupby(["deviceId", "dataset", "scenario", "method"])[metric]
        .agg(n="count", median="median", q1=lambda values: values.quantile(0.25), q3=lambda values: values.quantile(0.75))
        .reset_index()
    )
    grouped.to_csv(output_dir / "descriptive_violation_rate.csv", index=False)

    android_diagnostic_columns = [
        "runId",
        "deviceId",
        "dataset",
        "scenario",
        "repeat",
        "method",
        "studyPhase",
        "diagnosticPurpose",
        "fixedSse",
        "excludeFromFormalAggregation",
        "violationRate",
        "frameTimeP95Ms",
        "frameTimeP99Ms",
        "rawFrameTimeP95Ms",
        "rawFrameTimeP99Ms",
        "rawFrameTimeMaxMs",
        "frameTimeOver20Rate",
        "frameBudgetViolationRate",
        "requestQueuePeak",
        "requestQueueAuc",
        "tilesLoadedTotal",
        "transferBytes",
        "loadProgressEventCount",
        "frameTimeHistogram",
    ]
    android_diagnostic_frame = diagnostic[
        diagnostic["diagnosticPurpose"].fillna("").eq("android-workload-identifiability")
    ].copy() if "diagnosticPurpose" in diagnostic.columns else diagnostic.iloc[0:0].copy()
    for column in android_diagnostic_columns:
        if column not in android_diagnostic_frame.columns:
            android_diagnostic_frame[column] = math.nan
    android_diagnostic_frame[android_diagnostic_columns].to_csv(
        output_dir / "android_identifiability_diagnostics.csv", index=False
    )

    server_topology_diagnostic_columns = android_diagnostic_columns[:-1] + [
        "serverTopology",
        "pageOrigin",
        "pageHost",
        "encodedBodyBytes",
        "resourceCompletionPeak100Ms",
        "resourceCompletionPeak250Ms",
        "resourceCompletionPeak500Ms",
        "resourceCompletionTransferBytesPeak100Ms",
        "resourceCompletionTransferBytesPeak250Ms",
        "resourceCompletionTransferBytesPeak500Ms",
        "tileLoadPeak100Ms",
        "tileLoadPeak250Ms",
        "tileLoadPeak500Ms",
        "loadProgressEventPeak100Ms",
        "loadProgressEventPeak250Ms",
        "loadProgressEventPeak500Ms",
        "loadProgressQueuePeak100Ms",
        "loadProgressQueuePeak250Ms",
        "loadProgressQueuePeak500Ms",
        "frameTimeHistogram",
        "resourceCompletionBins100Ms",
        "resourceCompletionBins250Ms",
        "resourceCompletionBins500Ms",
        "tileLoadBins100Ms",
        "tileLoadBins250Ms",
        "tileLoadBins500Ms",
        "loadProgressBins100Ms",
        "loadProgressBins250Ms",
        "loadProgressBins500Ms",
    ]
    server_topology_diagnostic_frame = diagnostic[
        diagnostic["diagnosticPurpose"].fillna("").eq("server-topology-identifiability")
    ].copy() if "diagnosticPurpose" in diagnostic.columns else diagnostic.iloc[0:0].copy()
    for column in server_topology_diagnostic_columns:
        if column not in server_topology_diagnostic_frame.columns:
            server_topology_diagnostic_frame[column] = math.nan
    server_topology_diagnostic_frame[server_topology_diagnostic_columns].to_csv(
        output_dir / "server_topology_diagnostics.csv", index=False
    )

    forecast_columns = [
        "predictionMaeMs",
        "persistenceMaeMs",
        "violationPrecision",
        "violationRecall",
        "violationF1",
        "meanWarningLeadMs",
    ]
    if set(forecast_columns).issubset(confirmatory.columns):
        forecast = confirmatory.copy()
        forecast["predictionImprovementMs"] = (
            forecast["persistenceMaeMs"] - forecast["predictionMaeMs"]
        )
        forecast_summary = (
            forecast.groupby(["deviceId", "dataset", "scenario", "method"], dropna=False)
            [forecast_columns + ["predictionImprovementMs"]]
            .median()
            .reset_index()
        )
    else:
        forecast_summary = pd.DataFrame(
            columns=["deviceId", "dataset", "scenario", "method"]
            + forecast_columns
            + ["predictionImprovementMs"]
        )
    forecast_summary.to_csv(output_dir / "forecast_diagnostics.csv", index=False)

    pi_calibration = valid[
        (valid["method"] == "pi")
        & (valid["dataset"] == "publicStress")
        & (valid["scenario"] == "burst")
    ]
    selected_pi = select_pi_parameters(pi_calibration)
    pd.DataFrame([selected_pi] if selected_pi else []).to_csv(
        output_dir / "pi_parameter_selection.csv", index=False
    )

    tests = []
    p_values = []
    group_keys = ["deviceId", "dataset", "scenario"]
    for group_values, group in confirmatory.groupby(group_keys, dropna=False):
        group_metadata = dict(zip(group_keys, group_values))
        for comparator in PRIMARY_COMPARATORS:
            differences = paired_differences(group, comparator, metric)
            if differences and any(value != 0 for value in differences):
                statistic, p_value = wilcoxon_signed_rank(differences)
            else:
                statistic, p_value = math.nan, 1.0
            lower, upper = bootstrap_median_ci(differences)
            tests.append(
                {
                    **group_metadata,
                    "comparison": f"proposed - {comparator}",
                    "nPairs": len(differences),
                    "wilcoxonStatistic": statistic,
                    "pRaw": p_value,
                    "hodgesLehmann": hodges_lehmann_paired(differences),
                    "rankBiserial": rank_biserial_paired(differences),
                    "medianDifferenceCiLow": lower,
                    "medianDifferenceCiHigh": upper,
                }
            )
            p_values.append(float(p_value))
    for row, adjusted in zip(tests, holm_adjust(p_values)):
        row["pHolm"] = adjusted
    pd.DataFrame(tests).to_csv(output_dir / "planned_pairwise_tests.csv", index=False)

    friedman_rows = []
    complete_block_count = 0
    for group_values, group in confirmatory.groupby(group_keys, dropna=False):
        pivot = group[group["method"].isin(PRIMARY_METHODS)].pivot_table(
            index=["repeat"], columns="method", values=metric, aggfunc="first"
        )
        complete = pivot.reindex(columns=PRIMARY_METHODS).dropna()
        complete_block_count += len(complete)
        if len(complete) >= 2:
            blocks = complete[PRIMARY_METHODS].astype(float).to_numpy().tolist()
            statistic, p_value = friedman_test(blocks)
            friedman_rows.append({
                **dict(zip(group_keys, group_values)),
                "nBlocks": len(complete),
                "statistic": statistic,
                "pValue": p_value,
            })
    pd.DataFrame(friedman_rows).to_csv(output_dir / "friedman_test.csv", index=False)

    order = [method for method in PRIMARY_METHODS if method in confirmatory["method"].unique()]
    groups = {
        method: confirmatory.loc[confirmatory["method"] == method, metric].dropna().astype(float).tolist()
        for method in order
    }
    write_boxplot_svg(groups, output_dir / "violation_rate_by_method.svg")

    lines = [
        "# Analysis status",
        "",
        f"- Result files: {len(records)}",
        f"- Valid runs (all phases): {len(valid)}",
        f"- Valid confirmatory runs: {len(confirmatory)}",
        f"- Valid confirmatory candidates before D-031 filter: {len(confirmatory_candidates)}",
        f"- Valid pilot runs: {len(valid[valid['studyPhase'] == 'pilot'])}",
        f"- Valid diagnostic runs: {len(diagnostic)}",
        f"- Valid tuning runs: {len(valid[valid['studyPhase'] == 'tuning'])}",
        f"- Invalid runs: {len(frame) - len(valid)}",
        f"- Complete six-method paired blocks: {complete_block_count}",
        "",
        "Formal statistics use confirmatory runs only; pilot, tuning, and legacy records remain audit evidence.",
        "Formal efficacy claims must remain unset until D-031 physical confirmatory runs are collected, filtered, and analyzed.",
    ]
    (output_dir / "STATUS.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("../results/incoming"))
    parser.add_argument("--output", type=Path, default=Path("../results/analysis"))
    arguments = parser.parse_args()
    return run_analysis(arguments.input.resolve(), arguments.output.resolve())


if __name__ == "__main__":
    raise SystemExit(main())
