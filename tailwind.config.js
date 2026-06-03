/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '380px',  // Extra small devices (small phones)
        'sm': '640px',  // Small devices (phones)
        'md': '768px',  // Medium devices (tablets)
        'lg': '1024px', // Large devices (tablets, small desktops)
        'xl': '1280px', // Extra large devices (desktops)
        '2xl': '1536px', // 2XL devices (large desktops)
      },
    },
  },
  plugins: [],
};
