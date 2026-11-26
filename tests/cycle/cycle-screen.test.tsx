import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import type { AppSupabaseClient } from '@/lib/supabase';
import { cycleCopy as copy } from '@/content/cycle';
import {
  CycleScreen,
  CycleStartForm,
  useCycleStore,
  type CycleStart,
} from '@/features/cycle';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

// The first jest-expo render in a suite pays a one-time warm-up; give it room.
jest.setTimeout(20000);

function asClient(value: unknown) {
  return value as AppSupabaseClient;
}

function entry(partial: Partial<CycleStart>): CycleStart {
  return {
    id: 'c1',
    user_id: 'u1',
    started_on: '2026-10-27',
    created_at: '2026-10-27T08:00:00Z',
    ...partial,
  };
}

/** A client supporting list load, insert, single-delete and bulk-delete. */
function makeClient(
  options: {
    rows?: CycleStart[];
    insertResult?: { data: unknown; error: unknown };
  } = {},
) {
  const rows = options.rows ?? [];
  const insertResult = options.insertResult ?? {
    data: entry({}),
    error: null,
  };
  return asClient({
    auth: {
      getUser: async () => ({ data: { user: { id: 'u1' } }, error: null }),
    },
    from: () => ({
      select: () => ({ order: async () => ({ data: rows, error: null }) }),
      insert: () => ({
        select: () => ({
          single: async () => insertResult,
        }),
      }),
      delete: () => ({ eq: async () => ({ error: null }) }),
    }),
  });
}

const regularRows = [
  entry({ id: 'c3', started_on: '2026-10-27' }),
  entry({ id: 'c2', started_on: '2026-09-29' }),
  entry({ id: 'c1', started_on: '2026-09-01' }),
];

beforeEach(() => {
  useCycleStore.setState({ entries: [], status: 'idle', error: null });
});

afterEach(() => {
  useCycleStore.setState({ entries: [], status: 'idle', error: null });
});

describe('CycleScreen', () => {
  it('shows a calm "Saved" confirmation after a successful save', async () => {
    render(<CycleScreen client={makeClient({ rows: [] })} />);
    await screen.findByText(copy.emptyTitle);

    fireEvent.changeText(screen.getByLabelText(copy.dateLabel), '2026-11-01');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));

    const confirmation = await screen.findByTestId('cycle-saved-confirmation');
    expect(confirmation.props.accessibilityLiveRegion).toBe('polite');
    expect(confirmation.props.role).toBe('status');
    expect(screen.getByText(copy.savedConfirmation)).toBeOnTheScreen();
  });

  it('shows no confirmation when a save fails', async () => {
    render(
      <CycleScreen
        client={makeClient({
          rows: [],
          insertResult: { data: null, error: { message: 'offline' } },
        })}
      />,
    );
    await screen.findByText(copy.emptyTitle);

    fireEvent.changeText(screen.getByLabelText(copy.dateLabel), '2026-11-01');
    fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));

    await screen.findByText(copy.saveErrorTitle);
    expect(screen.getByDisplayValue('2026-11-01')).toBeOnTheScreen();
    expect(screen.queryByTestId('cycle-saved-confirmation')).toBeNull();
    expect(screen.queryByText(copy.savedConfirmation)).toBeNull();
  });

  it('CycleStartForm hides the confirmation again after about two seconds', async () => {
    jest.useFakeTimers();
    try {
      render(<CycleStartForm onSubmit={async () => true} />);
      fireEvent.press(screen.getByRole('button', { name: copy.saveAdd }));
      await act(async () => {
        await Promise.resolve();
      });
      expect(screen.getByTestId('cycle-saved-confirmation')).toBeOnTheScreen();
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(screen.queryByTestId('cycle-saved-confirmation')).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  it('renders the header and the non-diagnostic disclaimer with an estimate', async () => {
    render(
      <CycleScreen
        client={makeClient({ rows: regularRows })}
        today="2026-10-29"
      />,
    );

    expect(screen.getByText(copy.title)).toBeOnTheScreen();
    // The insight is framed as a rough, non-diagnostic estimate.
    await waitFor(() =>
      expect(screen.getByText(copy.insightDisclaimer)).toBeOnTheScreen(),
    );
    expect(screen.getByText(copy.insightTitle)).toBeOnTheScreen();
  });

  it('shows the honest insufficient-data message with fewer than two dates', async () => {
    render(
      <CycleScreen
        client={makeClient({ rows: [entry({})] })}
        today="2026-11-01"
      />,
    );

    await waitFor(() =>
      expect(screen.getByText(copy.insufficientTitle)).toBeOnTheScreen(),
    );
  });

  it('empty state appears when there are no dates', async () => {
    render(
      <CycleScreen client={makeClient({ rows: [] })} today="2026-11-01" />,
    );
    await waitFor(() =>
      expect(screen.getByText(copy.emptyTitle)).toBeOnTheScreen(),
    );
  });

  describe('disable flow', () => {
    it('offers keep vs delete and keeps history when "keep" is chosen', async () => {
      const onTrackingChange = jest.fn();
      render(
        <CycleScreen
          client={makeClient({ rows: regularRows })}
          today="2026-10-29"
          onTrackingChange={onTrackingChange}
        />,
      );
      await waitFor(() =>
        expect(screen.getByText(copy.insightTitle)).toBeOnTheScreen(),
      );

      fireEvent.press(screen.getByRole('button', { name: copy.turnOffAction }));

      // Both explicit history choices are presented.
      expect(
        screen.getByRole('button', { name: copy.disableKeepHistory }),
      ).toBeOnTheScreen();
      expect(
        screen.getByRole('button', { name: copy.disableDeleteHistory }),
      ).toBeOnTheScreen();

      fireEvent.press(
        screen.getByRole('button', { name: copy.disableKeepHistory }),
      );

      // Tracking turned off, but the dates are NOT removed from the store.
      await waitFor(() => expect(onTrackingChange).toHaveBeenCalledWith(false));
      expect(useCycleStore.getState().entries).toHaveLength(3);
    });

    it('deletes all history when "delete" is chosen', async () => {
      const onTrackingChange = jest.fn();
      render(
        <CycleScreen
          client={makeClient({ rows: regularRows })}
          today="2026-10-29"
          onTrackingChange={onTrackingChange}
        />,
      );
      await waitFor(() =>
        expect(screen.getByText(copy.insightTitle)).toBeOnTheScreen(),
      );

      fireEvent.press(screen.getByRole('button', { name: copy.turnOffAction }));
      fireEvent.press(
        screen.getByRole('button', { name: copy.disableDeleteHistory }),
      );

      // Bulk delete ran: the store is emptied and tracking is off.
      await waitFor(() =>
        expect(useCycleStore.getState().entries).toHaveLength(0),
      );
      expect(onTrackingChange).toHaveBeenCalledWith(false);
      expect(screen.getByText(copy.trackingOffBody)).toBeOnTheScreen();
    });
  });
});
