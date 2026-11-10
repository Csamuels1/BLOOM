import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues } from 'react-hook-form';
import type { ZodType } from 'zod';

import type { OnboardingDraft } from './schema';
import { useOnboardingStore } from './onboardingStore';

/**
 * Binds a step's React Hook Form (validated by its Zod schema) to the typed
 * onboarding store (issue #12). Fields are seeded from the persisted draft so a
 * resumed step shows prior answers; a valid submit patches the draft and (by
 * default) advances to the next reachable step.
 *
 * The schema's input and output types match (the step schemas use no
 * transforms), so it is typed `ZodType<TValues, TValues>` to satisfy the
 * resolver's `FieldValues` input constraint.
 */
export function useOnboardingForm<
  TValues extends Partial<OnboardingDraft> & FieldValues,
>(schema: ZodType<TValues, TValues>, options: { advance?: boolean } = {}) {
  const patch = useOnboardingStore((state) => state.patch);
  const next = useOnboardingStore((state) => state.next);
  const draft = useOnboardingStore((state) => state.draft);

  const form = useForm<TValues>({
    resolver: zodResolver(schema),
    defaultValues: draft as DefaultValues<TValues>,
  });

  const submit = form.handleSubmit((values) => {
    patch(values);
    if (options.advance !== false) next();
  });

  return { form, submit };
}
