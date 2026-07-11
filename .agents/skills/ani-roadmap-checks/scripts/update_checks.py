#!/usr/bin/env python3
"""Audit and conservatively update Ani roadmap checkboxes.

This script never commits, pushes, merges, or changes production. It can perform a small
read-only GitHub/live-health check when available, but local receipts remain the source of
truth for Track B evidence.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
PLAN = ROOT / "docs/06-execution-plan.md"
ROADMAP = ROOT / "docs/02-roadmap.md"


def exists(*parts: str) -> bool:
    return (ROOT.joinpath(*parts)).exists()


def contains(path: Path, text: str) -> bool:
    return path.exists() and text in path.read_text(encoding="utf-8", errors="replace")


def live_health(url: str) -> bool:
    try:
        with urllib.request.urlopen(url, timeout=8) as response:  # noqa: S310 - fixed audit URL
            payload = json.loads(response.read().decode("utf-8"))
        return payload.get("ok") is True and payload.get("backend") == "mi300x"
    except Exception:  # noqa: BLE001 - an unavailable live service must stay unchecked
        return False


def repo_is_public() -> bool | None:
    gh = shutil.which("gh")
    if not gh:
        return None
    try:
        result = subprocess.run(
            [gh, "repo", "view", "Zeraphim/ani-amd-hackathon", "--json", "isPrivate"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=12,
            check=True,
        )
        return json.loads(result.stdout).get("isPrivate") is False
    except Exception:  # noqa: BLE001 - unavailable auth is not completion evidence
        return None


def evidence() -> dict[str, bool | None]:
    train_log = ROOT / "training/receipts/train.log"
    vllm_log = ROOT / "training/receipts/vllm_serve.log"
    rocm_log = ROOT / "training/receipts/rocm-smi.log"
    notes = ROOT / "training/receipts/ROCM_NOTES.md"
    metrics = ROOT / "training/receipts/b7_metrics.json"
    build_id = ROOT / "web/.next/BUILD_ID"

    b7_metrics = False
    if metrics.exists():
        try:
            payload = json.loads(metrics.read_text(encoding="utf-8"))
            b7_metrics = all(
                key in payload
                for key in ("base_accuracy", "tuned_accuracy", "absolute_change")
            )
        except json.JSONDecodeError:
            pass

    return {
        "A1": repo_is_public(),
        "A3": build_id.exists(),
        "A6": contains(PLAN, "Decision E1") and contains(PLAN, "formally waived"),
        "B1": contains(rocm_log, "gfx942") and contains(rocm_log, "VRAM Total Memory"),
        "B2": contains(vllm_log, "Gemma3ForConditionalGeneration")
        and contains(vllm_log, "Multi-modal warmup completed"),
        "B3": contains(vllm_log, "Model loading took") and contains(vllm_log, "vllm=0.23.0"),
        "B4": (contains(notes, "Cloudflare **named** tunnel") and contains(notes, "ani-api.jcdiamante.com"))
        or live_health("https://ani-api.jcdiamante.com/"),
        "B5": contains(train_log, "source=mi300x")
        and (contains(notes, "Public FastAPI health") or live_health("https://ani-api.jcdiamante.com/")),
        "B6": contains(train_log, "endpoint=ani-amd-hackathon.vercel.app/api/process")
        and contains(train_log, "source=mi300x"),
        "B7": train_log.exists()
        and (ROOT / "training/receipts/loss_curve.svg").exists()
        and b7_metrics,
        "B8": notes.exists()
        and notes.read_text(encoding="utf-8").count("- [x]") >= 8,
    }


def set_checkbox(line: str, checked: bool) -> str:
    marker = "[x]" if checked else "[ ]"
    return re.sub(r"\[(?: |x|X)\]", marker, line, count=1)


def update_plan(text: str, facts: dict[str, bool | None], apply: bool) -> tuple[str, list[str]]:
    changed: list[str] = []
    lines = []
    task_pattern = re.compile(r"^(\|\s*)([A-C]\d|S\d)(\s*\|\s*)(\[[ xX]\]\s*)?(.*)$")
    for line in text.splitlines(keepends=True):
        match = task_pattern.match(line.rstrip("\n"))
        if not match:
            lines.append(line)
            continue
        task_id = match.group(2)
        old = match.group(4) or "[ ] "
        status = facts.get(task_id)
        new = old if status is None else "[x] " if status else "[ ] "
        if old.strip() != new.strip():
            changed.append(f"{task_id}: {old.strip()} -> {new.strip()}")
        rebuilt = "".join((match.group(1), task_id, match.group(3), new, match.group(5)))
        lines.append(rebuilt + "\n")
    result = "".join(lines)
    return (result if apply else text), changed


def update_roadmap(text: str, facts: dict[str, bool | None], apply: bool) -> tuple[str, list[str]]:
    changed: list[str] = []
    lines = []
    for line in text.splitlines(keepends=True):
        match = re.match(r"^(\s*-\s*)(\[[ xX]\])(\s+)(.*)$", line.rstrip("\n"))
        if not match:
            lines.append(line)
            continue
        body = match.group(4)
        task_id = next((key for key in facts if re.search(rf"\b{key}\b", body)), None)
        if not task_id:
            lines.append(line)
            continue
        old = match.group(2)
        status = facts[task_id]
        new = old if status is None else "[x]" if status else "[ ]"
        if old.lower() != new:
            changed.append(f"roadmap {task_id}: {old} -> {new}")
        lines.append(f"{match.group(1)}{new}{match.group(3)}{body}\n")
    result = "".join(lines)
    return (result if apply else text), changed


def main() -> int:
    parser = argparse.ArgumentParser()
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    facts = evidence()
    print("Evidence:")
    for task_id, status in facts.items():
        label = "done" if status is True else "not proven" if status is False else "unavailable"
        print(f"  {task_id}: {label}")

    plan_text, plan_changes = update_plan(PLAN.read_text(encoding="utf-8"), facts, args.apply)
    roadmap_text, roadmap_changes = update_roadmap(ROADMAP.read_text(encoding="utf-8"), facts, args.apply)
    changes = plan_changes + roadmap_changes
    print("Checkbox changes:")
    print("  " + "\n  ".join(changes) if changes else "  none")

    if args.apply and changes:
        PLAN.write_text(plan_text, encoding="utf-8")
        ROADMAP.write_text(roadmap_text, encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
