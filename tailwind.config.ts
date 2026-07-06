import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Iowan Old Style"', '"Palatino Linotype"', '"Book Antiqua"', "Georgia", "serif"],
        body: ['"Aptos"', '"Segoe UI"', '"Trebuchet MS"', "sans-serif"]
      },
      colors: {
        night: "#050816",
        mist: "#888888",
        starlight: "#F5F5F5",
        abyss: "#080808",
        black: {
          DEFAULT: "#0A0A0A",
          card: "#111111",
          surface: "#1A1A1A"
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F0D060",
          dark: "#A08020"
        }
      },
      boxShadow: {
        aura: "0 0 0 1px rgba(212,175,55,0.15), 0 18px 40px rgba(0,0,0,0.60)",
        pulse: "0 0 30px rgba(212,175,55,0.22)",
        halo: "0 0 0 1px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 60px rgba(0,0,0,0.55)"
      },
      backgroundImage: {
        "radial-veil":
          "radial-gradient(circle at top, rgba(212,175,55,0.06), transparent 28%), radial-gradient(circle at 85% 10%, rgba(212,175,55,0.04), transparent 22%)",
        filament:
          "linear-gradient(90deg, transparent 0%, rgba(212, 175, 55, 0.45) 49%, transparent 100%)"
      }
    }
  },
  plugins: []
};

export default config;
