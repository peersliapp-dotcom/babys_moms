/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#FDF2F4',
          100: '#FBE6E9',
          200: '#F7C9CE',
          300: '#F0A8B0',
          400: '#E8838F',
          500: '#DB5E6E',
          600: '#C94052',
          700: '#A82D3F',
          800: '#872335',
          900: '#6B2737',
        },
        rose: {
          50: '#FBF3F1',
          100: '#F7E3DF',
          200: '#EFC7BF',
          300: '#E3A89C',
          400: '#D98A93',
          500: '#C97080',
          600: '#B05568',
          700: '#934356',
          800: '#7A3848',
          900: '#6B2737',
        },
        gold: {
          50: '#FBF6EE',
          100: '#F5E8D3',
          200: '#ECD5B0',
          300: '#DFBD87',
          400: '#D4A968',
          500: '#C9A66B',
          600: '#B88E50',
          700: '#9A7340',
          800: '#7E5E36',
          900: '#6B4F2E',
        },
        cream: {
          50: '#FEFBF9',
          100: '#FDF5F2',
          200: '#FBEDE9',
          300: '#F8E0D9',
          400: '#F2D0C5',
          500: '#E8B8A8',
        },
        wine: {
          500: '#872335',
          600: '#7A1F2F',
          700: '#6B2737',
          800: '#5A1F2B',
          900: '#4A1A24',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Poppins"', 'system-ui', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
      },
    },
  },
  plugins: [],
}
