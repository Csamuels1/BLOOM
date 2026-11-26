import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as Haptics from 'expo-haptics';

import type { AppSupabaseClient } from '@/lib/supabase';
import { weightCopy as copy } from '@/content/weight';
import { useProfileStore } from '@/features/profile';
import {
  WeightLogScreen,
  useWeightStore,
  type WeightEntry,
} from '@/features/weight';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// The first jest-expo render in a suite pays a one-time warm-up; give it room
// so a cold start never flakes (warm renders here complete in well under a second).
jest.setTimeout(20000);

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

function entry(partial: Partial<WeightEntry>): WeightEntry {
  return {
    id: 'w1',
    user_id: 'u1',
    weight_kg: 68,
    measured_at: '2026-11-10',
    note: null,
    created_at: '2026-11-10T08:00:00Z',
    ...partial,
  };
}

/**
 * A client whose list load resolves to `rows`, and whose insert resolves to
 * `insertResult`. Both chains are supported from a single `from()` object.
 */
function makeClient(options: {
  rows?: WeightEntry[];
  insertResult?: { data: unknown; error: unknown };
}) {
  const rows = options.rows ?? [];
  const insertResult = options.insertResult ?? { data: entry({}), error: null };
  return asClient({
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: () => ({
      select: () => ({
        order: () => ({ order: async () => ({ data: rows, error: null }) }),
      }),
      insert: () => ({
        select: () => ({ single: async () => insertResult }),
      }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  });
}

beforeEach(() => {
  useProfileStore.setState({ profile: null, status: 'loaded' });
  useWeightStore.setState({ entries: [], status: 'idle', error: null });
});

afterEach(() => {
  useProfileStore.setState({ profile: null, status: 'idle' });
  useWeightStore.setState({ entries: [], status: 'idle', error: null });
});

describe('WeightLogScreen', () => {
  it('renders the add form and an empty state when there are no entries', async () => {
    render(<WeightLogScreen client={makeClient({ rows: [] })} />);

    expect(screen.getByText(copy.title)).toBeOnTheScreen();
    expect(screen.getByText(copy.formAddTitle)).toBeOnTheScreen();
    await waitFor(() =>
      expect(screen.getByText(copy.emptyTitle)).toBeOnTheScreen(),
    );
  });

  it('shows loaded entries', async () => {
    render(
      <WeightLogScreen
        client={makeClient({ rows: [entry({ id: 'w1', weight_kg: 68 })] })}
      />,
    );

    await waitFor(() =>
      // Metric default: 68 kg.
      expect(screen.getByText('68 kg')).toBeOnTheScreen(),
    );
  });

  it('keeps the entered value and shows a retryable notice when a save fails', async () => {
    render(
      <WeightLogScreen
        client={makeClient({
          rows: [],
          insertResult: { data: null, error: { message: 'offline' } },
        })}
      />,
    );

    const input = screen.getByLabelText(copy.weightLabel);
    fireEvent.changeText(input, '68');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));

    // The gentle, retryable error appears...
    await waitFor(() =>
      expect(screen.getByText(copy.saveErrorTitle)).toBeOnTheScreen(),
    );
    // ...and the user's input is NOT discarded.
    expect(screen.getByDisplayValue('68')).toBeOnTheScreen();
    // A failure never buzzes — no "punishment" haptic.
    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    // ...and no "Saved" confirmation is shown.
    expect(screen.queryByTestId('weight-saved-confirmation')).toBeNull();
    expect(screen.queryByText(copy.savedConfirmation)).toBeNull();
  });

  it('shows a calm, neutral "Saved" confirmation after a successful save', async () => {
    render(<WeightLogScreen client={makeClient({ rows: [] })} />);

    fireEvent.changeText(screen.getByLabelText(copy.weightLabel), '68');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));

    const confirmation = await screen.findByTestId('weight-saved-confirmation');
    expect(confirmation.props.accessibilityLiveRegion).toBe('polite');
    expect(confirmation.props.role).toBe('status');
    expect(screen.getByText(copy.savedConfirmation)).toBeOnTheScreen();
    // Still exactly one soft haptic tap.
    expect(Haptics.impactAsync).toHaveBeenCalledTimes(1);
  });

  it('uses the same message whatever the number (no direction-based praise)', async () => {
    render(
      <WeightLogScreen
        client={makeClient({
          rows: [entry({ weight_kg: 70 })],
          insertResult: {
            data: entry({ id: 'w2', weight_kg: 65 }),
            error: null,
          },
        })}
      />,
    );
    await screen.findByText(copy.listTitle);

    fireEvent.changeText(screen.getByLabelText(copy.weightLabel), '65');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));
    const confirmation = await screen.findByTestId('weight-saved-confirmation');
    expect(confirmation).toHaveTextContent(copy.savedConfirmation, {
      exact: true,
    });
  });

  it('confirms a successful save with one soft haptic tap', async () => {
    render(<WeightLogScreen client={makeClient({ rows: [] })} />);

    fireEvent.changeText(screen.getByLabelText(copy.weightLabel), '68');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));

    await waitFor(() => expect(Haptics.impactAsync).toHaveBeenCalledTimes(1));
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light,
    );
  });

  it('closes the save notice when retry (dismiss) is pressed', async () => {
    render(
      <WeightLogScreen
        client={makeClient({
          rows: [],
          insertResult: { data: null, error: { message: 'offline' } },
        })}
      />,
    );

    fireEvent.changeText(screen.getByLabelText(copy.weightLabel), '68');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));
    await waitFor(() =>
      expect(screen.getByText(copy.saveErrorTitle)).toBeOnTheScreen(),
    );

    fireEvent.press(screen.getByRole('button', { name: copy.retry }));
    await waitFor(() =>
      expect(screen.queryByText(copy.saveErrorTitle)).toBeNull(),
    );
    // Input still retained after dismissing the notice.
    expect(screen.getByDisplayValue('68')).toBeOnTheScreen();
  });
});
