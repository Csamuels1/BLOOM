import { fireEvent, render, screen } from '@testing-library/react-native';

import { useCommunityStore } from '@/features/community';
import * as communityService from '@/features/community/communityService';
import * as analytics from '@/features/telemetry/analytics';
import { MealCard } from '@/features/today/MealCard';
import type { AppSupabaseClient } from '@/lib/supabase';

// Mock the underlying modules (barrel re-exports are non-configurable).
jest.mock('@/features/telemetry/analytics', () => ({
  ...jest.requireActual('@/features/telemetry/analytics'),
  track: jest.fn(async () => true),
}));
jest.mock('@/features/community/communityService', () => ({
  ...jest.requireActual('@/features/community/communityService'),
  createPost: jest.fn(),
}));
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => true,
}));

const mockedTrack = jest.mocked(analytics.track);
const mockedCreate = jest.mocked(communityService.createPost);

beforeEach(() => {
  mockedTrack.mockClear();
  mockedCreate.mockReset();
});

describe('analytics wiring', () => {
  it('records meal_viewed when a meal is opened, not when it is closed', () => {
    render(
      <MealCard
        meal={
          {
            id: 'm1',
            name: 'Jollof rice',
            region: 'nigeria',
            calories: { min: 450, max: 550 },
            tags: [],
            ingredients: 'Rice, tomato, pepper',
          } as never
        }
        onLog={() => undefined}
      />,
    );
    const card = screen.getByText('Jollof rice');
    fireEvent.press(card); // open
    fireEvent.press(card); // close
    expect(mockedTrack).toHaveBeenCalledTimes(1);
    expect(mockedTrack).toHaveBeenCalledWith('meal_viewed');
  });

  it('records community_post_created only after a post is created', async () => {
    useCommunityStore.setState({ space: 'recovery', posts: [] } as never);
    mockedCreate.mockResolvedValueOnce({ ok: false, error: 'x' } as never);
    await useCommunityStore.getState().post({} as AppSupabaseClient, 'hello');
    expect(mockedTrack).not.toHaveBeenCalled();

    mockedCreate.mockResolvedValueOnce({
      ok: true,
      value: { id: 'p1', space: 'recovery', body: 'hello' },
    } as never);
    await useCommunityStore.getState().post({} as AppSupabaseClient, 'hello');
    expect(mockedTrack).toHaveBeenCalledWith('community_post_created');
  });
});
