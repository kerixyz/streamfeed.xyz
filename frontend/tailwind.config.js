/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        deepNavy: '#123456',    // Primary color for headers and text
        lightBlue: '#E6F1F8',   // Light blue for backgrounds
        primaryYellow: '#FCD34D', // Yellow for links and button hovers
        softGray: '#F0F4F8',    // Soft gray for alternative backgrounds
      },
    },
  },
  plugins: [],
}
