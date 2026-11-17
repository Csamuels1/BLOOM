import { Pressable, View } from 'react-native';

import {
  Body,
  Button,
  Caption,
  Card,
  Pill,
  PageTitle,
  SectionTitle,
} from '@/components';
import { notificationsCopy as copy } from '@/content/notifications';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

import {
  ALL_WEEKDAYS,
  TIME_PRESETS,
  presetForTime,
  type TimePreset,
  type Weekday,
} from './notificationPrefs';
import { useNotificationStore } from './notificationStore';

/** Short weekday labels (Sunday-first), keyed by the schedule model's weekday. */
const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: copy.daySunday,
  2: copy.dayMonday,
  3: copy.dayTuesday,
  4: copy.dayWednesday,
  5: copy.dayThursday,
  6: copy.dayFriday,
  7: copy.daySaturday,
};

const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  morning: copy.timeMorning,
  midday: copy.timeMidday,
  evening: copy.timeEvening,
};

const TIME_PRESET_ORDER: TimePreset[] = ['morning', 'midday', 'evening'];

/**
 * Privacy-preserving reminder settings (issue #36).
 *
 * The person opts in explicitly; permission is requested only at that moment
 * (contextual) via the store's `enable()`. The delivered text is always generic
 * and lock-screen-safe — this screen never schedules anything containing health
 * data. Disabling is clear and immediate. Denial is handled gently.
 */
export interface NotificationSettingsProps {
  /** Testing seam; ignored at runtime (the store resolves its own helpers). */
  testID?: string;
}

export function NotificationSettings(_props: NotificationSettingsProps = {}) {
  const prefs = useNotificationStore((state) => state.prefs);
  const permission = useNotificationStore((state) => state.permission);
  const hydrated = useNotificationStore((state) => state.hydrated);
  const enable = useNotificationStore((state) => state.enable);
  const disable = useNotificationStore((state) => state.disable);
  const setTime = useNotificationStore((state) => state.setTime);
  const toggleWeekday = useNotificationStore((state) => state.toggleWeekday);

  const enabled = prefs.enabled;
  const selectedPreset = presetForTime(prefs.time);
  // Denied is only worth surfacing after an opt-in attempt that was refused.
  const showDenied = permission === 'denied' && !enabled;

  async function handleToggle() {
    if (enabled) {
      await disable();
    } else {
      await enable();
    }
  }

  if (!hydrated) {
    return (
      <View style={{ gap: spacing.xl }}>
        <PageTitle>{copy.title}</PageTitle>
        <Caption
          color="plum"
          accessibilityLabel={copy.loadingLabel}
          accessibilityRole="progressbar"
        >
          {copy.loadingLabel}
        </Caption>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.xl }}>
      <View style={{ gap: spacing.xs }}>
        <PageTitle>{copy.title}</PageTitle>
        <Body>{copy.intro}</Body>
      </View>

      {/* Primary opt-in. Toggling on requests permission contextually. */}
      <Card>
        <View style={{ gap: spacing.md }}>
          <Pressable
            accessibilityRole="switch"
            accessibilityLabel={copy.toggleLabel}
            accessibilityState={{ checked: enabled }}
            accessibilityHint={enabled ? copy.toggleHintOn : copy.toggleHintOff}
            hitSlop={8}
            onPress={() => void handleToggle()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.md,
              minHeight: minTouchTarget,
            }}
          >
            <SectionTitle style={{ flex: 1 }}>{copy.toggleLabel}</SectionTitle>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={{
                width: 52,
                height: 30,
                borderRadius: radii.pill,
                padding: 3,
                backgroundColor: enabled ? colors.terracotta : colors.mutedSage,
                alignItems: enabled ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: radii.pill,
                  backgroundColor: colors.ivory,
                }}
              />
            </View>
          </Pressable>

          <Caption color="plum" accessibilityLiveRegion="polite">
            {enabled ? copy.toggleHintOn : copy.toggleHintOff}
          </Caption>
        </View>
      </Card>

      {/* Privacy reassurance — reminders never reveal anything personal. */}
      <Card>
        <View style={{ gap: spacing.xs }}>
          <SectionTitle>{copy.privacyTitle}</SectionTitle>
          <Body>{copy.privacyBody}</Body>
        </View>
      </Card>

      {/* Permission was refused: explain gently, never block the rest of the app. */}
      {showDenied ? (
        <Card>
          <View style={{ gap: spacing.xs }}>
            <SectionTitle>{copy.deniedTitle}</SectionTitle>
            <Body>{copy.deniedBody}</Body>
          </View>
        </Card>
      ) : null}

      {/* Schedule configuration — only meaningful once reminders are on. */}
      {enabled ? (
        <View style={{ gap: spacing.lg }}>
          <View style={{ gap: spacing.xs }}>
            <SectionTitle>{copy.scheduleTitle}</SectionTitle>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Caption color="plum">{copy.daysLabel}</Caption>
            <Caption color="plum">{copy.daysHint}</Caption>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              {ALL_WEEKDAYS.map((weekday) => (
                <Pill
                  key={weekday}
                  label={WEEKDAY_LABELS[weekday]}
                  selected={prefs.weekdays.includes(weekday)}
                  onPress={() => void toggleWeekday(weekday)}
                />
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Caption color="plum">{copy.timeLabel}</Caption>
            <Caption color="plum">{copy.timeHint}</Caption>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              {TIME_PRESET_ORDER.map((preset) => (
                <Pill
                  key={preset}
                  label={TIME_PRESET_LABELS[preset]}
                  selected={selectedPreset === preset}
                  onPress={() => void setTime({ ...TIME_PRESETS[preset] })}
                />
              ))}
            </View>
          </View>

          {/* A clear, explicit disable in addition to the toggle. */}
          <Button
            label={copy.disableLabel}
            variant="secondary"
            accessibilityHint={copy.disableHint}
            onPress={() => void disable()}
          />
        </View>
      ) : (
        <Caption color="plum" accessibilityLiveRegion="polite">
          {copy.disabledConfirmation}
        </Caption>
      )}
    </View>
  );
}

export default NotificationSettings;
