import type { MatchResult, BuyerMatch } from "@/lib/types";

function demandTag(d: BuyerMatch["demand"]) {
  const cls = d === "Surging" ? "surging" : d === "Stable" ? "stable" : "dipping";
  return <span className={"tag " + cls}>{d}</span>;
}

export default function MatchFeed({ m }: { m: MatchResult }) {
  return (
    <div className="card">
      <div className="label">Agent D · NCR Demand & Price Match</div>
      {m.buyers.map((b, i) => (
        <div className="match" key={i}>
          <div className="match-top">
            <span className="name">{b.buyer}</span>
            <span className="price">₱{b.pricePerKg}/kg</span>
          </div>
          <div className="match-sub">{b.market} — {b.note}</div>
          <div className="match-meta">
            <span className="tag match">{b.matchPct}% match</span>
            {demandTag(b.demand)}
            {b.action === "Route First" ? (
              <span className="tag first">⚡ {b.action}</span>
            ) : (
              <span className="tag stable">{b.action}</span>
            )}
          </div>
        </div>
      ))}
      <div className="footnote">
        Matching source: <span className="source-badge">{m.source}</span> · prices seed from DA/PSA data (Tier 2)
      </div>
    </div>
  );
}
