import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F3EC",
        ink: "#2A2420",
        muted: "#6B5D4F",
        faint: "#8C7B63",
        border: "#E6DCCB",
        accent: {
          DEFAULT: "#B5692E",
          dark: "#8C4E22",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
