/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Impact', 'ui-sans-serif', 'sans-serif'],
      },
      fontSize: {
        // Data-dense admin scale
        '2xs': ['0.6875rem', { lineHeight: '1.125rem', letterSpacing: '0.04em' }], // 11px micro caps
        xs: ['0.75rem', { lineHeight: '1.125rem' }], // 12px labels
        '13': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px table cells
        sm: ['0.875rem', { lineHeight: '1.375rem' }], // 14px body
        base: ['0.9375rem', { lineHeight: '1.5rem' }], // 15px lead
        lg: ['1.0625rem', { lineHeight: '1.5rem' }], // 17px h3
        xl: ['1.25rem', { lineHeight: '1.6rem' }], // 20px h2
        '2xl': ['1.5rem', { lineHeight: '1.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2rem' }],
        '4xl': ['2.375rem', { lineHeight: '2.4rem' }],
      },
      colors: {
        // Deep indigo brand ramp, anchored on #140B4F
        brand: {
          50: '#F1F0F9',
          100: '#E1DEF3',
          200: '#C3BDE7',
          300: '#A297D7',
          400: '#7E6FC3',
          500: '#5E4CA8',
          600: '#453689',
          700: '#31266B',
          800: '#20174F',
          900: '#140B4F',
          950: '#0C0632',
        },
        royal: {
          50: '#EFF5FF',
          100: '#DBE8FE',
          200: '#BFD7FE',
          300: '#93BEFD',
          400: '#609BFA',
          500: '#3B7CF6',
          600: '#2563EB',
          700: '#1D4FD8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Form-control boundaries need 3:1 against white (WCAG 1.4.11).
        // slate-300 managed 1.48:1, slate-400 only 2.56:1.
        control: {
          DEFAULT: '#7D8DA6', // 3.37:1 on white
          hover: '#5C6B83',   // 5.40:1 on white
        },
        accent: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        pop: '0 8px 24px -6px rgb(15 23 42 / 0.14), 0 2px 6px -2px rgb(15 23 42 / 0.08)',
        modal: '0 24px 60px -12px rgb(12 6 50 / 0.32)',
      },
      spacing: {
        sidebar: '15.5rem', // 248px
        topbar: '3.5rem', // 56px
      },
      maxWidth: {
        content: '100rem', // 1600px
      },
      keyframes: {
        'fade-in': { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        'slide-up': {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: 0, transform: 'translateX(12px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        // Never from scale(0) — a popover that grows out of nothing reads as a glitch.
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.97) translateY(-2px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
      },
      transitionTimingFunction: {
        // Stronger than the CSS built-ins, which are too soft to read as intentional.
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out-strong': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      animation: {
        'fade-in': 'fade-in 140ms cubic-bezier(0.23, 1, 0.32, 1)',
        'slide-up': 'slide-up 180ms cubic-bezier(0.23, 1, 0.32, 1)',
        'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.23, 1, 0.32, 1)',
        'pop-in': 'pop-in 150ms cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
}
