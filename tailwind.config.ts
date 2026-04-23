import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'tacit-ink': {
          50: '#F5F7FA',
          100: '#E4E9F0',
          200: '#CAD3DE',
          300: '#9FACBD',
          400: '#6C7A8F',
          500: '#475669',
          600: '#364353',
          700: '#283341',
          800: '#1B232E',
          900: '#0E141C',
        },
        amber: {
          50: '#FEFBF3',
          100: '#FEF3D7',
          200: '#FCE4A7',
          300: '#F8CE6C',
          400: '#F1B232',
          500: '#D99611',
          600: '#B4780A',
          700: '#8A5A07',
          800: '#603E06',
          900: '#3A2504',
        },
        moss: {
          50: '#F3F7EF',
          100: '#E5EFDC',
          200: '#C9DFBA',
          300: '#A3CA8E',
          400: '#76AE5D',
          500: '#5A8F47',
          600: '#467337',
          700: '#34572A',
          800: '#233B1C',
          900: '#132010',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          hover: 'hsl(var(--accent-hover))',
          muted: 'hsl(var(--accent-muted))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-pretendard)', 'Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Noto Serif KR', 'Georgia', 'serif'],
        mono: ['D2Coding', 'JetBrains Mono', 'monospace'],
      },
      fontSize: {
        base: ['1rem', { lineHeight: '1.625', letterSpacing: '-0.011em' }],
        lg: ['1.125rem', { lineHeight: '1.625' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 6px)',
      },
      boxShadow: {
        xs: '0 1px 2px hsl(var(--shadow-color) / 0.04)',
        sm: '0 1px 3px hsl(var(--shadow-color) / 0.06), 0 1px 2px hsl(var(--shadow-color) / 0.04)',
        md: '0 4px 6px hsl(var(--shadow-color) / 0.05), 0 2px 4px hsl(var(--shadow-color) / 0.04)',
        lg: '0 10px 15px hsl(var(--shadow-color) / 0.06), 0 4px 6px hsl(var(--shadow-color) / 0.04)',
        xl: '0 20px 25px hsl(var(--shadow-color) / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-in-out',
        'slide-up': 'slideUp 300ms ease-in-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
