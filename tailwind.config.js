/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        hairline: 'var(--color-hairline)',
        star: 'var(--color-star)',
        walnut: 'var(--color-walnut)',
        'walnut-deep': 'var(--color-walnut-deep)',
        gold: 'var(--color-gold)',
        'gold-soft': 'var(--color-gold-soft)',
        ivory: 'var(--color-ivory)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        button: 'var(--radius-button)',
        card: 'var(--radius-card)',
        input: 'var(--radius-input)',
        full: 'var(--radius-full)',
      },
      spacing: {
        'space-xs': 'var(--space-xs)',
        'space-sm': 'var(--space-sm)',
        'space-md': 'var(--space-md)',
        'space-lg': 'var(--space-lg)',
        'space-xl': 'var(--space-xl)',
        'space-2xl': 'var(--space-2xl)',
      },
      letterSpacing: {
        display: '0.05em',
        label: '0.15em',
        wordmark: '0.15em',
      },
      boxShadow: {
        primary: 'var(--shadow-primary)',
        dark: 'var(--shadow-dark)',
      },
      maxWidth: {
        site: '1440px',
      },
    },
  },
  plugins: [],
};
