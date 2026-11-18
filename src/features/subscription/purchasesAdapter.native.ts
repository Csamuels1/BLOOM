import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

import { getEnv } from '@/config/env';

import {
  isProFromCustomerInfo,
  type OfferingLike,
  type PurchaseOutcome,
} from './paywall';

/**
 * Purchases adapter — native implementation (issue #43). Metro resolves this on
 * iOS/Android; the web/default stub (purchasesAdapter.ts) is used elsewhere.
 *
 * Uses the platform-specific public RevenueCat SDK key. The app user id is set
 * to the Supabase user id so webhook events (#44) map to the right mirror row.
 * The entitlement derived here is for immediate UI feedback; the server mirror
 * remains the authority (#45).
 */

export type { OfferingLike, PurchaseOutcome };

let configuredFor: string | null = null;

function apiKey(): string {
  const env = getEnv();
  return Platform.OS === 'ios'
    ? env.revenueCatIosKey
    : env.revenueCatAndroidKey;
}

export function isPurchasesAvailable(): boolean {
  return apiKey().length > 0;
}

export function configurePurchases(appUserId: string): void {
  if (configuredFor === appUserId || !isPurchasesAvailable()) return;
  Purchases.configure({ apiKey: apiKey(), appUserID: appUserId });
  configuredFor = appUserId;
}

export async function getActiveOffering(): Promise<OfferingLike | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: unknown): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(
      pkg as PurchasesPackage,
    );
    return { status: 'purchased', isPro: isProFromCustomerInfo(customerInfo) };
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) {
      return { status: 'cancelled', isPro: false };
    }
    return {
      status: 'error',
      isPro: false,
      message: 'That purchase did not complete. Nothing was charged.',
    };
  }
}

export async function restorePurchases(): Promise<PurchaseOutcome> {
  try {
    const info = await Purchases.restorePurchases();
    return { status: 'purchased', isPro: isProFromCustomerInfo(info) };
  } catch {
    return {
      status: 'error',
      isPro: false,
      message: 'We could not restore purchases just now.',
    };
  }
}
