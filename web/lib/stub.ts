// Built-in stub backend — the same Benguet/NCR data the showcase uses, so the app
// looks identical whether it runs on the stub, Fireworks, or the MI300X.

import type { GradeCard, MatchResult, BuyerMatch, Dispatch, Urgency, Grade, Trend, AnalyzeResult } from "./types";

interface CropData {
  name: string;
  grade: Grade;
  score: number;
  ripe: string;
  shelf: number;
  win: string;
  fill: number;
  urgency: Urgency;
  to: string;
  eta: string;
  load: string;
  buyers: BuyerMatch[];
}

export const DATA: Record<string, CropData> = {
  pechay: {
    name: "Pechay", grade: "A", score: 92, ripe: "Crisp, tight leaves · minimal wilt",
    shelf: 48, win: "2 days", fill: 64, urgency: "high", to: "Divisoria", eta: "6h · ₱44/kg", load: "1.2t matched",
    buyers: [
      { buyer: "SM Supermalls commissary", sub: "Divisoria · needs 800kg Grade A by Thu", pricePerKg: 44, trend: "Surging", fit: "96% fit", first: true },
      { buyer: "Balintawak wholesaler", sub: "Balintawak · flexible volume · pays on pickup", pricePerKg: 38, trend: "Rising", fit: "88% fit", first: false },
      { buyer: "Hotel group (QSR)", sub: "Makati · recurring weekly order", pricePerKg: 41, trend: "Stable", fit: "81% fit", first: false },
    ],
  },
  cabbage: {
    name: "Cabbage (Scorpio)", grade: "A", score: 88, ripe: "Firm, market-ready head",
    shelf: 96, win: "4 days", fill: 42, urgency: "mid", to: "Balintawak", eta: "5h · ₱24/kg", load: "2.4t matched",
    buyers: [
      { buyer: "Balintawak Cloverleaf", sub: "Balintawak · weekend demand surging", pricePerKg: 24, trend: "Surging", fit: "94% fit", first: true },
      { buyer: "Divisoria wholesale cluster", sub: "Divisoria · steady bulk offtake", pricePerKg: 18, trend: "Stable", fit: "86% fit", first: false },
      { buyer: "NCR supermarket DC", sub: "Makati · premium for Grade A", pricePerKg: 30, trend: "Rising", fit: "80% fit", first: false },
    ],
  },
  carrots: {
    name: "Carrots", grade: "A", score: 90, ripe: "Mature · firm · low breakage",
    shelf: 168, win: "7 days", fill: 26, urgency: "low", to: "Cubao", eta: "6h · ₱55/kg", load: "3.0t matched",
    buyers: [
      { buyer: "Nepa Q-Mart consolidator", sub: "Cubao · demand rising", pricePerKg: 55, trend: "Rising", fit: "92% fit", first: true },
      { buyer: "Divisoria wholesale", sub: "Divisoria · steady offtake", pricePerKg: 50, trend: "Stable", fit: "84% fit", first: false },
      { buyer: "Supermarket DC", sub: "Makati · weekly order", pricePerKg: 58, trend: "Stable", fit: "78% fit", first: false },
    ],
  },
  broccoli: {
    name: "Broccoli", grade: "B", score: 74, ripe: "Tight florets · slight yellowing",
    shelf: 60, win: "2.5 days", fill: 58, urgency: "high", to: "Makati", eta: "6h · ₱120/kg", load: "0.4t matched",
    buyers: [
      { buyer: "Hotel group (QSR)", sub: "Makati · needs 400kg by Fri", pricePerKg: 120, trend: "Surging", fit: "90% fit", first: true },
      { buyer: "Divisoria specialty", sub: "Divisoria · premium produce", pricePerKg: 110, trend: "Rising", fit: "83% fit", first: false },
      { buyer: "Balintawak wholesaler", sub: "Balintawak · flexible", pricePerKg: 95, trend: "Stable", fit: "74% fit", first: false },
    ],
  },
};

export function stubCrops(): { id: string; name: string }[] {
  return Object.entries(DATA).map(([id, d]) => ({ id, name: d.name }));
}

export function gradeStub(cropId: string, _quantityKg: number): GradeCard {
  const d = DATA[cropId] ?? DATA.pechay;
  const rush = d.urgency === "high" ? "move within hours; " : "";
  return {
    cropId: DATA[cropId] ? cropId : "pechay",
    crop: DATA[cropId] ? d.name : cropId,
    grade: d.grade,
    score: d.score,
    ripeness: d.ripe,
    shelfLifeHours: d.shelf,
    freshnessWindow: d.win,
    freshnessFill: d.fill,
    urgency: d.urgency,
    suggestion: `“Best sold in ${d.to} — ${rush}your grade commands top price.”`,
    source: "stub",
  };
}

// Photo-first fallback. The stub can't actually see the image, so it "detects"
// the default Benguet harvest (pechay) and returns a plausible volume estimate.
// This keeps the demo alive when the inference tier is unreachable.
export function analyzeStub(cropId = "pechay", volumeKg = 450): AnalyzeResult {
  const grade = gradeStub(cropId, volumeKg);
  return {
    ...grade,
    cropConfidence: 94,
    volumeKg,
    volumeConfidence: 82,
    isCrop: true,
  };
}

export function matchStub(grade: GradeCard): MatchResult {
  const d = DATA[grade?.cropId] ?? DATA.pechay;
  const dispatch: Dispatch = { to: d.to, eta: d.eta, load: d.load };
  return { buyers: d.buyers, dispatch, source: "stub" };
}
