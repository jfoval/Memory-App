/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        zone1: '#3b82f6',
        zone2: '#10b981',
        zone3: '#f59e0b',
        zone4: '#a855f7',
      },
    },
  },
  plugins: [],
};
