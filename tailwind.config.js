/** @type {import('tailwindcss').Config} */
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
            950: "#2A0E45",
            900: "#3B1361",
            800: "#4B1D7A",
            700: "#5B2A8C",
            600: "#6E3A9E",
            500: "#8752B5",
            100: "#EFE6F7",
            50: "#F8F4FC",
          },
          gold: {
            700: "#B4790C",
            600: "#D69A1E",
            500: "#F2A900",
            400: "#F7BC33",
            300: "#FBD273",
            100: "#FDF0D8",
          },
          ink: "#1C1330",
          slate: "#5C5470",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(42,14,69,0.06), 0 8px 24px -12px rgba(42,14,69,0.18)",
      },
      backgroundImage: {
        "cbe-hero": "linear-gradient(135deg, #3B1361 0%, #5B2A8C 55%, #8752B5 100%)",
      },
    },
  },
  plugins: [],
}
