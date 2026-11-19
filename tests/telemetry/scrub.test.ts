import {
  LIMITS,
  safeErrorName,
  scrubMessage,
  scrubStack,
} from '@/features/telemetry';

describe('scrubMessage', () => {
  it('redacts emails, tokens, ids, query strings, and every number', () => {
    const out = scrubMessage(
      'Bad weight 75.2 for jane@x.com id 11111111-2222-3333-4444-555555555555 ' +
        'jwt eyJabc.def.ghi auth Bearer abc.123 at /api/x?token=secret',
    );
    expect(out).not.toMatch(
      /jane@x\.com|75\.2|11111111|eyJabc|secret|abc\.123/,
    );
    expect(out).toContain('[email]');
    expect(out).toContain('[id]');
    expect(out).toContain('[token]');
    expect(out).toContain('[n]');
    expect(out).toContain('?[redacted]');
  });

  it('never lets an email pattern through (fuzz)', () => {
    for (let i = 0; i < 300; i += 1) {
      const user = Math.random().toString(36).slice(2, 10);
      const out = scrubMessage(`failed for ${user}@example.org with ${i}`);
      expect(out).not.toMatch(/@example\.org/);
      expect(out).not.toMatch(/[0-9]/);
    }
  });

  it('truncates to the schema limit', () => {
    expect(scrubMessage('x'.repeat(2000)).length).toBe(LIMITS.message);
  });
});

describe('scrubStack', () => {
  it('keeps code locations but redacts identifiers and device usernames', () => {
    const out = scrubStack(
      'at save (/Users/jane/app/weight.ts:123:45)\n' +
        'at C:\\Users\\jane\\app\\x.ts:9:1 for jane@x.com',
    );
    expect(out).toContain('weight.ts:123:45');
    expect(out).toContain('/Users/[user]/app');
    expect(out).toContain('C:\\Users\\[user]\\app');
    expect(out).not.toContain('jane');
  });

  it('redacts numbers in the header line that repeats the message', () => {
    const out = scrubStack('Error: weight 81.5 kg\n    at save (w.ts:12:3)');
    expect(out).toBe('Error: weight [n] kg\n    at save (w.ts:12:3)');
  });
});

describe('safeErrorName', () => {
  it('keeps identifier-shaped names and replaces anything else', () => {
    expect(safeErrorName('TypeError')).toBe('TypeError');
    expect(safeErrorName('Weight 75kg error!')).toBe('Error');
    expect(safeErrorName(undefined)).toBe('Error');
  });
});
