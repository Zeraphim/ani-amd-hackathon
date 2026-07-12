import "server-only";

import { DATA, analyzeStub, gradeStub, matchStub } from "./stub";
import type { AnalyzeResult, GradeCard, Grade, Urgency } from "./types";

const PRIMARY_HEALTH_TIMEOUT_MS = 2_000;
const PRIMARY_INFERENCE_TIMEOUT_MS = 12_000;
const FIREWORKS_TIMEOUT_MS = 20_000;
const FIREWORKS_DEFAULT_BASE_URL = "https://api.fireworks.ai/inference/v1";

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

async function fetchJson(url: string, init: RequestInit, timeoutMs: number): Promise<JsonObject | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
    if (!response.ok) {
      console.warn(`[grader-failover] ${response.status} from ${new URL(url).host}`);
      return null;
    }
    return asObject(await response.json());
  } catch (error) {
    const reason = error instanceof Error ? error.name : "request error";
    console.warn(`[grader-failover] ${reason} from ${new URL(url).host}`);
    return null;
  } finally {
    clearTimeout(timeout);
    console.info(`[grader-failover] ${new URL(url).host} ${Date.now() - started}ms`);
  }
}

function isGradeCard(value: JsonObject | null): value is JsonObject & GradeCard {
  if (!value) return false;
  return typeof value.cropId === "string" && typeof value.crop === "string" &&
    ["A", "B", "C"].includes(String(value.grade)) && typeof value.score === "number" &&
    typeof value.ripeness === "string" && typeof value.shelfLifeHours === "number" &&
    typeof value.freshnessWindow === "string" && typeof value.freshnessFill === "number" &&
    ["high", "mid", "low"].includes(String(value.urgency)) && typeof value.suggestion === "string";
}

function isAnalyzeResult(value: JsonObject | null): value is JsonObject & AnalyzeResult {
  return isGradeCard(value) && typeof value.isCrop === "boolean" &&
    typeof value.cropConfidence === "number" && typeof value.volumeKg === "number" &&
    typeof value.volumeConfidence === "number";
}

function isProcessResult(value: JsonObject | null): value is JsonObject & GradeCard {
  const dispatch = asObject(value?.dispatch);
  return isGradeCard(value) && Array.isArray(value.buyers) && !!dispatch &&
    typeof dispatch.to === "string" && typeof dispatch.eta === "string" &&
    typeof dispatch.load === "string";
}

async function primaryRequest<T extends JsonObject>(
  path: string,
  payload: JsonObject,
  validate: (value: JsonObject | null) => value is T,
): Promise<T | null> {
  const configuredBase = process.env.INFERENCE_BASE_URL?.trim();
  if (!configuredBase) return null;
  const base = configuredBase.replace(/\/$/, "");
  const health = await fetchJson(base, { method: "GET" }, PRIMARY_HEALTH_TIMEOUT_MS);
  if (health?.backend !== "mi300x") {
    console.warn("[grader-failover] MI300X health check failed; trying Fireworks");
    return null;
  }
  const result = await fetchJson(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }, PRIMARY_INFERENCE_TIMEOUT_MS);
  if (!validate(result) || result.source !== "mi300x") {
    console.warn("[grader-failover] MI300X returned a degraded or invalid result; trying Fireworks");
    return null;
  }
  return result;
}

function parseModelJson(content: unknown): JsonObject | null {
  if (typeof content !== "string") return null;
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return asObject(JSON.parse(content.slice(start, end + 1)));
  } catch {
    return null;
  }
}

async function callFireworks(system: string, userContent: unknown[]): Promise<JsonObject | null> {
  const apiKey = process.env.FIREWORKS_API_KEY?.trim();
  const model = process.env.ANI_MODEL?.trim();
  if (!apiKey || !model) {
    console.warn("[grader-failover] Fireworks is not configured; using Pechay fallback");
    return null;
  }
  const base = (process.env.ANI_BASE_URL?.trim() || FIREWORKS_DEFAULT_BASE_URL).replace(/\/$/, "");
  const response = await fetchJson(`${base}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, { role: "user", content: userContent }],
      temperature: 0.1,
      max_tokens: 700,
      reasoning_effort: "none",
      response_format: { type: "json_object" },
    }),
  }, FIREWORKS_TIMEOUT_MS);
  const choices = Array.isArray(response?.choices) ? response.choices : [];
  const first = asObject(choices[0]);
  const message = asObject(first?.message);
  return parseModelJson(message?.content);
}

function clampInt(value: unknown, low: number, high: number): number {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error("expected a finite number");
  return Math.max(low, Math.min(high, Math.round(number)));
}

function cropIdFor(value: string): string {
  const crop = value.trim().toLowerCase();
  if (/pechay|bok choy|bok choi|pak choy|pak choi/.test(crop)) return "pechay";
  if (crop.includes("cabbage")) return "cabbage";
  if (crop.includes("carrot")) return "carrots";
  if (crop.includes("broccoli")) return "broccoli";
  return crop.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "pechay";
}

function normalizeGrade(data: JsonObject, requestedCrop: string): GradeCard {
  const grade = String(data.grade || "").toUpperCase() as Grade;
  const urgency = String(data.urgency || "").toLowerCase() as Urgency;
  if (!["A", "B", "C"].includes(grade) || !["high", "mid", "low"].includes(urgency)) {
    throw new Error("invalid grade or urgency");
  }
  const detected = String(data.crop || requestedCrop || "Pechay").trim();
  const cropId = cropIdFor(detected);
  const crop = DATA[cropId]?.name || detected;
  const shelfLifeHours = clampInt(data.shelfLifeHours, 1, 720);
  const ripeness = String(data.ripeness || "").trim();
  const suggestion = String(data.suggestion || "").trim();
  if (!ripeness || !suggestion) throw new Error("missing grade description");
  return {
    cropId,
    crop,
    grade,
    score: clampInt(data.score, 0, 100),
    ripeness,
    shelfLifeHours,
    freshnessWindow: String(data.freshnessWindow || "").trim() || `${Math.round(shelfLifeHours / 24)} days`,
    freshnessFill: clampInt(data.freshnessFill, 0, 100),
    urgency,
    suggestion,
    source: "fireworks",
  };
}

const GRADE_SYSTEM = `You are Ani's grader for Philippine highland produce. Inspect the image when supplied. Return exactly one compact JSON object with crop, grade (A|B|C), score (0-100 integer), ripeness, shelfLifeHours (positive integer), freshnessWindow, freshnessFill (0-100 integer), urgency (high|mid|low), and suggestion. Do not include prose or markdown.`;
const ANALYZE_SYSTEM = `You are Ani's grader for Philippine highland produce. Inspect the supplied photo. Return exactly one compact JSON object with isCrop (boolean), error (empty when true), crop, cropConfidence (0-100 integer), volumeKg (positive number), volumeConfidence (0-100 integer), grade (A|B|C), score (0-100 integer), ripeness, shelfLifeHours (positive integer), freshnessWindow, freshnessFill (0-100 integer), urgency (high|mid|low), and suggestion. If the photo is not edible produce set isCrop false. Do not include prose or markdown.`;

function imageContent(text: string, imageData: string): unknown[] {
  const content: unknown[] = [{ type: "text", text }];
  if (imageData) content.push({ type: "image_url", image_url: { url: imageData } });
  return content;
}

async function fireworksGrade(crop: string, quantityKg: number, imageData: string): Promise<GradeCard | null> {
  try {
    const raw = await callFireworks(GRADE_SYSTEM, imageContent(`Crop: ${crop}. Quantity: ${quantityKg} kg. Grade this harvest.`, imageData));
    return raw ? normalizeGrade(raw, crop) : null;
  } catch (error) {
    console.warn(`[grader-failover] invalid Fireworks grade: ${error instanceof Error ? error.message : "error"}`);
    return null;
  }
}

async function fireworksAnalyze(imageData: string): Promise<AnalyzeResult | null> {
  try {
    const raw = await callFireworks(ANALYZE_SYSTEM, imageContent("Identify, estimate the visible harvest volume in kilograms, and grade this photo.", imageData));
    if (!raw) return null;
    if (raw.isCrop === false) {
      return {
        ...gradeStub("pechay", 0),
        crop: "",
        grade: "C",
        score: 0,
        ripeness: "",
        shelfLifeHours: 1,
        freshnessWindow: "—",
        freshnessFill: 0,
        urgency: "high",
        suggestion: "",
        source: "fireworks",
        isCrop: false,
        error: String(raw.error || "That photo does not look like a harvest."),
        cropConfidence: 0,
        volumeKg: 0,
        volumeConfidence: 0,
      };
    }
    const grade = normalizeGrade(raw, String(raw.crop || "Pechay"));
    const volumeKg = Number(raw.volumeKg);
    if (!Number.isFinite(volumeKg) || volumeKg <= 0) throw new Error("invalid volume estimate");
    return {
      ...grade,
      isCrop: true,
      error: "",
      cropConfidence: clampInt(raw.cropConfidence, 0, 100),
      volumeKg: Math.round(volumeKg * 10) / 10,
      volumeConfidence: clampInt(raw.volumeConfidence, 0, 100),
    };
  } catch (error) {
    console.warn(`[grader-failover] invalid Fireworks analysis: ${error instanceof Error ? error.message : "error"}`);
    return null;
  }
}

export async function analyzeWithFailover(imageData: string, location: string): Promise<AnalyzeResult> {
  const primary = await primaryRequest("/analyze", { image_data: imageData, location }, isAnalyzeResult);
  if (primary) return { ...primary, source: "mi300x" };
  return (await fireworksAnalyze(imageData)) || analyzeStub();
}

export async function gradeWithFailover(crop: string, quantityKg: number, imageData: string, location: string): Promise<GradeCard> {
  const primary = await primaryRequest("/grade", { crop, location, quantity_kg: quantityKg, image_data: imageData }, isGradeCard);
  if (primary) return { ...primary, source: "mi300x" };
  return (await fireworksGrade(crop, quantityKg, imageData)) || gradeStub(crop, quantityKg);
}

export async function processWithFailover(crop: string, quantityKg: number, imageData: string, location: string): Promise<JsonObject> {
  const primary = await primaryRequest("/process", { crop, location, quantity_kg: quantityKg, image_data: imageData }, isProcessResult);
  if (primary) return { ...primary, source: "mi300x" };
  const grade = (await fireworksGrade(crop, quantityKg, imageData)) || gradeStub(crop, quantityKg);
  const match = matchStub(grade);
  return { ...grade, buyers: match.buyers, dispatch: match.dispatch, source: grade.source };
}
