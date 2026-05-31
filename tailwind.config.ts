import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#090b16',
          panel: '#12142b',
          panel2: '#181b35',
          inset: '#0f1120',
        },
        fg: {
          DEFAULT: '#f1f5f9',
          muted: '#94a3b8',
          subtle: '#64748b',
        },
        stroke: '#2a2d4a',
        purple: {
          DEFAULT: '#8b5cf6',
          light: '#a78bfa',
          dark: '#6d28d9',
          glow: 'rgba(139, 92, 246, 0.35)',
        },
        stat: {
          green: '#4ade80',
          blue: '#38bdf8',
          pink: '#f472b6',
          yellow: '#facc15',
        },
        good: '#4ade80',
        warn: '#facc15',
        bad: '#fb7185',
        accent: {
          DEFAULT: '#8b5cf6',
          2: '#a78bfa',
        },
      },
      boxShadow: {
        panel: '0 8px 32px rgba(0, 0, 0, 0.45)',
        purple: '0 0 24px rgba(139, 92, 246, 0.25)',
        yellow: '0 0 16px rgba(250, 204, 21, 0.35)',
      },
      borderRadius: {
        xl2: '0.875rem',
      },
      backgroundImage: {
        'timer-gradient':
          'linear-gradient(135deg, #4c1d95 0%, #312e81 35%, #1e1b4b 65%, #0f172a 100%)',
        'btn-purple':
          'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
      },
    },
  },
  plugins: [],
} satisfies Config;
