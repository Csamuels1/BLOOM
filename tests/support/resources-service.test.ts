import type { AppSupabaseClient } from '@/lib/supabase';
import { fetchResources, resourceRegionForCountry } from '@/features/support';

function clientReturning(data: unknown, error: unknown = null) {
  const builder: Record<string, unknown> = {
    select: () => builder,
    in: () => Promise.resolve({ data, error }),
  };
  return { from: () => builder } as unknown as AppSupabaseClient;
}

describe('resourceRegionForCountry', () => {
  it('maps known countries and falls back to global', () => {
    expect(resourceRegionForCountry('NG')).toBe('nigeria');
    expect(resourceRegionForCountry('us')).toBe('united_states');
    expect(resourceRegionForCountry('FR')).toBe('global');
    expect(resourceRegionForCountry(null)).toBe('global');
  });
});

describe('fetchResources', () => {
  const rows = [
    {
      id: 'g',
      region: 'global',
      category: 'general',
      name: 'General',
      description: null,
      contact_phone: null,
      contact_url: 'https://x',
      reviewed_at: '2026-10-01',
    },
    {
      id: 'c',
      region: 'nigeria',
      category: 'crisis',
      name: 'Crisis',
      description: 'help',
      contact_phone: '123',
      contact_url: null,
      reviewed_at: '2026-11-01',
    },
  ];

  it('maps rows and orders crisis first', async () => {
    const result = await fetchResources(clientReturning(rows), 'nigeria');
    expect(result?.map((r) => r.id)).toEqual(['c', 'g']);
    expect(result?.[0]).toMatchObject({
      category: 'crisis',
      contactPhone: '123',
      reviewedAt: '2026-11-01',
    });
  });

  it('returns null on error (keeps the screen fallback)', async () => {
    expect(
      await fetchResources(clientReturning(null, { code: '500' }), 'global'),
    ).toBeNull();
  });

  it('fails closed (null, no throw) when offline', async () => {
    const throwing = {
      from: () => {
        throw new Error('offline');
      },
    } as unknown as AppSupabaseClient;
    await expect(fetchResources(throwing, 'global')).resolves.toBeNull();
  });

  it('returns an empty list when there are no verified resources', async () => {
    expect(await fetchResources(clientReturning([]), 'global')).toEqual([]);
  });
});
