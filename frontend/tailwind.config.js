/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border, rgba(255, 255, 255, 0.16))",
        background: "var(--background, #000000)",
        foreground: "var(--foreground, #ffffff)",
        card: {
          DEFAULT: "var(--card, #f5f5f5)",
          foreground: "var(--card-foreground, #1b1b1b)",
        },
        popover: {
          DEFAULT: "var(--card, #f5f5f5)",
          foreground: "var(--card-foreground, #1b1b1b)",
        },
        primary: {
          DEFAULT: "var(--primary, #ffffff)",
          foreground: "var(--primary-foreground, #1b1b1b)",
        },
        secondary: {
          DEFAULT: "rgba(255, 255, 255, 0.08)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "rgba(255, 255, 255, 0.06)",
          foreground: "rgba(255, 255, 255, 0.60)",
        },
        accent: {
          DEFAULT: "#2b7fff",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },
        ring: "#2b7fff",
        // Direct Air Design Tokens
        air: {
          whiteout: "#ffffff",
          haze: "#f5f5f5",
          ink: "#1b1b1b",
          void: "#000000",
          twilight: "#426188",
          signal: "#2b7fff",
          border: "rgba(255, 255, 255, 0.16)",
          borderLight: "rgba(0, 0, 0, 0.10)",
        },
        // Pastel Palette Accents
        pastel: {
          lavender: "#ede9fe",
          lavenderText: "#6d28d9",
          lavenderBorder: "#ddd6fe",
          mint: "#dcfce7",
          mintText: "#15803d",
          mintBorder: "#bbf7d0",
          sky: "#e0f2fe",
          skyText: "#0369a1",
          skyBorder: "#bae6fd",
          peach: "#ffedd5",
          peachText: "#c2410c",
          peachBorder: "#fed7aa",
          rose: "#ffe4e6",
          roseText: "#be123c",
          roseBorder: "#fecdd3",
          butter: "#fef9c3",
          butterText: "#a16207",
          butterBorder: "#fef08a",
          lilac: "#fae8ff",
          lilacText: "#86198f",
          lilacBorder: "#f5d0fe",
          sage: "#ccfbf1",
          sageText: "#0f766e",
          sageBorder: "#99f6e4",
        },
      },
      boxShadow: {
        'glossy': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.35), 0 8px 32px 0 rgba(0, 0, 0, 0.35)',
        'glossy-light': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.95), 0 4px 24px -2px rgba(0, 0, 0, 0.08)',
        'glossy-pill': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.7), 0 2px 6px -1px rgba(0, 0, 0, 0.05)',
        'glass-glow': '0 0 40px -10px rgba(186, 230, 253, 0.25)',
      },
      borderRadius: {
        card: "12px",
        button: "8px",
        input: "4px",
        pill: "9999px",
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
      maxWidth: {
        page: "1150px",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Anton', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
