/**
 * Where the JWT is kept in the browser.
 *
 * DECISION PENDING with the backend team: an httpOnly cookie set by the API is safer than
 * localStorage (JavaScript, and therefore any injected script, cannot read it). Until that is
 * agreed, localStorage keeps development moving. Only this file needs to change later.
 */
const KEY = "lsync_token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(token: string, remember: boolean) {
    try {
      // "Keep me signed in" -> survives browser restarts; otherwise ends with the tab.
      (remember ? localStorage : sessionStorage).setItem(KEY, token);
      (remember ? sessionStorage : localStorage).removeItem(KEY);
    } catch {
      /* storage blocked: the user simply has to sign in again next time */
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  },
};

export function readToken(): string | null {
  try {
    return localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
