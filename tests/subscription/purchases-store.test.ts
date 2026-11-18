import type { PurchaseOutcome } from '@/features/subscription/paywall';
import * as adapterModule from '@/features/subscription/purchasesAdapter';
import { usePurchasesStore } from '@/features/subscription/purchasesStore';

// Mock the platform adapter so the native react-native-purchases SDK never loads
// in tests; the store's behaviour is what we verify. (babel-jest hoists this
// above the imports, so adapterModule resolves to the mock.)
jest.mock('@/features/subscription/purchasesAdapter', () => ({
  isPurchasesAvailable: jest.fn(() => true),
  configurePurchases: jest.fn(),
  getActiveOffering: jest.fn(),
  purchasePackage: jest.fn(),
  restorePurchases: jest.fn(),
}));

const adapter = jest.mocked(adapterModule);

const offering = {
  availablePackages: [
    {
      identifier: 'monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'prod_monthly',
        title: 'Monthly',
        priceString: '$6.99',
      },
    },
  ],
};

function outcome(o: PurchaseOutcome): PurchaseOutcome {
  return o;
}

beforeEach(() => {
  usePurchasesStore.getState().clear();
  adapter.isPurchasesAvailable.mockReturnValue(true);
  adapter.getActiveOffering.mockResolvedValue(offering);
});

describe('purchasesStore.init', () => {
  it('configures with the user id and loads the offering view model', async () => {
    await usePurchasesStore.getState().init('user-1');
    expect(adapter.configurePurchases).toHaveBeenCalledWith('user-1');
    const s = usePurchasesStore.getState();
    expect(s.available).toBe(true);
    expect(s.status).toBe('ready');
    expect(s.viewModel.packages[0]?.priceString).toBe('$6.99');
  });

  it('marks purchasing unavailable and does not configure when no key is set', async () => {
    adapter.isPurchasesAvailable.mockReturnValue(false);
    await usePurchasesStore.getState().init('user-1');
    expect(adapter.configurePurchases).not.toHaveBeenCalled();
    expect(usePurchasesStore.getState().available).toBe(false);
    expect(usePurchasesStore.getState().status).toBe('ready');
  });
});

describe('purchasesStore.purchase', () => {
  it('purchases the selected package and reports Pro', async () => {
    adapter.purchasePackage.mockResolvedValue(
      outcome({ status: 'purchased', isPro: true }),
    );
    await usePurchasesStore.getState().init('user-1');
    const isPro = await usePurchasesStore.getState().purchase('monthly');
    expect(adapter.purchasePackage).toHaveBeenCalledWith(
      offering.availablePackages[0],
    );
    expect(isPro).toBe(true);
    expect(usePurchasesStore.getState().actionStatus).toBe('purchased');
  });

  it('treats a user cancellation as a calm no-op', async () => {
    adapter.purchasePackage.mockResolvedValue(
      outcome({ status: 'cancelled', isPro: false }),
    );
    await usePurchasesStore.getState().init('user-1');
    await usePurchasesStore.getState().purchase('monthly');
    expect(usePurchasesStore.getState().actionStatus).toBe('cancelled');
    expect(usePurchasesStore.getState().message).toBeNull();
  });

  it('surfaces an error message without throwing', async () => {
    adapter.purchasePackage.mockResolvedValue(
      outcome({
        status: 'error',
        isPro: false,
        message: 'Nothing was charged.',
      }),
    );
    await usePurchasesStore.getState().init('user-1');
    await usePurchasesStore.getState().purchase('monthly');
    expect(usePurchasesStore.getState().actionStatus).toBe('error');
    expect(usePurchasesStore.getState().message).toBe('Nothing was charged.');
  });

  it('refuses an unknown package id', async () => {
    await usePurchasesStore.getState().init('user-1');
    const ok = await usePurchasesStore.getState().purchase('nope');
    expect(ok).toBe(false);
    expect(adapter.purchasePackage).not.toHaveBeenCalled();
  });
});

describe('purchasesStore.restore', () => {
  it('restores a prior purchase', async () => {
    adapter.restorePurchases.mockResolvedValue(
      outcome({ status: 'purchased', isPro: true }),
    );
    const isPro = await usePurchasesStore.getState().restore();
    expect(isPro).toBe(true);
    expect(usePurchasesStore.getState().actionStatus).toBe('purchased');
  });
});
