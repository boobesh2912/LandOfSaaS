/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fredoka", "ui-rounded", "sans-serif"],
        body: ["Nunito", "ui-sans-serif", "sans-serif"],
      },
      colors: {
        land: {
          50: "#eefaf0",
          100: "#d3f0da",
          300: "#8fd6a2",
          500: "#3fa34d",
          600: "#2f8a3f",
          700: "#256b32",
          900: "#163a1d",
        },
        ocean: {
          100: "#e3f4f7",
          300: "#a9dee6",
          500: "#5fb8c9",
          700: "#357c8a",
        },
        gold: {
          300: "#f7d774",
          500: "#f2b705",
          600: "#d99c02",
          700: "#a97600",
        },
        parchment: "#fdf8ec",
      },
      boxShadow: {
        liquid: "0 6px 0 0 rgba(37, 107, 50, 0.35)",
      },
    },
  },
  plugins: [],
};
