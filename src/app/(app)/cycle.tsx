import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/design/tokens';
import { useAuthStore } from '@/features/auth';
import { CycleScreen } from '@/features/cycle';
import { useProfileStore } from '@/features/profile';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Optional cycle logging route (issue #34). Reached from the Today screen. The
 * CycleScreen owns the CRUD, the uncertainty-aware insight, and the disable flow
 * (keep vs delete history); this route wires its on/off state to the profile's
 * `track_cycle` preference.
 */
export default function CycleRoute() {
  const profile = useProfileStore((state) => state.profile);
  const setProfile = useProfileStore((state) => state.setProfile);
  const userId = useAuthStore((state) => state.session?.user.id);
  const [tracking, setTracking] = useState(profile?.track_cycle ?? true);

  const onTrackingChange = async (next: boolean) => {
    setTracking(next);
    if (!userId) return;
    const { error } = await getSupabaseClient()
      .from('profiles')
      .update({ track_cycle: next })
      .eq('id', userId);
    if (!error && profile) {
      setProfile({ ...profile, track_cycle: next });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <CycleScreen
            tracking={tracking}
            onTrackingChange={onTrackingChange}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
