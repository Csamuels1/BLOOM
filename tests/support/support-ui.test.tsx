import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { supportCopy } from '@/content/support';
import * as signals from '@/features/safety/safetySignals';
import { GentleCheckIn, SupportScreen } from '@/features/support';

// babel-jest hoists these above the imports. The safety barrel re-exports are
// non-configurable, so we mock the underlying module (which the barrel and
// GentleCheckIn both resolve to) and keep the real copy mapping.
jest.mock('@/features/safety/safetySignals', () => ({
  ...jest.requireActual('@/features/safety/safetySignals'),
  fetchSafetySignals: jest.fn(),
}));
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));
jest.mock('@/lib/supabase', () => ({ getSupabaseClient: () => ({}) }));
// `mock`-prefixed so the hoisted factory may reference it lazily.
const mockNavigate = jest.fn();
jest.mock('expo-router', () => ({
  router: { navigate: (...a: unknown[]) => mockNavigate(...a) },
}));

const mockedFetch = jest.mocked(signals.fetchSafetySignals);

const resource = {
  id: 'r1',
  region: 'global',
  category: 'crisis',
  name: 'A crisis line',
  description: 'Someone to talk to',
  contactPhone: '123',
  contactUrl: 'https://example.org',
  reviewedAt: '2026-11-01',
};

describe('SupportScreen', () => {
  it('always shows a way to reach out and the emergency notice', () => {
    render(<SupportScreen initialResources={[]} />);
    expect(screen.getByText(supportCopy.fallbackTitle)).toBeOnTheScreen();
    expect(screen.getByText(supportCopy.emergencyBody)).toBeOnTheScreen();
    // With no verified resources, the empty note shows (fallback still present).
    expect(screen.getByText(supportCopy.emptyTitle)).toBeOnTheScreen();
  });

  it('lists reviewed resources with the reverification note', () => {
    render(<SupportScreen initialResources={[resource]} />);
    expect(screen.getByText('A crisis line')).toBeOnTheScreen();
    expect(screen.getByText(supportCopy.reverifyNote)).toBeOnTheScreen();
    // The review date is surfaced.
    expect(screen.getByText(/Reviewed/)).toBeOnTheScreen();
  });
});

describe('GentleCheckIn', () => {
  beforeEach(() => {
    mockedFetch.mockReset();
    mockNavigate.mockReset();
  });

  it('shows the reviewed non-diagnostic copy and routes to support on a signal', async () => {
    mockedFetch.mockResolvedValue({
      version: 'signals-2026.11',
      sufficientData: true,
      signals: ['rapid_sustained_loss'],
    });
    render(<GentleCheckIn />);

    const { body } = signals.describeSignal('rapid_sustained_loss');
    expect(await screen.findByText(body)).toBeOnTheScreen();

    fireEvent.press(screen.getByText(supportCopy.checkInCta));
    expect(mockNavigate).toHaveBeenCalledWith('/support');
  });

  it('can be dismissed', async () => {
    mockedFetch.mockResolvedValue({
      version: 'signals-2026.11',
      sufficientData: true,
      signals: ['rapid_sustained_loss'],
    });
    const { toJSON } = render(<GentleCheckIn />);
    fireEvent.press(await screen.findByText(supportCopy.checkInDismiss));
    expect(toJSON()).toBeNull();
  });

  it('renders nothing when there is no concerning signal', async () => {
    mockedFetch.mockResolvedValue({
      version: 'signals-2026.11',
      sufficientData: true,
      signals: [],
    });
    const { toJSON } = render(<GentleCheckIn />);
    await waitFor(() => expect(mockedFetch).toHaveBeenCalled());
    expect(toJSON()).toBeNull();
  });
});
