/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0C0C0F',
        surface: '#131318',
        card: '#1C1C24',
        border: 'rgba(255,255,255,0.07)',
        primary: '#8B5CF6',
        'primary-light': '#A78BFA',
        green: '#22C55E',
        orange: '#F97316',
        muted: '#52525B',
        dim: '#A1A1AA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        '8xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
      },
    },
  },
  plugins: [],
}
