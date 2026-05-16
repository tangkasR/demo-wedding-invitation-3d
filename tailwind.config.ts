import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cormorant: ['"Cormorant Garamond"', 'serif'],
        jost: ['Jost', 'sans-serif'],
      },
      colors: {
        gold: '#C9A96E',
        'gold-l': '#F0D99A',
        'gold-d': '#8A6E3C',
        dark: '#080604',
        cream: '#FFF8EE',
      },
      transitionDuration: {
        '400': '400ms',
        '700': '700ms',
        '1100': '1100ms',
      },
    },
  },
  plugins: [],
}

export default config
