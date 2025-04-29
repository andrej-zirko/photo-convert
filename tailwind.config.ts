import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // You can extend the theme here if needed
    },
  },
  // Add daisyUI plugin
  plugins: [require("daisyui")],

  // Optional: DaisyUI configuration
  daisyui: {
    themes: ["light", "dark", "cupcake"], // Enable themes
    darkTheme: "dark", // Default dark theme
    base: true, // Apply base styles
    styled: true, // Apply component styles
    utils: true, // Apply utility classes
    logs: true, // Show logs in console (dev only)
  },
};
export default config;