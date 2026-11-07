/** @type {import('tailwindcss').Config} */
// Brand values mirror src/design/tokens.ts (docs/BRAND_AND_COPY.md).
// tests/design/tokens.test.ts guards these two against drift.
const brandColors = {
  terracotta: '#C97C5D',
  sage: '#8A9A5B',
  ivory: '#FDF8F3',
  plum: '#3B2A35',
  gold: '#D4A373',
  blush: '#E8B4B8',
  'muted-sage': '#C8D0B8',
  amber: '#D98E4A',
};

module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: { bloom: brandColors },
      borderRadius: { button: '12px', card: '16px', pill: '9999px' },
      minHeight: { touch: '48px' },
      minWidth: { touch: '48px' },
      fontSize: {
        display: ['32px', '40px'],
        'page-title': ['24px', '32px'],
        'section-title': ['18px', '26px'],
        body: ['15px', '22px'],
        caption: ['13px', '18px'],
      },
    },
  },
  plugins: [],
};
