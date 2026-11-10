import { type ComponentType } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Caption } from '@/components';
import { onboardingCopy as copy } from '@/content/onboarding';
import { colors, minTouchTarget, spacing } from '@/design/tokens';

import { useOnboardingStore } from './onboardingStore';
import { CycleStep } from './screens/CycleStep';
import { DietaryAllergensStep } from './screens/DietaryAllergensStep';
import { FeedingStep } from './screens/FeedingStep';
import { GoalStep } from './screens/GoalStep';
import { PostpartumMonthsStep } from './screens/PostpartumMonthsStep';
import { PostpartumStep } from './screens/PostpartumStep';
import { PregnancyBoundaryStep } from './screens/PregnancyBoundaryStep';
import { PregnancyStep } from './screens/PregnancyStep';
import { PreviewStep } from './screens/PreviewStep';
import { RegionUnitsStep } from './screens/RegionUnitsStep';
import { StatsStep } from './screens/StatsStep';
import { WelcomeStep } from './screens/WelcomeStep';
import {
  isOptionalStep,
  prevStepId,
  visibleStepIds,
  type OnboardingStepId,
} from './steps';

/**
 * Store-driven onboarding host (issue #13). Renders the component for the
 * current step and the shared chrome (Back + progress). Navigation lives in the
 * store, so this is a single route rather than one route per step. Steps whose
 * screens are not built yet fall back to a placeholder (#14, #15).
 */
// A full record: TypeScript enforces that every onboarding step has a screen.
const STEP_COMPONENTS: Record<OnboardingStepId, ComponentType> = {
  welcome: WelcomeStep,
  goal: GoalStep,
  pregnancy: PregnancyStep,
  'pregnancy-boundary': PregnancyBoundaryStep,
  postpartum: PostpartumStep,
  'postpartum-months': PostpartumMonthsStep,
  feeding: FeedingStep,
  stats: StatsStep,
  'region-units': RegionUnitsStep,
  'dietary-allergens': DietaryAllergensStep,
  cycle: CycleStep,
  preview: PreviewStep,
};

export function OnboardingFlow() {
  const currentStepId = useOnboardingStore((state) => state.currentStepId);
  const draft = useOnboardingStore((state) => state.draft);
  const back = useOnboardingStore((state) => state.back);
  const skip = useOnboardingStore((state) => state.skip);

  const StepComponent = STEP_COMPONENTS[currentStepId];
  const visible = visibleStepIds(draft);
  const position = visible.indexOf(currentStepId) + 1;
  const canGoBack = prevStepId(currentStepId, draft) !== null;
  const canSkip = isOptionalStep(currentStepId);

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
        {canSkip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.skip}
            onPress={() => skip()}
            hitSlop={8}
            style={{ minHeight: minTouchTarget, justifyContent: 'center' }}
          >
            <Body color="terracotta">{copy.skip}</Body>
          </Pressable>
        ) : (
          <View />
        )}
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
