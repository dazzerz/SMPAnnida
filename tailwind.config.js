/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./login.html",
    "./dashboard.html",
    "./pages/**/*.{html,js}",
    "./js/**/*.{html,js}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#10b981",
        "primary-dim": "#059669",
        "primary-container": "#047857",
        accent: "#34d399",
      },
      fontFamily: {
        "headline-md": ["Literata", "serif"],
        "headline-lg": ["Literata", "serif"],
        "label-md": ["Nunito Sans", "sans-serif"],
        "body-md": ["Nunito Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
