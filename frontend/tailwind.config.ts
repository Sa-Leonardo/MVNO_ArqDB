import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 32% 91%)",
        surface: "hsl(0 0% 100%)",
        muted: "hsl(210 40% 96%)",
        ink: "hsl(222 47% 11%)",
        primary: "hsl(199 89% 48%)",
        accent: "hsl(162 73% 46%)",
        danger: "hsl(0 72% 51%)",
        warning: "hsl(38 92% 50%)"
      },
      boxShadow: {
        soft: "0 8px 28px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
