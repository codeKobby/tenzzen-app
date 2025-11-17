import type { Config } from "tailwindcss"
import type { PluginAPI } from "tailwindcss/types/config"

const config = {
  darkMode: ["class"],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './types/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'pulse-subtle': {
          '0%, 100%': {
            opacity: '1'
          },
          '50%': {
            opacity: '0.85'
          }
        },
        'confetti-fade': {
          '0%': {
            opacity: '1'
          },
          '100%': {
            opacity: '0'
          }
        },
        'scale-up': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'bounce-in': {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '70%': {
            transform: 'scale(1.05)',
            opacity: '1'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        },
        'float-y': {
          '0%, 100%': {
            transform: 'translateY(0)'
          },
          '50%': {
            transform: 'translateY(-10px)'
          }
        },
        'shimmer': {
          '0%': {
            transform: 'translateX(-100%)'
          },
          '100%': {
            transform: 'translateX(100%)'
          }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'confetti-fade': 'confetti-fade 5s ease-out forwards',
        'scale-up': 'scale-up 0.3s ease-out forwards',
        'bounce-in': 'bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
        'float-y': 'float-y 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite'
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
        'gradient-primary-hover': 'linear-gradient(to right, hsl(var(--primary) / 0.9), hsl(var(--primary) / 0.7))'
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: PluginAPI) {
      addUtilities({
        '.scrollbar-hide': {
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
} satisfies Config

export default config
