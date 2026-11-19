import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Body, Caption, Card, SafetyNotice, SectionTitle } from '@/components';
import { supportCopy as copy } from '@/content/support';
import { colors, radii, spacing } from '@/design/tokens';
import { useProfileStore } from '@/features/profile';
import { getSupabaseClient } from '@/lib/supabase';

import {
  fetchResources,
  resourceRegionForCountry,
  type SupportResource,
} from './resourcesService';

const CATEGORY_LABEL: Record<string, string> = {
  crisis: copy.categoryCrisis,
  mental_health: copy.categoryMentalHealth,
  dietitian: copy.categoryDietitian,
  postpartum: copy.categoryPostpartum,
  general: copy.categoryGeneral,
};

function reviewedLabel(reviewedAt: string | null): string | null {
  if (!reviewedAt) return null;
  const date = new Date(reviewedAt);
  if (Number.isNaN(date.getTime())) return null;
  return `${copy.reviewedPrefix} ${date.toLocaleDateString()}`;
}

function ResourceCard({ resource }: { resource: SupportResource }) {
  const reviewed = reviewedLabel(resource.reviewedAt);
  return (
    <Card tone="plain" style={{ gap: spacing.xs }}>
      <SectionTitle>{resource.name}</SectionTitle>
      {resource.description ? <Body>{resource.description}</Body> : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <Caption>
          {CATEGORY_LABEL[resource.category] ?? resource.category}
        </Caption>
        {reviewed ? <Caption>· {reviewed}</Caption> : null}
      </View>
      {/* Contact is shown as selectable text: in-app links are unreliable, so we
          never claim a call/visit happened — the details are always visible. */}
      {resource.contactUrl ? (
        <Caption color="terracotta" selectable>
          {copy.visitAction}: {resource.contactUrl}
        </Caption>
      ) : null}
      {resource.contactPhone ? (
        <Caption color="terracotta" selectable>
          {copy.callAction}: {resource.contactPhone}
        </Caption>
      ) : null}
    </Card>
  );
}

export interface SupportScreenProps {
  /** Test seam: inject resources instead of fetching. */
  initialResources?: SupportResource[] | null;
}

export function SupportScreen({ initialResources }: SupportScreenProps = {}) {
  const countryCode = useProfileStore((s) => s.profile?.country_code);
  const [resources, setResources] = useState<SupportResource[] | null>(
    initialResources ?? null,
  );
  const [loaded, setLoaded] = useState(initialResources !== undefined);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (initialResources !== undefined) return;
    let active = true;
    const region = resourceRegionForCountry(countryCode);
    void fetchResources(getSupabaseClient(), region).then((result) => {
      if (!active) return;
      setLoaded(true);
      if (result === null) {
        setErrored(true);
        setResources([]);
      } else {
        setResources(result);
      }
    });
    return () => {
      active = false;
    };
  }, [countryCode, initialResources]);

  const list = resources ?? [];

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ gap: spacing.xs }}>
        <SectionTitle>{copy.title}</SectionTitle>
        <Caption>{copy.intro}</Caption>
      </View>

      {/* Always-available fallback — keeps support reachable with zero resources. */}
      <Card tone="plain" style={{ gap: spacing.xs }}>
        <SectionTitle>{copy.fallbackTitle}</SectionTitle>
        <Body>{copy.fallbackBody}</Body>
      </Card>

      <SafetyNotice title={copy.emergencyTitle} message={copy.emergencyBody} />

      {errored ? (
        <View
          style={{
            backgroundColor: colors.ivory,
            borderRadius: radii.card,
            borderWidth: 1,
            borderColor: colors.blush,
            padding: spacing.lg,
            gap: spacing.xs,
          }}
        >
          <SectionTitle>{copy.loadErrorTitle}</SectionTitle>
          <Body>{copy.loadErrorBody}</Body>
        </View>
      ) : null}

      {list.length > 0 ? (
        <View style={{ gap: spacing.md }}>
          {list.map((r) => (
            <ResourceCard key={r.id} resource={r} />
          ))}
          <Caption>{copy.reverifyNote}</Caption>
        </View>
      ) : loaded && !errored ? (
        <Card tone="plain" style={{ gap: spacing.xs }}>
          <SectionTitle>{copy.emptyTitle}</SectionTitle>
          <Body>{copy.emptyBody}</Body>
        </Card>
      ) : null}
    </View>
  );
}

export default SupportScreen;
