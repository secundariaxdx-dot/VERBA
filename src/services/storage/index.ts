/**
 * Persistence layer.
 *
 * Phase 1–3: everything is stored on this device (localStorage), no account
 * needed and nothing leaves the browser except optional AI requests.
 *
 * Phase 4 (cloud): implement `createCloudStorage` against Supabase using the
 * schema in supabase/schema.sql (one JSON document per user, row-level
 * security on auth.uid()). The zustand store only depends on this interface,
 * so swapping the adapter is the only change needed.
 */
export interface KeyValueStorage {
  getItem(name: string): string | null | Promise<string | null>;
  setItem(name: string, value: string): void | Promise<void>;
  removeItem(name: string): void | Promise<void>;
}

const memory = new Map<string, string>();

export const localAdapter: KeyValueStorage = {
  getItem(name) {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem(name, value) {
    try {
      window.localStorage.setItem(name, value);
    } catch {
      memory.set(name, value);
    }
  },
  removeItem(name) {
    try {
      window.localStorage.removeItem(name);
    } catch {
      memory.delete(name);
    }
  },
};

export function createCloudStorage(): KeyValueStorage {
  throw new Error("Cloud sync is not configured yet. See supabase/schema.sql and the README (Phase 4).");
}

export const storage: KeyValueStorage = localAdapter;
