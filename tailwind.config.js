/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        open: {
          950: '#051525',    // deepest navy — main app background
          900: '#0B1F3A',    // card / surface background
          800: '#112D52',    // elevated surfaces, inputs
          700: '#1A3D69',    // border color
          600: '#24527F',    // subtle highlights / hover
          navy: '#002157',   // The Open's official navy accent
          muted: '#7A9EB8',  // secondary / label text
          cream: '#F0EDE5',  // primary text — warm off-white
          amber: '#F0B800',  // The Open leaderboard amber/yellow
          'amber-dark': '#C89A00',  // darker amber for text on light bg
          'amber-50': '#FFF8E1',    // very light amber — tinted table rows
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
