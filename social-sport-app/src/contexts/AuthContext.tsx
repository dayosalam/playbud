import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCurrentUser, logout as apiLogout, AuthUser } from "@/services/auth.service";
import { getStoredAccessToken } from "@/services/api-client";

const USER_CACHE_KEY = "pb_cached_user";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = getStoredAccessToken();
    if (!token) {
      setUser(null);
      localStorage.removeItem(USER_CACHE_KEY);
      setIsLoading(false);
      return;
    }
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(currentUser));
    } catch (error) {
      setUser(null);
      localStorage.removeItem(USER_CACHE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem(USER_CACHE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
