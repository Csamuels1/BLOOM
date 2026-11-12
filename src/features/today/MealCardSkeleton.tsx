import { View } from 'react-native';

import { Skeleton } from '@/components';
import { colors, radii, spacing } from '@/design/tokens';

/**
 * Loading placeholder shaped like a MealCard, so the meals area holds its space
 * and settles calmly instead of flashing in. Purely decorative for assistive
 * tech; the meals region announces that it is loading.
 */
export function MealCardSkeleton() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: colors.ivory,
        borderRadius: radii.card,
        borderWidth: 1,
        borderColor: colors.blush,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <Skeleton width="80%" height={18} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="30%" height={12} />
    </View>
  );
}

export default MealCardSkeleton;
