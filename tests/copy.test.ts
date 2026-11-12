import { authCopy } from '@/content/auth';
import { foundationCopy } from '@/content/foundation';
import { homeCopy } from '@/content/home';
import { onboardingCopy } from '@/content/onboarding';
import { subscriptionCopy } from '@/content/subscription';
import { todayCopy } from '@/content/today';

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
  onboardingCopy,
  todayCopy,
  subscriptionCopy,
};

describe('voice-sensitive copy', () => {
  for (const [name, copyModule] of Object.entries(copyModules)) {
    it(`keeps ${name} free of prohibited language`, () => {
      // Only string entries are user-facing copy (some modules export helpers).
      const strings = Object.values(copyModule).filter(
        (value): value is string => typeof value === 'string',
      );
      for (const copy of strings) {
        for (const phrase of prohibited) {
          expect(copy.toLowerCase()).not.toMatch(new RegExp(`\\b${phrase}\\b`));
        }
      }
    });
  }
});
