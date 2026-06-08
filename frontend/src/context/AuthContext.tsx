import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { authService } from "@/services/auth";
import type { LoginRequest, UserRole, UserSummary } from "@/types/api";
import { sessionStorageService } from "@/utils/storage";

interface AuthContextValue {
  user: UserSummary | null;
  token: string | null;
  role?: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function toSummary(value: unknown): UserSummary | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id === "string" && typeof record.name === "string") {
    return {
      id: record.id,
      name: String(record.name),
      email: String(record.email ?? ""),
      role: record.role as UserRole
    };
  }
  const identity = record.identity as Record<string, unknown> | undefined;
  const access = record.access as Record<string, unknown> | undefined;
  if (typeof record.id === "string" && identity && access) {
    return {
      id: record.id,
      name: String(identity.name ?? ""),
      email: String(identity.email ?? ""),
      role: access.role as UserRole
    };
  }
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => sessionStorageService.getToken());
  const [user, setUser] = useState<UserSummary | null>(() => sessionStorageService.getUser());
  const [isLoading, setIsLoading] = useState(Boolean(token));

  const logout = useCallback(() => {
    sessionStorageService.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshMe = useCallback(async () => {
    if (!sessionStorageService.getToken()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await authService.me();
      const summary = toSummary(me);
      if (summary) {
        sessionStorageService.setUser(summary);
        setUser(summary);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await authService.login(payload);
    sessionStorageService.setToken(response.token);
    sessionStorageService.setUser(response.user);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      role: user?.role,
      isAuthenticated: Boolean(token),
      isLoading,
      login,
      logout,
      refreshMe
    }),
    [user, token, isLoading, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
