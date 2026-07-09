// Simple staged "agent thinking" indicator. Phase 0 simulates the steps client-side;
// Phase 3/4 replaces this with real SSE streaming from Tier 2.
const STEPS = [
  "Analyzing harvest photo (vision)",
  "Scoring quality & shelf-life",
  "Forecasting NCR demand & price",
  "Ranking buyer matches",
];

export default function AgentTrace({ step }: { step: number }) {
  return (
    <div className="card">
      <div className="label">Agentic pipeline</div>
      <div className="trace">
        {STEPS.map((s, i) => (
          <div className="trace-row" key={i}>
            <span
              className={"dot " + (i < step ? "done" : i === step ? "on" : "")}
            />
            <span style={{ color: i <= step ? "var(--on-surface)" : undefined }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
