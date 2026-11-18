import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { subscriptionCopy as copy } from '@/content/subscription';
import { useAuthStore } from '@/features/auth';
import { PaywallScreen } from '@/features/subscription';
import * as adapterModule from '@/features/subscription/purchasesAdapter';
import { usePurchasesStore } from '@/features/subscription/purchasesStore';

// babel-jest hoists these above the imports.
jest.mock('@/features/subscription/purchasesAdapter', () => ({
  isPurchasesAvailable: jest.fn(() => true),
  configurePurchases: jest.fn(),
  getActiveOffering: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));
jest.mock('@/design/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

const adapter = jest.mocked(adapterModule);

const offering = {
  availablePackages: [
    {
      identifier: 'monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'prod_monthly',
        title: 'BLOOM Pro',
        priceString: '$6.99',
      },
    },
  ],
};

beforeEach(() => {
  usePurchasesStore.getState().clear();
  adapter.isPurchasesAvailable.mockReturnValue(true);
  adapter.getActiveOffering.mockResolvedValue(offering);
  useAuthStore.setState({ session: { user: { id: 'u1' } } } as never);
});

describe('PaywallScreen', () => {
  it('shows store-priced plans and completes a purchase', async () => {
    adapter.purchasePackage.mockResolvedValue({
      status: 'purchased',
      isPro: true,
    });
    render(<PaywallScreen />);

    expect(await screen.findByText('$6.99 per month')).toBeTruthy();
    expect(screen.getByText('BLOOM Pro')).toBeTruthy();

    fireEvent.press(screen.getByText(copy.paywallChoose));
    expect(await screen.findByText(copy.paywallPurchasedTitle)).toBeTruthy();
  });

  it('explains that purchasing is unavailable on web', async () => {
    adapter.isPurchasesAvailable.mockReturnValue(false);
    render(<PaywallScreen />);
    expect(await screen.findByText(copy.paywallUnavailableTitle)).toBeTruthy();
  });

  it('shows the empty state when the store has no plans configured', async () => {
    adapter.getActiveOffering.mockResolvedValue({ availablePackages: [] });
    render(<PaywallScreen />);
    expect(await screen.findByText(copy.paywallEmptyTitle)).toBeTruthy();
  });

  it('keeps a cancelled purchase calm with no charge message', async () => {
    adapter.purchasePackage.mockResolvedValue({
      status: 'cancelled',
      isPro: false,
    });
    render(<PaywallScreen />);
    fireEvent.press(await screen.findByText(copy.paywallChoose));
    await waitFor(() =>
      expect(screen.getByText(copy.paywallCancelled)).toBeTruthy(),
    );
  });
});
