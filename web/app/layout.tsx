import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ani — The Living Harvest Engine",
  description:
    "One photo grades a harvest, scores its spoilage urgency, and matches it to live Metro Manila demand — three AI agents on a single AMD MI300X.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
