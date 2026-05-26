/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F1ECE2',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        section: '#ECE5D3',
        border: '#E5DDCB',
        text: '#1F1B14',
        dim: '#4A4234',
        muted: '#8A8270',
        // Brand — sage green
        purple: '#5A6B47',
        'purple-dark': '#3D4A2F',
        'purple-light': '#B8C9A8',
        'purple-bg': '#DCE3CE',
        // Card palette (earthy)
        'card-purple': '#B8C9A8',
        'card-blue': '#93C5FD',
        'card-yellow': '#FDE68A',
        'card-pink': '#F9A8D4',
        'card-mint': '#86EFAC',
        'card-orange': '#FDBA74',
        'card-sky': '#C9D5DE',
        // Functional
        green: '#5A6B47',
        'green-light': '#B8C9A8',
        'green-bg': '#DCE3CE',
        orange: '#C97539',
        'orange-bg': '#F4DBC2',
        blue: '#4A6C82',
        'blue-light': '#C9D5DE',
        red: '#DC2626',
        black: '#1F1B14',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(31,27,20,0.07), 0 4px 20px rgba(0,0,0,0.05)',
        'card-lg': '0 4px 16px rgba(31,27,20,0.1), 0 16px 40px rgba(0,0,0,0.08)',
        nav: '0 8px 40px rgba(31,27,20,0.45)',
        purple: '0 4px 16px rgba(90,107,71,0.35)',
        green: '0 4px 16px rgba(90,107,71,0.25)',
      },
    },
  },
  plugins: [],
}
