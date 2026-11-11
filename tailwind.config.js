/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        noir: {
          950: '#03020a',
          900: '#07050f',
          850: '#0d0a18',
          800: '#12101f',
        },
        gold: {
          400: '#e8c060',
          500: '#c9943a',
          600: '#a87830',
        },
        crimson: {
          400: '#f87171',
          500: '#e02020',
          600: '#c01818',
          700: '#a01010',
          900: '#3a0808',
        },
        smoke: {
          200: '#e0ddd8',
          300: '#c0bdb8',
          400: '#9a9790',
          500: '#6a6760',
          600: '#4a4740',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      },
      animation: {
        flicker: 'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.85' },
        },
      },
    },
  },
  plugins: [],
};
