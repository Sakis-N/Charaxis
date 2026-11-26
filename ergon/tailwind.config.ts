import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        brand: { 50: "#eef6ff", 100: "#d9eaff", 500: "#2f7ae5", 600: "#1f63c8", 700: "#1a4fa0", 900: "#132f5c" },
      },
    },
  },
  plugins: [],
};
export default config;
