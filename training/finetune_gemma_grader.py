"""One-epoch multimodal LoRA fine-tune and evaluation for Ani B7 on MI300X."""
from __future__ import annotations

import argparse
import json
import math
import random
import re
import time
from pathlib import Path


SYSTEM_PROMPT = (
    "You are Ani's harvest grader. Inspect the produce photo and return only JSON with "
    "these exact keys: grade, score, ripeness, shelfLifeHours, freshnessWindow, "
    "freshnessFill, urgency, suggestion. grade must be A, B, or C."
)


def load_rows(path: Path, split: str) -> list[dict]:
    with path.open(encoding="utf-8") as handle:
        rows = [json.loads(line) for line in handle if line.strip()]
    return [row for row in rows if row["split"] == split]


def grade_from_text(text: str) -> str:
    patterns = [
        r'"grade"\s*:\s*"([ABC])"',
        r"\bgrade\s*[:=-]\s*([ABC])\b",
        r"\b([ABC])\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(1).upper()
    return "INVALID"


def messages_for(row: dict, include_target: bool) -> list[dict]:
    from PIL import Image

    with Image.open(row["image"]) as source_image:
        image = source_image.convert("RGB").copy()
    messages = [
        {"role": "system", "content": [{"type": "text", "text": SYSTEM_PROMPT}]},
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": "Grade this produce photo."},
            ],
        },
    ]
    if include_target:
        messages.append(
            {
                "role": "assistant",
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(row["target"], separators=(",", ":")),
                    }
                ],
            }
        )
    return messages


def move_batch(batch, device, torch):
    moved = {}
    for key, value in batch.items():
        value = value.to(device)
        if value.is_floating_point():
            value = value.to(torch.bfloat16)
        moved[key] = value
    return moved


def encode_training_row(row, processor, device, torch):
    prompt = processor.apply_chat_template(
        messages_for(row, include_target=False),
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    )
    full = processor.apply_chat_template(
        messages_for(row, include_target=True),
        tokenize=True,
        add_generation_prompt=False,
        return_dict=True,
        return_tensors="pt",
    )
    full = move_batch(full, device, torch)
    labels = full["input_ids"].clone()
    labels[:, : prompt["input_ids"].shape[1]] = -100
    if "attention_mask" in full:
        labels[full["attention_mask"] == 0] = -100
    full["labels"] = labels
    return full


def evaluate(model, processor, rows, device, torch, stage: str, predictions_path: Path):
    model.eval()
    correct = 0
    results = []
    previous_cache = getattr(model.config, "use_cache", None)
    model.config.use_cache = True
    started = time.time()
    with torch.inference_mode():
        for index, row in enumerate(rows, start=1):
            batch = processor.apply_chat_template(
                messages_for(row, include_target=False),
                tokenize=True,
                add_generation_prompt=True,
                return_dict=True,
                return_tensors="pt",
            )
            batch = move_batch(batch, device, torch)
            generated = model.generate(
                **batch,
                max_new_tokens=24,
                do_sample=False,
                temperature=None,
                top_p=None,
            )
            prompt_len = batch["input_ids"].shape[1]
            text = processor.tokenizer.decode(generated[0, prompt_len:], skip_special_tokens=True)
            predicted = grade_from_text(text)
            correct += predicted == row["grade"]
            results.append(
                {
                    "stage": stage,
                    "image": row["image"],
                    "expected": row["grade"],
                    "predicted": predicted,
                    "response": text,
                }
            )
            print(f"[eval:{stage}] {index}/{len(rows)} expected={row['grade']} predicted={predicted}")
    if previous_cache is not None:
        model.config.use_cache = previous_cache
    with predictions_path.open("a", encoding="utf-8") as handle:
        for result in results:
            handle.write(json.dumps(result, ensure_ascii=False) + "\n")
    accuracy = correct / len(rows) if rows else 0.0
    print(f"[eval:{stage}] accuracy={accuracy:.4f} correct={correct}/{len(rows)} seconds={time.time()-started:.1f}")
    return accuracy


def write_loss_curve(losses: list[dict], csv_path: Path, svg_path: Path) -> None:
    csv_path.write_text(
        "step,loss\n" + "".join(f"{row['step']},{row['loss']:.6f}\n" for row in losses),
        encoding="utf-8",
    )
    width, height, pad = 900, 480, 60
    values = [row["loss"] for row in losses] or [0.0]
    low, high = min(values), max(values)
    span = max(high - low, 1e-6)
    points = []
    for index, value in enumerate(values):
        x = pad + index * (width - 2 * pad) / max(len(values) - 1, 1)
        y = height - pad - (value - low) * (height - 2 * pad) / span
        points.append(f"{x:.1f},{y:.1f}")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
<rect width="100%" height="100%" fill="#fffdf5"/>
<text x="{pad}" y="32" font-family="sans-serif" font-size="22" fill="#173f35">Ani Gemma 3 LoRA — training loss</text>
<line x1="{pad}" y1="{height-pad}" x2="{width-pad}" y2="{height-pad}" stroke="#173f35"/>
<line x1="{pad}" y1="{pad}" x2="{pad}" y2="{height-pad}" stroke="#173f35"/>
<polyline points="{' '.join(points)}" fill="none" stroke="#d99b28" stroke-width="4"/>
<text x="{pad}" y="{height-18}" font-family="monospace" font-size="14">optimizer step</text>
<text x="{pad+8}" y="{pad+18}" font-family="monospace" font-size="14">loss {high:.4f} → {values[-1]:.4f}</text>
</svg>'''
    svg_path.write_text(svg, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="google/gemma-3-27b-it")
    parser.add_argument("--data", default="data/produce_grades.jsonl")
    parser.add_argument("--out", default="/shared-docker/ani-artifacts/ani-gemma-grader-lora")
    parser.add_argument("--receipts", default="receipts")
    parser.add_argument("--epochs", type=int, default=1)
    parser.add_argument("--eval-limit", type=int, default=30)
    parser.add_argument("--gradient-accumulation", type=int, default=8)
    parser.add_argument("--learning-rate", type=float, default=2e-4)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    import torch
    from peft import LoraConfig, get_peft_model
    from transformers import AutoProcessor, Gemma3ForConditionalGeneration

    if not torch.cuda.is_available():
        raise SystemExit("ROCm/CUDA device is required")
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device("cuda:0")
    properties = torch.cuda.get_device_properties(0)
    arch = getattr(properties, "gcnArchName", "unknown")
    print(f"[ani] device={torch.cuda.get_device_name(0)} arch={arch} hip={torch.version.hip}")
    print(f"[ani] model={args.base} epochs={args.epochs} seed={args.seed}")

    receipts = Path(args.receipts)
    receipts.mkdir(parents=True, exist_ok=True)
    predictions_path = receipts / "b7_predictions.jsonl"
    predictions_path.write_text("", encoding="utf-8")
    train_rows = load_rows(Path(args.data), "train")
    all_eval_rows = load_rows(Path(args.data), "eval")
    eval_rows = []
    per_grade = max(1, args.eval_limit // 3)
    for grade in ("A", "B", "C"):
        eval_rows.extend([row for row in all_eval_rows if row["grade"] == grade][:per_grade])
    print(f"[ani] dataset train={len(train_rows)} eval={len(eval_rows)}")

    processor = AutoProcessor.from_pretrained(args.base)
    model = Gemma3ForConditionalGeneration.from_pretrained(
        args.base,
        torch_dtype=torch.bfloat16,
        attn_implementation="eager",
        low_cpu_mem_usage=True,
    ).to(device)
    model.config.use_cache = True
    base_accuracy = evaluate(model, processor, eval_rows, device, torch, "base", predictions_path)

    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    model.config.use_cache = False
    model.gradient_checkpointing_enable(gradient_checkpointing_kwargs={"use_reentrant": False})
    model.enable_input_require_grads()
    optimizer = torch.optim.AdamW(
        [parameter for parameter in model.parameters() if parameter.requires_grad],
        lr=args.learning_rate,
    )

    losses = []
    optimizer_step = 0
    model.train()
    optimizer.zero_grad(set_to_none=True)
    started = time.time()
    for epoch in range(args.epochs):
        random.Random(args.seed + epoch).shuffle(train_rows)
        for index, row in enumerate(train_rows, start=1):
            batch = encode_training_row(row, processor, device, torch)
            with torch.autocast(device_type="cuda", dtype=torch.bfloat16):
                output = model(**batch)
                raw_loss = output.loss
                loss = raw_loss / args.gradient_accumulation
            loss.backward()
            should_step = index % args.gradient_accumulation == 0 or index == len(train_rows)
            if should_step:
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                optimizer.zero_grad(set_to_none=True)
                optimizer_step += 1
                value = float(raw_loss.detach().cpu())
                losses.append({"step": optimizer_step, "loss": value})
                print(f"[train] epoch={epoch+1} example={index}/{len(train_rows)} step={optimizer_step} loss={value:.6f}")

    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(output_dir)
    processor.save_pretrained(output_dir)
    print(f"[ani] saved_adapter={output_dir} train_seconds={time.time()-started:.1f}")

    tuned_accuracy = evaluate(model, processor, eval_rows, device, torch, "tuned", predictions_path)
    metrics = {
        "base_model": args.base,
        "adapter": str(output_dir),
        "train_examples": len(train_rows),
        "eval_examples": len(eval_rows),
        "epochs": args.epochs,
        "seed": args.seed,
        "base_accuracy": base_accuracy,
        "tuned_accuracy": tuned_accuracy,
        "absolute_change": tuned_accuracy - base_accuracy,
        "base_accuracy_percent": round(base_accuracy * 100, 2),
        "tuned_accuracy_percent": round(tuned_accuracy * 100, 2),
    }
    (receipts / "b7_metrics.json").write_text(json.dumps(metrics, indent=2) + "\n", encoding="utf-8")
    write_loss_curve(losses, receipts / "loss_curve.csv", receipts / "loss_curve.svg")
    print("[ani] metrics=" + json.dumps(metrics, sort_keys=True))
    if not math.isfinite(tuned_accuracy):
        raise SystemExit("non-finite tuned accuracy")


if __name__ == "__main__":
    main()
