import {
  buildRecoveryContext,
  CONTENT_VERSION,
  MONTHS_MAX,
  MONTHS_MIN,
  type PostpartumStage,
  type RecoveryContext,
} from '@/features/postpartum';

function asStage(result: RecoveryContext) {
  if (result.kind !== 'stage') throw new Error('expected a stage result');
  return result;
}

describe('buildRecoveryContext — postpartum stages', () => {
  it('returns a gentle stage narrative across the full month range', () => {
    for (let months = MONTHS_MIN; months <= MONTHS_MAX; months += 1) {
      const result = asStage(
        buildRecoveryContext({
          postpartumStatus: 'postpartum',
          postpartumMonths: months,
        }),
      );
      expect(result.narrative.length).toBeGreaterThan(0);
      expect(result.stage).not.toBeNull();
      expect(result.isDraft).toBe(true);
      expect(result.disclaimer.length).toBeGreaterThan(0);
    }
  });

  it('maps early / mid / later seasons from the month value', () => {
    const stageAt = (months: number): PostpartumStage =>
      asStage(
        buildRecoveryContext({
          postpartumStatus: 'postpartum',
          postpartumMonths: months,
        }),
      ).stage;
    expect(stageAt(0)).toBe('early');
    expect(stageAt(2)).toBe('early');
    expect(stageAt(3)).toBe('mid');
    expect(stageAt(9)).toBe('mid');
    expect(stageAt(10)).toBe('later');
    expect(stageAt(24)).toBe('later');
  });
});

describe('buildRecoveryContext — safe missing / prefer-not paths (no guess)', () => {
  it('uses the neutral default when status is missing (null)', () => {
    const result = buildRecoveryContext({
      postpartumStatus: null,
      postpartumMonths: null,
    });
    expect(result.kind).toBe('neutral');
    expect(result.stage).toBeNull();
    expect(result.narrative.length).toBeGreaterThan(0);
  });

  it('uses the neutral default for prefer-not-to-say, ignoring any months', () => {
    const result = buildRecoveryContext({
      postpartumStatus: 'prefer_not_to_say',
      postpartumMonths: 6,
    });
    expect(result.kind).toBe('neutral');
    expect(result.stage).toBeNull();
  });

  it('never guesses a stage when postpartum but months is missing', () => {
    const result = buildRecoveryContext({
      postpartumStatus: 'postpartum',
      postpartumMonths: null,
    });
    expect(result.kind).toBe('neutral');
    expect(result.stage).toBeNull();
  });

  it('treats an out-of-range or non-integer month as missing, not a guess', () => {
    for (const months of [-1, 25, 100, 3.5, Number.NaN]) {
      const result = buildRecoveryContext({
        postpartumStatus: 'postpartum',
        postpartumMonths: months,
      });
      expect(result.kind).toBe('neutral');
      expect(result.stage).toBeNull();
    }
  });
});

describe('buildRecoveryContext — not postpartum', () => {
  it('returns a warm, neutral not-applicable note', () => {
    const result = buildRecoveryContext({
      postpartumStatus: 'not_postpartum',
      postpartumMonths: null,
    });
    expect(result.kind).toBe('not_applicable');
    expect(result.stage).toBeNull();
    expect(result.narrative.length).toBeGreaterThan(0);
  });
});

describe('buildRecoveryContext — versioned and draft', () => {
  it('stamps CONTENT_VERSION and the draft flag on every result', () => {
    const results = [
      buildRecoveryContext({
        postpartumStatus: 'postpartum',
        postpartumMonths: 1,
      }),
      buildRecoveryContext({ postpartumStatus: null, postpartumMonths: null }),
      buildRecoveryContext({
        postpartumStatus: 'not_postpartum',
        postpartumMonths: null,
      }),
    ];
    for (const result of results) {
      expect(result.contentVersion).toBe(CONTENT_VERSION);
      expect(result.isDraft).toBe(true);
      expect(result.disclaimer.length).toBeGreaterThan(0);
    }
  });
});

describe('buildRecoveryContext — deterministic (replay)', () => {
  it('returns identical output for identical input', () => {
    const inputs = {
      postpartumStatus: 'postpartum' as const,
      postpartumMonths: 7,
    };
    expect(buildRecoveryContext(inputs)).toEqual(buildRecoveryContext(inputs));
  });
});
