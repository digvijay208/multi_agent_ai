/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0d59f2',
        'background-light': '#f5f6f8',
        'background-dark': '#101622',
      },
      fontFamily: {
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
