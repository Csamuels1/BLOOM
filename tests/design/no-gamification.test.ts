import pkg from '../../package.json';

// The project ships no Node type definitions; type just what this test uses.
declare const __dirname: string;
const { readdirSync } = jest.requireActual<{
  readdirSync: (dir: string) => string[];
}>('fs');
const { join } = jest.requireActual<{
  join: (...parts: string[]) => string;
}>('path');

/**
 * Guard against aggressive gamification (issue #51). BLOOM's audience is at
 * elevated risk of disordered eating, so copy must never introduce streaks,
 * badges, points, levels, ranks, or loss-aversion hooks. This scans the string
 * VALUES of every module in src/content (comments explaining what we avoid are
 * fine), so new copy modules are covered automatically.
 */
const CONTENT_DIR = join(__dirname, '..', '..', 'src', 'content');

const gamificationPatterns: RegExp[] = [
  /\bstreaks?\b/i,
  /\bbadges?\b/i,
  /\bpoints\b/i,
  /\bxp\b/i,
  /\blevel(?:led|ed|ing)?[- ]up\b/i,
  /\bnext level\b/i,
  /\bleaderboards?\b/i,
  /\brank(?:s|ed|ing|ings)?\b/i,
  /\bachievements?\b/i,
  /\bunlock(?:ed)? (?:an? |your |new )?(?:achievement|reward|badge|level)s?\b/i,
  /\bdon['’]?t break\b/i,
  /\bdon['’]?t lose your\b/i,
  /\btroph(?:y|ies)\b/i,
  /\bcombo\b/i,
  /\bhigh score\b/i,
  /\bbeat your\b/i,
];

function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectStrings(item, out);
  }
  return out;
}

const contentFiles = readdirSync(CONTENT_DIR).filter((file) =>
  /\.tsx?$/.test(file),
);

describe('no aggressive gamification in copy', () => {
  it('finds the content modules to scan', () => {
    expect(contentFiles.length).toBeGreaterThan(10);
  });

  it.each(contentFiles)('keeps %s free of gamification terms', (file) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const moduleExports: unknown = require(join(CONTENT_DIR, file));
    const strings = collectStrings(moduleExports);
    const offenders = strings.flatMap((copy) =>
      gamificationPatterns
        .filter((pattern) => pattern.test(copy))
        .map((pattern) => `${pattern} → "${copy}"`),
    );
    expect(offenders).toEqual([]);
  });

  it('flags a gamified sentence (the guard itself works)', () => {
    const sample = collectStrings({
      a: "Don't break your 7-day streak!",
      b: ['Level up to earn a badge'],
    });
    const hits = sample.filter((copy) =>
      gamificationPatterns.some((pattern) => pattern.test(copy)),
    );
    expect(hits).toHaveLength(2);
  });
});

describe('no celebration machinery in dependencies', () => {
  it('ships no confetti or reward-animation packages', () => {
    const names = Object.keys(pkg.dependencies);
    expect(names.filter((name) => /confetti|fireworks/i.test(name))).toEqual(
      [],
    );
  });
});
