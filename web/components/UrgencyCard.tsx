import type { GradeCard } from "@/lib/types";

export default function UrgencyCard({ g }: { g: GradeCard }) {
  return (
    <div className="card">
      <div className="label">Agent A · Harvest Grader</div>
      <div className="grade-head">
        <div className="urgency-badge">
          <div className="num">{g.urgency.toFixed(1)}</div>
          <div className="cap">URGENCY</div>
        </div>
        <div>
          <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 20 }}>
            {g.crop}
          </div>
          <div className="muted">{g.spoilageWindow}</div>
        </div>
      </div>

      <div className="chips">
        <span className={"chip" + (g.grade === "A" ? " a" : "")}>Grade {g.grade}</span>
        <span className="chip">Quality {g.qualityScore.toFixed(1)}/10</span>
        <span className="chip">{g.ripeness}</span>
        <span className="chip">Shelf-life ~{g.shelfLifeHours}h</span>
      </div>

      <div className="suggestion">{g.suggestion}</div>
      <div className="footnote">
        Grading source: <span className="source-badge">{g.source}</span>
      </div>
    </div>
  );
}
