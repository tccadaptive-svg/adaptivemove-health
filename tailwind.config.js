/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#0A0D14',
          secondary: '#111827',
          card: '#1A2235',
        },
        accent: {
          blue: '#2563EB',
          sky: '#38BDF8',
        },
        success: '#22C55E',
        warning: '#F59E0B',
        text: {
          primary: '#F1F5F9',
          muted: '#94A3B8',
        },
        border: 'rgba(255,255,255,0.07)',
      },
      animation: {
        'gradient-shift': 'gradientShift 8s ease infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in-left': 'slideInLeft 0.3s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'typing': 'typing 1.2s steps(3) infinite',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(37, 99, 235, 0.6)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        typing: {
          '0%': { opacity: '0.3' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.3' },
        },
      },
      backgroundSize: {
        '300%': '300%',
      },
    },
  },
  plugins: [],
};
