# Grading accuracy — single-run summary

Runs: 1 (seeds [42]) · held-out eval set n = **30** (balanced A/B/C).
**Variance is unavailable from one run; a zero standard deviation is not claimed.**

| Stage | Mean | Std | Min | Max | Wilson 95% CI |
|---|---|---|---|---|---|
| Base Gemma-3-27B | 86.7% | N/A (1 run) | 86.7% | 86.7% | [70.3%, 94.7%] |
| + Ani LoRA (tuned) | 100.0% | N/A (1 run) | 100.0% | 100.0% | [88.6%, 100.0%] |

**Absolute improvement: +13.3 pts.**

Honesty notes: the Wilson interval reflects the small eval size — even a perfect score on n=30 is a *range*, not a guarantee. Report the CI, not a bare 100%. If the intervals overlap, run more seeds and/or enlarge the eval split. This file is not multi-seed evidence.
