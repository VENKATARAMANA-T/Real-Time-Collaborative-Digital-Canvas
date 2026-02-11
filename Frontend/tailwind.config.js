/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#137fec",
        "deep-purple": "#4f46e5",
        "teal-accent": "#0d9488",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
        "surface-dark": "#1a242f",
        "border-dark": "#2d3a4b"
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      }
    },
  },
  plugins: [],
}

