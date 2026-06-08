/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'shake': 'shake 0.4s ease-in-out',
        'ping-once': 'ping-once 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
};
