import Cookies from "js-cookie";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "customer";
  is_active: boolean;
  created_at: string;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("avbank_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function storeAuth(accessToken: string, refreshToken: string, user: User): void {
  Cookies.set("access_token", accessToken, { sameSite: "lax", expires: 1 });
  Cookies.set("refresh_token", refreshToken, { sameSite: "lax", expires: 7 });
  localStorage.setItem("avbank_user", JSON.stringify(user));
}

export function clearAuth(): void {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
  if (typeof window !== "undefined") {
    localStorage.removeItem("avbank_user");
  }
}

export function isAuthenticated(): boolean {
  return !!Cookies.get("access_token");
}
