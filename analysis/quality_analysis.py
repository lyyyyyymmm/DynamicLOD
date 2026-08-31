"""Compute deterministic windowed SSIM for canonical LOD screenshots."""

from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path

import numpy as np
from PIL import Image


CAPTURE_PATTERN = re.compile(
    r"^(?P<dataset>[A-Za-z0-9_-]+)__sse-(?P<sse>\d+)__view-(?P<view>\d+)\.png$"
)


def parse_capture_name(filename: str) -> dict:
    match = CAPTURE_PATTERN.match(Path(filename).name)
    if not match:
        raise ValueError(f"Invalid capture filename: {filename}")
    return {
        "dataset": match.group("dataset"),
        "sse": int(match.group("sse")),
        "view": int(match.group("view")),
    }


def _local_mean(channel: np.ndarray, window: int = 11) -> np.ndarray:
    radius = window // 2
    padded = np.pad(channel, ((radius, radius), (radius, radius)), mode="reflect")
    integral = np.pad(padded, ((1, 0), (1, 0)), mode="constant").cumsum(0).cumsum(1)
    sums = (
        integral[window:, window:]
        - integral[:-window, window:]
        - integral[window:, :-window]
        + integral[:-window, :-window]
    )
    return sums / (window * window)


def ssim_arrays(reference: np.ndarray, candidate: np.ndarray) -> float:
    if reference.shape != candidate.shape:
        raise ValueError("SSIM images must have identical dimensions")
    if reference.ndim == 2:
        reference = reference[:, :, None]
        candidate = candidate[:, :, None]
    if reference.ndim != 3 or reference.shape[2] not in (1, 3, 4):
        raise ValueError("SSIM expects grayscale, RGB, or RGBA arrays")
    reference = reference[:, :, :3].astype(np.float64)
    candidate = candidate[:, :, :3].astype(np.float64)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    channel_scores = []
    for channel_index in range(reference.shape[2]):
        left = reference[:, :, channel_index]
        right = candidate[:, :, channel_index]
        mean_left = _local_mean(left)
        mean_right = _local_mean(right)
        variance_left = np.maximum(0, _local_mean(left * left) - mean_left * mean_left)
        variance_right = np.maximum(0, _local_mean(right * right) - mean_right * mean_right)
        covariance = _local_mean(left * right) - mean_left * mean_right
        numerator = (2 * mean_left * mean_right + c1) * (2 * covariance + c2)
        denominator = (mean_left * mean_left + mean_right * mean_right + c1) * (
            variance_left + variance_right + c2
        )
        channel_scores.append(float(np.mean(numerator / denominator)))
    return float(np.mean(channel_scores))


def lpips_input_array(image: np.ndarray) -> np.ndarray:
    if image.ndim != 3 or image.shape[2] not in (3, 4):
        raise ValueError("LPIPS expects an RGB or RGBA array")
    rgb = image[:, :, :3].astype(np.float32) / 127.5 - 1.0
    return np.transpose(rgb, (2, 0, 1))


class LpipsEvaluator:
    def __init__(self) -> None:
        try:
            import lpips
            import torch
        except ImportError as error:
            raise RuntimeError(
                "LPIPS requires torch and lpips; install analysis/requirements-lpips.txt"
            ) from error
        self.torch = torch
        self.model = lpips.LPIPS(net="alex")
        self.model.eval()

    def compare(self, reference: np.ndarray, candidate: np.ndarray) -> float:
        if reference.shape != candidate.shape:
            raise ValueError("LPIPS images must have identical dimensions")
        left = self.torch.from_numpy(lpips_input_array(reference)).unsqueeze(0)
        right = self.torch.from_numpy(lpips_input_array(candidate)).unsqueeze(0)
        with self.torch.no_grad():
            return float(self.model(left, right).item())


def analyze_captures(input_dir: Path, output_csv: Path, compute_lpips: bool = False) -> int:
    captures = {}
    for path in sorted(input_dir.glob("*.png")):
        try:
            metadata = parse_capture_name(path.name)
        except ValueError:
            continue
        captures[(metadata["dataset"], metadata["sse"], metadata["view"])] = path

    rows = []
    lpips_evaluator = LpipsEvaluator() if compute_lpips else None
    for (dataset, sse, view), path in captures.items():
        reference_path = captures.get((dataset, 4, view))
        if reference_path is None:
            continue
        reference = np.asarray(Image.open(reference_path).convert("RGB"))
        candidate = np.asarray(Image.open(path).convert("RGB"))
        rows.append(
            {
                "dataset": dataset,
                "sse": sse,
                "view": view,
                "reference": reference_path.name,
                "candidate": path.name,
                "ssim": ssim_arrays(reference, candidate),
                "lpips": lpips_evaluator.compare(reference, candidate)
                if lpips_evaluator else "",
            }
        )
    output_csv.parent.mkdir(parents=True, exist_ok=True)
    with output_csv.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["dataset", "sse", "view", "reference", "candidate", "ssim", "lpips"],
        )
        writer.writeheader()
        writer.writerows(rows)
    return len(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=Path("../results/quality/captures"))
    parser.add_argument("--output", type=Path, default=Path("../results/quality/quality_ssim.csv"))
    parser.add_argument("--lpips", action="store_true")
    arguments = parser.parse_args()
    count = analyze_captures(
        arguments.input.resolve(), arguments.output.resolve(), arguments.lpips
    )
    metrics = "SSIM and LPIPS" if arguments.lpips else "SSIM"
    print(f"Computed {count} {metrics} comparisons")
    return 0 if count else 2


if __name__ == "__main__":
    raise SystemExit(main())
