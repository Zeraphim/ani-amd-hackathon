// Ani design tokens (canonical) — mirror of tokens.css for programmatic use in React.
// Source of truth: docs/ui/kitchensink.html. Prefer CSS var() in components; use this object
// for inline styles, charts, canvas, or theming where a JS value is needed.

export const color = {
  green: "#14663B",       // Highland Green — primary
  greenDeep: "#0E3F23",   // Deep Forest
  greenInk: "#0A2A18",    // text on gold
  leaf1: "#8CC63F",       // Leaf Green — fresh
  leaf2: "#4FA84E",       // Grove Green — growing
  gold: "#E0A62E",        // Harvest Gold — value/accent (use sparingly)
  goldDeep: "#B67E10",
  cream: "#F4F2EA",       // canvas
  cream2: "#EDEADD",
  paper: "#FBFAF4",       // raised surface
  black: "#101A15",       // Field Black — text
  green100: "#E7F3DF",    // soft green wash
  gray: "#5B6B62",        // muted
  line: "rgba(16,26,21,.10)",
  line2: "rgba(16,26,21,.06)",
  danger: "#C0342C",
  dangerWash: "#FBE7E5",
  warn: "#E0A62E",
  ok: "#178A4E",
  okWash: "#E4F4EA",
} as const;

export const font = {
  display: "'Poppins','Century Gothic',Futura,ui-rounded,system-ui,sans-serif",
  body: "'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
} as const;

// 4pt spacing scale
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 24, 6: 32, 7: 48, 8: 64, 9: 96, 10: 128 } as const;

export const radius = { xs: 8, sm: 12, md: 16, lg: 22, xl: 30, pill: 999 } as const;

export const elevation = {
  e1: "0 1px 2px rgba(16,26,21,.06)",
  e2: "0 6px 18px -8px rgba(16,26,21,.18)",
  e3: "0 22px 48px -22px rgba(16,26,21,.34)",
  gold: "0 12px 40px -12px rgba(224,166,46,.55)",
} as const;

export const ease = {
  out: "cubic-bezier(.16,1,.3,1)",
  spring: "cubic-bezier(.34,1.56,.64,1)",
  io: "cubic-bezier(.65,0,.35,1)",
} as const;

export const duration = { d1: 160, d2: 320, d3: 600, d4: 1000 } as const; // ms

export const gradient = {
  harvest: "linear-gradient(100deg,#8CC63F,#4FA84E 42%,#E0A62E)",
  harvestSoft: "linear-gradient(120deg,#EAF5DE,#E7F0DB 45%,#F6E7C4)",
} as const;

export const tokens = { color, font, space, radius, elevation, ease, duration, gradient };
export default tokens;
