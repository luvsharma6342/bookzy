/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(245, 75%, 60%)",
          hover: "hsl(245, 75%, 52%)",
          light: "hsl(245, 75%, 95%)",
          dark: "hsl(245, 75%, 35%)",
        },
        secondary: {
          DEFAULT: "hsl(260, 60%, 65%)",
          hover: "hsl(260, 60%, 57%)",
        },
        accent: {
          DEFAULT: "hsl(150, 75%, 45%)",
          hover: "hsl(150, 75%, 38%)",
          light: "hsl(150, 75%, 95%)",
        }
      },
      fontFamily: {
        title: ["Outfit", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        radius: "12px",
      }
    },
  },
  plugins: [],
}
