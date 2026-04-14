/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['attribute', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          300: 'hsl(220 80% 75%)',
          400: 'hsl(220 75% 65%)',
          500: 'hsl(220 70% 50%)',
          600: 'hsl(220 65% 42%)',
        },
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          border: 'var(--surface-border)',
        },
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
}
