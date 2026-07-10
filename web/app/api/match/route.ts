import { NextResponse } from "next/server";
import { matchStub } from "@/lib/stub";
import type { GradeCard } from "@/lib/types";

// POST /api/match  { grade: GradeCard }
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as any));
  const grade = body.grade as GradeCard;

  const base = process.env.INFERENCE_BASE_URL || "http://127.0.0.1:8000";
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
      /* fall through to stub */
    }
  }
  return NextResponse.json(matchStub(grade));
}
