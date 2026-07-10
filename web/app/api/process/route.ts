import { NextResponse } from "next/server";
import { gradeStub, matchStub } from "@/lib/stub";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const crop = body.crop ?? "pechay";
  const quantityKg = Number(body.quantityKg ?? 450);
  const imageData = body.image_data ?? "";

  const base = process.env.INFERENCE_BASE_URL || "http://127.0.0.1:8000"; // default for local testing
  if (base) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/process`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ crop, quantity_kg: quantityKg, image_data: imageData }),
        cache: "no-store",
      });
      if (r.ok) return NextResponse.json(await r.json());
    } catch {
      /* fall through to stub */
    }
  }
  
  // Fallback to unified stub
  const grade = gradeStub(crop, quantityKg);
  const match = matchStub(grade);
  return NextResponse.json({ ...grade, ...match });
}
