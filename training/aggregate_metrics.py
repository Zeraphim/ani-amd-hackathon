#!/usr/bin/env python3
"""Aggregate B7 grading metrics into an honest, judge-ready summary.

Reads per-seed runs from receipts/variance/b7_metrics_seed*.json (produced by
run_variance_eval.sh). If none exist, falls back to the single receipts/b7_metrics.json
so this still works today with the one run we already have.

Reports, per stage (base / tuned):
  - mean +/- std across seeds
  - min / max
  - Wilson 95% confidence interval for the mean accuracy at the eval-set size n
    (honest treatment of a small held-out set — a point estimate of 100% on n=30
    is NOT the same as "always right").

No GPU needed. Pure stdlib. Writes receipts/variance/summary.{json,md}.
"""
from __future__ import annotations

import json
import math
from pathlib import Path

RECEIPTS = Path(__file__).parent / "receipts"
VAR_DIR = RECEIPTS / "variance"
Z = 1.959963984540054  # 95%


def wilson(p: float, n: int, z: float = Z) -> tuple[float, float]:
    """Wilson score interval for a binomial proportion."""
    if n == 0:
        return (0.0, 0.0)
    denom = 1 + z * z / n
    center = (p + z * z / (2 * n)) / denom
    half = (z / denom) * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (max(0.0, center - half), min(1.0, center + half))


def load_runs() -> list[dict]:
    runs = sorted(VAR_DIR.glob("b7_metrics_seed*.json"))
    if runs:
        return [json.loads(p.read_text()) for p in runs]
    single = RECEIPTS / "b7_metrics.json"
    if single.exists():
        print("[aggregate] no variance runs found — using single receipts/b7_metrics.json")
        return [json.loads(single.read_text())]
    raise SystemExit("No metrics found. Run run_variance_eval.sh first.")


def stats(values: list[float]) -> dict:
    n = len(values)
    mean = sum(values) / n
    var = sum((v - mean) ** 2 for v in values) / (n - 1) if n > 1 else None
    return {
        "mean": mean,
        "std": math.sqrt(var) if var is not None else None,
        "min": min(values),
        "max": max(values),
        "n_runs": n,
    }


def main() -> None:
    runs = load_runs()
    n_eval = int(runs[0].get("eval_examples", 0))
    seeds = [r.get("seed") for r in runs]
    base = [float(r["base_accuracy"]) for r in runs]
    tuned = [float(r["tuned_accuracy"]) for r in runs]

    base_s, tuned_s = stats(base), stats(tuned)
    base_ci = wilson(base_s["mean"], n_eval)
    tuned_ci = wilson(tuned_s["mean"], n_eval)
    delta = tuned_s["mean"] - base_s["mean"]
    variance_available = len(runs) > 1

    summary = {
        "seeds": seeds,
        "eval_examples": n_eval,
        "variance_available": variance_available,
        "base": {**base_s, "wilson95": list(base_ci)},
        "tuned": {**tuned_s, "wilson95": list(tuned_ci)},
        "absolute_improvement": delta,
    }
    VAR_DIR.mkdir(parents=True, exist_ok=True)
    (VAR_DIR / "summary.json").write_text(json.dumps(summary, indent=2) + "\n")

    pct = lambda x: f"{x * 100:.1f}%"
    std = lambda value: pct(value) if value is not None else "N/A (1 run)"
    title = "variance summary" if variance_available else "single-run summary"
    lines = [
        f"# Grading accuracy — {title}",
        "",
        f"Runs: {len(runs)} (seeds {seeds}) · held-out eval set n = **{n_eval}** (balanced A/B/C).",
        "" if variance_available else "**Variance is unavailable from one run; a zero standard deviation is not claimed.**",
        "",
        "| Stage | Mean | Std | Min | Max | Wilson 95% CI |",
        "|---|---|---|---|---|---|",
        f"| Base Gemma-3-27B | {pct(base_s['mean'])} | {std(base_s['std'])} | {pct(base_s['min'])} | {pct(base_s['max'])} | [{pct(base_ci[0])}, {pct(base_ci[1])}] |",
        f"| + Ani LoRA (tuned) | {pct(tuned_s['mean'])} | {std(tuned_s['std'])} | {pct(tuned_s['min'])} | {pct(tuned_s['max'])} | [{pct(tuned_ci[0])}, {pct(tuned_ci[1])}] |",
        "",
        f"**Absolute improvement: +{delta * 100:.1f} pts.**",
        "",
        "Honesty notes: the Wilson interval reflects the small eval size — even a perfect "
        f"score on n={n_eval} is a *range*, not a guarantee. Report the CI, not a bare 100%. "
        "If the intervals overlap, run more seeds and/or enlarge the eval split. "
        + ("Seed variance is reported separately." if variance_available else "This file is not multi-seed evidence."),
        "",
    ]
    (VAR_DIR / "summary.md").write_text("\n".join(lines))
    print("\n".join(lines))
    print(f"[aggregate] wrote {VAR_DIR/'summary.md'} and summary.json")


if __name__ == "__main__":
    main()
