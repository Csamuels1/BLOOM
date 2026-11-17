import type { AppSupabaseClient } from '@/lib/supabase';
import type { Database } from '@/types/database';

/** A stored cycle start-date row. `cycle_logs` records START DATES only. */
export type CycleStart = Database['public']['Tables']['cycle_logs']['Row'];

/** Discriminated result so callers branch without try/catch and never lose input. */
export type CycleResult<T> =
  { ok: true; value: T } | { ok: false; error: string };

const GENERIC_SAVE_ERROR = 'We could not save that date just now.';
const GENERIC_LOAD_ERROR = 'We could not load your dates just now.';
const GENERIC_DELETE_ERROR = 'We could not remove that date just now.';
const GENERIC_CLEAR_ERROR = 'We could not clear your dates just now.';
const INVALID_DATE_ERROR = 'Please use the date format YYYY-MM-DD.';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** The local calendar date as YYYY-MM-DD, with no timezone math. */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when the value is a real calendar date in YYYY-MM-DD form. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && localDateString(date) === value;
}

/**
 * Record a cycle start date for the signed-in user. The row's user_id is forced
 * to the caller's auth id and RLS confirms ownership on the server. Starts are
 * unique per user per day (cycle_logs_unique_start); a duplicate returns a
 * gentle, retryable message rather than throwing. Returns a discriminated
 * result so a caller can keep the user's input and offer a retry.
 */
export async function addCycleStart(
  client: AppSupabaseClient,
  startedOn: string,
): Promise<CycleResult<CycleStart>> {
  if (!isValidDateString(startedOn)) {
    return { ok: false, error: INVALID_DATE_ERROR };
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }

  const { data, error } = await client
    .from('cycle_logs')
    .insert({ user_id: user.id, started_on: startedOn })
    .select()
    .single();

  if (error || !data) {
    return { ok: false, error: GENERIC_SAVE_ERROR };
  }
  return { ok: true, value: data };
}

/** List the caller's own start dates, most recent first (RLS owner-scoped). */
export async function listCycleStarts(
  client: AppSupabaseClient,
): Promise<CycleResult<CycleStart[]>> {
  const { data, error } = await client
    .from('cycle_logs')
    .select('*')
    .order('started_on', { ascending: false });

  if (error || !data) {
    return { ok: false, error: GENERIC_LOAD_ERROR };
  }
  return { ok: true, value: data };
}

/** Delete one of the caller's start dates by id (RLS owner-scoped). */
export async function deleteCycleStart(
  client: AppSupabaseClient,
  id: string,
): Promise<CycleResult<string>> {
  const { error } = await client.from('cycle_logs').delete().eq('id', id);

  if (error) {
    return { ok: false, error: GENERIC_DELETE_ERROR };
  }
  return { ok: true, value: id };
}

/**
 * Remove ALL of the caller's cycle history. Used by the disable flow when the
 * person explicitly chooses to delete their dates; RLS scopes the delete to the
 * owner. The user_id filter is forced from the caller's auth id so this can
 * never reach another person's rows.
 */
export async function deleteAllCycleHistory(
  client: AppSupabaseClient,
): Promise<CycleResult<true>> {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();
  if (userError || !user) {
    return { ok: false, error: GENERIC_CLEAR_ERROR };
  }

  const { error } = await client
    .from('cycle_logs')
    .delete()
    .eq('user_id', user.id);

  if (error) {
    return { ok: false, error: GENERIC_CLEAR_ERROR };
  }
  return { ok: true, value: true };
}
