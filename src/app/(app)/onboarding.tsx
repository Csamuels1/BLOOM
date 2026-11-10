import { OnboardingFlow } from '@/features/onboarding';

/**
 * Onboarding route (issue #13). A single route hosts the whole flow; step
 * navigation is driven by the onboarding store, not the router.
 */
export default function OnboardingRoute() {
  return <OnboardingFlow />;
}
