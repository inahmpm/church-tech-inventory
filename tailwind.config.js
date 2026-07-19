/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef3fa',
          100: '#dce6f3',
          400: '#4d729e',
          500: '#28496f',
          600: '#153a5c',
          700: '#0f2a44',
        },
      },
    },
  },
  plugins: [],
}

