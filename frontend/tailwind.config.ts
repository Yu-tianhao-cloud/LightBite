import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#4a7c59", light: "#e8f5e0", dark: "#3d6b4f" },
        accent: { DEFAULT: "#e94560", light: "#fef0f0" },
        warm: { DEFAULT: "#f39c12" },
      },
    },
  },
  plugins: [],
};
export default config;
