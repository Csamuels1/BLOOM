import { communityMediaCopy } from '@/content/communityMedia';

// Mirrors tests/copy.test.ts until the supervisor adds communityMediaCopy there.
const prohibited = [
  'you failed',
  'you went over',
  'stay strong',
  'crush your goals',
  'dream body',
  'before and after',
  'good food',
  'bad food',
  'clean',
  'cheat meal',
];

// Community images never use comparison framing, and alt text never describes
// a body, shape, or weight.
const noComparisonOrBody = [
  'before/after',
  'before-and-after',
  'transformation',
  'side-by-side',
  'compare',
  'body',
  'weight',
  'figure',
];

describe('communityMediaCopy', () => {
  const strings: string[] = Object.values(communityMediaCopy);

  it('is free of prohibited language', () => {
    for (const copy of strings) {
      for (const phrase of prohibited) {
        expect(copy.toLowerCase()).not.toMatch(new RegExp(`\\b${phrase}\\b`));
      }
    }
  });

  it('has no comparison or body framing', () => {
    for (const copy of strings) {
      for (const word of noComparisonOrBody) {
        expect(copy.toLowerCase()).not.toMatch(new RegExp(`\\b${word}\\b`));
      }
    }
  });
});
