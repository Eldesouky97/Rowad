import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        night: { DEFAULT: '#1E1B4B', 2: '#312E81', 3: '#4338CA' },
        sand: { DEFAULT: '#F5F3FF', 2: '#EDE9FE' },
        gold: { DEFAULT: '#C4B5FD', 2: '#A78BFA' },
        rust: '#6D28D9',
        sea: '#4C1D95',
        ink: '#1E1B4B',
        cream: '#FFFFFF',
      },
      fontFamily: {
        display: ['var(--font-arabic)', 'sans-serif'],
        body: ['var(--font-arabic)', 'sans-serif'],
        utility: ['var(--font-arabic)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 20px 50px -25px rgba(22,35,59,0.45)',
      },
      borderRadius: {
        xl2: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
