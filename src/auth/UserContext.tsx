import React from "react";

const STORAGE_KEY = "procureguard_user";

export interface CurrentUser {
  name: string;
  loggedInAt: string;
}

function readUser(): CurrentUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CurrentUser;
    if (parsed && typeof parsed.name === "string" && parsed.name.trim().length > 0) {
      return parsed;
    }
  } catch {
    /* fall through */
  }
  return null;
}

interface UserContextValue {
  user: CurrentUser | null;
  login: (name: string) => CurrentUser;
  logout: () => void;
}

const UserContext = React.createContext<UserContextValue | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<CurrentUser | null>(() => readUser());

  const login = React.useCallback((name: string): CurrentUser => {
    const trimmed = name.trim();
    const next: CurrentUser = {
      name: trimmed,
      loggedInAt: new Date().toISOString()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setUser(next);
    return next;
  }, []);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = React.useMemo<UserContextValue>(
    () => ({ user, login, logout }),
    [user, login, logout]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export function useUser(): UserContextValue {
  const ctx = React.useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used inside <UserProvider>");
  }
  return ctx;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
