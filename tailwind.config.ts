import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0b1a3a", light: "#1a2f5a" },
        gold: { DEFAULT: "#d4a843", light: "#f0d68a" },
      },
    },
  },
  plugins: [],
};

export default config;
