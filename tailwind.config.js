/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          indigo: "#6d28d9",   // morado bonito
          blue:   "#2563eb",   // azul
          green:  "#22c55e",   // verde
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(2,8,23,.06)"
      },
      borderRadius: {
        xl2: "1rem"
      }
    },
  },
  plugins: [],
}
