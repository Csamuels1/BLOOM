import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Button, PageTitle } from '@/components';
import { homeCopy as copy } from '@/content/home';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Authenticated home (issue #9). Only reachable while signed in; proves the
 * protected group renders and that sign-out returns to the auth group via the
 * same session-driven guard.
 */
export default function HomeScreen() {
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <PageTitle>{copy.title}</PageTitle>
          <Body>{copy.body}</Body>

          <Link href="/onboarding" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.startOnboarding}
              style={({ pressed }) => ({
                minHeight: minTouchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radii.button,
                backgroundColor: colors.terracotta,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Body color="ivory" style={{ textAlign: 'center' }}>
                {copy.startOnboarding}
              </Body>
            </Pressable>
          </Link>

          <Link href="/foundation" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.exploreFoundation}
              style={({ pressed }) => ({
                minHeight: minTouchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radii.button,
                backgroundColor: colors.plum,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Body color="ivory" style={{ textAlign: 'center' }}>
                {copy.exploreFoundation}
              </Body>
            </Pressable>
          </Link>

          <Button
            label={copy.signOut}
            variant="secondary"
            onPress={() => {
              void signOut(getSupabaseClient());
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
