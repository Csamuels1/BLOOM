import {
  isProFromCustomerInfo,
  mapOffering,
  PRO_ENTITLEMENT_ID,
  type OfferingLike,
} from '@/features/subscription/paywall';

function pkg(type: string, id: string, price: string, title?: string) {
  return {
    identifier: id,
    packageType: type,
    product: { identifier: `prod_${id}`, title, priceString: price },
  };
}

describe('mapOffering', () => {
  it('returns an empty model for no offering or no packages', () => {
    expect(mapOffering(null).packages).toEqual([]);
    expect(mapOffering({ availablePackages: [] }).packages).toEqual([]);
  });

  it('maps packages, keeps the store price string, and orders monthly before annual', () => {
    const offering: OfferingLike = {
      availablePackages: [
        pkg('ANNUAL', 'annual', '$59.99', 'BLOOM Pro (Annual)'),
        pkg('MONTHLY', 'monthly', '$6.99', 'BLOOM Pro (Monthly)'),
      ],
    };
    const { packages } = mapOffering(offering);
    expect(packages.map((p) => p.period)).toEqual(['monthly', 'annual']);
    expect(packages[0]).toEqual({
      id: 'monthly',
      productId: 'prod_monthly',
      title: 'BLOOM Pro (Monthly)',
      priceString: '$6.99',
      period: 'monthly',
    });
    expect(packages[1]?.priceString).toBe('$59.99');
  });

  it('falls back to the package id when the product has no title', () => {
    const { packages } = mapOffering({
      availablePackages: [pkg('MONTHLY', 'monthly', '$6.99')],
    });
    expect(packages[0]?.title).toBe('monthly');
  });
});

describe('isProFromCustomerInfo', () => {
  it('is true only when the pro entitlement is active', () => {
    expect(
      isProFromCustomerInfo({
        entitlements: { active: { [PRO_ENTITLEMENT_ID]: {} } },
      }),
    ).toBe(true);
    expect(isProFromCustomerInfo({ entitlements: { active: {} } })).toBe(false);
    expect(isProFromCustomerInfo(null)).toBe(false);
  });
});
