import { NextResponse } from "next/server";
import { gradeWithFailover } from "@/lib/grader-failover";

// POST /api/grade  { crop, quantityKg }
// Failover order: MI300X Tier 2 -> Fireworks Kimi vision -> built-in crop data.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const crop = body.crop ?? "pechay";
  const location = body.location ?? "La Trinidad, Benguet";
  const quantityKg = Number(body.quantityKg ?? 450);
  const imageData = body.image_data ?? "";

  return NextResponse.json(await gradeWithFailover(crop, quantityKg, imageData, location));
}
