/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        surface: '#fff8f5',
        primary: '#002b5b',
        secondary: '#b08d57',
        outline: '#e1d8d4',
        'surface-dim': '#f5efe9',
        'on-surface-variant': 'rgba(0, 43, 91, 0.65)',
      },
      spacing: {
        'margin-mobile': '16px',
      },
      fontFamily: {
        serif: ['BodoniModa_400Regular'],
        'serif-semibold': ['BodoniModa_600SemiBold'],
        'serif-bold': ['BodoniModa_700Bold'],
      },
      borderRadius: {
        md: '6px',
      },
    },
  },
  plugins: [],
};
