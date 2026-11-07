import { Link } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Display, Typography } from '@/components';
import { foundationCopy as copy } from '@/content/foundation';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

export default function WelcomeScreen() {
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
          <Display>{copy.name}</Display>
          <Typography variant="pageTitle">{copy.tagline}</Typography>
          <Body>{copy.introduction}</Body>
          <Body>{copy.notice}</Body>
          <Link href="/foundation" replace={false} asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.explore}
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
                {copy.explore}
              </Body>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
