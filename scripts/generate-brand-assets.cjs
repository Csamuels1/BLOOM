#!/usr/bin/env node
// Regenerate BLOOM raster brand assets from the original SVG mark.
//
// The mark is original geometric art (see assets/brand/mark.svg). This script
// rasterizes the icon/adaptive-icon/splash/favicon PNGs and the wordmark from
// the vector sources so they can be reproduced deterministically.
//
// One-off setup (the rasterizer is intentionally NOT a project dependency):
//   npm i -D @resvg/resvg-js@2.6.2
//   node scripts/generate-brand-assets.cjs
//
// Palette and sizing mirror docs/BRAND_AND_COPY.md and src/design/tokens.ts.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

let Resvg;
try {
  ({ Resvg } = require('@resvg/resvg-js'));
} catch {
  console.error(
    'Missing @resvg/resvg-js. Run: npm i -D @resvg/resvg-js@2.6.2 (dev only).',
  );
  process.exit(1);
}

const ROOT = path.join(__dirname, '..');
const BRAND = path.join(ROOT, 'assets', 'brand');
const IMAGES = path.join(ROOT, 'assets', 'images');
const FONT = path.join(ROOT, 'assets', 'fonts', 'Fraunces-SemiBold.ttf');

const C = {
  terracotta: '#C97C5D',
  blush: '#E8B4B8',
  gold: '#D4A373',
  ivory: '#FDF8F3',
  plum: '#3B2A35',
};

const petalFront = (a) =>
  `<path d="M256 256 C212 202 212 152 256 120 C300 152 300 202 256 256 Z" transform="rotate(${a} 256 256)" fill="${C.terracotta}"/>`;
const petalBack = (a) =>
  `<path d="M256 256 C204 194 204 134 256 98 C308 134 308 194 256 256 Z" transform="rotate(${a} 256 256)" fill="${C.blush}"/>`;

const MARK = [
  ...[36, 108, 180, 252, 324].map(petalBack),
  ...[0, 72, 144, 216, 288].map(petalFront),
  `<circle cx="256" cy="256" r="42" fill="${C.gold}"/>`,
].join('');

const placed = (scale) =>
  `<g transform="translate(512 512) scale(${scale}) translate(-256 -256)">${MARK}</g>`;
const doc = (inner, bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${
    bg ? `<rect width="1024" height="1024" fill="${bg}"/>` : ''
  }${inner}</svg>`;

const sources = {
  'mark.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">${MARK}</svg>`,
  'icon.svg': doc(placed(2.0), C.ivory),
  'adaptive-icon.svg': doc(placed(1.65), null),
  'splash.svg': doc(placed(1.3), null),
  'wordmark.svg': `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><g transform="translate(200 200) scale(0.62) translate(-256 -256)">${MARK}</g><text x="440" y="252" font-family="Fraunces" font-weight="600" font-size="190" fill="${C.plum}" letter-spacing="2">BLOOM</text></svg>`,
};

for (const [name, svg] of Object.entries(sources)) {
  fs.writeFileSync(path.join(BRAND, name), svg);
}

const fontBuffers = [fs.readFileSync(FONT)];
const render = (svg, width, outPath, withFont) => {
  const opts = { fitTo: { mode: 'width', value: width } };
  if (withFont)
    opts.font = {
      fontBuffers,
      loadSystemFonts: false,
      defaultFontFamily: 'Fraunces',
    };
  fs.writeFileSync(outPath, new Resvg(Buffer.from(svg), opts).render().asPng());
  console.log('wrote', path.relative(ROOT, outPath));
};

render(sources['icon.svg'], 1024, path.join(IMAGES, 'icon.png'));
render(
  sources['adaptive-icon.svg'],
  1024,
  path.join(IMAGES, 'adaptive-icon.png'),
);
render(sources['splash.svg'], 1024, path.join(IMAGES, 'splash.png'));
render(sources['icon.svg'], 64, path.join(IMAGES, 'favicon.png'));
render(sources['wordmark.svg'], 1200, path.join(BRAND, 'wordmark.png'), true);
