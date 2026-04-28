/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f8faf9',
          100: '#f1f5f2',
          200: '#e2eae4',
          300: '#c8d7cc',
          400: '#a8bfad',
          500: '#8aaca5',
          600: '#6b968c',
          700: '#527d72',
          800: '#3d655d',
          900: '#2d4f47',
        }
      }
    },
  },
  plugins: [],
};
