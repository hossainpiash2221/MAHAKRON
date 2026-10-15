/* @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#16211F', paper: '#F6F7F3', sand: '#E8E4D8', mist: '#DDE5E3', sky: '#e9fbff', pink: '#c80077', dark_green: '#00350c',
        peacock: { DEFAULT: '#0F5C6B', dark: '#0A4350' }, madder: '#B3374A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },

      animation: {
        marquee: 'marquee 50s linear infinite',
      },

      keyframes: {
        marquee: {
          '0%': {
            transform: 'translateX(0)',
          },
          '100%': {
            transform: 'translateX(-50%)',
          },
        },
      },
    },
  },
  plugins: [
    require("daisyui"),
  ],
};
