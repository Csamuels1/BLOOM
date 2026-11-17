// Staff web moderation queue (issue #41).
//
// This barrel exports ONLY the platform-resolved screen component. Metro picks
// ModerationQueueScreen.web.tsx on web and ModerationQueueScreen.tsx (a stub) on
// native, so the moderation data layer (moderationService / moderationStore and
// their reads and RPC calls) is bundled for web only. The route imports from
// here; callers that need the data layer import it by its module path directly.
export {
  ModerationQueueScreen,
  type ModerationQueueScreenProps,
} from './ModerationQueueScreen';
