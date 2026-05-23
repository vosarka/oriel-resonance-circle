export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const APP_ORIGIN = "https://vossari.local";
const DEFAULT_AUTH_REDIRECT_TARGET = "/";

function getSafeSameSitePath(target: string | null | undefined) {
  const candidate = target?.trim();
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(candidate, APP_ORIGIN);
    if (url.origin !== APP_ORIGIN || candidate.includes("\\")) {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export function getLoginUrl(returnTo?: string | null) {
  const target = getSafeSameSitePath(returnTo);
  return target ? `/auth?next=${encodeURIComponent(target)}` : "/auth";
}

export function getAuthRedirectTarget(search: string | null | undefined) {
  const next = new URLSearchParams(search ?? "").get("next");
  return getSafeSameSitePath(next) ?? DEFAULT_AUTH_REDIRECT_TARGET;
}
