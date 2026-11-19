import { API_URL, USE_MOCKS } from "./endpoints";
import { mockRequest } from "./mock";
import { readToken } from "@/lib/auth/token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Attach the Bearer token (default true). */
  auth?: boolean;
  /** Don't treat a 401 as "session ended". Use for probes like "is GitHub connected?". */
  quiet401?: boolean;
};

/** Fired on any 401 from an authenticated call so the AuthProvider can sign the user out. */
export const UNAUTHORIZED_EVENT = "lsync:unauthorized";

type Raw = { ok: boolean; status: number; data: unknown };

async function transport(path: string, method: string, body: unknown, init: RequestInit, token: string | null): Promise<Raw> {
  if (USE_MOCKS) {
    const r = await mockRequest(method, path, body, token);
    return { ok: r.status < 400, status: r.status, data: r.data };
  }
  let res: Response;
  // Give up after 70s so the button never spins forever (the free server can take about a minute to wake).
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), 70000);
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: ctrl.signal,
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    window.clearTimeout(timer);
    if (ctrl.signal.aborted) throw new ApiError("The server took too long to answer. It may still be waking up, so please try again in a moment.", 0);
    // Network failure, server down, or the browser blocked the request (CORS)
    throw new ApiError("We couldn't reach the server. If it was asleep, wait a minute and try again. Otherwise check your connection, or ask the backend team to allow this site (CORS).", 0);
  }
  window.clearTimeout(timer);
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { ok: res.ok, status: res.status, data };
}

/** The free server sleeps when idle. A quiet request on page load wakes it while the person types. */
export function wakeServer() {
  if (USE_MOCKS || typeof window === "undefined") return;
  fetch(API_URL, { mode: "no-cors" }).catch(() => {});
}

export async function api<T = unknown>(path: string, { body, auth = true, quiet401 = false, headers, method = "GET", ...init }: Options = {}): Promise<T> {
  const token = auth ? readToken() : null;
  const res = await transport(path, method, body, { ...init, headers }, token);
  if (!res.ok) {
    if (res.status === 401 && auth && !quiet401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    if (process.env.NODE_ENV !== "production") console.warn(`[LSync API] ${method} ${path} -> ${res.status}`, res.data);
    throw new ApiError(messageFrom(res.data, res.status), res.status, res.data);
  }
  return res.data as T;
}

/** Finds a readable message in the common Express / validator error shapes. */
function findMessage(d: unknown, depth = 0): string | null {
  if (typeof d === "string") return d.trim() && !d.trim().startsWith("<") ? d.trim().slice(0, 200) : null;
  if (!d || typeof d !== "object" || depth > 2) return null;
  if (Array.isArray(d)) {
    // Validator errors arrive as ["Name is required", "Username must be at least 5 characters"]: show them all.
    const texts = d.filter((x): x is string => typeof x === "string" && x.trim() !== "" && !x.trim().startsWith("<"));
    if (texts.length) return texts.slice(0, 3).map((t) => t.trim().replace(/\.$/, "")).join(". ") + ".";
    for (const x of d) {
      const m = findMessage(x, depth + 1);
      if (m) return m;
    }
    return null;
  }
  const o = d as Record<string, unknown>;
  for (const k of ["message", "msg", "error", "detail", "details", "errors", "data"]) {
    if (k in o) {
      const m = findMessage(o[k], depth + 1);
      if (m) return m;
    }
  }
  // { errors: { email: "Already used" } } or { errors: { email: ["Already used"] } }
  for (const v of Object.values(o)) {
    const m = findMessage(v, depth + 1);
    if (m) return m;
  }
  return null;
}

function messageFrom(data: unknown, status: number): string {
  const found = findMessage(data);
  if (found) return found;
  if (status === 401) return "Those details don't match an account. Check them and try again.";
  if (status === 404) return "The server doesn't have that address (error 404). Check the route paths in src/lib/api/endpoints.ts.";
  if (status === 409) return "An account with those details already exists.";
  if (status >= 500) return "Something went wrong on the server. Please try again shortly.";
  // While developing, show what the server actually said so a wrong field name is easy to spot.
  if (process.env.NODE_ENV !== "production") {
    let body = "";
    try {
      body = typeof data === "string" ? data.slice(0, 160) : JSON.stringify(data).slice(0, 160);
    } catch {}
    return `The server rejected the request (error ${status})${body ? `: ${body}` : "."}`;
  }
  return "Something went wrong. Please try again.";
}
