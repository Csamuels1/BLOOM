import type { AppSupabaseClient } from '@/lib/supabase';
import {
  buildCrashPayload,
  CRASH_PAYLOAD_KEYS,
  installGlobalCrashHandler,
  MAX_REPORTS_PER_SESSION,
  reportCrash,
} from '@/features/telemetry';
import { resetCrashReporterForTests } from '@/features/telemetry/crashReporter';

// `mock`-prefixed so the hoisted factory may reference it.
const mockInsert = jest.fn(async (_payload: unknown) => ({ error: null }));
jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: () => ({ from: () => ({ insert: mockInsert }) }),
}));

const META = { appVersion: '1.2.3', os: 'ios' };

beforeEach(() => {
  resetCrashReporterForTests();
  mockInsert.mockClear();
});

describe('buildCrashPayload', () => {
  it('produces exactly the fixed schema', () => {
    const payload = buildCrashPayload(new TypeError('boom'), META);
    expect(Object.keys(payload).sort()).toEqual([...CRASH_PAYLOAD_KEYS].sort());
    expect(payload).toMatchObject({
      error_name: 'TypeError',
      message: 'boom',
      app_version: '1.2.3',
      platform: 'ios',
    });
  });

  it('never carries extra error properties or sensitive values', () => {
    const error = Object.assign(new Error('weight 81.5 for a@b.co'), {
      cause: { weightKg: 81.5 },
      userEmail: 'a@b.co',
      cycleDay: 14,
    });
    const serialized = JSON.stringify(buildCrashPayload(error, META));
    expect(serialized).not.toMatch(/81\.5|a@b\.co|weightKg|cycleDay|userEmail/);
  });

  it('handles non-Error throws and maps unknown platforms to web', () => {
    const payload = buildCrashPayload('plain 42', {
      appVersion: null,
      os: 'windows',
    });
    expect(payload).toEqual({
      error_name: 'Error',
      message: 'plain [n]',
      stack: null,
      app_version: null,
      platform: 'web',
    });
  });
});

describe('reportCrash', () => {
  it('inserts only the fixed payload into client_crash_reports', async () => {
    const from = jest.fn(() => ({ insert: mockInsert }));
    const ok = await reportCrash(new Error('x'), {
      from,
    } as unknown as AppSupabaseClient);
    expect(ok).toBe(true);
    expect(from).toHaveBeenCalledWith('client_crash_reports');
    const sent = mockInsert.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(sent).sort()).toEqual([...CRASH_PAYLOAD_KEYS].sort());
  });

  it('never throws, even if the client throws', async () => {
    const broken = {
      from: () => {
        throw new Error('offline');
      },
    } as unknown as AppSupabaseClient;
    await expect(reportCrash(new Error('y'), broken)).resolves.toBe(false);
  });

  it('de-duplicates and rate-limits per session', async () => {
    expect(await reportCrash(new Error('same'))).toBe(true);
    expect(await reportCrash(new Error('same'))).toBe(false); // duplicate
    for (let i = 0; i < MAX_REPORTS_PER_SESSION + 3; i += 1) {
      await reportCrash(new Error(`distinct-${'a'.repeat(i + 1)}`));
    }
    expect(mockInsert).toHaveBeenCalledTimes(MAX_REPORTS_PER_SESSION);
  });
});

describe('installGlobalCrashHandler', () => {
  it('reports uncaught errors and still runs the previous handler', async () => {
    const previous = jest.fn();
    let current: ((e: unknown, f?: boolean) => void) | undefined = previous;
    const g = globalThis as { ErrorUtils?: unknown };
    const original = g.ErrorUtils;
    g.ErrorUtils = {
      getGlobalHandler: () => current,
      setGlobalHandler: (h: (e: unknown, f?: boolean) => void) => {
        current = h;
      },
    };
    try {
      installGlobalCrashHandler();
      const error = new Error('uncaught');
      current?.(error, true);
      expect(previous).toHaveBeenCalledWith(error, true);
      await new Promise((r) => setTimeout(r, 0));
      expect(mockInsert).toHaveBeenCalled();
    } finally {
      g.ErrorUtils = original;
    }
  });
});
