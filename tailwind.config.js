/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft whites and pastels for WhiteCall theme
        'white-call': {
          50: '#ffffff',
          100: '#fefefe',
          200: '#fafafa',
          300: '#f5f5f5',
          400: '#f0f0f0',
        },
        // Light blues
        'sky-soft': {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
        },
        // Pastels
        'pastel': {
          pink: '#ffd6e8',
          blue: '#d6e8ff',
          purple: '#e8d6ff',
          green: '#d6ffe8',
          yellow: '#fff4d6',
          peach: '#ffd6d6',
        },
        // Shift type colors
        'shift': {
          day: '#38bdf8',      // Light blue
          night: '#818cf8',    // Indigo
          evening: '#fb923c',  // Orange
          call: '#ec4899',     // Pink
          weekend: '#a855f7',  // Purple
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}
