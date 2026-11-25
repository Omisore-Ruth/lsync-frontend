/**
 * Demo-mode "backend". Runs entirely in the browser (data lives in localStorage) so the whole app can be
 * clicked through without a server. It only exists when NEXT_PUBLIC_USE_MOCKS=true.
 *
 * It returns responses shaped like the real API is likely to (populated skill/platform/track objects,
 * `{ success, data }` wrappers) so the real mappers in services.ts are exercised too.
 */
import { endpoints } from "./endpoints";
import { addDays, keyOf, startOfDay } from "@/lib/stats";
import type { GithubActivity, LearningLog } from "@/lib/types";

type MockUser = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  headline?: string;
  about?: string;
  interests?: string[];
  isPublic?: boolean;
  accounts?: { id: string; source: string; username: string; url?: string }[];
};
type GithubState = { connected: boolean; commits: GithubActivity[]; synced: string[] };
type Db = { users: MockUser[]; logs: Record<string, LearningLog[]>; github: Record<string, GithubState> };

const KEY = "lsync_mock_db_v1";
export const DEMO_EMAIL = "demo@lsync.app";
export const DEMO_PASSWORD = "Demo1234";

let memoryDb: Db | null = null;

/* ---------- seed data ---------- */

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATALOG = [
  { skill: "Data analysis", track: "Data", platform: "Coursera", min: [30, 90], w: 3 },
  { skill: "Python", track: "Development", platform: "Coursera", min: [30, 75], w: 3 },
  { skill: "Python", track: "Development", platform: "YouTube", min: [20, 50], w: 1 },
  { skill: "Figma and UI design", track: "Design", platform: "Udemy", min: [40, 90], w: 2 },
  { skill: "Git and version control", track: "Development", platform: "YouTube", min: [20, 50], w: 2 },
  { skill: "SQL", track: "Data", platform: "YouTube", min: [20, 45], w: 2 },
  { skill: "Data visualisation", track: "Data", platform: "Udemy", min: [30, 60], w: 1 },
  { skill: "UX research", track: "Design", platform: "Coursera", min: [40, 80], w: 1 },
  { skill: "Web accessibility", track: "Development", platform: "Blogs and docs", min: [15, 40], w: 1 },
  { skill: "Statistics", track: "Data", platform: "edX", min: [45, 100], w: 1 },
];

function seedLogs(today: Date, userId: string): LearningLog[] {
  const rand = rng(42);
  const pool = CATALOG.flatMap((c) => Array<(typeof CATALOG)[number]>(c.w).fill(c));
  const logs: LearningLog[] = [];
  let n = 0;
  for (let back = 0; back < 150; back++) {
    const d = addDays(startOfDay(today), -back);
    const weekday = (d.getDay() + 6) % 7;
    const chance = back < 9 ? 1 : weekday >= 5 ? 0.45 : 0.82;
    if (rand() > chance) continue;
    const sessions = rand() < 0.3 ? 2 : 1;
    for (let s = 0; s < sessions; s++) {
      const c = pool[Math.floor(rand() * pool.length)];
      const minutes = Math.round((c.min[0] + rand() * (c.min[1] - c.min[0])) / 5) * 5;
      logs.push({ id: `${userId}-log-${n++}`, skill: c.skill, platform: c.platform, track: c.track, date: keyOf(d), durationMinutes: minutes });
    }
  }
  return logs;
}

const REPOS = [
  { fullName: "demo-learner/lsync-ui", description: "Frontend for LSync", language: "TypeScript", private: false, fork: false, stars: 3 },
  { fullName: "demo-learner/pandas-practice", description: "Notebooks from the data analysis course", language: "Python", private: false, fork: false, stars: 1 },
  { fullName: "demo-learner/private-notes", description: "Private study notes", language: "Markdown", private: true, fork: false, stars: 0 },
];

const MESSAGES = ["Add login form validation", "Merge pull request #12 from feature/sidebar", "Fix chart axis labels", "Clean dataset and add tests", "Refactor API client", "Update README"];

function makeCommits(repo: string, today: Date): GithubActivity[] {
  const rand = rng(repo.length * 97);
  return MESSAGES.map((message, i) => {
    const at = addDays(startOfDay(today), -Math.floor(rand() * 14)).getTime() + (9 + i) * 3_600_000;
    const sha = Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(rand() * 16)]).join("");
    return {
      id: sha,
      repository: repo,
      commitSha: sha,
      message,
      githubAuthorLogin: "demo-learner",
      committedAt: new Date(at).toISOString(),
      commitUrl: `https://github.com/${repo}/commit/${sha}`,
      verificationStatus: i === 5 ? "unverified" : "matched",
    };
  });
}

function seed(): Db {
  const today = new Date();
  const id = "u-demo";
  return {
    users: [
      {
        id,
        fullName: "Demo Learner",
        username: "demo-learner",
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        headline: "Product designer building skills in data analysis and development.",
        about: "",
        interests: ["Data analysis", "Product design", "Web development"],
        isPublic: false,
        accounts: [
          { id: "a-coursera", source: "Coursera", username: "demo-learner", url: "https://www.coursera.org/user/demo-learner" },
          { id: "a-udemy", source: "Udemy", username: "demo-learner" },
        ],
      },
    ],
    logs: { [id]: seedLogs(today, id) },
    github: { [id]: { connected: false, commits: [], synced: [] } },
  };
}

/* ---------- storage ---------- */

function load(): Db {
  if (memoryDb) return memoryDb;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      memoryDb = JSON.parse(raw) as Db;
      return memoryDb;
    }
  } catch {
    /* storage blocked or corrupted: fall through to a fresh seed */
  }
  memoryDb = seed();
  save();
  return memoryDb;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(memoryDb));
  } catch {
    /* in-memory only for this tab */
  }
}

export function resetMockData() {
  memoryDb = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/* ---------- request handling ---------- */

type Result = { status: number; data: unknown };
const ok = (data: unknown, status = 200): Result => ({ status, data });
const fail = (status: number, message: string): Result => ({ status, data: { success: false, message } });
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const publicUser = (u: MockUser) => ({ id: u.id, fullName: u.fullName, username: u.username, email: u.email });
const populate = (l: LearningLog) => ({
  _id: l.id,
  skill: { _id: `s-${l.skill}`, name: l.skill },
  platform: { _id: `p-${l.platform}`, name: l.platform },
  track: l.track ? { _id: `t-${l.track}`, name: l.track } : null,
  date: l.date,
  durationMinutes: l.durationMinutes,
});

export async function mockRequest(method: string, path: string, body: unknown, token: string | null): Promise<Result> {
  await delay(160 + Math.random() * 160);
  const [pathname, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  const db = load();
  const b = (body ?? {}) as Record<string, unknown>;

  // ---- public auth routes ----
  if (pathname === endpoints.register && method === "POST") {
    const fullName = String(b.fullName ?? "").trim();
    const username = String(b.username ?? "").trim();
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!fullName || !username || !email || !b.password) return fail(400, "Please fill in every field.");
    if (db.users.some((u) => u.email === email)) return fail(409, "An account with that email already exists.");
    if (db.users.some((u) => u.username.toLowerCase() === username.toLowerCase())) return fail(409, "That username is taken.");
    const user: MockUser = { id: `u-${Date.now()}`, fullName, username, email, password: String(b.password), interests: [], isPublic: false };
    db.users.push(user);
    db.logs[user.id] = [];
    db.github[user.id] = { connected: false, commits: [], synced: [] };
    save();
    return ok({ success: true, token: `mock.${user.id}`, user: publicUser(user) }, 201);
  }
  if (pathname === endpoints.login && method === "POST") {
    const id = String(b.email ?? b.username ?? "").trim().toLowerCase();
    const user = db.users.find((u) => u.email === id || u.username.toLowerCase() === id);
    if (!user) return fail(401, "No demo account with that email in this browser. Demo accounts are saved only in the browser where they were created, so use the demo login shown above or create a new account here.");
    if (user.password !== b.password) return fail(401, "Incorrect password.");
    return ok({ success: true, token: `mock.${user.id}`, user: publicUser(user) });
  }

  // Demo password reset: the "email" is simulated, so the response hands back the token the link would carry.
  if (pathname === endpoints.forgotPassword && method === "POST") {
    const email = String(b.email ?? "").trim().toLowerCase();
    const found = db.users.find((u) => u.email === email);
    return ok({ success: true, message: "If an account exists for that email, a reset link has been sent.", demoToken: found ? `reset.${found.id}` : null });
  }
  if (pathname === endpoints.resetPassword && method === "POST") {
    const id = String(b.token ?? "").replace(/^reset\./, "");
    const target = db.users.find((u) => u.id === id);
    if (!target) return fail(400, "This reset link is invalid or has expired. Request a new one.");
    target.password = String(b.newPassword ?? b.password ?? "");
    save();
    return ok({ success: true, message: "Password updated." });
  }

  // ---- everything below needs a signed-in user ----
  const user = db.users.find((u) => token === `mock.${u.id}`);
  if (!user) return fail(401, "Unauthorized");
  const logs = (db.logs[user.id] ??= []);
  const gh = (db.github[user.id] ??= { connected: false, commits: [], synced: [] });

  // The real backend serves "me" and the profile from the same path (/api/users/me); then the profile route below answers.
  if (pathname === endpoints.me && method === "GET" && endpoints.me !== endpoints.profile) return ok({ success: true, user: publicUser(user) });

  if (pathname === endpoints.profile) {
    if (method === "GET" || method === "PATCH") {
      if (method === "PATCH") {
        if (typeof b.fullName === "string") user.fullName = b.fullName;
        if (typeof b.headline === "string") user.headline = b.headline;
        if (typeof b.about === "string") user.about = b.about;
        if (Array.isArray(b.interests)) user.interests = b.interests.map(String);
        if (typeof b.isPublic === "boolean") user.isPublic = b.isPublic;
        save();
      }
      const { password: _pw, ...rest } = user; // eslint-disable-line @typescript-eslint/no-unused-vars
      return ok({ success: true, data: rest });
    }
  }

  // ---- account: password, deletion, linked platform accounts ----
  if (pathname === endpoints.changePassword && method === "PUT") {
    if (b.currentPassword !== user.password) return fail(400, "Current password is incorrect.");
    user.password = String(b.newPassword ?? "");
    save();
    return ok({ success: true, msg: "Password updated" });
  }
  if (pathname === endpoints.deleteAccount && method === "DELETE") {
    if (b.password !== user.password) return fail(400, "Password incorrect.");
    if (b.confirmDelete !== "DELETE") return fail(400, "You must type DELETE to confirm.");
    db.users = db.users.filter((u) => u.id !== user.id);
    delete db.logs[user.id];
    delete db.github[user.id];
    save();
    return ok({ success: true, msg: "Account and all data deleted permanently" });
  }
  if (pathname === endpoints.accounts) {
    const accounts = (user.accounts ??= []);
    if (method === "GET") return ok({ success: true, data: accounts });
    if (method === "POST") {
      const source = String(b.source ?? "");
      if (!String(b.platformUsername ?? "").trim()) return fail(400, "Platform username required");
      if (accounts.some((a) => a.source === source)) return fail(400, "Platform already linked");
      accounts.push({ id: `a-${Date.now()}`, source, username: String(b.platformUsername).trim(), url: typeof b.profileUrl === "string" ? b.profileUrl : undefined });
      save();
      return ok({ success: true, data: accounts }, 201);
    }
  }
  const acct = pathname.match(/^\/api\/users\/accounts\/([^/]+)$/);
  if (acct && method === "DELETE") {
    user.accounts = (user.accounts ?? []).filter((a) => a.id !== decodeURIComponent(acct[1]));
    save();
    return ok({ success: true });
  }

  if (pathname === endpoints.learningLogs) {
    if (method === "GET") {
      const newestFirst = logs.map((l, i) => ({ l, i })).sort((a, c) => c.l.date.localeCompare(a.l.date) || c.i - a.i);
      return ok({ success: true, data: newestFirst.map((x) => populate(x.l)) });
    }
    if (method === "POST") {
      const log: LearningLog = {
        id: `${user.id}-log-${Date.now()}`,
        skill: String(b.skill ?? "").trim(),
        platform: String(b.platform ?? "Other"),
        track: b.track ? String(b.track) : undefined,
        date: String(b.date ?? keyOf(new Date())),
        durationMinutes: Number(b.durationMinutes ?? 0),
      };
      if (!log.skill || log.durationMinutes < 1) return fail(400, "Skill and duration are required.");
      logs.push(log);
      save();
      return ok({ success: true, data: populate(log) }, 201);
    }
  }
  const delPrefix = endpoints.learningLog("");
  const del = pathname.startsWith(delPrefix) && pathname.length > delPrefix.length ? [pathname, pathname.slice(delPrefix.length)] : null;
  if (del && method === "DELETE") {
    const id = decodeURIComponent(del[1]);
    const i = logs.findIndex((l) => l.id === id);
    if (i === -1) return fail(404, "Log not found.");
    logs.splice(i, 1);
    save();
    return ok({ success: true });
  }

  // ---- GitHub ----
  if (pathname === endpoints.githubConnect && method === "GET") {
    gh.connected = true; // a real flow would round-trip through GitHub; demo mode connects immediately
    save();
    return ok({ success: true, authorizationUrl: "/connect?github=connected" });
  }
  if (pathname === endpoints.githubRepositories && method === "GET") {
    if (!gh.connected) return fail(400, "GitHub is not connected.");
    return ok({ success: true, data: REPOS.map((r) => ({ ...r, pushedAt: new Date().toISOString() })) });
  }
  const sync = pathname.match(/^\/api\/integrations\/github\/repositories\/([^/]+)\/([^/]+)\/sync$/);
  if (sync && method === "POST") {
    if (!gh.connected) return fail(400, "GitHub is not connected.");
    const repo = `${sync[1]}/${sync[2]}`;
    const known = gh.synced.includes(repo);
    if (!known) {
      const fresh = makeCommits(repo, new Date());
      gh.commits.push(...fresh);
      gh.synced.push(repo);
      save();
      return ok({ success: true, provider: "GitHub", repository: repo, fetched: fresh.length, inserted: fresh.length, alreadyExisting: 0, verification: { matched: fresh.length - 1, unverified: 1 } });
    }
    const count = gh.commits.filter((c) => c.repository === repo).length;
    return ok({ success: true, provider: "GitHub", repository: repo, fetched: count, inserted: 0, alreadyExisting: count, verification: { matched: count - 1, unverified: 1 } });
  }
  if (pathname === "/api/integrations/github/activities" && method === "GET") {
    if (!gh.connected) return fail(400, "GitHub is not connected.");
    const page = Math.max(1, Number(params.get("page") ?? 1));
    const limit = Math.max(1, Number(params.get("limit") ?? 20));
    const all = [...gh.commits].sort((a, c) => c.committedAt.localeCompare(a.committedAt));
    return ok({ success: true, data: all.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: all.length, pages: Math.max(1, Math.ceil(all.length / limit)) } });
  }

  return fail(404, `Demo mode has no route for ${method} ${pathname}`);
}
