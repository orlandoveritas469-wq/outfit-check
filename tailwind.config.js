/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Inter', 'sans-serif'],
      },
      colors: {
        background: '#101118',
        surface: '#181A22',
        panel: '#20222D',
        primary: {
          DEFAULT: '#FF6B00',
          foreground: '#FFFFFF',
        },
        foreground: '#F0F0F0',
        'muted-foreground': '#8A8B93',
        border: '#30323D',
      }
    },
  },
  plugins: [],
}
