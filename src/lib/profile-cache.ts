import { getProfile } from "@/lib/data";
import type { UserProfile } from "@/lib/types";

let cached: UserProfile | null = null;
let pending: Promise<UserProfile> | null = null;

/** Drop the shared profile so the next read hits the server once. */
export function clearProfileCache() {
  cached = null;
  pending = null;
}

/**
 * One in-flight profile read for the whole page. Later callers reuse the
 * same promise, then the cached result, instead of each component fetching.
 */
export function fetchProfileShared(force = false): Promise<UserProfile> {
  if (!force && cached) return Promise.resolve(cached);
  if (!force && pending) return pending;
  const request = getProfile()
    .then((profile) => {
      cached = profile;
      return profile;
    })
    .finally(() => {
      if (pending === request) pending = null;
    });
  pending = request;
  return request;
}
