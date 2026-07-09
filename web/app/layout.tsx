import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ani — Harvest Grader & Market Match",
  description:
    "Agentic cold-chain & market-matching for highland farmers. Grade a harvest, score spoilage urgency, match to live NCR demand.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="brand">
            <span className="leaf">🌱</span> Ani
          </div>
          <div className="spacer" />
          <span className="pill">Track 3 · Unicorn</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
