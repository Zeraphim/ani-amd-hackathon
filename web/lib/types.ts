// Shared types — the "contract" between the web tier and the inference tier.
// Tier 2 (FastAPI) returns the same shapes, so swapping stub -> Fireworks -> MI300X
// requires no changes here.

export interface GradeCard {
  crop: string;
  grade: "A" | "B" | "C";
  qualityScore: number; // 0-10
  ripeness: string;
  shelfLifeHours: number;
  urgency: number; // 0-10, drives the whole marketplace
  spoilageWindow: string;
  suggestion: string;
  source: "stub" | "fireworks" | "mi300x";
}

export interface BuyerMatch {
  buyer: string;
  market: string; // NCR location
  matchPct: number; // 0-100
  demand: "Surging" | "Stable" | "Dipping";
  pricePerKg: number; // PHP
  note: string;
  action: "Route First" | "Reserve" | "Review" | "Hold";
}

export interface MatchResult {
  buyers: BuyerMatch[];
  source: "stub" | "fireworks" | "mi300x";
}
