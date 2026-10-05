import forms from '@tailwindcss/forms';

/** Press-room palette: cool paper, ink, one process-magenta accent. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#EEF0F3',
        sheet: '#FFFFFF',
        ink: { DEFAULT: '#18202F', soft: '#2A3446' },
        graphite: '#5B6475',
        mist: '#8A93A3',
        rule: { DEFAULT: '#D9DDE4', soft: '#E7EAEF' },
        well: '#F6F7F9',
        magenta: { DEFAULT: '#C8186E', soft: '#FBE7F1', ink: '#8E0F4D' },
        cyan: { DEFAULT: '#0A84B5', soft: '#E3F3FA' },
        yellow: { DEFAULT: '#F4C430', soft: '#FFF6D6', ink: '#7A5C00' },
        danger: { DEFAULT: '#C62828', soft: '#FDECEC' },
        go: { DEFAULT: '#1E7D4F', soft: '#E6F4EC' },
      },
      fontFamily: { sans: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      boxShadow: {
        sheet: '0 1px 0 rgba(24,32,47,0.04), 0 1px 3px rgba(24,32,47,0.06)',
        lift: '0 12px 32px -8px rgba(24,32,47,0.22), 0 2px 6px rgba(24,32,47,0.08)',
      },
    },
  },
  plugins: [forms],
};
