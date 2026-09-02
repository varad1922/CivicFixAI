/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#17211E',
        'deep-green': '#214E3B',
        'civic-green': '#4F7D61',
        paper: '#F7F5EF',
        sand: '#E8E3D6',
        orange: '#E76F51',
        amber: '#E9B44C',
        'info-blue': '#457B9D',
        danger: '#C94C4C',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
