import { safetyCopy } from '@/content/safety';
import type { AppSupabaseClient } from '@/lib/supabase';
import {
  describeSignal,
  fetchSafetySignals,
  parseEvaluation,
} from '@/features/safety';

describe('parseEvaluation', () => {
  it('narrows a valid server result and keeps only known signal codes', () => {
    const result = parseEvaluation({
      version: 'signals-2026.11',
      sufficient_data: true,
      signals: ['rapid_sustained_loss', 'something_unknown'],
    });
    expect(result).toEqual({
      version: 'signals-2026.11',
      sufficientData: true,
      signals: ['rapid_sustained_loss'],
    });
  });

  it('treats missing or malformed results as no evaluation', () => {
    expect(parseEvaluation(null)).toBeNull();
    expect(parseEvaluation('nope')).toBeNull();
    expect(parseEvaluation({ sufficient_data: true })).toBeNull(); // no version
  });

  it('reports insufficient data with no signals', () => {
    const result = parseEvaluation({
      version: 'signals-2026.11',
      sufficient_data: false,
      signals: [],
    });
    expect(result?.sufficientData).toBe(false);
    expect(result?.signals).toEqual([]);
  });
});

describe('describeSignal', () => {
  it('maps a code to gentle, non-diagnostic copy', () => {
    const msg = describeSignal('rapid_sustained_loss');
    expect(msg.title).toBe(safetyCopy.signalRapidLossTitle);
    expect(msg.body).toBe(safetyCopy.signalRapidLossBody);
    // The message never names a condition.
    expect(msg.body.toLowerCase()).not.toContain('disorder');
    expect(msg.body.toLowerCase()).not.toContain('diagnos');
  });
});

describe('fetchSafetySignals', () => {
  it('calls the server engine with no user id and returns the evaluation', async () => {
    const rpc = jest.fn(async () => ({
      data: {
        version: 'signals-2026.11',
        sufficient_data: true,
        signals: ['rapid_sustained_loss'],
      },
      error: null,
    }));
    const result = await fetchSafetySignals({
      rpc,
    } as unknown as AppSupabaseClient);
    expect(rpc).toHaveBeenCalledWith('evaluate_safety_signals', {});
    expect(result?.signals).toEqual(['rapid_sustained_loss']);
  });

  it('returns null on a server error rather than guessing', async () => {
    const rpc = jest.fn(async () => ({ data: null, error: { code: '500' } }));
    expect(
      await fetchSafetySignals({ rpc } as unknown as AppSupabaseClient),
    ).toBeNull();
  });
});
