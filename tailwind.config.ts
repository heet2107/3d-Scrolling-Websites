import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#060806",
        panel: "#0a0e0a",
        line: "#1a221a",
        fog: "#e8f0e8",
        moss: "#7d8a7d",
        ember: "#34d399",
        emberDim: "#10b981",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.05em",
        wider2: "0.25em",
      },
    },
  },
  plugins: [],
};

export default config;
