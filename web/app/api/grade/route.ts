import { NextResponse } from "next/server";
import { gradeStub } from "@/lib/stub";

// POST /api/grade  { crop, quantityKg }
// - If INFERENCE_BASE_URL is set, proxy to Tier 2 (FastAPI: Fireworks now, MI300X later).
// - Otherwise return the built-in stub so the Space always demos.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const crop = body.crop ?? "Cabbage (Scorpio)";
  const quantityKg = Number(body.quantityKg ?? 400);

  const base = process.env.INFERENCE_BASE_URL;
  if (base) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/grade`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ crop, quantity_kg: quantityKg }),
        cache: "no-store",
      });
      if (r.ok) return NextResponse.json(await r.json());
    } catch {
      // fall through to stub if the backend is unreachable
    }
  }

  return NextResponse.json(gradeStub(crop, quantityKg));
}
