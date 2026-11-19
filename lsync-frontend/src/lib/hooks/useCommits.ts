"use client";

import { githubConnected, listGithubActivities } from "@/lib/api/services";
import { useAsync } from "./useAsync";
import type { GithubActivity } from "@/lib/types";

/**
 * Synced GitHub commits, or an empty list if GitHub isn't connected or the call fails.
 * GitHub is optional, so a failure here must never break a page that also shows learning logs.
 */
export function useCommits() {
  return useAsync<GithubActivity[]>(async () => {
    try {
      if (!(await githubConnected())) return [];
      return (await listGithubActivities(1, 100)).items;
    } catch {
      return [];
    }
  });
}
