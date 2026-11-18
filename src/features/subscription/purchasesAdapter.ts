import type {
  CustomerInfoLike,
  OfferingLike,
  PurchaseOutcome,
} from './paywall';

/**
 * Purchases adapter — default/web stub (issue #43).
 *
 * react-native-purchases is a native module with no web support, so Metro
 * resolves this stub on web (and anywhere the native file is absent) and
 * purchasesAdapter.native.ts on iOS/Android. Keeping the SDK out of this file
 * means the web bundle never imports it. On web, purchasing is simply
 * unavailable; the paywall shows a "manage on mobile" message instead.
 */

export type { CustomerInfoLike, OfferingLike, PurchaseOutcome };

export function isPurchasesAvailable(): boolean {
  return false;
}

export function configurePurchases(_appUserId: string): void {
  // No-op: no native purchasing on web.
}

export async function getActiveOffering(): Promise<OfferingLike | null> {
  return null;
}

export async function purchasePackage(_pkg: unknown): Promise<PurchaseOutcome> {
  return { status: 'error', isPro: false, message: 'unavailable' };
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  return { status: 'error', isPro: false, message: 'unavailable' };
}
