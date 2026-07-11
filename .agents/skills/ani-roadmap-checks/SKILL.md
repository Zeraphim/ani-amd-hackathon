---
name: ani-roadmap-checks
description: Audit and update Ani roadmap checkboxes from repository, receipt, build, and live-deployment evidence. Use when checking docs/02-roadmap.md or docs/06-execution-plan.md, after implementing an Ani task, or before submission assembly.
---

# Ani Roadmap Checks

Keep Ani status documents synchronized with evidence. Use this skill after implementation
work or when asked whether the roadmap is current.

## Workflow

1. Read `docs/02-roadmap.md` and `docs/06-execution-plan.md` before changing either file.
2. Run `scripts/update_checks.py --check` from the repository root. Treat its report as
   evidence, not as permission to claim work that has not actually happened.
3. Inspect receipts, source files, build output, and live endpoints for any task reported as
   ambiguous. Never infer deployment, training, or merge completion from a local edit alone.
4. Run `scripts/update_checks.py --apply` only after confirming the evidence. The script is
   intentionally conservative: it checks known completed tasks and leaves blocked, partial,
   and user-dependent tasks unchecked.
5. Review the diff. Preserve the existing task wording, exception records, and checkbox
   semantics. A checked task must have a concrete exit criterion or receipt.

## Evidence rules

- B1 requires `training/receipts/rocm-smi.log` containing `gfx942` and VRAM telemetry.
- B3 requires `training/receipts/vllm_serve.log` containing model startup and model load.
- B7 requires `training/receipts/train.log`, a loss curve, and a machine-readable base/tuned
  accuracy comparison.
- B8 requires a filled `training/receipts/ROCM_NOTES.md` with all receipt checkboxes checked.
- A3 requires a successful `web` production build; A1 requires the GitHub repository to be
  public; B6 requires a live Vercel response with `source: mi300x`.
- S1 and later assembly tasks are never auto-checked because they require deliberate git,
  submission, or infrastructure actions.
- A formally recorded exception may satisfy a prerequisite only when the exception is dated,
  evidence-backed, and explicitly present in `docs/06-execution-plan.md`.

## Safety

Do not change JSON contracts, source tags, environment wiring, or stub fallbacks while
updating checkboxes. Do not mark a task complete because a script exists. Do not commit,
push, merge, destroy infrastructure, or change production state as part of this skill.

## Resource

Use `scripts/update_checks.py` for the deterministic evidence scan and checkbox update.
