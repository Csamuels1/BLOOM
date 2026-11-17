// Voice-sensitive copy for privacy-preserving reminders (issue #36). Covered by
// the prohibited-language test (tests/copy.test.ts once the supervisor wires it
// in) AND by a dedicated non-sensitive-text test in tests/notifications/.
//
// PRIVACY RULE (AGENTS.md): a reminder's title and body are shown on the lock
// screen, so they must NEVER contain health details — no weight, no calories, no
// numbers, no cycle/postpartum specifics. The default reminder text is a gentle,
// generic nudge that reveals nothing about the person using BLOOM.
//
// Voice rules (docs/BRAND_AND_COPY.md, AGENTS.md): warm, pressure-free, never
// shame or body-transformation language. Reminders are an invitation, never a
// demand. Permission is asked only when someone chooses reminders, and turning
// them off is immediate and clearly explained.
export const notificationsCopy = {
  // ---- Lock-screen-safe reminder content (the ONLY strings that ever leave the
  // app and appear on a device's lock screen). Deliberately generic. ----
  reminderTitle: 'BLOOM',
  reminderBody: 'A gentle check-in whenever you’re ready.',

  // ---- Settings screen ----
  title: 'Reminders',
  intro:
    'A soft nudge to check in with yourself, on your terms. Reminders never show anything private — just a gentle hello.',

  // The main opt-in control.
  toggleLabel: 'Gentle reminders',
  toggleHintOff:
    'Off. Turn this on to receive a calm check-in on the days and time you choose.',
  toggleHintOn:
    'On. You can change the days and time below, or turn this off anytime.',

  // Privacy reassurance, shown near the toggle.
  privacyTitle: 'Private by design',
  privacyBody:
    'Reminders only ever say a short, general hello. No weight, no meals, no personal details — nothing private appears on your lock screen.',

  // Schedule configuration.
  scheduleTitle: 'When to check in',
  daysLabel: 'Days',
  daysHint: 'Choose the days you would like a reminder.',
  timeLabel: 'Time of day',
  timeHint: 'Choose roughly when the reminder arrives.',

  // Time-of-day presets (friendly, non-sensitive).
  timeMorning: 'Morning',
  timeMidday: 'Midday',
  timeEvening: 'Evening',

  // Weekday labels (short), Sunday-first to match the schedule model.
  daySunday: 'Sun',
  dayMonday: 'Mon',
  dayTuesday: 'Tue',
  dayWednesday: 'Wed',
  dayThursday: 'Thu',
  dayFriday: 'Fri',
  daySaturday: 'Sat',

  // Clear disable affordance.
  disableLabel: 'Turn reminders off',
  disableHint: 'Stops all reminders right away and cancels anything scheduled.',
  disabledConfirmation: 'Reminders are off. Nothing is scheduled.',

  // Permission states — contextual, never pushy.
  deniedTitle: 'Reminders need notification permission',
  deniedBody:
    'BLOOM does not have permission to send notifications, so reminders stay off. You can allow notifications for BLOOM in your device settings whenever you like.',

  // Gentle states.
  loadingLabel: 'Loading your reminder settings…',

  // A11y / live-region announcements.
  enabledAnnouncement: 'Reminders turned on.',
  disabledAnnouncement: 'Reminders turned off.',
} as const;

export default notificationsCopy;
