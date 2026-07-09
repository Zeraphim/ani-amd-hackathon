// Built-in stub backend — Benguet/NCR-localized so the demo tells the story
// even with zero external services. Deterministic-ish, driven by crop perishability.

import type { GradeCard, MatchResult, BuyerMatch } from "./types";

// Perishability profiles for real Benguet highland crops.
const CROPS: Record<
  string,
  { shelfLifeH: number; ripeness: string; baseQuality: number }
> = {
  "Cabbage (Scorpio)": { shelfLifeH: 96, ripeness: "Firm, market-ready", baseQuality: 8.2 },
  "Carrots": { shelfLifeH: 168, ripeness: "Mature", baseQuality: 8.6 },
  "Broccoli": { shelfLifeH: 60, ripeness: "Tight florets", baseQuality: 7.4 },
  "Lettuce (Romaine)": { shelfLifeH: 48, ripeness: "Crisp, high moisture", baseQuality: 7.1 },
  "Bell Pepper": { shelfLifeH: 120, ripeness: "Glossy, full color", baseQuality: 8.0 },
  "Chinese Cabbage (Wombok)": { shelfLifeH: 72, ripeness: "Dense head", baseQuality: 7.6 },
};

export function stubCrops(): string[] {
  return Object.keys(CROPS);
}

export function gradeStub(crop: string, quantityKg: number): GradeCard {
  const p = CROPS[crop] ?? CROPS["Cabbage (Scorpio)"];
  // Urgency rises as shelf-life shrinks and volume grows (harder to move fast).
  const volumeFactor = Math.min(2, quantityKg / 400);
  const urgencyRaw = (240 - p.shelfLifeH) / 24 + volumeFactor * 1.5;
  const urgency = Math.max(2, Math.min(10, Number((urgencyRaw + 3).toFixed(1))));
  const quality = Number(p.baseQuality.toFixed(1));
  const grade: GradeCard["grade"] = quality >= 8 ? "A" : quality >= 7 ? "B" : "C";

  return {
    crop,
    grade,
    qualityScore: quality,
    ripeness: p.ripeness,
    shelfLifeHours: p.shelfLifeH,
    urgency,
    spoilageWindow: `Peak freshness decays in ~${p.shelfLifeH}h at ambient highland temps`,
    suggestion:
      urgency >= 7
        ? `High urgency — prioritize cold-chain dispatch within ${Math.round(
            p.shelfLifeH / 6
          )}h to hold premium NCR pricing.`
        : `Moderate urgency — consolidate with nearby farms before dispatch to cut haul cost.`,
    source: "stub",
  };
}

export function matchStub(grade: GradeCard): MatchResult {
  // A small, believable NCR buyer set. Prices in PHP/kg.
  const pool: BuyerMatch[] = [
    {
      buyer: "Balintawak Cloverleaf Trader",
      market: "Balintawak, Quezon City",
      matchPct: 96,
      demand: "Surging",
      pricePerKg: 42,
      note: "Weekend restaurant demand surging; short supply expected.",
      action: "Route First",
    },
    {
      buyer: "Divisoria Wholesale Cluster",
      market: "Divisoria, Manila",
      matchPct: 88,
      demand: "Stable",
      pricePerKg: 36,
      note: "Steady bulk offtake; reliable but price-sensitive.",
      action: "Reserve",
    },
    {
      buyer: "SM Supermarket Commissary",
      market: "Makati NCR DC",
      matchPct: 82,
      demand: "Stable",
      pricePerKg: 48,
      note: "Pays premium for Grade A with shelf-life guarantee.",
      action: "Review",
    },
    {
      buyer: "Nepa-Q-Mart Consolidator",
      market: "Cubao, Quezon City",
      matchPct: 71,
      demand: "Dipping",
      pricePerKg: 28,
      note: "Demand softening this week; hold unless urgency is high.",
      action: grade.urgency >= 7 ? "Review" : "Hold",
    },
  ];

  // Grade A lifts match/price a little; higher urgency pushes "Route First".
  const buyers = pool
    .map((b) => ({
      ...b,
      pricePerKg: grade.grade === "A" ? b.pricePerKg + 4 : b.pricePerKg,
    }))
    .sort((a, b) => b.matchPct - a.matchPct);

  return { buyers, source: "stub" };
}
