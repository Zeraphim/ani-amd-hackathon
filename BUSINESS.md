# Ani — Business Case

*Ani grades a highland farmer's harvest from a photo, scores its spoilage urgency, and
matches it to live Metro Manila (NCR) demand — so Benguet produce sells before it spoils.
This document covers the market, the buyer, the revenue model, and the unit economics.
Figures are cited; the interactive ROI model on the landing page lets a judge change the
inputs live.*

---

## 1. The problem (quantified)

Benguet supplies roughly **80% of Metro Manila's highland vegetables** — the country's
"Salad Bowl." Yet a large share of that harvest is lost before it sells: the Department
of Agriculture puts general crop loss at **~30% from poor logistics**, and vegetable-specific
studies find **42–50% losses** across harvest → grading → transport → market. In 2026,
Benguet cabbage crashed to **₱4–10/kg**, below production cost, and farmers dumped harvests
or plowed them back as fertilizer.

The root cause is not growing capacity — it's **coordination and timing**. Farmers are
price-takers with no live demand signal, so they harvest into gluts; there is no cold chain
to hold what does sell. Government's answer is **₱93B** of physical post-harvest capex over
three years — slow, centralized, and years away. **The losses happening this season are a
software problem: grade it, match it to live demand, and move the most perishable loads
first.** That is the gap Ani fills.

## 2. Who uses it vs. who pays

**Users (touch the app):**
- Highland vegetable farmers & co-ops (La Trinidad, Buguias, Atok) — post a harvest photo, get a grade + spoilage-urgency score + recommended buyer.
- Haulers / drivers — a spoilage-prioritized load feed.
- Wholesalers & institutional buyers (Balintawak, Divisoria, supermarket & QSR commissaries) — a demand-matched availability feed.

**Buyers (pay):**
- **Farmer cooperatives & trading-post associations** (e.g., La Trinidad *Bagsakan*) — SaaS/transaction fee to cut member losses.
- **Agri-logistics operators / consolidators** — matching + dispatch optimization as a service.
- **Institutional buyers** — pay for reliable, graded, spoilage-aware supply.
- **Public sector (expansion)** — DA / LGUs, given the demonstrated ₱93B budget appetite.

**Beachhead:** one Benguet co-op + the La Trinidad trading post → expand across Luzon → SEA cold chains.

## 3. Market sizing

| Layer | Figure | Note |
|---|---|---|
| **TAM** | ASEAN cold-chain logistics **~$9.18B (2025), ~8.8% CAGR** | SEA expansion |
| **SAM** | Philippine cold-chain logistics **→ ~$3.14B by 2031** (~$1.3B today, 10% CAGR) | beachhead market |
| **Cost-of-problem proxy** | Government spending **₱93B** post-harvest capex to save **₱10.7B/yr** on rice & corn *alone* | vegetables more perishable, unaddressed — quantified willingness-to-pay |

## 4. Unit economics — the ROI model

The interactive calculator on the site (Market section) computes this live; the default
scenario, per harvest cycle for a single mid-size co-op load:

| Input (default) | Value |
|---|---|
| Harvest volume | 1,000 kg |
| Farm-gate price | ₱25 / kg |
| Baseline spoilage (no matching) | 42% |
| Spoilage with Ani (grade + demand match) | 17% |

**Result (model):** spoilage avoided on **250 kg**, **≈ ₱6,250 recovered per 1,000 kg
cycle**, and a **~43% increase in sellable revenue** (sellable share 58% → 83%). Scaled
across a co-op moving tens of tons per week, the recovered value is the SaaS/transaction-fee
willingness-to-pay. *This is a transparent model on cited loss rates, not a measured pilot
result — the inputs are editable so a judge can pressure-test it.*

**Revenue model:** (1) per-transaction match fee to co-ops/traders; (2) SaaS tier for
consolidators (dispatch optimization); (3) institutional supply contracts. The data
flywheel (every photo + realized sale price is a new labeled example) compounds grading
accuracy and switching cost over time.

## 5. Why AMD is the moat, not a checkbox

Ani's grader is a **Gemma-3-27B model LoRA-fine-tuned and served on a single AMD Instinct
MI300X**. The 192 GB of HBM3 co-hosts the grader + reasoning + KV budget on **one card**
(measured ~151 GiB reservation; does not fit a single 80 GB H100 — see
`training/receipts/METRICS.md`). That enables the defensible part of the business:

1. **Proprietary fine-tuned grader** — not an API wrapper; +13.3 pts over base on held-out grading.
2. **On-prem / data sovereignty** — a co-op runs the whole stack on-site; pricing, contracts, and farmer data never leave the cooperative, and it works with spotty rural connectivity.
3. **Data flywheel** — proprietary labeled data compounds; generic-LLM competitors can't replicate it.

This trio is why Ani becomes defensible, and it doubles as the **"Best AMD-Hosted Gemma
Project"** entry.

## 6. Competitive position

Generic "AI assistant for farmers" tools (weather/irrigation chat over a hosted LLM) don't
grade produce, don't match to live demand, and have no AMD-native model or data moat. Ani's
differentiation is the **fine-tuned vision grader + demand-matching engine running privately
on AMD**, aimed at a specific, quantified regional loss with named paying customers.

## 7. Risks & mitigations

- **Data cold-start** → seed with real DA/PSA/Bantay-Presyo prices and a curated produce set; flywheel improves it.
- **Connectivity** → on-prem MI300X deployment is offline-capable by design.
- **Adoption friction** → photo-first UX (one photo → grade → buyer); no manual data entry.
- **GPU cost at pilot scale** → one card co-hosts the stack; on-prem economics beat multi-GPU cloud.

---

### Sources
- Benguet ~80% of NCR upland vegetables; 2026 dumping: [Nordis](https://nordis.net/2026/06/02/article/feature/rescue-buy-exposes-toll-of-benguet-vegetable-price-crash/) · [GMA](https://www.gmanetwork.com/regionaltv/news/113642/benguet-farmers-dump-crops-as-prices-crash/story/)
- ~30% crop loss from logistics: [Philstar/DA, Jan 2024](https://www.philstar.com/headlines/2024/01/17/2326363/da-30-percent-crops-wasted-due-poor-logistics); vegetable 42–50% loss: [JSDA/J-Stage](https://www.jstage.jst.go.jp/article/jdsa/11/1/11_8/_pdf)
- ₱93B post-harvest program / ₱10.7B-yr savings: [Philstar](https://www.philstar.com/business/2023/07/08/2279410/private-sector-rescue)
- PH cold chain → US$3.14B by 2031: [BlueWeave](https://www.blueweaveconsulting.com/press-release/philippines-cold-chain-logistics-market-booming-to-reach-usd-3-14-billion-by-2031); ASEAN ~$9.18B (2025): [Data Insights](https://www.datainsightsmarket.com/reports/asean-cold-chain-logistics-market-16368)
- Measured AMD/model figures: `training/receipts/METRICS.md`, `vllm_serve.log`, `b7_metrics.json`
