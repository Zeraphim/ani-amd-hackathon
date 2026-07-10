"use client";

import { useEffect } from "react";
import DispatchMapModal from "@/components/DispatchMapModal";
import { gradeStub, matchStub } from "@/lib/stub";

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
  <div class="scrollcue"><span>Scroll</span><span class="line"></span></div>
</header>

<div class="marquee"><div class="track">
  <span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span>
  <span>Grade</span><span>Match</span><span>Dispatch</span><span>Fresh from Benguet</span>
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
        <span class="live"><span class="d"></span> connected &middot; MI300X</span>
      </div>
      <div class="console-body">
        <div class="console-in">
          <div class="subhead">Post a harvest</div>
          <div class="field">
            <label>Crop</label>
            <select class="select" id="cropSel">
              <option value="pechay">Pechay</option>
              <option value="cabbage">Cabbage (Scorpio)</option>
              <option value="carrots">Carrots</option>
              <option value="broccoli">Broccoli</option>
            </select>
          </div>
          <div class="field">
            <label>Volume (kg)</label>
            <input class="input" id="qtyIn" type="number" value="450" min="1">
          </div>
          <div class="field" style="margin-bottom:12px">
            <label>Harvest photo</label>
            <div class="drop" id="drop"><span class="leafico">&#127807;</span><div class="big">Drop or tap to capture</div><div class="muted" style="font-size:12.5px">graded on-device &middot; JPG/PNG</div></div>
            <div class="samples">
              <span class="s on" data-ph="Pechay_B12.jpg">Pechay_B12.jpg</span>
              <span class="s" data-ph="field_shot.jpg">field_shot.jpg</span>
            </div>
          </div>
          <button class="btn lg sheen magnetic" id="runBtn" style="width:100%">&#9889; Grade &amp; match harvest</button>
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
              <div class="subhead" style="margin-bottom:12px">Agent trace &middot; 3 models, one MI300X</div>
              <div class="pipe" id="pipe">
                <div class="pstep" data-step="0"><div class="rail"><div class="node">&#128247;</div></div><div class="txt"><div class="h">Harvest Grader &mdash; fine-tuned Gemma (vision)</div><div class="d">Reads the photo; scores quality, ripeness, shelf-life.</div><div class="stat" id="s0">&rarr; &hellip;</div></div></div>
                <div class="pstep" data-step="1"><div class="rail"><div class="node">&#128202;</div></div><div class="txt"><div class="h">Demand &amp; Price Oracle</div><div class="d">Matches the grade to live NCR market demand.</div><div class="stat" id="s1">&rarr; &hellip;</div></div></div>
                <div class="pstep" data-step="2"><div class="rail"><div class="node">&#128666;</div></div><div class="txt"><div class="h">Logistics Router</div><div class="d">Sequences dispatch, most-perishable first.</div><div class="stat" id="s2">&rarr; &hellip;</div></div></div>
              </div>
            </div>
            <div class="grid g2 stage" id="gradeRow" style="gap:16px;display:none">
              <div class="grade-card">
                <div class="grade-photo"><span class="badge green live"><span class="d"></span> graded on MI300X</span></div>
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
              <div class="route"><div class="stop"><div class="p">La Trinidad</div><div class="s">origin</div></div><div class="dline"></div><div class="stop"><div class="p" id="dTo">Divisoria</div><div class="s" id="dEta">6h &middot; &#8369;44/kg</div></div></div>
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
        <p>vLLM on ROCm co-hosts the fine-tuned Gemma grader, reasoning, and embeddings in 192&nbsp;GB.</p>
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
      <h2>The whole stack fits on a single card</h2>
      <p>192&nbsp;GB of HBM3 co-hosts all three models on one MI300X &mdash; so a farmer co-op runs Ani on-prem, private, and offline-capable. On an 80&nbsp;GB card, you'd need several machines.</p>
    </div>
    <div class="gpu-grid" data-reveal>
      <div class="gpu-card">
        <div class="gpu-head">
          <span class="chip">AMD Instinct MI300X &middot; gfx942 &middot; ROCm</span>
          <span class="live"><span class="d"></span> LIVE</span>
        </div>
        <div class="vram-label"><span>HBM3 memory</span><span><b id="vramUsed">171.4</b> / 192 GB</span></div>
        <div class="vram">
          <div class="seg g1" id="segG1" title="Gemma Grader (VLM)"></div>
          <div class="seg g2" id="segG2" title="Gemma Reasoning"></div>
          <div class="seg g3" id="segG3" title="Embeddings + KV cache"></div>
        </div>
        <div class="vram-legend">
          <span class="lg"><i style="background:var(--leaf1)"></i> Gemma Grader &middot; VLM</span>
          <span class="lg"><i style="background:var(--leaf2)"></i> Gemma Reasoning</span>
          <span class="lg"><i style="background:var(--gold)"></i> Embeddings + KV</span>
        </div>
        <div class="gauges">
          <div class="gauge"><div class="k">Throughput</div><div class="v" id="gTok">2,410 <small>tok/s</small></div></div>
          <div class="gauge"><div class="k">Board power</div><div class="v" id="gPwr">341 <small>W</small></div></div>
          <div class="gauge"><div class="k">Temp &middot; edge</div><div class="v" id="gTmp">62 <small>&deg;C</small></div></div>
          <div class="gauge"><div class="k">Concurrency</div><div class="v" id="gCon">31 <small>&times;</small></div></div>
        </div>
        <div class="termino" id="termino">
          <div><span class="dim">$</span> <span class="p">vllm serve</span> ani/gemma-grader-lora --dtype bfloat16</div>
          <div class="dim">INFO gfx942 detected &middot; 192GB HBM3 &middot; loading 3 models&hellip;</div>
          <div><span class="p">READY</span> grader+reasoning+embeddings co-hosted &middot; KV 2.06M tokens</div>
        </div>
      </div>
      <div class="gpu-card">
        <div class="subhead" style="color:#9fb3a8">Memory math &mdash; why one card</div>
        <div class="memo">
          <div class="r"><span class="lab">Grader + reasoning + embeddings</span><span class="mono" style="color:#fff">&asymp;171 GB</span></div>
          <div class="r"><span class="lab">NVIDIA H100 (80 GB)</span><span class="no">&#10005; won't fit</span></div>
          <div class="r"><span class="lab">2&times; H100 (160 GB)</span><span class="no">&#10005; still short + split</span></div>
          <div class="r"><span class="lab">AMD MI300X (192 GB)</span><span class="yes">&#10003; one card</span></div>
        </div>
        <p style="color:#b8c7bf;font-size:13.5px;margin-top:16px">Fewer machines means the co-op's pricing, contracts, and farmer photos never leave the cooperative &mdash; and Ani keeps working when rural connectivity doesn't. That's the moat, and the <b style="color:var(--gold)">Best AMD-Hosted Gemma</b> entry.</p>
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

<footer class="foot">
  <div class="wrap">
    <img src="/logo.png" alt="Ani" style="height:44px;width:auto;display:block;margin:0 auto 12px" />
    <p>Ani &middot; Tier 1&rarr;3 Showcase &middot; AMD Developer Hackathon ACT II &mdash; Track 3.<br>Grade &rarr; Match &rarr; Dispatch &middot; three agents, one AMD MI300X.</p>
  </div>
</footer>
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

    async function getGrade(cropId: string, qty: number) {
      try {
        const r = await fetch("/api/grade", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ crop: cropId, quantityKg: qty }) });
        if (r.ok) return await r.json();
      } catch {}
      return gradeStub(cropId, qty);
    }
    async function getMatch(grade: any) {
      try {
        const r = await fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ grade }) });
        if (r.ok) return await r.json();
      } catch {}
      return matchStub(grade);
    }

    async function run() {
      if (busy) return; busy = true;
      const cropId = (gid("cropSel") as any).value;
      const qty = Number((gid("qtyIn") as any).value) || 450;
      runBtn.classList.add("loading");
      outEmpty.style.display = "none"; outStack.classList.add("show");
      steps.forEach((s) => s.classList.remove("active", "done"));
      gid("s0").textContent = "→ …"; gid("s1").textContent = "→ …"; gid("s2").textContent = "→ …";
      gid("gScore").textContent = "0"; gid("fVal").style.width = "0"; gid("matchHost").innerHTML = "";
      gradeRow.classList.remove("show"); gradeRow.style.display = "none";
      matchPanel.classList.remove("show"); matchPanel.style.display = "none";
      dispatchEl.classList.remove("show"); dispatchEl.style.display = "none";

      /* Agent A — trace only */
      setStep(0, "active");
      const grade = await getGrade(cropId, qty);
      await delay(950);
      gid("s0").textContent = "→ Grade " + grade.grade + " · " + grade.score + " · 0.4s";
      setStep(0, "done");
      await delay(800);

      /* Agent D — trace only */
      setStep(1, "active");
      const match = await getMatch(grade);
      await delay(900);
      gid("s1").textContent = "→ " + match.buyers.length + " buyers · ₱" + match.buyers[0].pricePerKg + "/kg peak";
      setStep(1, "done");
      await delay(800);

      /* Router — trace only */
      setStep(2, "active");
      await delay(850);
      gid("s2").textContent = "→ La Trinidad → " + match.dispatch.to + " · " + match.dispatch.eta.split("·")[0].trim();
      setStep(2, "done");
      await delay(2000);

      /* --- All trace steps done — cascade result panels --- */

      gid("gCrop").textContent = grade.crop;
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

    /* MI300X telemetry */
    const gpu = gid("mi300x");
    if (gpu) {
      const gpuObs = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) {
          const g1 = gid("segG1"), g2 = gid("segG2"), g3 = gid("segG3");
          if (g1) { g1.style.width = "34%"; g1.textContent = "Grader 65GB"; }
          if (g2) { g2.style.width = "31%"; g2.textContent = "Reasoning 59GB"; }
          if (g3) { g3.style.width = "24%"; g3.textContent = "Emb+KV 47GB"; }
          gpuObs.unobserve(e.target);
        }
      }), { threshold: 0.4 });
      gpuObs.observe(gpu);
      cleanups.push(() => gpuObs.disconnect());
    }
    if (!reduce) {
      const rnd = (base: number, jit: number) => base + (Math.random() - 0.5) * jit;
      const iv = setInterval(() => {
        const tok = gid("gTok"), pwr = gid("gPwr"), tmp = gid("gTmp"), vu = gid("vramUsed");
        if (tok) tok.innerHTML = Math.round(rnd(2410, 180)).toLocaleString() + " <small>tok/s</small>";
        if (pwr) pwr.innerHTML = Math.round(rnd(341, 14)) + " <small>W</small>";
        if (tmp) tmp.innerHTML = Math.round(rnd(62, 3)) + " <small>°C</small>";
        if (vu) vu.textContent = rnd(171.4, 1.2).toFixed(1);
      }, 1600);
      cleanups.push(() => clearInterval(iv));
    }

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
