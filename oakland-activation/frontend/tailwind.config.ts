import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141714",
        panel: "#1c211c",
        line: "#2e342e",
        paper: "#f4f0e6",
        steel: "#9aa196",
        orange: "#e15a1c",
        ok: "#2f8f55",
        warn: "#d89a2b",
        block: "#c44736",
      },
      fontFamily: {
        display: ['"Avenir Next Condensed"', '"Arial Narrow"', "Impact", "sans-serif"],
        body: ['"Avenir Next"', "Avenir", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
