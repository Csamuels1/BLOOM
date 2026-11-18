/**
 * Pure paywall mapping (issue #43).
 *
 * Decoupled from react-native-purchases (no SDK import) so it is typechecked and
 * Jest-tested without the native module. It defines the minimal shapes we read
 * from an Offering and CustomerInfo, maps an offering to a display view model
 * using the store's own localized price strings, and derives Pro from the single
 * 'pro' entitlement. One entitlement maps to every product (monthly, annual, …).
 */

/** The single entitlement that grants Pro, mapped to all Pro products. */
export const PRO_ENTITLEMENT_ID = 'pro';

/** Minimal subset of a RevenueCat StoreProduct we read. */
export interface StoreProductLike {
  identifier: string;
  title?: string;
  priceString: string;
}

/** Minimal subset of a RevenueCat Package we read. */
export interface PackageLike {
  identifier: string;
  packageType: string;
  product: StoreProductLike;
}

/** Minimal subset of a RevenueCat Offering we read. */
export interface OfferingLike {
  availablePackages: PackageLike[];
}

/** Minimal subset of CustomerInfo we read. */
export interface CustomerInfoLike {
  entitlements: { active: Record<string, unknown> };
}

/** Result of a purchase or restore attempt, surfaced to the UI. */
export interface PurchaseOutcome {
  status: 'purchased' | 'cancelled' | 'error';
  isPro: boolean;
  message?: string;
}

export type BillingPeriod = 'monthly' | 'annual' | 'other';

/** A package as the paywall UI shows it, with the store's localized price. */
export interface PaywallPackage {
  id: string;
  productId: string;
  title: string;
  priceString: string;
  period: BillingPeriod;
}

export interface PaywallViewModel {
  packages: PaywallPackage[];
}

function toPeriod(packageType: string): BillingPeriod {
  switch (packageType) {
    case 'MONTHLY':
      return 'monthly';
    case 'ANNUAL':
      return 'annual';
    default:
      return 'other';
  }
}

const PERIOD_ORDER: Record<BillingPeriod, number> = {
  monthly: 0,
  annual: 1,
  other: 2,
};

/**
 * Map an offering to the paywall view model. Prices are the store's own
 * localized `priceString` values (storefront values display), never computed.
 * Returns an empty model when there is no offering.
 */
export function mapOffering(
  offering: OfferingLike | null | undefined,
): PaywallViewModel {
  if (!offering || offering.availablePackages.length === 0) {
    return { packages: [] };
  }
  const packages = offering.availablePackages.map((pkg) => {
    const period = toPeriod(pkg.packageType);
    return {
      id: pkg.identifier,
      productId: pkg.product.identifier,
      title: pkg.product.title ?? pkg.identifier,
      priceString: pkg.product.priceString,
      period,
    };
  });
  packages.sort((a, b) => PERIOD_ORDER[a.period] - PERIOD_ORDER[b.period]);
  return { packages };
}

/** Whether the customer currently holds the Pro entitlement. */
export function isProFromCustomerInfo(
  info: CustomerInfoLike | null | undefined,
): boolean {
  return Boolean(info?.entitlements.active[PRO_ENTITLEMENT_ID]);
}
