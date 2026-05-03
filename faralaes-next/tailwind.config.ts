import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // 👈 CLAVE
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2E7D32",
        "primary-hover": "#1B5E20",
        "primary-soft": "#E8F5E9",
      },
      fontFamily: {
        serif: ["Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
