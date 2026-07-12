#!/usr/bin/env python3
"""Measure Ani's end-to-end image grading latency on the MI300X.

The benchmark calls FastAPI's ``/process`` endpoint with a real repository image,
then counts a request as successful only when the response preserves the product
contract (grade A/B/C and the expected ``source`` tag). Warmups are excluded.

This is product-path latency, not raw vLLM token throughput. It includes FastAPI,
Gemma vision inference, response parsing, and buyer matching.
"""
from __future__ import annotations

import argparse
import base64
import collections
import datetime
import hashlib
import json
import os
import statistics
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


DEFAULT_IMAGE = Path(__file__).resolve().parents[1] / "web" / "public" / "Pechay_B12.jpg"


def percentile(values: list[float], q: float) -> float:
    ordered = sorted(values)
    return ordered[min(len(ordered) - 1, int(round(q * (len(ordered) - 1))))]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--base-url",
        default=os.getenv("ANI_PROCESS_URL", "http://127.0.0.1:8000"),
        help="FastAPI base URL; /process is appended automatically",
    )
    parser.add_argument("--image", type=Path, default=DEFAULT_IMAGE)
    parser.add_argument("--n", type=int, default=20)
    parser.add_argument("--concurrency", type=int, default=1)
    parser.add_argument("--warmup", type=int, default=2)
    parser.add_argument("--timeout", type=float, default=120.0)
    parser.add_argument("--expected-source", default="mi300x")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(__file__).parent / "receipts" / "latency_bench.json",
    )
    args = parser.parse_args()

    image_bytes = args.image.read_bytes()
    image_data = "data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("ascii")
    payload = json.dumps(
        {
            "crop": "pechay",
            "location": "La Trinidad, Benguet",
            "quantity_kg": 450,
            "image_data": image_data,
        }
    ).encode()

    def one_call(_: int = 0) -> dict:
        request = urllib.request.Request(
            args.base_url.rstrip("/") + "/process",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(request, timeout=args.timeout) as response:
                body = json.loads(response.read().decode())
            source = str(body.get("source", "missing"))
            grade = str(body.get("grade", "missing"))
            valid = source == args.expected_source and grade in {"A", "B", "C"}
            return {
                "latency_s": time.perf_counter() - started,
                "source": source,
                "grade": grade,
                "ok": valid,
                "error": None if valid else "unexpected response contract",
            }
        except Exception as exc:  # noqa: BLE001
            return {
                "latency_s": time.perf_counter() - started,
                "source": "error",
                "grade": "error",
                "ok": False,
                "error": str(exc),
            }

    print(
        f"[bench] {args.n} image grades @ concurrency {args.concurrency} "
        f"-> {args.base_url.rstrip('/')}/process"
    )
    for index in range(args.warmup):
        print(f"[warmup {index + 1}/{args.warmup}] {one_call(index)}")

    wall_started = time.perf_counter()
    if args.concurrency == 1:
        results = []
        for index in range(args.n):
            result = one_call(index)
            results.append(result)
            print(f"[request {index + 1}/{args.n}] {result}")
    else:
        with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
            results = list(pool.map(one_call, range(args.n)))
    wall_seconds = time.perf_counter() - wall_started

    successful = [result for result in results if result["ok"]]
    if not successful:
        raise SystemExit("[bench] all requests failed or returned a non-mi300x source")
    latencies = [result["latency_s"] for result in successful]
    output = {
        "captured_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "measurement": "end-to-end image /process latency",
        "base_url": args.base_url,
        "sample_image": args.image.name,
        "sample_sha256": hashlib.sha256(image_bytes).hexdigest(),
        "expected_source": args.expected_source,
        "requests": args.n,
        "succeeded": len(successful),
        "failed": args.n - len(successful),
        "concurrency": args.concurrency,
        "warmup_requests_excluded": args.warmup,
        "latency_s": {
            "p50": round(percentile(latencies, 0.50), 3),
            "p95": round(percentile(latencies, 0.95), 3),
            "mean": round(statistics.mean(latencies), 3),
            "min": round(min(latencies), 3),
            "max": round(max(latencies), 3),
        },
        "grades_per_min": round(len(successful) / wall_seconds * 60, 2),
        "wall_seconds": round(wall_seconds, 2),
        "sources": dict(collections.Counter(result["source"] for result in results)),
        "grades": dict(collections.Counter(result["grade"] for result in results)),
        "errors": [result["error"] for result in results if result["error"]],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n")
    print(json.dumps(output, indent=2))
    print(f"[bench] wrote {args.output}")


if __name__ == "__main__":
    main()
