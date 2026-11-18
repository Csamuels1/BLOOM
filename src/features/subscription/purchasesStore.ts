import { create } from 'zustand';

import {
  configurePurchases,
  getActiveOffering,
  isPurchasesAvailable,
  purchasePackage,
  restorePurchases,
} from './purchasesAdapter';
import {
  mapOffering,
  type OfferingLike,
  type PaywallViewModel,
} from './paywall';

/**
 * Paywall / purchasing state (issue #43).
 *
 * Wraps the platform purchases adapter so the UI stays declarative. The server
 * mirror (#44/#45) is the authority on entitlement; a successful purchase here
 * updates the UI immediately, and useEntitlementSync re-reads the server row.
 */

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type ActionStatus =
  'idle' | 'purchasing' | 'restoring' | 'purchased' | 'cancelled' | 'error';

interface PurchasesState {
  available: boolean;
  offering: OfferingLike | null;
  viewModel: PaywallViewModel;
  status: LoadStatus;
  actionStatus: ActionStatus;
  message: string | null;

  /** Configure the SDK for this user and load offerings. */
  init: (appUserId: string) => Promise<void>;
  loadOfferings: () => Promise<void>;
  purchase: (packageId: string) => Promise<boolean>;
  restore: () => Promise<boolean>;
  clearMessage: () => void;
  clear: () => void;
}

const EMPTY = {
  offering: null as OfferingLike | null,
  viewModel: { packages: [] } as PaywallViewModel,
  status: 'idle' as LoadStatus,
  actionStatus: 'idle' as ActionStatus,
  message: null as string | null,
};

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  available: false,
  ...EMPTY,

  init: async (appUserId) => {
    const available = isPurchasesAvailable();
    set({ available });
    if (!available) {
      set({ status: 'ready' });
      return;
    }
    configurePurchases(appUserId);
    await get().loadOfferings();
  },

  loadOfferings: async () => {
    set({ status: 'loading', message: null });
    try {
      const offering = await getActiveOffering();
      set({ offering, viewModel: mapOffering(offering), status: 'ready' });
    } catch {
      set({ status: 'error', message: 'We could not load plans just now.' });
    }
  },

  purchase: async (packageId) => {
    const offering = get().offering;
    const pkg = offering?.availablePackages.find(
      (p) => p.identifier === packageId,
    );
    if (!pkg) {
      set({ actionStatus: 'error', message: 'That plan is unavailable.' });
      return false;
    }
    set({ actionStatus: 'purchasing', message: null });
    const outcome = await purchasePackage(pkg);
    if (outcome.status === 'purchased') {
      set({ actionStatus: 'purchased', message: null });
      return outcome.isPro;
    }
    if (outcome.status === 'cancelled') {
      set({ actionStatus: 'cancelled', message: null });
      return false;
    }
    set({ actionStatus: 'error', message: outcome.message ?? null });
    return false;
  },

  restore: async () => {
    set({ actionStatus: 'restoring', message: null });
    const outcome = await restorePurchases();
    if (outcome.status === 'purchased') {
      set({ actionStatus: 'purchased', message: null });
      return outcome.isPro;
    }
    set({
      actionStatus: outcome.status === 'cancelled' ? 'cancelled' : 'error',
      message: outcome.message ?? null,
    });
    return false;
  },

  clearMessage: () => set({ message: null }),
  clear: () => set({ ...EMPTY }),
}));
