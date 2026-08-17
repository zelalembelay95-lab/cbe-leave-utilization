/** @type {import('tailwindcss').Config} */
// Brand colors extracted directly from the uploaded CBE logo SVG
// (deep brown #3E1C11 / bronze #815630 / gold #D0A12A). The Tailwind key is
// still named "purple" so every existing `cbe-purple-*` class in the app
// keeps working — only the underlying hex values changed to match the real
// logo instead of the earlier placeholder purple guess.
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cbe: {
          purple: {
            950: "#20100A", // deepest brown (hero backgrounds)
            900: "#3E1C11", // logo dark brown
            800: "#552B18", // interpolated
            700: "#815630", // logo bronze
            600: "#9F6D39", // logo gold-brown
            500: "#B98F55", // lighter bronze
            100: "#F3E9DC", // warm tint background
            50: "#FBF7F1",  // near-white warm tint
          },
          gold: {
            700: "#A67C15",
            600: "#C79322",
            500: "#D0A12A", // logo gold
            400: "#DCB65C",
            300: "#E8CD8C",
            100: "#FBF1DC",
          },
          ink: "#20130A",
          slate: "#7A6552",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(32,16,10,0.06), 0 8px 24px -12px rgba(32,16,10,0.22)",
      },
      backgroundImage: {
        "cbe-hero": "linear-gradient(135deg, #20100A 0%, #3E1C11 45%, #815630 85%, #9F6D39 100%)",
      },
    },
  },
  plugins: [],
}
