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
        primary: "#0f172a",
        accent: "#2563eb",
        danger: "#dc2626",
        success: "#16a34a",
        warning: "#ca8a04",
      },
    },
  },
  plugins: [],
};

export default config;
