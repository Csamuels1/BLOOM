import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  ONBOARDING_STORAGE_KEY,
  useOnboardingStore,
} from '@/features/onboarding/onboardingStore';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
  useOnboardingStore.setState({
    draft: {},
    currentStepId: 'welcome',
    hydrated: false,
  });
});

describe('onboarding store', () => {
  it('merges patched fields into the draft', () => {
    useOnboardingStore.getState().patch({ goal: 'loss' });
    useOnboardingStore.getState().patch({ isPregnant: false });
    expect(useOnboardingStore.getState().draft).toEqual({
      goal: 'loss',
      isPregnant: false,
    });
  });

  it('advances and goes back along the conditional path', () => {
    const store = useOnboardingStore.getState();
    store.goTo('pregnancy');
    store.patch({ isPregnant: false });
    store.next();
    expect(useOnboardingStore.getState().currentStepId).toBe('postpartum');
    useOnboardingStore.getState().back();
    expect(useOnboardingStore.getState().currentStepId).toBe('pregnancy');
  });

  it('only skips optional steps', () => {
    const store = useOnboardingStore.getState();
    store.patch({ isPregnant: false, postpartumStatus: 'postpartum' });

    store.goTo('feeding');
    useOnboardingStore.getState().skip();
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');

    // A required step cannot be skipped.
    useOnboardingStore.getState().skip();
    expect(useOnboardingStore.getState().currentStepId).toBe('stats');
  });

  it('resets the draft and returns to the first step', () => {
    const store = useOnboardingStore.getState();
    store.patch({ goal: 'gain' });
    store.goTo('stats');
    useOnboardingStore.getState().reset();
    expect(useOnboardingStore.getState().draft).toEqual({});
    expect(useOnboardingStore.getState().currentStepId).toBe('welcome');
  });

  it('persists the draft and current step locally (resumable, no backend)', async () => {
    useOnboardingStore.getState().patch({ goal: 'maintenance' });
    useOnboardingStore.getState().goTo('pregnancy');
    await flush();

    const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string);
    expect(stored.state.draft).toEqual({ goal: 'maintenance' });
    expect(stored.state.currentStepId).toBe('pregnancy');
  });

  it('resumes a persisted draft on rehydration', async () => {
    await AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        state: { draft: { goal: 'gain' }, currentStepId: 'goal' },
        version: 0,
      }),
    );

    await useOnboardingStore.persist.rehydrate();

    expect(useOnboardingStore.getState().draft.goal).toBe('gain');
    expect(useOnboardingStore.getState().currentStepId).toBe('goal');
    expect(useOnboardingStore.getState().hydrated).toBe(true);
  });
});
