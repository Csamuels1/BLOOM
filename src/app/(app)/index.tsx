import { Link, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, SectionTitle } from '@/components';
import { communityCopy } from '@/content/community';
import { cycleCopy } from '@/content/cycle';
import { moderationCopy } from '@/content/moderation';
import { settingsCopy } from '@/content/settings';
import { supportCopy } from '@/content/support';
import { todayCopy } from '@/content/today';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { useProfileStore } from '@/features/profile';
import { GentleCheckIn } from '@/features/support';
import { TodayScreen } from '@/features/today';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Authenticated home (issues #9, #20, #22, #52). The Today screen is the branded
 * daily overview and leads the page. Below it sits a de-emphasized area with the
 * feature links and a single Settings entry; account lifecycle (export, delete,
 * sign out) and privacy controls live in Settings (#52).
 */
export default function HomeScreen() {
  const userId = useAuthStore((state) => state.session?.user.id);
  // Cosmetic gate only: show the staff link to moderators. The moderation route
  // and every action behind it are enforced server-side regardless of this.
  const role = useAuthStore((state) => state.session?.user.app_metadata?.role);
  const isModerator = role === 'moderator' || role === 'admin';

  const loadProfile = useProfileStore((state) => state.load);
  const profileStatus = useProfileStore((state) => state.status);

  // Load the profile once so the Today overview can tailor meals to the region.
  useEffect(() => {
    if (userId && profileStatus === 'idle') {
      void loadProfile(getSupabaseClient());
    }
  }, [userId, profileStatus, loadProfile]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            gap: spacing.xxl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          {/* A gentle, non-diagnostic check-in surfaces here only when the
              server-side engine (#48) flags a concerning pattern. */}
          <GentleCheckIn />

          <TodayScreen
            onRetryProfile={() => void loadProfile(getSupabaseClient())}
          />

          {/* De-emphasized account area — the daily overview comes first. */}
          <View style={{ gap: spacing.md }}>
            <SectionTitle>{todayCopy.accountTitle}</SectionTitle>
            <HomeLink href="/community" label={communityCopy.title} />
            <HomeLink href="/cycle" label={cycleCopy.title} />
            {/* Safety (#49): support stays one tap from Home, independent of
                whether a check-in is showing. Do not move this into Settings. */}
            <HomeLink href="/support" label={supportCopy.title} />
            <HomeLink href="/settings" label={settingsCopy.homeLink} />
            {isModerator ? (
              <HomeLink href="/moderation" label={moderationCopy.title} />
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeLink({ href, label }: { href: Href; label: string }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={label}>
        {/* Visual on a plain View, not the style function (#146). */}
        {({ pressed }) => (
          <View
            style={{
              minHeight: minTouchTarget,
              justifyContent: 'center',
              paddingHorizontal: spacing.xl,
              paddingVertical: spacing.md,
              borderRadius: radii.button,
              borderWidth: 1,
              borderColor: colors.mutedSage,
              opacity: pressed ? 0.85 : 1,
            }}
          >
            <Body style={{ textAlign: 'center' }}>{label}</Body>
          </View>
        )}
      </Pressable>
    </Link>
  );
}
