const plugin = require("tailwindcss/plugin");
const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./workers/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-noto-sans)", ...fontFamily.sans],
        serif: ["var(--font-noto-serif)", ...fontFamily.serif],
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    plugin(function ({ addUtilities }) {
      addUtilities({
        ".border-stripes": {
          position: "relative",

          "&::before": {
            content: "' '",
            position: "absolute",
            top: "100%",
            left: 0,
            width: "100%",
            height: 6,
            zIndex: -1,

            background:
              "repeating-linear-gradient(90deg, #2463eb 0px, #2463eb 5px, white 5px, white 10px)",
            backgroundPosition: "top left",
            transform: "skew(45deg, 0deg)",
            transformOrigin: "top left",

            pointerEvents: "none",
          },
          "&::after": {
            content: "' '",
            position: "absolute",
            top: 0,
            left: "100%",
            width: 6,
            height: "100%",
            zIndex: -1,

            background: "white",
            backgroundPosition: "top left",
            transform: "skew(0deg, 45deg)",
            transformOrigin: "top left",

            pointerEvents: "none",
          },
        },
        ".content-hidden": {
          "content-visibility": "hidden",
        },
        ".content-visible": {
          "content-visibility": "visible",
        },
      });
    }),
  ],
};
