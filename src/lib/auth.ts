import { clearTokens, getAccessToken, isAuthenticated } from "./api";

const USER_KEY = "scrafit_user";

export interface AuthUser {
  id?: number;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  shop_name?: string;
  is_verified?: boolean;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  if (typeof window === "undefined") return;
  clearTokens();
  localStorage.removeItem(USER_KEY);
  window.location.href = "/login";
}

export { isAuthenticated, getAccessToken };
