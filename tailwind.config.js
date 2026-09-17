/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FDF8F9', // Blanc avec une micro-touche de rose
        secondary: '#111111', // Noir profond
        accent: '#E94560', // Rose vif (Pink)
        'accent-light': '#F4A5B3', // Rose clair
        'glass-bg': 'rgba(255, 255, 255, 0.95)',
        'glass-border': 'rgba(0, 0, 0, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 24px 0 rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
