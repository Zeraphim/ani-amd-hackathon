import { NextResponse } from "next/server";
import { processWithFailover } from "@/lib/grader-failover";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const crop = body.crop ?? "pechay";
  const location = body.location ?? "La Trinidad, Benguet";
  const quantityKg = Number(body.quantityKg ?? 450);
  const imageData = body.image_data ?? "";

  return NextResponse.json(await processWithFailover(crop, quantityKg, imageData, location));
}
