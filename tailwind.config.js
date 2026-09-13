/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        newsprint: {
          50: '#fcfbf7',
          100: '#f7f4ec',
          200: '#ede8db',
          300: '#ded5c0',
          400: '#c5b89a',
          800: '#2b2723',
          900: '#1a1816',
          ink: '#11100f',
        },
        editorial: {
          red: '#8b181b',
          crimson: '#a3191d',
          gold: '#c59b27',
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-newsreader)', 'Georgia', 'Cambria', 'serif'],
        headline: ['var(--font-cinzel)', 'Playfair Display', 'serif'],
        mono: ['var(--font-mono)', 'Courier Prime', 'monospace'],
      },
    },
  },
  plugins: [],
};
