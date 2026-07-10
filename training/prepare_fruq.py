"""Prepare a deterministic 300-image FruQ-DB grading split for B7.

Source: FruQ-DB, DOI 10.5281/zenodo.7224690, CC BY 4.0.
The archive contains adjacent time-lapse frames. We select at most one frame from a
canonical sequence name, then make an 80/20 stratified split to avoid frame leakage.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
import re
import zipfile
from pathlib import Path


EXPECTED_MD5 = "1a942c2d49dc302bacef155561e1f9a8"
LABELS = {
    "Fresh": {
        "grade": "A",
        "score": 92,
        "ripeness": "fresh",
        "shelfLifeHours": 72,
        "freshnessWindow": "3 days",
        "freshnessFill": 90,
        "urgency": "low",
        "suggestion": "Keep chilled and route to the highest-value buyer.",
    },
    "Mild": {
        "grade": "B",
        "score": 72,
        "ripeness": "mature with mild deterioration",
        "shelfLifeHours": 36,
        "freshnessWindow": "1.5 days",
        "freshnessFill": 55,
        "urgency": "mid",
        "suggestion": "Sell within one day and keep the produce refrigerated.",
    },
    "Rotten": {
        "grade": "C",
        "score": 28,
        "ripeness": "overripe with visible spoilage",
        "shelfLifeHours": 8,
        "freshnessWindow": "same day",
        "freshnessFill": 20,
        "urgency": "high",
        "suggestion": "Separate damaged produce and divert it from fresh retail sale.",
    },
}


def file_md5(path: Path) -> str:
    digest = hashlib.md5()  # noqa: S324 - published artifact integrity checksum
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sequence_key(member: str) -> str:
    name = Path(member).name
    return re.sub(r" \(\d+\)(?=\.[^.]+$)", "", name, flags=re.IGNORECASE)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", default="data/raw/FruQ-DB.zip")
    parser.add_argument("--extract-root", default="data/raw")
    parser.add_argument("--out", default="data/produce_grades.jsonl")
    parser.add_argument("--per-class", type=int, default=100)
    parser.add_argument("--eval-per-class", type=int, default=20)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    archive = Path(args.archive)
    extract_root = Path(args.extract_root)
    output = Path(args.out)
    actual_md5 = file_md5(archive)
    if actual_md5 != EXPECTED_MD5:
        raise SystemExit(f"checksum mismatch: expected {EXPECTED_MD5}, got {actual_md5}")

    rng = random.Random(args.seed)
    selected: list[dict] = []
    with zipfile.ZipFile(archive) as bundle:
        members = [
            name
            for name in bundle.namelist()
            if name.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
        grouped_by_label: dict[str, dict[str, list[str]]] = {}
        all_sequences: set[str] = set()
        for label in LABELS:
            candidates = [name for name in members if f"/{label}/" in name]
            by_sequence: dict[str, list[str]] = {}
            for name in candidates:
                by_sequence.setdefault(sequence_key(name), []).append(name)
            grouped_by_label[label] = by_sequence
            all_sequences.update(by_sequence)

        # A canonical time-lapse sequence may cross quality classes. Assign it once,
        # globally, so no adjacent frames from that sequence leak across the split.
        shuffled_sequences = sorted(all_sequences)
        rng.shuffle(shuffled_sequences)
        eval_pool = set(shuffled_sequences[: round(len(shuffled_sequences) * 0.2)])

        for label, target in LABELS.items():
            by_sequence = grouped_by_label[label]
            eval_candidates = sorted(set(by_sequence) & eval_pool)
            train_candidates = sorted(set(by_sequence) - eval_pool)
            train_needed = args.per_class - args.eval_per_class
            if len(eval_candidates) < args.eval_per_class or len(train_candidates) < train_needed:
                raise SystemExit(f"not enough globally split {label} sequences")
            chosen_eval = rng.sample(eval_candidates, args.eval_per_class)
            chosen_train = rng.sample(train_candidates, train_needed)
            for split, sequence in [
                *(("eval", name) for name in chosen_eval),
                *(("train", name) for name in chosen_train),
            ]:
                member = rng.choice(sorted(by_sequence[sequence]))
                bundle.extract(member, extract_root)
                selected.append(
                    {
                        "image": str(extract_root / member),
                        "split": split,
                        "crop": "produce",
                        "quality_label": label,
                        "grade": target["grade"],
                        "target": target,
                        "sequence": sequence,
                        "source": "FruQ-DB v1; doi:10.5281/zenodo.7224690; CC BY 4.0",
                    }
                )

    rng.shuffle(selected)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", encoding="utf-8") as handle:
        for row in selected:
            handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")

    train_count = sum(row["split"] == "train" for row in selected)
    eval_count = len(selected) - train_count
    print(f"archive_md5={actual_md5}")
    print(f"examples={len(selected)} train={train_count} eval={eval_count} seed={args.seed}")
    print(f"wrote={output}")


if __name__ == "__main__":
    main()
