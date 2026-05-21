/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#EBE5FF',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        section: '#F4F0FF',
        border: '#DDD6F5',
        text: '#1A1728',
        dim: '#2E2850',
        muted: '#9B97B8',
        // Brand
        purple: '#7C3AED',
        'purple-dark': '#6D28D9',
        'purple-light': '#C4B5FD',
        'purple-bg': '#EDE9FE',
        // Card palette (colorful backgrounds)
        'card-purple': '#C4B5FD',
        'card-blue': '#93C5FD',
        'card-yellow': '#FDE68A',
        'card-pink': '#F9A8D4',
        'card-mint': '#86EFAC',
        'card-orange': '#FDBA74',
        'card-sky': '#BAE6FD',
        // Functional
        green: '#16A34A',
        'green-light': '#86EFAC',
        'green-bg': '#DCFCE7',
        orange: '#EA580C',
        'orange-bg': '#FFF7ED',
        blue: '#2563EB',
        'blue-light': '#BAE6FD',
        red: '#DC2626',
        black: '#1C1C1E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(124,58,237,0.07), 0 4px 20px rgba(0,0,0,0.05)',
        'card-lg': '0 4px 16px rgba(124,58,237,0.1), 0 16px 40px rgba(0,0,0,0.08)',
        nav: '0 8px 40px rgba(28,28,30,0.4)',
        purple: '0 4px 16px rgba(124,58,237,0.35)',
        green: '0 4px 16px rgba(22,163,74,0.25)',
      },
    },
  },
  plugins: [],
}
