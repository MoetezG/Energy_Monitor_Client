import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#F28707",
          50: "#FEF3E8",
          100: "#FDE7D1",
          200: "#FBD0A3",
          300: "#F9B975",
          400: "#F7A147",
          500: "#F28707",
          600: "#C26C05",
          700: "#915004",
          800: "#613502",
          900: "#301A01",
        },
        secondary: {
          DEFAULT: "#71A700",
          50: "#E8F5CC",
          100: "#DDEDB3",
          200: "#C6DD80",
          300: "#AFCE4D",
          400: "#98BE1A",
          500: "#71A700",
          600: "#5C8600",
          700: "#476500",
          800: "#324300",
          900: "#1D2200",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
