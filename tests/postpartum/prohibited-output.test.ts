import { buildRecoveryContext } from '@/features/postpartum';
import { postpartumCopy } from '@/content/postpartum';

/**
 * Safety gate: the recovery context must never diagnose, never pressure a pace,
 * never imply a "should", and never embed a numeric target. Loss/gain/maintenance
 * are equal — no body-transformation language.
 */
const PROHIBITED = [
  'you should',
  'you must',
  'must ',
  'diagnos',
  'bounce back',
  'lose the baby weight',
  'snap back',
  'get your body back',
  'before and after',
  'target',
  'should be',
];

/** Every narrative the context logic can produce, across all paths. */
const NARRATIVES: string[] = [
  // stage paths
  ...[0, 2, 3, 9, 10, 24].map(
    (months) =>
      buildRecoveryContext({
        postpartumStatus: 'postpartum',
        postpartumMonths: months,
      }).narrative,
  ),
  // neutral / missing / prefer-not
  buildRecoveryContext({ postpartumStatus: null, postpartumMonths: null })
    .narrative,
  buildRecoveryContext({
    postpartumStatus: 'prefer_not_to_say',
    postpartumMonths: null,
  }).narrative,
  // not applicable
  buildRecoveryContext({
    postpartumStatus: 'not_postpartum',
    postpartumMonths: null,
  }).narrative,
];

describe('recovery context — prohibited output', () => {
  it('never uses diagnostic or pace-pressuring language in any narrative', () => {
    for (const narrative of NARRATIVES) {
      const lower = narrative.toLowerCase();
      for (const phrase of PROHIBITED) {
        expect(lower).not.toContain(phrase);
      }
    }
  });

  it('never embeds a numeric target in a narrative', () => {
    for (const narrative of NARRATIVES) {
      expect(narrative).not.toMatch(/\d/);
    }
  });

  it('keeps the shipped narrative copy strings free of the same language', () => {
    // Scope: narrative copy only. The draft disclaimer intentionally reassures
    // with words like "never a diagnosis", which belong there and nowhere else.
    const narrativeStrings = Object.entries(postpartumCopy)
      .filter(
        ([key, value]) =>
          key.startsWith('narrative') && typeof value === 'string',
      )
      .map(([, value]) => String(value));
    expect(narrativeStrings.length).toBeGreaterThan(0);
    for (const copy of narrativeStrings) {
      const lower = copy.toLowerCase();
      for (const phrase of PROHIBITED) {
        expect(lower).not.toContain(phrase);
      }
    }
  });
});
