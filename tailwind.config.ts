import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        'fade-in-down': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        }
      },
      animation: {
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.5s ease-out',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            'code': {
              backgroundColor: '#f0f0f0',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'pre': {
              backgroundColor: '#f0f0f0',
              padding: '1rem',
              borderRadius: '0.5rem',
              marginTop: '1em',
              marginBottom: '1em',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              borderRadius: '0',
              fontWeight: '400',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};

export default config;
