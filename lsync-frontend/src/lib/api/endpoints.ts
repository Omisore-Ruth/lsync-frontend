/**
 * Every backend route the frontend calls lives here, so a path change is a one-line fix.
 *
 * All of these were read from the backend repo (olugbengadamilola2020-web/Lsync_1.0.0) on 19 Nov 2026,
 * except forgotPassword / resetPassword, which the backend does not have yet.
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2005").replace(/\/$/, "");

/**
 * Demo mode: no backend needed. The app serves realistic sample data from the browser's storage so every
 * screen can be clicked through. Set NEXT_PUBLIC_USE_MOCKS=false to talk to the real API.
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "false";

export const endpoints = {
  // --- auth + user ---
  register: "/api/auth/register",
  login: "/api/auth/login",
  me: "/api/users/me",
  profile: "/api/users/me",
  profileUpdate: "/api/users/profile",
  privacy: "/api/users/privacy",

  // --- NOT IN THE BACKEND YET (ask the backend team to add them) ---
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
  githubCommits: (owner: string, repo: string) =>
    `/api/integrations/github/repositories/${owner}/${repo}/commits`,
  githubSync: (owner: string, repo: string) =>
    `/api/integrations/github/repositories/${owner}/${repo}/sync`,
  githubActivities: (page = 1, limit = 20) =>
    `/api/integrations/github/activities?page=${page}&limit=${limit}`,
  portfolio: (username: string) => `/api/portfolio/${encodeURIComponent(username)}`,
} as const;
