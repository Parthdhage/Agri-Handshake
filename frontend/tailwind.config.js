/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                'playfair': ['"DM Serif Display"', 'serif'],
                'display': ['"DM Serif Display"', 'serif'],
                'inter': ['Inter', 'sans-serif'],
            },
            colors: {
                brand: {
                    green: '#166534',
                    'green-light': '#22c55e',
                    'green-pale': '#f0fdf4',
                    gold: '#b45309',
                    'gold-light': '#f59e0b',
                    'gold-pale': '#fffbeb',
                    earth: '#78350f',
                    bg: '#FAFAF5',
                    surface: '#FFFFFF',
                    text: '#1a1a1a',
                    muted: '#6b7280',
                },
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(22, 101, 52, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(22, 101, 52, 0.5)' },
                },
            },
        },
    },
    plugins: [],
}
