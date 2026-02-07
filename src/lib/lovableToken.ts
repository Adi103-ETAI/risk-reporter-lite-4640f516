const TOKEN_PARAM = "__lovable_token";
const STORAGE_KEY = "lovable_token";
const CONSUMED_KEY = "lovable_token_consumed";

export function consumeLovableToken(token: string | null | undefined) {
  const t = (token ?? "").trim();
  if (!t) return;

  // Session-scoped storage (avoids persistence across browser restarts).
  sessionStorage.setItem(STORAGE_KEY, t);
  sessionStorage.setItem(CONSUMED_KEY, "1");
}

export function getLovableToken(): string | null {
  return sessionStorage.getItem(STORAGE_KEY);
}

export function wasLovableTokenConsumed(): boolean {
  return sessionStorage.getItem(CONSUMED_KEY) === "1";
}

export function stripLovableTokenFromUrl(url: string): string {
  try {
    // Support both absolute and relative URLs.
    const isAbsolute = /^https?:\/\//i.test(url);
    const u = new URL(url, isAbsolute ? undefined : window.location.origin);
    u.searchParams.delete(TOKEN_PARAM);

    // Preserve path + search + hash for relative inputs.
    if (!isAbsolute) {
      const path = u.pathname + (u.search ? u.search : "") + (u.hash ? u.hash : "");
      return path || "/";
    }
    return u.toString();
  } catch {
    return url;
  }
}

export function consumeTokenFromCurrentLocationOnce() {
  try {
    const u = new URL(window.location.href);
    const token = u.searchParams.get(TOKEN_PARAM);
    if (!token) return { didConsume: false, strippedUrl: null as string | null };

    consumeLovableToken(token);
    u.searchParams.delete(TOKEN_PARAM);

    return { didConsume: true, strippedUrl: u.pathname + u.search + u.hash };
  } catch {
    return { didConsume: false, strippedUrl: null as string | null };
  }
}
