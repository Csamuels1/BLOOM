import { type ComponentType } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Caption } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { colors, minTouchTarget, spacing } from '@/design/tokens';

import { useOnboardingStore } from './onboardingStore';
import { GoalStep } from './screens/GoalStep';
import { PlaceholderStep } from './screens/PlaceholderStep';
import { WelcomeStep } from './screens/WelcomeStep';
import { prevStepId, visibleStepIds, type OnboardingStepId } from './steps';

/**
 * Store-driven onboarding host (issue #13). Renders the component for the
 * current step and the shared chrome (Back + progress). Navigation lives in the
 * store, so this is a single route rather than one route per step. Steps whose
 * screens are not built yet fall back to a placeholder (#14, #15).
 */
const STEP_COMPONENTS: Partial<Record<OnboardingStepId, ComponentType>> = {
  welcome: WelcomeStep,
  goal: GoalStep,
};

export function OnboardingFlow() {
  const currentStepId = useOnboardingStore((state) => state.currentStepId);
  const draft = useOnboardingStore((state) => state.draft);
  const back = useOnboardingStore((state) => state.back);

  const StepComponent = STEP_COMPONENTS[currentStepId] ?? PlaceholderStep;
  const visible = visibleStepIds(draft);
  const position = visible.indexOf(currentStepId) + 1;
  const canGoBack = prevStepId(currentStepId, draft) !== null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: minTouchTarget,
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
        }}
      >
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.back}
            onPress={() => back()}
            hitSlop={8}
            style={{ minHeight: minTouchTarget, justifyContent: 'center' }}
          >
            <Body color="terracotta">{copy.back}</Body>
          </Pressable>
        ) : (
          <View />
        )}
        <Caption>{copy.stepProgress(position, visible.length)}</Caption>
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            padding: spacing.xl,
            maxWidth: 480,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <StepComponent />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default OnboardingFlow;
