/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#080B14',
        surface: '#0F1320',
        card: '#161B2E',
        border: '#1E2540',
        primary: '#7C3AED',
        secondary: '#00D4AA',
        accent: '#FF6B35',
        muted: '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
