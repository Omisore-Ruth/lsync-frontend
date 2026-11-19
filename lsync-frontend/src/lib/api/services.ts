/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * The only place that knows the backend's response and request shapes for learning logs, GitHub and profile.
 * Written against the real backend code (Lsync_1.0.0 repo, read 19 Nov 2026). Demo mode (USE_MOCKS) keeps simpler shapes.
 */
import { api, ApiError } from "./client";
import { endpoints, USE_MOCKS } from "./endpoints";
import type { GithubActivity, GithubRepo, LearningLog, NewLog, Pagination, Profile, SyncResult } from "@/lib/types";

const nameOf = (v: any): string => (typeof v === "string" ? v : (v?.name ?? v?.title ?? ""));

function listOf(data: any, keys: string[]): any[] {
  if (Array.isArray(data)) return data;
  for (const k of keys) if (Array.isArray(data?.[k])) return data[k];
  for (const k of keys) if (Array.isArray(data?.data?.[k])) return data.data[k];
  return [];
}

/* ---------- learning logs ---------- */

function toLog(r: any): LearningLog {
  return {
    id: String(r.id ?? r._id),
    skill: nameOf(r.skill) || nameOf(r.title) || "Untitled skill",
    platform: nameOf(r.platform) || "Other",
    track: nameOf(r.track) || undefined,
    date: String(r.date ?? r.createdAt ?? ""),
    durationMinutes: Number(r.durationMinutes ?? 0),
  };
}

const idOf = (d: any): string | undefined => {
  const r = d?.data ?? d;
  const v = r?._id ?? r?.id;
  return v ? String(v) : undefined;
};

/** The form's platform names -> the backend's platform "type" values. */
const PLATFORM_TYPE: Record<string, string> = { GitHub: "GitHub", YouTube: "YouTube", Coursera: "Coursera", Udemy: "Udemy", edX: "edX", "Blogs and docs": "Blogs", Other: "Other" };
/** A sensible activity type for the backend's "type" field. */
const LOG_TYPE: Record<string, string> = { GitHub: "Coding", YouTube: "Video", Coursera: "Video", Udemy: "Video", edX: "Video", "Blogs and docs": "Reading" };

/** The backend stores platforms per learner, one per type. Find the learner's, or create it. Returns its id. */
async function platformId(name: string, existing: any[]): Promise<string> {
  const type = PLATFORM_TYPE[name] ?? "Other";
  const byName = existing.find((p) => String(p.name).toLowerCase() === name.toLowerCase());
  if (byName) return String(byName._id ?? byName.id);
  const sameType = () => {
    const f = existing.find((p) => p.type === type);
    return f ? String(f._id ?? f.id) : undefined;
  };
  const create = async (t: string) => idOf(await api(endpoints.platforms, { method: "POST", body: { name, type: t } }));
  try {
    const id = await create(type);
    if (id) return id;
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      const f = sameType();
      if (f) return f;
    }
    // The backend's validator spells YouTube as "Youtube" but its database model as "YouTube", so YouTube is rejected. Fall back to "Other".
    if (!(e instanceof ApiError && e.status === 400 && type === "YouTube")) throw e;
  }
  try {
    const id = await create("Other");
    if (id) return id;
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      const f = existing.find((p) => p.type === "Other");
      if (f) return String(f._id ?? f.id);
    }
    throw e;
  }
  throw new ApiError("We couldn't save that platform. Please try again.", 0);
}

export async function listLogs(): Promise<LearningLog[]> {
  const data = await api(endpoints.learningLogs);
  return listOf(data, ["data", "logs", "learningLogs", "items"]).map(toLog).filter((l) => l.date && l.durationMinutes > 0);
}

export async function createLog(input: NewLog): Promise<void> {
  if (USE_MOCKS) {
    await api(endpoints.learningLogs, { method: "POST", body: { skill: input.skill, platform: input.platform, track: input.track || undefined, date: input.date, durationMinutes: input.durationMinutes } });
    return;
  }
  // The real API stores skill / platform / track as ids, so look them up (or create them) first.
  const [skill, platforms, tracks] = await Promise.all([
    api(endpoints.skills, { method: "POST", body: { name: input.skill } }),
    api(endpoints.platforms),
    input.track ? api(endpoints.tracks, { auth: false }) : Promise.resolve(null),
  ]);
  const skillRef = idOf(skill);
  const platformRef = await platformId(input.platform, listOf(platforms, ["data"]));
  const trackRef = input.track
    ? idOf(listOf(tracks, ["data"]).find((t) => String(t.name).toLowerCase() === input.track!.toLowerCase()))
    : undefined; // Tracks are shared and curated, so an unknown name is skipped rather than created.
  await api(endpoints.learningLogs, {
    method: "POST",
    body: {
      title: `${input.skill} (${input.platform})`,
      durationMinutes: input.durationMinutes,
      type: LOG_TYPE[input.platform],
      date: input.date,
      skill: skillRef,
      platform: platformRef,
      track: trackRef,
    },
  });
}

export async function deleteLog(id: string): Promise<void> {
  await api(endpoints.learningLog(id), { method: "DELETE" });
}

/* ---------- GitHub (confirmed routes) ---------- */

/** Connected if the repositories call succeeds. A 4xx means "not connected yet". Network errors still throw. */
export async function githubConnected(): Promise<boolean> {
  try {
    await api(endpoints.githubRepositories, { quiet401: true });
    return true;
  } catch (e) {
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) return false;
    throw e;
  }
}

/** Returns the GitHub authorization URL. The caller sends the browser there. */
export async function startGithubConnect(): Promise<string> {
  const data: any = await api(endpoints.githubConnect);
  const url = data?.authorizationUrl ?? data?.data?.authorizationUrl;
  if (typeof url !== "string") throw new ApiError("The server didn't return a GitHub link. Please try again.", 200, data);
  return url;
}

export async function listGithubRepos(): Promise<GithubRepo[]> {
  const data = await api(endpoints.githubRepositories);
  return listOf(data, ["data", "repositories", "repos", "items"]).map((r: any) => ({
    fullName: String(r.fullName ?? r.full_name ?? r.name),
    description: r.description ?? undefined,
    language: r.language ?? undefined,
    private: Boolean(r.private),
    fork: Boolean(r.fork),
    stars: Number(r.stars ?? r.stargazers_count ?? 0),
    pushedAt: r.pushedAt ?? r.pushed_at ?? undefined,
  }));
}

export async function syncGithubRepo(fullName: string): Promise<SyncResult> {
  const [owner, repo] = fullName.split("/");
  const d: any = await api(endpoints.githubSync(owner, repo), { method: "POST" });
  return {
    repository: d.repository ?? fullName,
    fetched: Number(d.fetched ?? 0),
    inserted: Number(d.inserted ?? 0),
    alreadyExisting: Number(d.alreadyExisting ?? 0),
    matched: Number(d.verification?.matched ?? 0),
    unverified: Number(d.verification?.unverified ?? 0),
  };
}

export async function listGithubActivities(page = 1, limit = 100): Promise<{ items: GithubActivity[]; pagination: Pagination }> {
  const d: any = await api(endpoints.githubActivities(page, limit));
  const items = listOf(d, ["data", "activities", "items"]).map(
    (r: any): GithubActivity => ({
      id: String(r.id ?? r._id ?? r.commitSha),
      repository: String(r.repository ?? ""),
      commitSha: String(r.commitSha ?? r.sha ?? ""),
      message: String(r.message ?? ""),
      githubAuthorLogin: r.githubAuthorLogin ?? undefined,
      committedAt: String(r.committedAt ?? r.date ?? ""),
      commitUrl: r.commitUrl ?? undefined,
      verificationStatus: String(r.verificationStatus ?? "pending"),
    }),
  );
  const p = d?.pagination ?? d?.data?.pagination ?? {};
  return { items, pagination: { page: Number(p.page ?? page), limit: Number(p.limit ?? limit), total: Number(p.total ?? items.length), pages: Number(p.pages ?? p.totalPages ?? 1) } };
}

/* ---------- profile ---------- */

const clean = (v: unknown): string => String(v ?? "").trim(); // the backend's empty defaults are a single space

function toProfile(d: any): Profile {
  const r = d?.data ?? d?.user ?? d ?? {};
  return {
    fullName: r.fullName ?? r.name,
    username: r.username,
    email: r.email,
    headline: clean(r.headline ?? r.currentRole),
    about: clean(r.about ?? r.bio),
    interests: Array.isArray(r.interests) ? r.interests.map(String) : [],
    isPublic: r.isPublic === undefined ? false : Boolean(r.isPublic),
  };
}

export async function getProfile(): Promise<Profile> {
  return toProfile(await api(endpoints.profile));
}

/**
 * Real backend: PUT /api/users/profile accepts name, username, bio, avatar and track; PUT /api/users/privacy accepts isPublic.
 * It has no field for headline or interests yet, so those two are not saved there (ask the backend team to add them).
 */
export async function saveProfile(patch: Partial<Omit<Profile, "email" | "username">>): Promise<Profile> {
  if (USE_MOCKS) return toProfile(await api(endpoints.profile, { method: "PATCH", body: patch }));
  const body: Record<string, unknown> = {};
  if (patch.fullName !== undefined) body.name = patch.fullName;
  if (patch.about !== undefined) body.bio = patch.about;
  if (Object.keys(body).length) await api(endpoints.profileUpdate, { method: "PUT", body });
  if (patch.isPublic !== undefined) await api(endpoints.privacy, { method: "PUT", body: { isPublic: patch.isPublic } });
  return getProfile();
}
