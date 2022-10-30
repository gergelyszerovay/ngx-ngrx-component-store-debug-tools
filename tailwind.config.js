/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors');

module.exports = {
  content: [
    "./projects/demo/src/**/*.{html,ts}"
  ],
  theme: {
    extend: {},
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      slate: colors.slate,
      white: colors.white,
      emerald: colors.emerald
    }
  },
  plugins: [],
};
