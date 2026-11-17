import type { AppSupabaseClient } from '@/lib/supabase';

/** One recorded query against the fake client. */
export interface FakeCall {
  table: string;
  op: 'select' | 'insert' | 'delete' | 'update';
  payload?: unknown;
  filters: { method: string; column: string; value: unknown }[];
}

export interface FakeResponse {
  data?: unknown;
  error?: { message: string; code?: string } | null;
}

export interface FakeClientOptions {
  userId?: string;
  /** What `rpc('is_pro')` resolves to. */
  isPro?: boolean;
  /** Decide each query's response; defaults to an empty, successful result. */
  respond?: (call: FakeCall) => FakeResponse;
}

/**
 * A plain-object stand-in for the Supabase client: a chainable, awaitable
 * query builder that records every call so tests can assert on what was sent.
 */
export function makeFakeClient(options: FakeClientOptions = {}) {
  const calls: FakeCall[] = [];
  const respond = options.respond ?? (() => ({ data: [], error: null }));

  function builder(table: string) {
    const call: FakeCall = { table, op: 'select', filters: [] };
    let opSet = false;
    const settle = () => {
      const response = respond(call);
      return { data: response.data ?? null, error: response.error ?? null };
    };
    const chain = {
      select: () => {
        if (!opSet) {
          call.op = 'select';
          opSet = true;
          calls.push(call);
        }
        return chain;
      },
      insert: (payload: unknown) => {
        call.op = 'insert';
        call.payload = payload;
        opSet = true;
        calls.push(call);
        return chain;
      },
      delete: () => {
        call.op = 'delete';
        opSet = true;
        calls.push(call);
        return chain;
      },
      eq: (column: string, value: unknown) => {
        call.filters.push({ method: 'eq', column, value });
        return chain;
      },
      neq: (column: string, value: unknown) => {
        call.filters.push({ method: 'neq', column, value });
        return chain;
      },
      in: (column: string, value: unknown) => {
        call.filters.push({ method: 'in', column, value });
        return chain;
      },
      order: (column: string, value: unknown) => {
        call.filters.push({ method: 'order', column, value });
        return chain;
      },
      single: async () => settle(),
      then: <T>(
        resolve: (value: ReturnType<typeof settle>) => T,
        reject?: (reason: unknown) => T,
      ) => Promise.resolve().then(settle).then(resolve, reject),
    };
    return chain;
  }

  const client = {
    auth: {
      getUser: async () => ({
        data: { user: { id: options.userId ?? 'u1' } },
        error: null,
      }),
    },
    rpc: async () => ({ data: options.isPro ?? false, error: null }),
    from: (table: string) => builder(table),
  } as unknown as AppSupabaseClient;

  return { client, calls };
}

/** The value of a recorded filter, if present. */
export function filterValue(
  call: FakeCall | undefined,
  method: string,
  column: string,
): unknown {
  return call?.filters.find((f) => f.method === method && f.column === column)
    ?.value;
}
