import { useEffect } from 'react';
import { View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  Card,
  EmptyState,
  ErrorState,
  SectionTitle,
} from '@/components';
import { subscriptionCopy as copy } from '@/content/subscription';
import { spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';

import type { BillingPeriod, PaywallPackage } from './paywall';
import { usePurchasesStore } from './purchasesStore';

function periodLabel(period: BillingPeriod): string | null {
  if (period === 'monthly') return copy.paywallPerMonth;
  if (period === 'annual') return copy.paywallPerYear;
  return null;
}

function PackageRow({ pkg }: { pkg: PaywallPackage }) {
  const purchase = usePurchasesStore((s) => s.purchase);
  const actionStatus = usePurchasesStore((s) => s.actionStatus);
  const busy = actionStatus === 'purchasing' || actionStatus === 'restoring';
  const label = periodLabel(pkg.period);

  return (
    <Card tone="plain" style={{ gap: spacing.sm }}>
      <SectionTitle>{pkg.title}</SectionTitle>
      <Body>
        {pkg.priceString}
        {label ? ` ${label}` : ''}
      </Body>
      <Button
        label={busy ? copy.paywallPurchasing : copy.paywallChoose}
        disabled={busy}
        onPress={() => {
          void purchase(pkg.id);
        }}
      />
    </Card>
  );
}

export function PaywallScreen() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const init = usePurchasesStore((s) => s.init);
  const loadOfferings = usePurchasesStore((s) => s.loadOfferings);
  const restore = usePurchasesStore((s) => s.restore);
  const available = usePurchasesStore((s) => s.available);
  const status = usePurchasesStore((s) => s.status);
  const actionStatus = usePurchasesStore((s) => s.actionStatus);
  const message = usePurchasesStore((s) => s.message);
  const viewModel = usePurchasesStore((s) => s.viewModel);

  useEffect(() => {
    if (userId) void init(userId);
  }, [userId, init]);

  if (status === 'loading' || status === 'idle') {
    return (
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.paywallTitle}</SectionTitle>
        <Caption accessibilityLiveRegion="polite">{copy.paywallIntro}</Caption>
      </View>
    );
  }

  if (!available) {
    return (
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.paywallUnavailableTitle}</SectionTitle>
        <Body>{copy.paywallUnavailableBody}</Body>
      </View>
    );
  }

  if (actionStatus === 'purchased') {
    return (
      <View style={{ gap: spacing.md }}>
        <SectionTitle>{copy.paywallPurchasedTitle}</SectionTitle>
        <Body accessibilityLiveRegion="polite">
          {copy.paywallPurchasedBody}
        </Body>
      </View>
    );
  }

  const busy = actionStatus === 'purchasing' || actionStatus === 'restoring';

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <SectionTitle>{copy.paywallTitle}</SectionTitle>
        <Caption>{copy.paywallIntro}</Caption>
      </View>

      {status === 'error' ? (
        <ErrorState
          message={copy.paywallLoadError}
          retryLabel={copy.paywallRetry}
          onRetry={() => void loadOfferings()}
        />
      ) : null}

      {actionStatus === 'cancelled' ? (
        <Caption accessibilityLiveRegion="polite">
          {copy.paywallCancelled}
        </Caption>
      ) : null}
      {actionStatus === 'error' && message ? (
        <Caption color="terracotta" accessibilityLiveRegion="polite">
          {message}
        </Caption>
      ) : null}

      {status === 'ready' && viewModel.packages.length === 0 ? (
        <EmptyState
          title={copy.paywallEmptyTitle}
          body={copy.paywallEmptyBody}
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {viewModel.packages.map((pkg) => (
            <PackageRow key={pkg.id} pkg={pkg} />
          ))}
        </View>
      )}

      {viewModel.packages.length > 0 ? (
        <Button
          label={
            actionStatus === 'restoring'
              ? copy.paywallRestoring
              : copy.paywallRestore
          }
          variant="ghost"
          disabled={busy}
          onPress={() => {
            void restore();
          }}
        />
      ) : null}

      <View style={{ gap: spacing.xs }}>
        <Caption>{copy.paywallManage}</Caption>
        <Caption>{copy.paywallManageHint}</Caption>
      </View>
    </View>
  );
}

export default PaywallScreen;
