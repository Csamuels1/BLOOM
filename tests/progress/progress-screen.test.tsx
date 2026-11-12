import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { progressCopy as copy } from '@/content/progress';
import { ProgressScreen } from '@/features/progress';
import { useProfileStore } from '@/features/profile';
import { useWeightStore } from '@/features/weight';

jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

const entry = (measured_at: string, weight_kg: number) =>
  ({
    id: `${measured_at}-${weight_kg}`,
    user_id: 'u1',
    weight_kg,
    measured_at,
    note: null,
    created_at: `${measured_at}T08:00:00Z`,
  }) as never;

beforeEach(() => {
  (router.navigate as jest.Mock).mockClear();
  useProfileStore.setState({
    profile: { unit_system: 'metric' } as never,
    status: 'loaded',
  });
});

afterEach(() => {
  useWeightStore.setState({ entries: [], status: 'idle', error: null });
  useProfileStore.setState({ profile: null, status: 'idle' });
});

describe('ProgressScreen', () => {
  it('shows a skeleton while loading', () => {
    useWeightStore.setState({ entries: [], status: 'loading' });
    render(<ProgressScreen />);
    expect(screen.getByLabelText(copy.loadingLabel)).toBeOnTheScreen();
  });

  it('invites logging from a gentle empty state', () => {
    useWeightStore.setState({ entries: [], status: 'loaded' });
    render(<ProgressScreen />);

    expect(screen.getByText(copy.emptyTitle)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: copy.emptyCta }));
    expect(router.navigate).toHaveBeenCalledWith('/weight-log');
  });

  it('shows a retryable error', () => {
    const load = jest.fn();
    useWeightStore.setState({ entries: [], status: 'error', load });
    render(<ProgressScreen client={{} as never} />);

    expect(screen.getByText(copy.errorTitle)).toBeOnTheScreen();
    fireEvent.press(screen.getByRole('button', { name: copy.retry }));
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('renders the chart section, in-words summary, and milestones', () => {
    useWeightStore.setState({
      entries: [
        entry('2021-01-04', 72),
        entry('2021-01-11', 71),
        entry('2021-01-18', 70),
      ],
      status: 'loaded',
    });
    render(<ProgressScreen />);

    expect(screen.getByText(copy.chartTitle)).toBeOnTheScreen();
    expect(screen.getByText(copy.summaryTitle)).toBeOnTheScreen();
    // Three distinct weeks, trending down → neutral "eased down" sentence.
    expect(screen.getByText(copy.directionDown)).toBeOnTheScreen();
    // Milestones recognize showing up.
    expect(screen.getByText(copy.milestonesTitle)).toBeOnTheScreen();
  });
});
