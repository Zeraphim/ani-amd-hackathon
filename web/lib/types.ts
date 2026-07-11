// Shared contract between the web tier and the inference tier.
// Tier 2 (FastAPI) returns these exact shapes, so swapping stub -> Fireworks -> MI300X
// requires no changes here.

export type Source = "stub" | "fireworks" | "mi300x" | "langgraph";
export type Grade = "A" | "B" | "C";
export type Urgency = "high" | "mid" | "low";
export type Trend = "Surging" | "Rising" | "Stable";

export interface GradeCard {
  cropId: string; // pechay | cabbage | carrots | broccoli
  crop: string; // display name
  grade: Grade;
  score: number; // 0-100, the big count-up
  ripeness: string;
  shelfLifeHours: number;
  freshnessWindow: string; // e.g. "2 days"
  freshnessFill: number; // 0-100 meter fill
  urgency: Urgency;
  suggestion: string;
  source: Source;
}

export interface BuyerMatch {
  buyer: string;
  sub: string; // market + note line
  pricePerKg: number; // PHP
  trend: Trend;
  fit: string; // e.g. "96% fit"
  first: boolean; // top match
}

export interface Dispatch {
  to: string;
  eta: string; // e.g. "6h · ₱44/kg"
  load: string; // e.g. "1.2t matched"
}

export interface MatchResult {
  buyers: BuyerMatch[];
  dispatch: Dispatch;
  source: Source;
}

// Photo-first analysis: one vision pass on upload returns the full grade PLUS
// what the model read from the photo (crop identity + volume estimate). The web
// tier caches this and reuses the grade for "Grade & match" — no second pass.
export interface AnalyzeResult extends GradeCard {
  cropConfidence: number; // 0-100 — how sure the grader is about the crop identity
  volumeKg: number; // estimated harvest volume from the photo (editable by the farmer)
  volumeConfidence: number; // 0-100 — rough; single-photo volume is an estimate, not a measurement
  isCrop: boolean; // false when the photo isn't an edible crop
  error?: string; // populated when isCrop is false
}
