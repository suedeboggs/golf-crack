/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        golf: {
          50:  '#f0fdf4',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          400: '#d4af37',
          500: '#b8962a',
        }
      },
      screens: {
        xs: '375px',
      }
    },
  },
  plugins: [],
}
