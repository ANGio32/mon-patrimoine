/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F2F2F7',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        section: '#F8F8FA',
        border: '#E5E5EA',
        text: '#1C1C1E',
        dim: '#3A3A3C',
        muted: '#8E8E93',
        green: '#2FB960',
        'green-dark': '#25A244',
        'green-bg': '#E9F9EF',
        orange: '#FF9500',
        'orange-bg': '#FFF4E0',
        purple: '#7C5CFC',
        'purple-bg': '#F0EDFF',
        red: '#FF3B30',
        blue: '#007AFF',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)',
        'card-lg': '0 2px 8px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.06)',
        green: '0 4px 16px rgba(47,185,96,0.25)',
      },
    },
  },
  plugins: [],
}
