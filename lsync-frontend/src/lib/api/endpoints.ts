/**
 * Every backend route the frontend calls lives here, so a path change is a one-line fix.
 *
 * All of these were read from the backend repo (olugbengadamilola2020-web/Lsync_1.0.0) on 19 Nov 2026,
 * except forgotPassword / resetPassword, which the backend does not have yet.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2005").replace(/\/$/, "");

/**
 * Demo mode: no backend needed. The app serves realistic sample data from the browser's storage so every
 * screen can be clicked through. Demo is the default: only the exact value "false" switches to the real API, so a missing or mistyped variable can never leave a deployed site pointing at a server that is not there.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS !== "false";

export const endpoints = {
  // --- auth + user ---
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/users/me",
  profile: "/api/users/me",
  profileUpdate: "/api/users/profile",
  privacy: "/api/users/privacy",

  changePassword: "/api/users/password",
  deleteAccount: "/api/users/delete",
  /** Linked platform accounts: POST to link, DELETE .../:id to unlink. They come back inside GET /api/users/me. */
  accounts: "/api/users/accounts",
  account: (id: string) => `/api/users/accounts/${encodeURIComponent(id)}`,
  health: "/api/health",

  // --- password reset (backend team's endpoint list, 20 Nov 2026) ---
  forgotPassword: "/api/auth/forgot-password",
  resetPassword: "/api/auth/reset-password",

  // --- learning data ---
  learningLogs: "/api/logs/log",
  learningLog: (id: string) => `/api/logs/log/${encodeURIComponent(id)}`,
  platforms: "/api/platforms/platform",
  skills: "/api/skills/skill",
  tracks: "/api/tracks/track",

  // --- GitHub ---
  githubConnect: "/api/integrations/github/connect",
  githubRepositories: "/api/integrations/github/repositories",
  /** The backend team's documented form of the repositories call. */
  githubRepositoriesPage: "/api/integrations/github/repositories?page=1&perPage=30",
  githubCommits: (owner: string, repo: string) =>
    `/api/integrations/github/repositories/${owner}/${repo}/commits`,
  githubSync: (owner: string, repo: string) =>
    `/api/integrations/github/repositories/${owner}/${repo}/sync`,
  githubActivities: (page = 1, limit = 20) =>
    `/api/integrations/github/activities?page=${page}&limit=${limit}`,
  portfolio: (username: string) => `/api/portfolio/${encodeURIComponent(username)}`,
} as const;
