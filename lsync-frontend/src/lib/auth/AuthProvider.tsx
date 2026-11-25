"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, ApiError, UNAUTHORIZED_EVENT } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { readToken, tokenStore } from "./token";

export type User = {
  id?: string;
  fullName?: string;
  username?: string;
  email?: string;
  [key: string]: unknown;
};

type Status = "loading" | "authenticated" | "anonymous";

type RegisterInput = { fullName: string; username: string; email: string; password: string };

type AuthContextValue = {
  user: User | null;
  status: Status;
  login: (identifier: string, password: string, remember: boolean) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  /** Merge changes into the signed-in user (after a profile edit) without a refetch. */
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/* ---- Response mappers: the only place that knows the backend's field names. ---- */

/** The login/register response may carry the token under a few common names. */
function extractToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  return d.token ?? d.accessToken ?? d.access_token ?? d.data?.token ?? d.data?.accessToken ?? null;
}

function extractUser(data: unknown): User | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const u = d.user ?? d.data?.user ?? d.data ?? d;
  if (!u || typeof u !== "object") return null;
  return { ...u, fullName: u.fullName ?? u.fullname ?? u.name };
}

/** Set when the person signs out on purpose, so route guards know not to add a "?next=" to the login address. */
export const signOutState = { deliberate: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  // On first load: if a token exists, ask the API who it belongs to.
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      if (!readToken()) {
        setStatus("anonymous");
        return;
      }
      try {
        const data = await api(endpoints.me);
        if (cancelled) return;
        setUser(extractUser(data));
        setStatus("authenticated");
      } catch (e) {
        if (cancelled) return;
        // Expired/invalid token -> sign out. A network error keeps the token so a refresh can retry.
        if (e instanceof ApiError && e.status === 0) {
          setStatus("anonymous");
        } else {
          signOut();
        }
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, [signOut]);

  // Any 401 from an authenticated request ends the session.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut);
  }, [signOut]);

  /** A person choosing to log out (or deleting their account) lands on a clean page. Only a lost session gets "?next=". */
  const logout = useCallback(() => {
    signOutState.deliberate = true;
    signOut();
  }, [signOut]);

  const finishAuth = useCallback(async (data: unknown, remember: boolean) => {
    signOutState.deliberate = false;
    const token = extractToken(data);
    if (!token) throw new ApiError("Signed in, but the server didn't return an access token.", 200, data);
    tokenStore.set(token, remember);
    let u = extractUser(data);
    // If the auth response had no profile, fetch it.
    if (!u || (!u.username && !u.email && !u.fullName)) {
      u = extractUser(await api(endpoints.me));
    }
    setUser(u);
    setStatus("authenticated");
  }, []);

  const login = useCallback<AuthContextValue["login"]>(
    async (identifier, password, remember) => {
      // The backend's login route only accepts an email (a username is rejected with "Valid email is required").
      const typed = identifier.trim();
      const tryLogin = (email: string) => api(endpoints.login, { method: "POST", body: { email, password }, auth: false });
      let data: unknown;
      try {
        data = await tryLogin(typed);
      } catch (e) {
        // Accounts made before emails were lowercased may be stored exactly as typed, so try as typed first. If the server
        // says no and the email has capital letters (a phone keyboard may have added one), try once more in lowercase.
        const lower = typed.toLowerCase();
        if (e instanceof ApiError && (e.status === 400 || e.status === 401) && lower !== typed) data = await tryLogin(lower);
        else throw e;
      }
      await finishAuth(data, remember);
    },
    [finishAuth],
  );

  const register = useCallback<AuthContextValue["register"]>(
    async ({ fullName, username, email: rawEmail, password }) => {
      const email = rawEmail.trim().toLowerCase(); // one way of writing it, so signing in later always matches
      // The real backend replied "Name is required", so it wants `name`. `fullName` is kept for the demo backend.
      const data = await api(endpoints.register, {
        method: "POST",
        body: { name: fullName, fullName, username, email, password },
        auth: false,
      });
      // Some APIs return a token on register, others need a separate login.
      if (extractToken(data)) await finishAuth(data, true);
      else await login(email, password, true);
    },
    [finishAuth, login],
  );

  const updateUser = useCallback((patch: Partial<User>) => setUser((u) => (u ? { ...u, ...patch } : u)), []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, updateUser }),
    [user, status, login, register, logout, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
