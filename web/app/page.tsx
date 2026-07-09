"use client";

import { useState } from "react";
import { stubCrops } from "@/lib/stub";
import type { GradeCard, MatchResult } from "@/lib/types";
import UrgencyCard from "@/components/UrgencyCard";
import MatchFeed from "@/components/MatchFeed";
import AgentTrace from "@/components/AgentTrace";

const CROPS = stubCrops();

export default function Home() {
  const [crop, setCrop] = useState(CROPS[0]);
  const [qty, setQty] = useState(450);
  const [photo, setPhoto] = useState<string | null>(null);
  const [step, setStep] = useState(-1);
  const [busy, setBusy] = useState(false);
  const [grade, setGrade] = useState<GradeCard | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function run() {
    setBusy(true);
    setGrade(null);
    setMatch(null);

    setStep(0);
    await sleep(600);
    setStep(1);
    const g: GradeCard = await fetch("/api/grade", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ crop, quantityKg: qty }),
    }).then((r) => r.json());
    setGrade(g);

    await sleep(500);
    setStep(2);
    await sleep(500);
    setStep(3);
    const m: MatchResult = await fetch("/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ grade: g }),
    }).then((r) => r.json());
    setMatch(m);

    setStep(4);
    setBusy(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setPhoto(f.name);
  }

  return (
    <main className="app">
      <div className="hero">
        <h1>Post a harvest. Sell it before it spoils.</h1>
        <p>
          Ani grades your highland harvest, scores its spoilage urgency, and matches it to
          live Metro Manila demand — turning &ldquo;harvest then hope&rdquo; into
          &ldquo;sell before it spoils.&rdquo;
        </p>
      </div>

      <div className="grid">
        {/* LEFT: input */}
        <div className="card">
          <h3>Post New Crop Yield</h3>

          <div className="field">
            <div className="label">Crop type</div>
            <select value={crop} onChange={(e) => setCrop(e.target.value)}>
              {CROPS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Quantity (kg)</div>
            <input
              type="number"
              value={qty}
              min={1}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </div>

          <div className="field">
            <div className="label">Harvest photo (optional in stub mode)</div>
            <label className={"drop" + (photo ? " has" : "")}>
              {photo ? `📷 ${photo}` : "Tap to upload a produce photo"}
              <input type="file" accept="image/*" hidden onChange={onFile} />
            </label>
          </div>

          <button className="btn" onClick={run} disabled={busy}>
            {busy ? "Analyzing…" : "⚡ Grade & match harvest"}
          </button>
        </div>

        {/* RIGHT: results */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {step < 0 && (
            <div className="card">
              <div className="muted">
                Choose a crop and press <b>Grade &amp; match</b>. The agentic pipeline will
                grade the harvest, score urgency, and rank NCR buyers. Runs on a built-in
                stub now; flips to Fireworks / the AMD MI300X with one env var.
              </div>
            </div>
          )}

          {step >= 0 && <AgentTrace step={step} />}
          {grade && <UrgencyCard g={grade} />}
          {match && <MatchFeed m={match} />}
        </div>
      </div>
    </main>
  );
}
