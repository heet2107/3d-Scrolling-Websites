/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#F7F5F2',
        ink: '#151515',
        brass: '#A98D67',
        sand: '#D8CEC0',
        void: '#101010',
      },
      fontFamily: {
        display: ['Instrument Serif', 'Canela', 'PP Editorial New', 'Georgia', 'serif'],
        sans: ['Inter', 'Neue Montreal', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.22em',
        wide2: '0.34em',
      },
      transitionTimingFunction: {
        // The two curves the whole site moves on.
        keynote: 'cubic-bezier(0.16, 1, 0.3, 1)',
        sweep: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
    },
  },
  plugins: [],
}
