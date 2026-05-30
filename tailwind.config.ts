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
        // Warm "paper" canvas + ink (light, ledger feel)
        paper: "oklch(97.6% 0.007 83 / <alpha-value>)",
        "paper-2": "oklch(95.4% 0.009 82 / <alpha-value>)",
        surface: "oklch(99.3% 0.003 86 / <alpha-value>)",
        ink: "oklch(25% 0.02 72 / <alpha-value>)",
        "ink-2": "oklch(43% 0.018 72 / <alpha-value>)",
        "ink-3": "oklch(55% 0.014 72 / <alpha-value>)",
        line: "oklch(90.5% 0.01 82 / <alpha-value>)",
        "line-2": "oklch(85% 0.012 82 / <alpha-value>)",

        // Monad violet — primary accent (used sparingly)
        violet: "oklch(55% 0.205 292 / <alpha-value>)",
        "violet-deep": "oklch(49% 0.2 292 / <alpha-value>)",
        "violet-ink": "oklch(46% 0.19 292 / <alpha-value>)",
        "violet-soft": "oklch(95.5% 0.035 292 / <alpha-value>)",
        "violet-line": "oklch(83% 0.07 292 / <alpha-value>)",

        // "Verified" green — completed / sealed operations
        verified: "oklch(57% 0.14 156 / <alpha-value>)",
        "verified-ink": "oklch(45% 0.125 156 / <alpha-value>)",
        "verified-soft": "oklch(94% 0.05 156 / <alpha-value>)",
        "verified-line": "oklch(80% 0.08 156 / <alpha-value>)",

        // Amber — pending / demo / fulfilled
        amber: "oklch(71% 0.13 72 / <alpha-value>)",
        "amber-ink": "oklch(50% 0.1 64 / <alpha-value>)",
        "amber-soft": "oklch(95% 0.05 78 / <alpha-value>)",
        "amber-line": "oklch(82% 0.09 75 / <alpha-value>)",

        // Danger — errors / cancelled
        danger: "oklch(57% 0.19 27 / <alpha-value>)",
        "danger-ink": "oklch(48% 0.18 27 / <alpha-value>)",
        "danger-soft": "oklch(95% 0.04 27 / <alpha-value>)",
        "danger-line": "oklch(84% 0.08 27 / <alpha-value>)",

        // Slate — neutral status (created)
        slate: "oklch(52% 0.03 250 / <alpha-value>)",
        "slate-soft": "oklch(95% 0.012 250 / <alpha-value>)",
        "slate-line": "oklch(85% 0.02 250 / <alpha-value>)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        eyebrow: ["0.72rem", { lineHeight: "1", letterSpacing: "0.22em" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "0.9375rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        xs: "0 1px 1.5px oklch(70% 0.03 80 / 0.18)",
        sm: "0 1px 2px oklch(68% 0.03 80 / 0.2), 0 1px 1px oklch(68% 0.03 80 / 0.12)",
        md: "0 6px 18px -10px oklch(45% 0.04 80 / 0.32)",
        lg: "0 22px 48px -28px oklch(40% 0.05 80 / 0.4)",
        seal: "0 1px 0 oklch(100% 0 0 / 0.7) inset, 0 2px 6px -3px oklch(45% 0.04 80 / 0.25)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        seal: {
          "0%": { opacity: "0", transform: "rotate(-2deg) scale(1.25)" },
          "60%": { opacity: "1" },
          "100%": { opacity: "1", transform: "rotate(-2deg) scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.2,0.8,0.2,1) both",
        seal: "seal 0.45s cubic-bezier(0.2,0.8,0.2,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
