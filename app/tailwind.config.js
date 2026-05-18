/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          dark:    "#1e5799",
          mid:     "#2989d8",
          DEFAULT: "#207cca",
          light:   "#7db9e8",
          lighter: "#dbeeff",
          navy:    "#0c1e3c",
        },
      },
      backgroundImage: {
        "brand":      "linear-gradient(to bottom, #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%)",
        "brand-h":    "linear-gradient(to right,  #1e5799 0%, #2989d8 50%, #207cca 51%, #7db9e8 100%)",
        "brand-btn":  "linear-gradient(135deg, #1e5799 0%, #2989d8 100%)",
        "brand-soft": "linear-gradient(135deg, #2989d8 0%, #7db9e8 100%)",
      },
    },
  },
  plugins: [],
};
