import { NextResponse } from "next/server";
import { analyzeWithFailover } from "@/lib/grader-failover";

// POST /api/analyze  { image_data, location }
// One vision pass on photo upload: the grader reads the photo and returns the
// full grade PLUS the crop it identified and a volume estimate. Failover order:
// MI300X Tier 2 -> Fireworks Kimi vision -> built-in Pechay demo data.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const imageData = body.image_data ?? "";
  const location = body.location ?? "La Trinidad, Benguet";

  return NextResponse.json(await analyzeWithFailover(imageData, location));
}
