/** @type {import('tailwindcss').Config} */
/** Strict monochrome: black, white, neutral grays only (no chroma). */
const systemSans = [
  "system-ui",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "sans-serif",
];

export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: systemSans,
        serif: ["Georgia", "Cambria", '"Times New Roman"', "serif"],
        display: systemSans,
        /** Preserved alias for existing `font-geist` usage; now resolves to local system fonts. */
        geist: systemSans,
      },
      colors: {
        canvas: {
          DEFAULT: "#ffffff",
          raised: "#ffffff",
          subtle: "#f5f5f5",
        },
        ink: {
          DEFAULT: "#000000",
          muted: "#737373",
          faint: "#a3a3a3",
        },
        accent: {
          DEFAULT: "#000000",
          muted: "#404040",
        },
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 0, 0, 0.05), transparent)",
      },
      keyframes: {
        "cursor-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        /** Seamless loop: track is two concatenated logo sets; move −50% width. */
        "logo-marquee": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "cursor-blink": "cursor-blink 1s step-end infinite",
        "logo-marquee": "logo-marquee 42s linear infinite",
      },
    },
  },
  plugins: [],
};
