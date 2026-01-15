import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
        xl: "var(--radius-xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        hover: "var(--shadow-hover)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "aurora-wave": {
          "0%, 100%": { 
            transform: "translateX(0) translateY(0) rotate(-15deg) scaleY(1)",
            opacity: "1"
          },
          "33%": { 
            transform: "translateX(3%) translateY(-4%) rotate(-12deg) scaleY(1.08)",
            opacity: "0.9"
          },
          "66%": { 
            transform: "translateX(-2%) translateY(3%) rotate(-18deg) scaleY(0.95)",
            opacity: "1"
          },
        },
        "aurora-wave-delayed": {
          "0%, 100%": { 
            transform: "translateX(0) translateY(0) rotate(-8deg) scaleX(1)",
            opacity: "1"
          },
          "40%": { 
            transform: "translateX(-3%) translateY(2%) rotate(-5deg) scaleX(1.05)",
            opacity: "0.85"
          },
          "70%": { 
            transform: "translateX(2%) translateY(-3%) rotate(-11deg) scaleX(0.97)",
            opacity: "1"
          },
        },
        "aurora-breathe": {
          "0%, 100%": { opacity: "1", transform: "rotate(12deg) scale(1)" },
          "50%": { opacity: "0.75", transform: "rotate(12deg) scale(1.05)" },
        },
        "aurora-drift": {
          "0%, 100%": { transform: "translateX(0) translateY(0) rotate(-20deg)" },
          "50%": { transform: "translateX(5%) translateY(-2%) rotate(-17deg)" },
        },
        "aurora-pulse": {
          "0%, 100%": { opacity: "1", transform: "rotate(-5deg) scale(1)" },
          "50%": { opacity: "0.6", transform: "rotate(-5deg) scale(1.08)" },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "count-up": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "flame-dance": {
          "0%, 100%": { transform: "scaleY(1) rotate(0deg)" },
          "25%": { transform: "scaleY(1.05) rotate(-2deg)" },
          "50%": { transform: "scaleY(0.98) rotate(0deg)" },
          "75%": { transform: "scaleY(1.05) rotate(2deg)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-100vh) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "slide-up-bounce": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "60%": { transform: "translateY(-5%)" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "count-up": "count-up 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "flame-dance": "flame-dance 2s ease-in-out infinite",
        "confetti-fall": "confetti-fall 3s linear forwards",
        "slide-up-bounce": "slide-up-bounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "aurora-wave": "aurora-wave 20s ease-in-out infinite",
        "aurora-wave-delayed": "aurora-wave-delayed 25s ease-in-out infinite",
        "aurora-breathe": "aurora-breathe 15s ease-in-out infinite",
        "aurora-drift": "aurora-drift 30s ease-in-out infinite",
        "aurora-pulse": "aurora-pulse 12s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
