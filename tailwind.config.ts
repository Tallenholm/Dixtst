import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/client/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        circadian: {
          amber: '#f59e0b',
          dusk: '#f97316',
          night: '#1e293b',
          dawn: '#60a5fa',
        },
      },
      boxShadow: {
        glow: '0 0 30px rgba(245, 158, 11, 0.45)',
      },
    },
  },
  plugins: [],
} satisfies Config;
