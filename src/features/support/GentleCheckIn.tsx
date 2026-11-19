import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Body, Button, Card, SectionTitle } from '@/components';
import { supportCopy } from '@/content/support';
import { spacing } from '@/design/tokens';
import {
  describeSignal,
  fetchSafetySignals,
  type SafetySignalCode,
} from '@/features/safety';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * A gentle check-in (issue #49). When the server-side engine (#48) returns a
 * concerning-pattern signal for the signed-in user, this shows a calm,
 * non-diagnostic card that points to support. It renders nothing otherwise, and
 * the viewer can dismiss it. It never names a condition — the wording comes from
 * the reviewed signal copy.
 */
export function GentleCheckIn() {
  const [signal, setSignal] = useState<SafetySignalCode | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchSafetySignals(getSupabaseClient()).then((evaluation) => {
      if (!active || !evaluation) return;
      const first = evaluation.signals[0];
      if (first) setSignal(first);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!signal || dismissed) return null;
  const message = describeSignal(signal);

  return (
    <Card style={{ gap: spacing.sm }}>
      <SectionTitle>{message.title}</SectionTitle>
      <Body>{message.body}</Body>
      <Button
        label={supportCopy.checkInCta}
        onPress={() => router.navigate('/support')}
      />
      <Button
        label={supportCopy.checkInDismiss}
        variant="ghost"
        onPress={() => setDismissed(true)}
      />
    </Card>
  );
}

export default GentleCheckIn;
