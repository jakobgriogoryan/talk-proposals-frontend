/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Dark ocean theme colors
        'ocean': {
          50: '#e6f4f7',
          100: '#b3d9e3',
          200: '#80bfcf',
          300: '#4da5bb',
          400: '#1a8ba7',
          500: '#0d6b7f',
          600: '#0a5566',
          700: '#073f4d',
          800: '#052933',
          900: '#02131a',
        },
      },
    },
  },
  plugins: [],
}

