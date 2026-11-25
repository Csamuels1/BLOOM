import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Body } from '@/components';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

export interface SettingsLinkProps {
  label: string;
  href: Href;
}

/**
 * A calm, full-width navigation row (48dp target, `link` role). Navigates with
 * `router.navigate` so it renders safely in tests that stub expo-router.
 */
export function SettingsLink({ label, href }: SettingsLinkProps) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => router.navigate(href)}
    >
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
            backgroundColor: colors.ivory,
            opacity: pressed ? 0.85 : 1,
          }}
        >
          <Body style={{ textAlign: 'center' }}>{label}</Body>
        </View>
      )}
    </Pressable>
  );
}

export default SettingsLink;
