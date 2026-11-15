const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

const ACCESS_KEY = "polyraaga_access";
const REFRESH_KEY = "polyraaga_refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  document.cookie = `polyraaga_access_mw=1; path=/; max-age=86400`;
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  document.cookie = "polyraaga_access_mw=; path=/; max-age=0";
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem(ACCESS_KEY, data.access);
    document.cookie = `polyraaga_access_mw=1; path=/; max-age=86400`;
    return data.access;
  } catch {
    return null;
  }
}

/**
 * Fetch authentifié — attache le token JWT, rafraîchit automatiquement
 * si le token a expiré, et redirige vers /login en dernier recours.
 *
 * Si `options.body` est un FormData (upload de fichier), le header
 * Content-Type n'est PAS forcé : le navigateur doit générer lui-même
 * le boundary multipart, sinon l'upload échoue silencieusement.
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const access = getAccessToken();
  const isFormData = options.body instanceof FormData;

  const doFetch = (token: string | null) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

  let res = await doFetch(access);

  if (res.status === 401) {
    const newAccess = await refreshAccessToken();

    if (newAccess) {
      res = await doFetch(newAccess);
    } else {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return res;
}