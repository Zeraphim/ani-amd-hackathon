"""Tier 3 — LoRA fine-tune of Gemma as the Ani harvest grader (runs on MI300X / ROCm).

This is the champion receipt: a real fine-tune with a before/after number.
Skeleton is runnable-shaped; fill DATA_PATH with your labeled produce set
(image/description -> grade JSON) and run on the MI300X.

    python finetune_gemma_grader.py --data data/produce_grades.jsonl --epochs 3

Keep the training log + loss curve in training/receipts/ and cite the base-vs-tuned
grading accuracy on the pitch deck.
"""
import argparse

# NOTE: imports are inside main() so the file is safe to open/inspect off-GPU.


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="google/gemma-2-9b-it")
    ap.add_argument("--data", default="data/produce_grades.jsonl")
    ap.add_argument("--out", default="ani-gemma-grader-lora")
    ap.add_argument("--epochs", type=int, default=3)
    args = ap.parse_args()

    import torch
    from datasets import load_dataset
    from peft import LoraConfig
    from transformers import AutoModelForCausalLM, AutoTokenizer
    from trl import SFTConfig, SFTTrainer

    print(f"[ani] device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}")
    print("[ani] Expect gfx942 (MI300X) here — this line is a receipt.")

    tok = AutoTokenizer.from_pretrained(args.base)
    model = AutoModelForCausalLM.from_pretrained(args.base, torch_dtype=torch.bfloat16)

    ds = load_dataset("json", data_files=args.data, split="train")

    peft_cfg = LoraConfig(
        r=16, lora_alpha=32, lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    sft_cfg = SFTConfig(
        output_dir=args.out, num_train_epochs=args.epochs,
        per_device_train_batch_size=4, gradient_accumulation_steps=4,
        learning_rate=2e-4, bf16=True, logging_steps=10, save_strategy="epoch",
    )
    trainer = SFTTrainer(model=model, args=sft_cfg, train_dataset=ds, peft_config=peft_cfg)
    trainer.train()
    trainer.save_model(args.out)
    print(f"[ani] saved LoRA adapter -> {args.out}")


if __name__ == "__main__":
    main()
