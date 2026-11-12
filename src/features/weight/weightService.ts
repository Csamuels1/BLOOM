import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/** A stored weight measurement row (kilograms are canonical). */
export type WeightEntry =
  Database['public']['Tables']['weight_measurements']['Row'];

/** Discriminated result so callers can branch without try/catch and never lose input. */
export type WeightResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

/** Schema bounds: weight_kg CHECK (> 0 AND < 400). Kept in sync by tests. */
export const MIN_WEIGHT_KG = 0;
export const MAX_WEIGHT_KG = 400;
/** note text CHECK (length <= 500). */
export const MAX_NOTE_LENGTH = 500;

const GENERIC_SAVE_ERROR = 'We could not save your entry just now.';
const GENERIC_LOAD_ERROR = 'We could not load your entries just now.';
const GENERIC_UPDATE_ERROR = 'We could not update your entry just now.';
const GENERIC_DELETE_ERROR = 'We could not remove your entry just now.';

export interface LogWeightInput {
  /** Canonical weight in kilograms. */
  weightKg: number;
  /** ISO date (YYYY-MM-DD). Defaults to the caller's local date when omitted. */
  measuredAt?: string;
  /** Optional free-text note (<= 500 chars). */
  note?: string | null;
}

/** Fields that may be edited on an existing entry. */
export interface UpdateWeightInput {
  weightKg?: number;
  measuredAt?: string;
  note?: string | null;
}

/** The local calendar date as YYYY-MM-DD, with no timezone math. */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Validate a weight in kg against the schema bounds; returns an error message or null. */
export function validateWeightKg(weightKg: number): string | null {
  if (!Number.isFinite(weightKg)) {
    return 'Enter a weight to continue.';
  }
  if (weightKg <= MIN_WEIGHT_KG || weightKg >= MAX_WEIGHT_KG) {
    return 'That weight is outside the range we can record.';
  }
  return null;
}

/** Validate an optional note against the schema length bound. */
function validateNote(note: string | null | undefined): string | null {
  if (note != null && note.length > MAX_NOTE_LENGTH) {
    return 'That note is a little long — please shorten it.';
  }
  return null;
}

/**
 * Create a timestamped weight entry for the signed-in user. The row's user_id is
 * forced to the caller's auth id and RLS confirms ownership on the server;
 * multiple entries per date are allowed (measured_at is a DATE). Returns a
 * discriminated result and never throws on an expected failure, so a caller can
 * keep the user's input and offer a retry.
 */
export async function logWeight(
  client: AppSupabaseClient,
  input: LogWeightInput,
): Promise<WeightResult<WeightEntry>> {
  const invalid = validateWeightKg(input.weightKg) ?? validateNote(input.note);
  if (invalid) {
    return { ok: false, error: invalid };
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  const { data, error } = await client
    .from('weight_measurements')
    .insert({
      user_id: user.id,
      weight_kg: input.weightKg,
      measured_at: input.measuredAt ?? localDateString(),
      note: input.note ?? null,
    })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }
  return { ok: true, value: data };
}

/** List the caller's own entries, most recent measurement first. */
export async function listWeights(
  client: AppSupabaseClient,
): Promise<WeightResult<WeightEntry[]>> {
  const { data, error } = await client
    .from('weight_measurements')
    .select('*')
    .order('measured_at', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }
  return { ok: true, value: data };
}

/**
 * Update fields on one of the caller's entries. RLS scopes the update to the
 * owner. Returns the updated row or a gentle, retryable error.
 */
export async function updateWeight(
  client: AppSupabaseClient,
  id: string,
  patch: UpdateWeightInput,
): Promise<WeightResult<WeightEntry>> {
  if (patch.weightKg !== undefined) {
    const invalid = validateWeightKg(patch.weightKg);
    if (invalid) {
      return { ok: false, error: invalid };
    }
  }
  const noteInvalid = validateNote(patch.note);
  if (noteInvalid) {
    return { ok: false, error: noteInvalid };
  }

  const changes: Database['public']['Tables']['weight_measurements']['Update'] =
    {};
  if (patch.weightKg !== undefined) {
    changes.weight_kg = patch.weightKg;
  }
  if (patch.measuredAt !== undefined) {
    changes.measured_at = patch.measuredAt;
  }
  if (patch.note !== undefined) {
    changes.note = patch.note;
  }

  const { data, error } = await client
    .from('weight_measurements')
    .update(changes)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: GENERIC_UPDATE_ERROR };
  }
  return { ok: true, value: data };
}

/** Delete one of the caller's entries (RLS owner-scoped). */
export async function deleteWeight(
  client: AppSupabaseClient,
  id: string,
): Promise<WeightResult<string>> {
  const { error } = await client
    .from('weight_measurements')
    .delete()
    .eq('id', id);

  if (error) {
    return { ok: false, error: GENERIC_DELETE_ERROR };
  }
  return { ok: true, value: id };
}
