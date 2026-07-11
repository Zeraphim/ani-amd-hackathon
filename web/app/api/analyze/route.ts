import { NextResponse } from "next/server";
import { analyzeStub } from "@/lib/stub";

// POST /api/analyze  { image_data, location }
// One vision pass on photo upload: the grader reads the photo and returns the
// full grade PLUS the crop it identified and a volume estimate. If INFERENCE_BASE_URL
// is set we proxy to Tier 2 (Fireworks now, MI300X later); otherwise we return the
// built-in stub so the Space always demos.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const imageData = body.image_data ?? "";
  const location = body.location ?? "La Trinidad, Benguet";

  const base = process.env.INFERENCE_BASE_URL || "http://127.0.0.1:8000";
  if (base) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_data: imageData, location }),
        cache: "no-store",
      });
      if (r.ok) return NextResponse.json(await r.json());
    } catch {
      /* fall through to stub */
    }
  }

  return NextResponse.json(analyzeStub());
}
