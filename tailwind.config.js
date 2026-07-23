/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light theme neutral colors (overall app background set to #fefae0)
        neutral: {
          50:  '#fefae0', // Overall bg color except sidebar and box containers
          100: '#f4f3f0',
          200: '#e5e3de',
          300: '#d5d2cc',
          400: '#a5a198',
          500: '#76726a',
          600: '#57544e',
          700: '#3d3a35',
          800: '#24221f',
          900: '#151412',
        },
        // Purple primary (brand)
        brand: {
          50:  '#f7f0fc',
          100: '#eddff9',
          200: '#dbbbf1',
          300: '#c18ce6',
          400: '#a35ad6',
          500: '#8a32c6', // Main purple
          600: '#7225a7',
          700: '#5a1a87',
          800: '#431266',
        },
        // Yellow / gold accent
        accent: {
          50:  '#fffde7',
          100: '#fff9c4',
          200: '#fff176',
          300: '#f4ce41', // Main gold/yellow
          400: '#e6b800',
          500: '#c9a000',
          600: '#a07c00',
        },
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        display: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '1.4', letterSpacing: '0.02em' }],
      },
    },
  },
  plugins: [],
}
