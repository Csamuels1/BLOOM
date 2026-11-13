/**
 * Shared types for the deterministic recommendation engine (issue #31).
 *
 * This is a PURE logic engine: no database, no network, no React. The caller
 * supplies the candidate meals it wants considered. In production the caller
 * passes only approved, active meals (review_status = 'approved', is_active) —
 * the engine does NOT care about review status; it simply filters and selects
 * from the candidates it is given.
 */

/** Region vocabulary, mirroring the `meals.region` check in the DB. */
export type MealRegion = 'nigeria' | 'united_states' | 'both';

/** Goal vocabulary (loss, maintenance, gain are equal goals — AGENTS.md). */
export type MealGoal = 'loss' | 'maintenance' | 'gain';

/** Meal slot vocabulary, mirroring the `meals.slot` check in the DB. */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * A candidate meal the caller passes to the engine. Mirrors the shape of a
 * `public.meals` row (the fields the engine needs). Arrays are readonly so the
 * engine never mutates the caller's data.
 */
export interface CandidateMeal {
  readonly id: string;
  readonly name: string;
  readonly region: MealRegion;
  /** Subset of goals this meal supports. */
  readonly goals: readonly string[];
  readonly slot: MealSlot;
  /** Allergens present in the meal. The safety gate excludes these. */
  readonly allergens: readonly string[];
  readonly dietary_tags: readonly string[];
  readonly calories_min: number;
  readonly calories_max: number;
}

/** Inclusive calorie range used to filter candidates by overlap. */
export interface CalorieRange {
  readonly min: number;
  readonly max: number;
}

/**
 * The approved inputs that drive deterministic selection. Every field here
 * affects which candidates are eligible.
 */
export interface RecommendationCriteria {
  /** The person's region. A meal matches when its region is this or 'both'. */
  readonly region: MealRegion;
  readonly goal: MealGoal;
  /**
   * Allergens to avoid. SAFETY-CRITICAL: a meal containing any of these is
   * never selected or offered as a swap.
   */
  readonly avoidAllergens: readonly string[];
  /** Optional: every tag listed must be present on the meal. */
  readonly dietaryTags?: readonly string[];
  /** Optional: the meal's calorie range must overlap this range. */
  readonly calorieRange?: CalorieRange;
}

/** A single selected meal with its explainable reasons. */
export interface SelectedMeal {
  readonly mealId: string;
  readonly name: string;
  /** Non-empty, human-readable reasons for the pick (explainability). */
  readonly reasons: readonly string[];
}

/** One slot within a planned day: either a pick, or an explicit gap. */
export interface PlanSlot {
  readonly slot: MealSlot;
  /** The chosen meal, or null when no safe candidate exists for this slot. */
  readonly meal: SelectedMeal | null;
  /** A plain explanation when `meal` is null; null when a meal was chosen. */
  readonly gap: string | null;
}

/** One day of the plan. */
export interface PlanDay {
  /** 1-based day number. */
  readonly day: number;
  readonly slots: readonly PlanSlot[];
}

/** The full deterministic plan. */
export interface RecommendationPlan {
  readonly days: readonly PlanDay[];
}

/** Options describing the plan window. */
export interface PlanOptions {
  /** Number of days to plan (>= 1). */
  readonly days: number;
  /** Slots to fill for each day, in the order given. */
  readonly slots: readonly MealSlot[];
}

/** Options for a swap request. */
export interface SwapOptions {
  readonly slot: MealSlot;
  /** Meal ids to exclude (e.g. already used elsewhere in the plan). */
  readonly excludeIds?: readonly string[];
}

/** The result of a swap: an alternative, or null with a reason. */
export interface SwapResult {
  readonly meal: SelectedMeal | null;
  /** Null when a meal was found; a plain reason when none fits. */
  readonly reason: string | null;
}
