"use client";
import { useSyncExternalStore } from "react";
import { useVerba } from "@/store/verba";

const subscribe = (cb: () => void) => useVerba.persist.onFinishHydration(cb);

/** True once the persisted store has been read from this device (avoids SSR mismatches). */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => useVerba.persist.hasHydrated(), () => false);
}
