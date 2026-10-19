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
