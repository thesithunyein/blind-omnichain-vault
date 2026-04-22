import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:   "#f0fdf4",
          100:  "#dcfce7",
          200:  "#bbf7d0",
          300:  "#86efac",
          400:  "#4ade80",
          500:  "#22c55e",
          600:  "#16a34a",
          700:  "#15803d",
          800:  "#166534",
          900:  "#14532d",
          950:  "#052e16",
        },
        surface: {
          DEFAULT: "#0a0a0c",
          card:    "rgba(255,255,255,0.03)",
          border:  "rgba(255,255,255,0.07)",
          muted:   "rgba(255,255,255,0.05)",
          elevated: "rgba(28,28,32,0.85)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "pulse-slow":  "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flicker":     "flicker 2.5s linear infinite",
        "fade-in":     "fadeIn 0.35s ease-out",
        "slide-up":    "slideUp 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-down":  "slideDown 0.35s cubic-bezier(0.16,1,0.3,1)",
        "shimmer":     "shimmer 2.2s infinite",
        "float":       "float 6s ease-in-out infinite",
        "spin-slow":   "spin 8s linear infinite",
      },
      keyframes: {
        flicker: {
          "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": { opacity: "1" },
          "20%, 21.999%, 63%, 63.999%, 65%, 69.999%":            { opacity: "0.4" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "glass":     "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glass-sm":  "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
        "glow-md":   "0 0 30px rgba(34,197,94,0.18)",
        "glow-lg":   "0 0 60px rgba(34,197,94,0.14)",
        "card-hover":"0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};

export default config;
