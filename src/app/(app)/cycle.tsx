import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components';
import { cycleCopy } from '@/content/cycle';
import { colors, spacing } from '@/design/tokens';
import { CycleScreen, useTrackingPreference } from '@/features/cycle';

/**
 * Optional cycle logging route (issue #34). Reached from the Today screen. The
 * CycleScreen owns the CRUD, the uncertainty-aware insight, and the disable flow
 * (keep vs delete history); this route wires its on/off state to the profile's
 * `track_cycle` preference. The save reflects server truth and fails visibly:
 * on failure the toggle reverts and a retryable error shows (#54).
 */
export default function CycleRoute() {
  const { tracking, saveError, change, retry } = useTrackingPreference();

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
          {saveError ? (
            <ErrorState
              title={cycleCopy.trackingSaveErrorTitle}
              message={cycleCopy.trackingSaveErrorBody}
              retryLabel={cycleCopy.retry}
              onRetry={() => void retry()}
            />
          ) : null}
          <CycleScreen
            tracking={tracking}
            onTrackingChange={(next) => void change(next)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
