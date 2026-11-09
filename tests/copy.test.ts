import { authCopy } from '@/content/auth';
import { foundationCopy } from '@/content/foundation';
import { homeCopy } from '@/content/home';

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

const copyModules = {
  foundationCopy,
  authCopy,
  homeCopy,
};

describe('voice-sensitive copy', () => {
  for (const [name, copyModule] of Object.entries(copyModules)) {
    it(`keeps ${name} free of prohibited language`, () => {
      for (const copy of Object.values(copyModule)) {
        for (const phrase of prohibited) {
          expect(copy.toLowerCase()).not.toMatch(new RegExp(`\\b${phrase}\\b`));
        }
      }
    });
  }
});
