// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    // Add other paths where you use Tailwind classes
  ],
  theme: {
    screens: {
      md: "945px",
    },
    extend: {},
  },
  plugins: [],
};
