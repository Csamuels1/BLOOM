// Safety guardrails (Phase 11). Conservative, versioned, protective boundaries.
export {
  GUARDRAIL_VERSION,
  SAFE_CALORIE_FLOOR,
  MAX_SAFE_WEEKLY_LOSS_KG,
  applyCalorieFloor,
  evaluateLossPace,
  type FlooredRange,
  type LossPaceResult,
} from './guardrails';
