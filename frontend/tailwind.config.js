/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "#0B0D10",
        panel: "#13161B",
        panel2: "#1A1E24",
        linea: "#252A32",
        linea2: "#323843",
        tinta: "#EDEFF2",
        tenue: "#99A0AB",
        marfil: "#E8E2D4",
        verde: "#8FB8A0",
        ambar: "#D2B07A",
        rojo: "#D98B7E",
      },
      fontFamily: {
        sans: ["Atkinson Hyperlegible Next", "system-ui", "sans-serif"],
        mono: ["Atkinson Hyperlegible Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        hoja: "14px",
      },
      boxShadow: {
        hoja: "0 1px 0 rgba(255,255,255,0.03) inset, 0 18px 40px -24px rgba(0,0,0,0.8)",
      },
    },
  },
  plugins: [],
};
