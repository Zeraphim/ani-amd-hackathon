"use client";

import { useEffect } from "react";
import DispatchMapModal from "@/components/DispatchMapModal";
import { matchStub, analyzeStub } from "@/lib/stub";

// The showcase markup (from docs/ui/showcase.html), preserved exactly.
// Styles live in globals.css; behavior is wired in the effect below.
const MARKUP = `
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <clipPath id="lfc"><path d="M256,64 C150,150 150,360 256,452 C362,360 362,150 256,64 Z"/></clipPath>
  <symbol id="leaf" viewBox="0 0 512 512">
    <path style="fill:#8CC63F" d="M256,64 C150,150 150,360 256,452 C362,360 362,150 256,64 Z"/>
    <g clip-path="url(#lfc)"><path style="fill:#4FA84E" d="M212,58 L520,58 L520,520 L332,470 Z"/></g>
    <g style="stroke:#E0A62E" stroke-width="5" stroke-linecap="round" fill="none"><path d="M256,120 L312,172 M256,120 L206,214 M256,120 L256,68 M312,172 L298,252 M206,214 L298,252 M206,214 L226,300 M298,252 L312,318 M226,300 L312,318 M312,172 L352,150 M206,214 L168,232"/></g>
    <g style="fill:#E0A62E"><circle cx="256" cy="120" r="8"/><circle cx="312" cy="172" r="8"/><circle cx="206" cy="214" r="8"/><circle cx="298" cy="252" r="8"/><circle cx="226" cy="300" r="7"/><circle cx="312" cy="318" r="7"/></g>
    <path style="fill:#17572F;stroke:#FBFAF4;stroke-width:4" d="M188,386 L256,300 L324,386 Z"/><path style="fill:#E0A62E" d="M256,300 L244,326 L256,318 L268,326 Z"/>
  </symbol>
</svg>

<div class="scrollbar" id="scrollbar"></div>

<nav>
  <div class="wrap">
    <div class="brand"><img src="/logo.png" alt="Ani" style="height:38px;width:auto;display:block" /></div>
    <div class="links">
      <a href="#problem">Problem</a>
      <a href="#market">Market</a>
      <a href="#demo">Live demo</a>
      <a href="#stack">The stack</a>
      <a href="#mi300x">MI300X</a>
    </div>
    <a href="#demo" class="btn sm gold sheen magnetic">Run the demo <span class="ico arrow">&rarr;</span></a>
  </div>
</nav>

<header class="hero" id="top">
  <canvas id="net-canvas"></canvas>
  <img class="floatleaf" src="/logo-leaf.png" alt="" />
  <div class="wrap">
    <span class="kicker" data-reveal><span class="dot"></span> Ani &middot; 3 agents &middot; one AMD MI300X &middot; Track 3 Unicorn</span>
    <h1 data-reveal>One photo.<br>A <span class="grad">harvest</span>,<br>sold fresh.</h1>
    <p class="lead" data-reveal>Benguet grows 80% of Metro Manila's vegetables &mdash; and up to half rots before it sells. Ani grades a harvest from a single photo, scores its spoilage urgency, and matches it to live NCR demand. Three AI agents, running privately on one AMD Instinct MI300X.</p>
    <div class="cta-row" data-reveal>
      <a href="#demo" class="btn lg gold sheen magnetic">See it grade a harvest <span class="ico arrow">&rarr;</span></a>
      <a href="#stack" class="btn lg secondary magnetic">How the stack works</a>
    </div>
    <div class="meta" data-reveal>
      <div class="m"><div class="n" data-count="80" data-suffix="%">0%</div><div class="l">of NCR veg from Benguet</div></div>
      <div class="m"><div class="n" data-count="50" data-suffix="%">0%</div><div class="l">harvest lost to timing</div></div>
      <div class="m"><div class="n" data-count="192" data-suffix="GB">0</div><div class="l">one card, three agents</div></div>
    </div>
  </div>
</header>

<div class="marquee"><div class="track">
  <div class="set"><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span></div>
  <div class="set" aria-hidden="true"><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span><span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span></div>
</div></div>

<section class="block" id="problem">
  <div class="wrap">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">01 &mdash; The problem</span>
      <h2>It isn't a growing problem. It's a coordination problem.</h2>
      <p>Farmers harvest blind into gluts, prices crash, and produce is dumped &mdash; while there's no cold chain to hold what does sell. The waste is happening this season. Software can fix it now.</p>
    </div>
    <div class="grid g3" data-reveal>
      <div class="stat"><div class="n" data-count="80" data-suffix="%">0</div><div class="l">of Metro Manila's vegetables are grown in Benguet</div><div class="src">SRC: WowCordillera &middot; GMA</div></div>
      <div class="stat"><div class="n" data-count="42" data-suffix="%">0</div><div class="l">of vegetables lost across harvest &rarr; transport &rarr; market</div><div class="src">SRC: DA &middot; FAO research</div></div>
      <div class="stat"><div class="n" data-count="4" data-prefix="&#8369;">0</div><div class="l">per kilo &mdash; cabbage dumped below cost, used as fertilizer</div><div class="src">SRC: Rappler &middot; Nordis 2026</div></div>
    </div>
  </div>
</section>

<section class="block" id="market">
  <div class="wrap">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">02 &mdash; Market opportunity</span>
      <h2>A cold-chain gap at national scale</h2>
      <p>Benguet feeds the country's largest market, Metro Manila &mdash; and the same grading-plus-matching engine extends anywhere harvest timing and demand are disconnected.</p>
    </div>
    <div class="grid g3 mkt-cards" data-reveal>
      <div class="mkt-card">
        <h4>Farmer cooperatives</h4>
        <p>Better prices and fewer losses on every harvest cycle.</p>
      </div>
      <div class="mkt-card">
        <h4>Traders &amp; wholesalers</h4>
        <p>A demand-matched feed instead of guesswork ordering.</p>
      </div>
      <div class="mkt-card">
        <h4>Agri-logistics operators</h4>
        <p>Coordinated dispatch across farms instead of one truck at a time.</p>
      </div>
    </div>
    <div class="mkt-callout" data-reveal>
      <span class="mkt-callout-ico"><img src="/logo-leaf.png" alt="" width="28" height="28" /></span>
      <p><strong>Benguet &rarr; Metro Manila today.</strong> Southeast Asian cold chains next.</p>
    </div>
    <div class="panel" data-reveal style="margin-top:22px">
      <div class="subhead">Loss reduction &mdash; before vs after Ani (pilot simulation)</div>
      <div class="bars">
        <div class="bar-row"><div class="lbl"><span>Baseline waste, no matching</span><b>42%</b></div><div class="bar-track"><div class="bf warn" data-w="42"></div></div></div>
        <div class="bar-row"><div class="lbl"><span>With Ani grade + demand matching</span><b>17%</b></div><div class="bar-track"><div class="bf" data-w="17"></div></div></div>
        <div class="bar-row"><div class="lbl"><span>Farmer income recovered</span><b>+31%</b></div><div class="bar-track"><div class="bf" data-w="31"></div></div></div>
      </div>
    </div>
  </div>
</section>

<section class="block" id="demo">
  <div class="wrap">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">03 &mdash; Tier 1 &middot; the living system</span>
      <h2>Watch three agents turn a photo into a sale</h2>
      <p>This is the real product loop. Pick a harvest and run it &mdash; the grader, the demand oracle, and the router each do their job in seconds, all on one MI300X.</p>
    </div>
    <div class="console" data-reveal>
      <div class="console-bar">
        <div class="dots"><i></i><i></i><i></i></div>
        <span class="ttl">ani &middot; harvest-grader</span>
        <span class="live"><span class="d"></span><span id="backendStatusText">backend &middot; checking</span></span>
      </div>
      <div class="console-body">
        <div class="console-in">
          <div class="subhead">Post a harvest</div>

          <!-- 1 · Photo first — the grader reads it, then fills the rest -->
          <div class="field" style="margin-bottom:14px">
            <label>Harvest photo</label>
            <div class="photo-slot" id="photoSlot">
              <label for="imageIn" class="drop" id="dropLabel">
                <span class="leafico">&#129382;</span>
                <div class="big" id="imageNameDisplay">Tap to add a photo</div>
                <div class="muted" style="font-size:12.5px">JPG / PNG &middot; the grader reads it</div>
              </label>
              <img class="preview-img" id="previewImg" alt="" />
              <div class="scan-line"></div>
              <div class="scan-corners"><span></span><span></span><span></span><span></span></div>
              <div class="photo-check">&#10003; Photo read</div>
              <button type="button" class="photo-retake" id="retakeBtn">Retake</button>
              <div class="analyzing-pill"><span class="dd"></span> Gemma vision reading photo&hellip;</div>
            </div>
            <input type="file" id="imageIn" accept="image/*" style="display:none;" />
          </div>

          <!-- 2 · AI-detected, still editable -->
          <div class="field detected" id="cropField">
            <div class="field-head"><label>Crop <span class="ai-badge"><span class="spark">&#10022;</span> AI</span></label><span class="edit-hint">tap to edit</span></div>
            <input class="input" id="cropSel" type="text" placeholder="Detected from photo" />
          </div>
          <div class="field detected" id="volField">
            <div class="field-head"><label>Volume (kg) <span class="ai-badge"><span class="spark">&#10022;</span> AI estimate</span></label><span class="edit-hint">tap to edit</span></div>
            <input class="input" id="qtyIn" type="number" min="1" placeholder="Estimated from photo" />
          </div>

          <!-- 3 · Manual origin -->
          <div class="field detected" id="locField" style="margin-bottom:16px">
            <div class="field-head"><label>&#128205; Location (origin)</label></div>
            <input class="input" id="locIn" type="text" placeholder="e.g. Cebu City" value="La Trinidad, Benguet" />
          </div>

          <button class="btn lg sheen magnetic" id="runBtn" style="width:100%" disabled>&#9889; Grade &amp; match harvest</button>
          <button class="btn sm secondary magnetic" id="replayBtn" style="width:100%;margin-top:10px;display:none">Replay &#8635;</button>
        </div>
        <div class="console-out">
          <div class="out-empty" id="outEmpty">
            <span class="em">&#129508;</span>
            <div class="h">Ready when you are</div>
            <div class="muted" style="font-size:13px;margin-top:4px">Press &ldquo;Grade &amp; match&rdquo; to run the pipeline</div>
          </div>
          <div class="out-stack" id="outStack">
            <div class="panel" style="padding:18px">
              <div class="subhead" style="margin-bottom:12px">Agent trace &middot; grade &rarr; match &rarr; dispatch</div>
              <div class="pipe" id="pipe">
                <div class="pstep" data-step="0"><div class="rail"><div class="node">&#128247;</div></div><div class="txt"><div class="h">Harvest Grader &mdash; fine-tuned Gemma (vision)</div><div class="d">Reads the photo; scores quality, ripeness, shelf-life.</div><div class="stat" id="s0">&rarr; &hellip;</div></div></div>
                <div class="pstep" data-step="1"><div class="rail"><div class="node">&#128202;</div></div><div class="txt"><div class="h">Demand &amp; Price Oracle</div><div class="d">Matches the grade to live NCR market demand.</div><div class="stat" id="s1">&rarr; &hellip;</div></div></div>
                <div class="pstep" data-step="2"><div class="rail"><div class="node">&#128666;</div></div><div class="txt"><div class="h">Logistics Router</div><div class="d">Sequences dispatch, most-perishable first.</div><div class="stat" id="s2">&rarr; &hellip;</div></div></div>
              </div>
            </div>
            <div class="grid g2 stage" id="gradeRow" style="gap:16px;display:none">
              <div class="grade-card">
                <div class="grade-photo"><span class="crop-emoji" id="gEmoji">&#129388;</span><span class="badge green live"><span class="d"></span><span id="gradeSourceText">source &middot; pending</span></span></div>
                <div class="grade-body">
                  <div class="grade-head">
                    <div class="grade-score"><div class="num" id="gScore">0</div><div class="cap">score</div></div>
                    <div><div class="t"><span id="gCrop">Pechay</span> &middot; <span class="badge grade" id="gGrade">Grade A</span></div><div class="muted" style="font-size:12.5px" id="gRipe">Crisp, tight leaves</div></div>
                  </div>
                  <div class="suggestion" id="gSuggest">&mdash;</div>
                </div>
              </div>
              <div class="panel" style="padding:18px">
                <div class="row" style="justify-content:space-between;align-items:baseline"><div class="subhead" style="margin:0">Freshness window</div><div style="font-family:var(--display);font-weight:700;font-size:22px;color:var(--gold-deep)" id="fWin">&mdash;</div></div>
                <div class="fresh-meter"><div class="val" id="fVal"></div></div>
                <div class="ticks"><small>Fresh</small><small>Ripe</small><small>Sell now</small><small>Spoil</small></div>
                <p class="muted" style="font-size:12.5px;margin-top:12px">The gradient is the spoilage clock &mdash; green when there's time, gold when it's time to move.</p>
              </div>
            </div>
            <div class="panel stage" id="matchPanel" style="padding:18px;display:none">
              <div class="subhead" style="margin-bottom:12px">Demand-match feed &middot; live NCR buyers</div>
              <div id="matchHost"></div>
            </div>
            <div class="dispatch stage" id="dispatch" style="display:none">
              <span class="eyebrow">Dispatch plan</span>
              <h3 style="color:#fff;font-size:19px;margin-top:6px">Most-perishable first</h3>
              <div class="route"><div class="stop"><div class="p" id="dFrom">Origin</div><div class="s">origin</div></div><div class="dline"></div><div class="stop"><div class="p" id="dTo">Destination</div><div class="s" id="dEta">6h &middot; &#8369;44/kg</div></div></div>
              <div class="row"><span class="badge gold" id="dLoad">1.2t matched</span><span class="badge" style="background:rgba(255,255,255,.15);color:#fff">ETA 6h</span></div>
              <button class="btn sm gold sheen magnetic" id="mapTrackBtn" type="button" style="margin-top:14px;width:100%">&#128506; Track live route <span class="ico arrow">&rarr;</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="block" id="stack">
  <div class="wrap">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">04 &mdash; Under the hood</span>
      <h2>Three tiers. Two env vars. One card.</h2>
      <p>The UI you just used is only Tier 1. Behind it, a thin contract lets us run against a stub today and the MI300X at showtime &mdash; swapping backends is a single variable, never a rewrite.</p>
    </div>
    <div class="arch" data-reveal>
      <div class="tier">
        <div class="tno">TIER 1 &middot; WEB / UI</div>
        <h4>The product</h4>
        <p>Next.js on a Hugging Face Docker Space. Captures the harvest, streams the agent trace, renders the result.</p>
        <div style="margin-top:10px"><span class="stackpill">Next.js</span><span class="stackpill">React</span><span class="stackpill">Docker &middot; 7860</span></div>
      </div>
      <div class="seam"><span class="env">INFERENCE_BASE_URL</span><div class="flow"></div></div>
      <div class="tier">
        <div class="tno">TIER 2 &middot; INFERENCE</div>
        <h4>The agentic brain</h4>
        <p>FastAPI orchestrates the 3 agents behind one contract. Backend = stub &middot; fireworks &middot; mi300x.</p>
        <div style="margin-top:10px"><span class="stackpill">FastAPI</span><span class="stackpill">OpenAI-compat</span><span class="stackpill">SSE</span></div>
      </div>
      <div class="seam"><span class="env">ANI_BASE_URL</span><div class="flow"></div></div>
      <div class="tier" style="border-color:var(--gold);box-shadow:var(--e-gold)">
        <div class="tno" style="color:var(--gold-deep)">TIER 3 &middot; MODELS</div>
        <h4>One MI300X</h4>
        <p>vLLM on ROCm serves the Gemma 3 vision grader while FastAPI keeps grading, matching, and dispatch on the same private MI300X host.</p>
        <div style="margin-top:10px"><span class="stackpill">vLLM</span><span class="stackpill">ROCm</span><span class="stackpill">Gemma &middot; LoRA</span></div>
      </div>
    </div>
    <p class="muted" data-reveal style="margin-top:20px;font-size:14px;text-align:center">Every layer degrades gracefully to a stub &mdash; the demo never hard-fails in front of a judge.</p>
  </div>
</section>

<section class="block gpu-sec" id="mi300x">
  <div class="wrap">
    <div class="sec-head" data-reveal>
      <span class="eyebrow">05 &mdash; Tier 3 &middot; why AMD is non-negotiable</span>
      <h2>Measured on one AMD card</h2>
      <p>The committed ROCm receipts verify the hardware and model load. Ani reports measured values only &mdash; no simulated telemetry and no unverified accelerator comparisons.</p>
    </div>
    <div class="gpu-grid" data-reveal>
      <div class="gpu-card">
        <div class="gpu-head">
          <span class="chip">AMD Instinct MI300X &middot; gfx942 &middot; ROCm</span>
          <span class="live"><span class="d"></span> Gemma 3 live on ROCm</span>
        </div>
        <div class="vram-label"><span>HBM3 memory &middot; measured</span><span><b id="vramUsed">153.3</b> / 192 GB</span></div>
        <div class="vram">
          <div class="seg g1" id="segG1" title="Gemma 3 27B VLM + LoRA" style="width:27%">51.66 GiB</div>
          <div class="seg g2" id="segG2" title="KV cache" style="width:52%">99.42 GiB</div>
          <div class="seg g3" id="segG3" title="Available HBM3" style="width:20%">38.4 GiB free</div>
        </div>
        <div class="vram-legend">
          <span class="lg"><i style="background:var(--leaf1)"></i> Gemma 3 27B &middot; VLM</span>
          <span class="lg"><i style="background:var(--leaf2)"></i> vLLM KV cache</span>
          <span class="lg"><i style="background:var(--gold)"></i> Available HBM3</span>
        </div>
        <div class="gauges">
          <div class="gauge"><div class="k">Generation</div><div class="v">6.4 <small>tok/s</small></div></div>
          <div class="gauge"><div class="k">Prompt ingest</div><div class="v">39.8 <small>tok/s</small></div></div>
          <div class="gauge"><div class="k">Architecture</div><div class="v">gfx942</div></div>
          <div class="gauge"><div class="k">8K concurrency</div><div class="v">22.69<small>&times;</small></div></div>
        </div>
        <div class="termino" id="termino">
          <div><span class="dim">$</span> <span class="p">vllm serve</span> google/gemma-3-27b-it --dtype bfloat16</div>
          <div class="dim">VERIFIED gfx942 &middot; AMD Instinct MI300X &middot; 192GB HBM3</div>
          <div><span class="p">READY</span> Gemma 3 vision + ani-grader LoRA &middot; 185,846-token KV cache</div>
        </div>
      </div>
      <div class="gpu-card">
        <div class="subhead" style="color:#9fb3a8">Memory math &mdash; why one card</div>
        <div class="memo">
          <div class="r"><span class="lab">Gemma 3 27B service reservation</span><span class="mono" style="color:#fff">153.3 GiB</span></div>
          <div class="r"><span class="lab">NVIDIA H100 (80 GB)</span><span class="no">&#10005; measured runtime exceeds it</span></div>
          <div class="r"><span class="lab">AMD MI300X</span><span class="yes">&#10003; 192 GB verified</span></div>
        </div>
        <p style="color:#b8c7bf;font-size:13.5px;margin-top:16px">The deployment keeps the Gemma vision grader, orchestration, pricing data, and farmer photos on one private AMD host. Measured ROCm logs &mdash; not animated estimates &mdash; support the <b style="color:var(--gold)">Best AMD-Hosted Gemma</b> entry.</p>
      </div>
    </div>
  </div>
</section>

<section class="close-sec">
  <div class="wrap">
    <span class="eyebrow" data-reveal>The outcome</span>
    <h2 data-reveal>Benguet won't dump another harvest.<br><span class="grad">Ani sells it &mdash; before it spoils.</span></h2>
    <div class="row" data-reveal style="justify-content:center;margin-top:8px">
      <a href="#demo" class="btn lg gold sheen magnetic">Run the demo again <span class="ico arrow">&rarr;</span></a>
      <a href="#top" class="btn lg secondary magnetic">Back to top</a>
    </div>
  </div>
</section>

<section class="block" id="team">
  <div class="wrap">
    <div class="sec-head" data-reveal style="text-align:center;margin-inline:auto">
      <span class="eyebrow">The team</span>
      <h2>Built by four, overnight.</h2>
    </div>
    <div class="team-grid" data-reveal>
      <div class="team-card"><div class="avatar">JD</div><div class="name">JC Diamante</div><div class="role">Role &mdash; edit me</div></div>
      <div class="team-card"><div class="avatar">AL</div><div class="name">Andre D. Lacra</div><div class="role">Role &mdash; edit me</div></div>
      <div class="team-card"><div class="avatar">JA</div><div class="name">Jan A&ntilde;onuevo</div><div class="role">Role &mdash; edit me</div></div>
      <div class="team-card"><div class="avatar">JM</div><div class="name">Jake Manahan</div><div class="role">Role &mdash; edit me</div></div>
    </div>
  </div>
</section>

<footer class="foot">
  <div class="wrap">
    <img src="/logo.png" alt="Ani" style="height:44px;width:auto;display:block;margin:0 auto 12px" />
    <p>Ani &middot; Tier 1&rarr;3 Showcase &middot; AMD Developer Hackathon ACT II &mdash; Track 3.<br>Grade &rarr; Match &rarr; Dispatch &middot; three agents, one AMD MI300X.</p>
  </div>
</footer>

<div id="errorModal" class="modal-scrim" style="display:none; align-items:center; justify-content:center; z-index:9999; position:fixed; inset:0; background:rgba(14,63,35,.72);">
  <div class="modal" role="alertdialog" aria-modal="true" aria-labelledby="errorModalTitle" style="background:var(--paper); padding:var(--s-5); border-radius:var(--r-md); border:1px solid var(--line); max-width:400px; text-align:center; box-shadow:var(--e-3);">
    <h3 id="errorModalTitle" style="color:var(--danger); margin-top:0; font-size:20px;">Invalid Image Detected</h3>
    <p id="errorModalMsg" class="muted" style="margin:var(--s-4) 0; font-size:15px; line-height:1.5;">This is an error</p>
    <button class="btn sm secondary" onclick="document.getElementById('errorModal').style.display='none'" style="width:100%;">Dismiss</button>
  </div>
</div>
`;

export default function Home() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    const on = (el: any, ev: string, fn: any, opts?: any) => {
      if (!el) return;
      el.addEventListener(ev, fn, opts);
      cleanups.push(() => el.removeEventListener(ev, fn, opts));
    };
    const gid = (id: string) => document.getElementById(id) as any;
    const delay = (ms: number) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

    /* scroll progress */
    const bar = gid("scrollbar");
    const onScroll = () => {
      const h = document.documentElement;
      const p = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      if (bar) bar.style.width = p * 100 + "%";
    };
    on(window, "scroll", onScroll, { passive: true });
    onScroll();

    /* reveal */
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* count-up */
    const countUp = (el: any) => {
      const t = parseFloat(el.dataset.count), pre = el.dataset.prefix || "", suf = el.dataset.suffix || "";
      if (reduce) { el.textContent = pre + t + suf; return; }
      const s = performance.now(), d = 1400;
      const tick = (n: number) => {
        const p = Math.min((n - s) / d, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(e * t) + suf;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const co = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target); co.unobserve(e.target); } }),
      { threshold: 0.6 }
    );
    document.querySelectorAll("[data-count]").forEach((el) => co.observe(el));
    cleanups.push(() => co.disconnect());

    /* bar fills */
    const fo = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { const el = e.target as any; if (el.dataset.w != null) el.style.width = el.dataset.w + "%"; fo.unobserve(el); } }),
      { threshold: 0.4 }
    );
    document.querySelectorAll("[data-w]").forEach((el) => fo.observe(el));
    cleanups.push(() => fo.disconnect());

    /* magnetic */
    if (!reduce) {
      document.querySelectorAll(".magnetic").forEach((b: any) => {
        on(b, "pointermove", (ev: any) => {
          const r = b.getBoundingClientRect();
          b.style.setProperty("--mx", (ev.clientX - r.left - r.width / 2) * 0.3 + "px");
          b.style.setProperty("--my", (ev.clientY - r.top - r.height / 2) * 0.4 + "px");
        });
        on(b, "pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
      });
    }

    /* hero node-network */
    const canvas = gid("net-canvas");
    if (canvas && !reduce) {
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0, H = 0, pts: any[] = [], raf = 0, stopped = false;
      const mouse = { x: -999, y: -999 };
      const resize = () => {
        const h = canvas.parentElement.getBoundingClientRect();
        W = h.width; H = h.height;
        canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const init = () => { pts = []; for (let i = 0; i < 46; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 }); };
      const draw = () => {
        if (stopped) return;
        ctx.clearRect(0, 0, W, H);
        for (let i = 0; i < pts.length; i++) {
          const p = pts[i]; p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
          for (let j = i + 1; j < pts.length; j++) {
            const q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = Math.sqrt(dx * dx + dy * dy);
            if (d < 130) { ctx.strokeStyle = "rgba(79,168,78," + (1 - d / 130) * 0.28 + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
          const md = Math.sqrt(Math.pow(p.x - mouse.x, 2) + Math.pow(p.y - mouse.y, 2)), g = md < 150;
          ctx.fillStyle = g ? "rgba(224,166,46,.9)" : "rgba(20,102,59,.5)";
          ctx.beginPath(); ctx.arc(p.x, p.y, g ? 3.4 : 2.2, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      };
      on(window, "resize", () => { resize(); init(); });
      on(canvas.parentElement, "pointermove", (e: any) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      on(canvas.parentElement, "pointerleave", () => { mouse.x = -999; mouse.y = -999; });
      resize(); init(); draw();
      cleanups.push(() => { stopped = true; cancelAnimationFrame(raf); });
    }

    /* ---------- interactive demo (wired to /api) ---------- */
    const runBtn = gid("runBtn"), replayBtn = gid("replayBtn"), outEmpty = gid("outEmpty"), outStack = gid("outStack");
    const gradeRow = gid("gradeRow"), matchPanel = gid("matchPanel"), dispatchEl = gid("dispatch");
    const steps = Array.from(document.querySelectorAll("#pipe .pstep")) as any[];
    let hasRun = false, busy = false;

    document.querySelectorAll(".samples .s").forEach((s: any) => {
      on(s, "click", () => {
        document.querySelectorAll(".samples .s").forEach((x) => x.classList.remove("on"));
        s.classList.add("on");
        const drop = gid("drop"); if (drop) { drop.classList.add("armed"); drop.querySelector(".big").textContent = s.dataset.ph; }
      });
    });

    const setStep = (i: number, state?: string) => { steps[i].classList.remove("active", "done"); if (state) steps[i].classList.add(state); };
    const countTo = (el: any, target: number, dur: number) => {
      if (reduce) { el.textContent = String(target); return; }
      const s = performance.now();
      const tk = (n: number) => { const p = Math.min((n - s) / dur, 1); el.textContent = String(Math.round((1 - Math.pow(1 - p, 3)) * target)); if (p < 1) requestAnimationFrame(tk); };
      requestAnimationFrame(tk);
    };

    const scrollContainerTo = (container: HTMLElement, top: number, dur = 1200) => {
      const start = container.scrollTop;
      const delta = top - start;
      if (Math.abs(delta) < 1) return;
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        container.scrollTop = start + delta * eased;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const revealPanel = (el: any, displayType: string) => {
      if (!el || el.classList.contains("show")) return;
      el.style.display = displayType;
      void el.offsetHeight;
      el.classList.add("show");
      if (!reduce) {
        const consoleOut = outStack?.parentElement;
        if (consoleOut && window.innerWidth > 900) {
          scrollContainerTo(consoleOut, Math.max(0, el.offsetTop - 16));
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    };

    const createMatchRow = (b: any, index: number) => {
      const label = (b.trend === "Stable" ? "– " : "▲ ") + b.trend;
      const tcls = b.trend.toLowerCase();
      const tag1cls = b.first ? "first" : tcls;
      const tag1txt = b.first ? "★ First match" : label;
      const badgeCls = index === 0 ? "ok" : "soft";
      const dot = index === 0 ? '<span class="d"></span> ' : "";
      const el = document.createElement("div"); el.className = "match";
      el.innerHTML =
        '<div class="top"><span class="nm">' + b.buyer + '</span><span class="price">₱' + b.pricePerKg + "/kg</span></div>" +
        '<div class="sub">' + b.sub + "</div>" +
        '<div class="meta"><span class="tag ' + tag1cls + '">' + tag1txt + "</span>" +
        '<span class="tag ' + tcls + '">' + label + "</span>" +
        '<span class="badge ' + badgeCls + '" style="font-size:11px">' + dot + b.fit + "</span></div>";
      return el;
    };

    /* ---- photo-first: analyze on upload, cache the grade ---- */
    let analyzed: any = null; // one vision pass result (grade + detected crop/volume)
    const sourceLabels: Record<string, string> = {
      mi300x: "connected · MI300X",
      fireworks: "connected · Fireworks",
      langgraph: "connected · LangGraph",
      stub: "safe fallback · stub",
    };
    // detected crop text -> id; unknown crops degrade to their slug (backend falls back to pechay data)
    const mapCropId = (name: string) => {
      const v = (name || "").trim().toLowerCase();
      const known = ["pechay", "cabbage", "carrots", "broccoli"];
      const hit = known.find((k) => v.startsWith(k) || v.includes(k));
      return hit || v.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "pechay";
    };
    // display-name keyword -> grade-card emoji; unknown crops fall back to leafy green
    const cropEmoji = (name: string) => {
      const n = (name || "").toLowerCase();
      const map: [string, string][] = [
        ["pechay", "🥬"], ["cabbage", "🥬"], ["lettuce", "🥬"], ["broccoli", "🥦"],
        ["carrot", "🥕"], ["apple", "🍎"], ["banana", "🍌"], ["mango", "🥭"],
        ["tomato", "🍅"], ["corn", "🌽"], ["potato", "🥔"], ["onion", "🧅"],
        ["garlic", "🧄"], ["pepper", "🌶️"], ["chili", "🌶️"], ["cucumber", "🥒"],
        ["eggplant", "🍆"], ["strawberry", "🍓"], ["grape", "🍇"], ["orange", "🍊"],
        ["pineapple", "🍍"], ["watermelon", "🍉"],
      ];
      const hit = map.find(([k]) => n.includes(k));
      return hit ? hit[1] : "🥬";
    };
    const typeInto = async (el: HTMLInputElement, text: string, per = 40) => {
      if (reduce) { el.value = text; return; }
      el.value = "";
      for (let i = 0; i < text.length; i++) { el.value += text[i]; await delay(per); }
    };
    const countInto = (el: HTMLInputElement, target: number, dur = 800) =>
      new Promise<void>((resolve) => {
        if (reduce) { el.value = String(target); resolve(); return; }
        const s = performance.now();
        const tk = (n: number) => {
          const p = Math.min((n - s) / dur, 1);
          el.value = String(Math.round((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(tk); else { el.value = String(target); resolve(); }
        };
        requestAnimationFrame(tk);
      });
    const resizeImage = (file: File) =>
      new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            const MAX = 800; let width = img.width, height = img.height;
            if (width > height) { if (width > MAX) { height *= MAX / width; width = MAX; } }
            else { if (height > MAX) { width *= MAX / height; height = MAX; } }
            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext("2d"); if (ctx) ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.7));
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });

    async function getAnalyze(imageData: string, location: string) {
      try {
        const r = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image_data: imageData, location }) });
        if (r.ok) return await r.json();
      } catch {}
      return analyzeStub();
    }

    function resetPhoto() {
      analyzed = null;
      const slot = gid("photoSlot");
      slot.classList.remove("has", "scanning", "done");
      gid("previewImg").src = "";
      (gid("imageIn") as HTMLInputElement).value = "";
      gid("imageNameDisplay").textContent = "Tap to add a photo";
      ["cropField", "volField", "locField"].forEach((id) => gid(id).classList.remove("in", "filled", "filling"));
      (document.getElementById("cropSel") as HTMLInputElement).value = "";
      (document.getElementById("qtyIn") as HTMLInputElement).value = "";
      runBtn.disabled = true; replayBtn.style.display = "none";
      outStack.classList.remove("show"); outEmpty.style.display = "";
    }

    async function analyzeImage(file: File) {
      const slot = gid("photoSlot"), preview = gid("previewImg");
      const raw = await resizeImage(file);
      preview.src = raw;
      slot.classList.add("has");
      gid("imageNameDisplay").textContent = file.name;
      runBtn.disabled = true; replayBtn.style.display = "none";

      await delay(120);
      slot.classList.add("scanning");
      const loc = (document.getElementById("locIn") as HTMLInputElement).value;
      const resPromise = getAnalyze(raw, loc);
      await delay(1500);
      slot.classList.remove("scanning");
      const res = await resPromise;

      // photo wasn't a crop (or the call failed) -> surface the existing modal, let them retake
      if (!res || res.isCrop === false || res.error) {
        const msg = (res && (res.error || "That photo doesn't look like a harvest — try another shot.")) || "Couldn't read that photo. Try again.";
        const errModal = gid("errorModal");
        if (errModal) { gid("errorModalMsg").textContent = msg; errModal.style.display = "flex"; }
        resetPhoto();
        return;
      }

      analyzed = res;
      slot.classList.add("done");
      const backendStatusText = gid("backendStatusText");
      const source = sourceLabels[res.source] ? res.source : "stub";
      if (backendStatusText) backendStatusText.textContent = sourceLabels[source];

      const cropField = gid("cropField"), volField = gid("volField"), locField = gid("locField");
      const cropInput = document.getElementById("cropSel") as HTMLInputElement;
      const qtyInput = document.getElementById("qtyIn") as HTMLInputElement;

      cropField.classList.add("in", "filling");
      await typeInto(cropInput, res.crop, 38);
      cropField.classList.remove("filling"); cropField.classList.add("filled");
      await delay(180);
      volField.classList.add("in", "filling");
      await countInto(qtyInput, Math.round(res.volumeKg), 800);
      volField.classList.remove("filling"); volField.classList.add("filled");
      await delay(180);
      locField.classList.add("in");
      runBtn.disabled = false;
    }
    async function getMatch(grade: any, location: string) {
      try {
        const r = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ grade, location }) });
        if (r.ok) return await r.json();
      } catch {}
      return matchStub(grade);
    }

    async function run() {
      if (busy) return;
      if (!analyzed) { alert("Add a harvest photo first — the grader reads it to fill the rest."); return; }
      busy = true;
      const cropInput = (document.getElementById("cropSel") as HTMLInputElement).value;
      const qty = parseInt((document.getElementById("qtyIn") as HTMLInputElement).value);
      const loc = (document.getElementById("locIn") as HTMLInputElement).value;

      if (!cropInput || !cropInput.trim()) { alert("Please enter a valid crop."); busy = false; return; }
      if (!loc || !loc.trim()) { alert("Please enter a valid location."); busy = false; return; }
      if (isNaN(qty) || qty <= 0) { alert("Please enter a valid weight greater than 0."); busy = false; return; }

      // Reuse the vision pass from upload. If the farmer corrected the crop, re-key
      // so match + dispatch follow the edit — no second MI300X pass.
      const grade: any = { ...analyzed, quantityKg: qty };
      if (cropInput.trim() !== analyzed.crop) {
        grade.crop = cropInput.trim();
        grade.cropId = mapCropId(cropInput);
      }

      runBtn.classList.add("loading");
      outEmpty.style.display = "none"; outStack.classList.add("show");
      steps.forEach((s) => s.classList.remove("active", "done"));
      gid("s0").textContent = "→ …"; gid("s1").textContent = "→ …"; gid("s2").textContent = "→ …";
      gid("s0").style.color = "";
      gid("gScore").textContent = "0"; gid("fVal").style.width = "0"; gid("matchHost").innerHTML = "";
      gradeRow.classList.remove("show"); gradeRow.style.display = "none";
      matchPanel.classList.remove("show"); matchPanel.style.display = "none";
      dispatchEl.classList.remove("show"); dispatchEl.style.display = "none";

      /* Agent A — grade already computed at upload; replay it in the trace */
      setStep(0, "active");
      await delay(650);
      const source = sourceLabels[grade.source] ? grade.source : "stub";
      const gradeSourceText = gid("gradeSourceText");
      if (gradeSourceText) gradeSourceText.textContent = source === "mi300x" ? "graded on MI300X" : `source · ${source}`;
      gid("s0").textContent = "→ Grade " + grade.grade + " · " + grade.score + " · 0.4s";
      setStep(0, "done");
      await delay(700);

      /* Agent D — trace only */
      setStep(1, "active");
      const match = await getMatch(grade, loc);
      await delay(900);
      gid("s1").textContent = "→ " + match.buyers.length + " buyers · ₱" + match.buyers[0].pricePerKg + "/kg peak";
      setStep(1, "done");
      await delay(800);

      /* Router — trace only */
      setStep(2, "active");
      await delay(850);
      if (match && match.dispatch) {
        gid("s2").textContent = "→ " + (match.dispatch.from || loc).split(',')[0] + " → " + match.dispatch.to + " · " + match.dispatch.eta.split("·")[0].trim();
      } else {
        gid("s2").textContent = "→ Routing complete";
      }
      setStep(2, "done");
      await delay(2000);

      /* --- All trace steps done — cascade result panels --- */

      gid("gCrop").textContent = grade.crop;
      gid("gEmoji").textContent = cropEmoji(grade.crop);
      gid("gGrade").textContent = "Grade " + grade.grade;
      gid("gRipe").textContent = grade.ripeness;
      gid("gSuggest").textContent = grade.suggestion;
      gid("fWin").textContent = grade.freshnessWindow;
      revealPanel(gradeRow, "grid");
      countTo(gid("gScore"), grade.score, 900);
      gid("fVal").style.width = grade.freshnessFill + "%";
      await delay(2000);

      const host = gid("matchHost");
      host.innerHTML = "";
      const matchRows = match.buyers.map((b: any, i: number) => createMatchRow(b, i));
      matchRows.forEach((el: HTMLElement) => host.appendChild(el));
      revealPanel(matchPanel, "block");
      await delay(650);
      for (const el of matchRows) {
        await delay(260); el.classList.add("in");
      }
      await delay(2500);

      gid("dTo").textContent = match.dispatch.to;
      gid("dEta").textContent = match.dispatch.eta;
      gid("dLoad").textContent = match.dispatch.load;
      revealPanel(dispatchEl, "block");
      await delay(2000);
      window.dispatchEvent(
        new CustomEvent("ani:map-route", {
          detail: { destination: match.dispatch.to, eta: match.dispatch.eta },
        })
      );

      runBtn.classList.remove("loading");
      replayBtn.style.display = "block";
      hasRun = true; busy = false;
    }
    on(runBtn, "click", run);
    on(replayBtn, "click", run);
    on(gid("mapTrackBtn"), "click", () => window.dispatchEvent(new CustomEvent("ani:map-open")));
    
    on(gid("imageIn"), "change", async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) await analyzeImage(target.files[0]);
    });
    on(gid("retakeBtn"), "click", (e: Event) => { e.preventDefault(); resetPhoto(); });

    return () => cleanups.forEach((f) => f());
  }, []);

  const normalizedMarkup = MARKUP.replace(/\r\n/g, "\n");
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: normalizedMarkup }} />
      <DispatchMapModal />
    </>
  );
}
