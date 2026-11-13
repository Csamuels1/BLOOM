import type {
  CandidateMeal,
  MealRegion,
  MealSlot,
} from '@/features/recommendations';

/**
 * Deterministic fixtures for the recommendation engine tests. The matrix helper
 * generates a large, varied candidate set for the allergen-safety property test.
 */

export const REGIONS: readonly MealRegion[] = [
  'nigeria',
  'united_states',
  'both',
];
export const SLOTS: readonly MealSlot[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
];
export const GOALS = ['loss', 'maintenance', 'gain'] as const;
export const ALLERGEN_POOL = [
  'peanut',
  'milk',
  'egg',
  'gluten',
  'fish',
  'shellfish',
  'soy',
] as const;

/** A small, hand-authored, varied catalog used by behavioural tests. */
export const CANDIDATES: readonly CandidateMeal[] = [
  {
    id: 'ng-b1',
    name: 'Pap with akara',
    region: 'nigeria',
    goals: ['loss', 'maintenance'],
    slot: 'breakfast',
    allergens: ['gluten'],
    dietary_tags: ['vegetarian'],
    calories_min: 300,
    calories_max: 420,
  },
  {
    id: 'ng-b2',
    name: 'Moi moi and custard',
    region: 'nigeria',
    goals: ['maintenance', 'gain'],
    slot: 'breakfast',
    allergens: [],
    dietary_tags: ['vegetarian', 'dairy-free'],
    calories_min: 380,
    calories_max: 520,
  },
  {
    id: 'ng-l1',
    name: 'Jollof rice with grilled chicken',
    region: 'nigeria',
    goals: ['maintenance', 'gain'],
    slot: 'lunch',
    allergens: [],
    dietary_tags: ['high-protein'],
    calories_min: 550,
    calories_max: 700,
  },
  {
    id: 'ng-l2',
    name: 'Egusi soup with pounded yam',
    region: 'nigeria',
    goals: ['gain'],
    slot: 'lunch',
    allergens: ['fish'],
    dietary_tags: [],
    calories_min: 650,
    calories_max: 820,
  },
  {
    id: 'us-b1',
    name: 'Oatmeal with berries and nut butter',
    region: 'united_states',
    goals: ['loss', 'maintenance'],
    slot: 'breakfast',
    allergens: ['peanut', 'milk'],
    dietary_tags: ['vegetarian'],
    calories_min: 350,
    calories_max: 450,
  },
  {
    id: 'us-l1',
    name: 'Grilled chicken salad with beans',
    region: 'united_states',
    goals: ['loss', 'maintenance'],
    slot: 'lunch',
    allergens: [],
    dietary_tags: ['high-protein', 'dairy-free'],
    calories_min: 420,
    calories_max: 560,
  },
  {
    id: 'both-s1',
    name: 'Sliced fruit and yoghurt',
    region: 'both',
    goals: ['loss', 'maintenance', 'gain'],
    slot: 'snack',
    allergens: ['milk'],
    dietary_tags: ['vegetarian'],
    calories_min: 120,
    calories_max: 220,
  },
  {
    id: 'both-s2',
    name: 'Groundnuts and banana',
    region: 'both',
    goals: ['maintenance', 'gain'],
    slot: 'snack',
    allergens: ['peanut'],
    dietary_tags: ['vegan', 'dairy-free'],
    calories_min: 180,
    calories_max: 280,
  },
  {
    id: 'both-d1',
    name: 'Baked fish with rice and vegetables',
    region: 'both',
    goals: ['loss', 'maintenance', 'gain'],
    slot: 'dinner',
    allergens: ['fish'],
    dietary_tags: ['high-protein'],
    calories_min: 500,
    calories_max: 650,
  },
  {
    id: 'both-d2',
    name: 'Bean stew with plantain',
    region: 'both',
    goals: ['loss', 'maintenance'],
    slot: 'dinner',
    allergens: [],
    dietary_tags: ['vegan', 'dairy-free'],
    calories_min: 450,
    calories_max: 600,
  },
];

/**
 * Deterministically generate a large matrix of candidates. Allergen sets are
 * derived from each meal's index so the catalog is varied but reproducible.
 */
export function buildMatrixCandidates(): CandidateMeal[] {
  const meals: CandidateMeal[] = [];
  let n = 0;
  for (const region of REGIONS) {
    for (const slot of SLOTS) {
      for (let variant = 0; variant < 4; variant += 1) {
        // Pick 0-3 allergens deterministically from the pool.
        const allergens: string[] = [];
        for (let a = 0; a < ALLERGEN_POOL.length; a += 1) {
          if ((n >> a) % 2 === 1) {
            const item = ALLERGEN_POOL[a];
            if (item !== undefined) {
              allergens.push(item);
            }
          }
        }
        const goal = GOALS[n % GOALS.length] ?? 'maintenance';
        meals.push({
          // Zero-padded id keeps ascending string sort meaningful.
          id: `m-${String(n).padStart(4, '0')}`,
          name: `Meal ${n}`,
          region,
          goals: [goal],
          slot,
          allergens,
          dietary_tags: variant % 2 === 0 ? ['vegetarian'] : [],
          calories_min: 200 + (n % 5) * 50,
          calories_max: 400 + (n % 5) * 50,
        });
        n += 1;
      }
    }
  }
  return meals;
}
