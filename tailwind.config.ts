import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Χαραγμένο σε ξύλο" παλέτα: χαρτί/σημύδα, καμένη γραμμή χάραξης,
        // ξύλο για δευτερεύον κείμενο, λεπτή γραμμή για περιγράμματα,
        // και "ember" — το ίδιο το λέιζερ — ως σπάνιο, στοχευμένο highlight.
        paper: "#F2EEE2",
        ink: "#1B1714",
        wood: "#8A7A62",
        faint: "#AC9F82",
        line: "#DCD3BF",
        ember: {
          DEFAULT: "#E2430F",
          dark: "#A82D06",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
