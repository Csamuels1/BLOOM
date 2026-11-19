// First-party, privacy-preserving telemetry (issue #53, ADR-0014).
export {
  buildCrashPayload,
  reportCrash,
  installGlobalCrashHandler,
  CRASH_PAYLOAD_KEYS,
  MAX_REPORTS_PER_SESSION,
  type CrashPayload,
  type CrashPlatform,
} from './crashReporter';
export {
  track,
  isAnalyticsEvent,
  ANALYTICS_EVENTS,
  type AnalyticsEvent,
} from './analytics';
export { scrubMessage, scrubStack, safeErrorName, LIMITS } from './scrub';
