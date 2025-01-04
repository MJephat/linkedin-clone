import daisyui from 'daisyui';
import e from 'express';
import { Warning } from 'postcss';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui:{
    themes:[
      {
        linkedin:{
          primary:"#0A66C2", //linkedIn blue
          secondary: '#FFFFFF', //white
          accent: '#7FC15E', //Linked Green (for accent)
          neutral: '#000000', //black (for text)
          "base-100": '#F3F2EF', //Light gray (for background)
          info: '#5E5E5E', //dark gray (for seconfdary text)
          success: '#057642', //dark green (for success message)
          Warning: '#F5C75D', //light orange (for warning message)
          error: '#CC1016', //dark red (for error message)
        },
      },
    ]
  },
  
}