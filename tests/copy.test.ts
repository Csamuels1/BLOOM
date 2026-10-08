import { foundationCopy } from '@/content/foundation';

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

it('keeps scaffold copy free of prohibited language', () => {
  for (const copy of Object.values(foundationCopy)) {
    for (const phrase of prohibited) {
      expect(copy.toLowerCase()).not.toMatch(new RegExp(`\\b${phrase}\\b`));
    }
  }
});
