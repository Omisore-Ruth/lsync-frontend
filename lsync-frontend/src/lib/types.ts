/** Domain types the UI works with. The services layer converts backend responses into these. */

export type LearningLog = {
  id: string;
  skill: string;
  platform: string;
  track?: string;
  /** ISO date or date-time. Only the day is used for stats. */
  date: string;
  durationMinutes: number;
};

export type NewLog = {
  skill: string;
  platform: string;
  track?: string;
  /** YYYY-MM-DD */
  date: string;
  durationMinutes: number;
};

export type GithubRepo = {
  fullName: string;
  description?: string;
  language?: string;
  private: boolean;
  fork: boolean;
  stars: number;
  pushedAt?: string;
};

export type GithubActivity = {
  id: string;
  repository: string;
  commitSha: string;
  message: string;
  githubAuthorLogin?: string;
  committedAt: string;
  commitUrl?: string;
  /** "matched" means GitHub associated the commit with the connected account. It is NOT a skill certification. */
  verificationStatus: string;
};

export type SyncResult = {
  repository: string;
  fetched: number;
  inserted: number;
  alreadyExisting: number;
  matched: number;
  unverified: number;
};

export type Pagination = { page: number; limit: number; total: number; pages: number };

/** A platform account the learner has linked by username (the backend stores it under /api/users/accounts). */
export type LinkedAccount = { id: string; source: string; username: string; url?: string };

export type Profile = {
  fullName?: string;
  username?: string;
  email?: string;
  headline?: string;
  about?: string;
  interests: string[];
  isPublic: boolean;
  /** A picture address from the server, when it has one. */
  avatar?: string;
};
