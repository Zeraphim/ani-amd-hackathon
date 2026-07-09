import { NextResponse } from "next/server";
import { matchStub } from "@/lib/stub";
import type { GradeCard } from "@/lib/types";

// POST /api/match  { grade: GradeCard }
// Same swap logic as /api/grade: proxy to Tier 2 if configured, else stub.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const grade = body.grade as GradeCard;

  const base = process.env.INFERENCE_BASE_URL;
  if (base && grade) {
    try {
      const r = await fetch(`${base.replace(/\/$/, "")}/match`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ grade }),
        cache: "no-store",
      });
      if (r.ok) return NextResponse.json(await r.json());
    } catch {
      // fall through to stub
    }
  }

  return NextResponse.json(matchStub(grade));
}
