"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createAutoRefreshFetch, setInitialRefreshPromise } from "@/lib/api/auto-refresh-fetch";
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  SignupRequest,
} from "@/lib/types/api";

const AUTH_STORAGE_KEY = "medaura-auth";

type BackendAuthUser = {
  user_id: number;
  email: string;
  role: string;
  profile?: Record<string, unknown>;
  photo?: string | null;
};

type AuthResponseLike = AuthResponse & {
  access?: string;
  access_token?: string;
  accessToken?: string;
  data?: AuthResponseLike;
  status?: string;
  user?: BackendAuthUser;
};

export interface AuthContextValue {
  user: AuthResponse | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<AuthResponse>;
  signup: (data: SignupRequest) => Promise<AuthResponse>;
  refreshAuth: () => Promise<AuthResponse | null>;
  logout: () => Promise<void>;
  updateUser: (user: AuthResponse | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function unwrapAuthResponse(authData: AuthResponseLike): AuthResponseLike {
  if (authData?.data && typeof authData.data === "object") {
    return unwrapAuthResponse(authData.data);
  }

  return authData;
}

function normalizeAuthResponse(authData: AuthResponseLike): AuthResponse {
  const unwrapped = unwrapAuthResponse(authData);
  const token =
    unwrapped.token ||
    unwrapped.access_token ||
    unwrapped.accessToken ||
    unwrapped.access;

  if (unwrapped.status === "success" && unwrapped.user) {
    const backendUser = unwrapped.user;

    return {
      id: backendUser.user_id,
      email: backendUser.email,
      user_type: backendUser.role,
      profile: backendUser.profile,
      token,
      ...(typeof backendUser.photo === "string" ? { photo: backendUser.photo } : {}),
    };
  }

  return {
    ...unwrapped,
    token,
  };
}

async function readAuthResponse(response: Response, fallbackMessage: string) {
  const result = await response.json();

  // Handle different response formats
  if (!response.ok) {
    throw new Error(result.message || result.error || fallbackMessage);
  }

  // Check for success status (different formats)
  if (result.success === false || result.status === "fail") {
    throw new Error(result.message || result.error || fallbackMessage);
  }

  // Handle different response structures
  let authData: AuthResponseLike;

  if (result.success && result.data) {
    // Standard BFF format
    authData = result.data;
  } else if (result.status === "success" && result.user) {
    // Backend direct format
    authData = {
      id: result.user.user_id,
      email: result.user.email,
      user_type: result.user.role,
      profile: result.user.profile,
    };
  } else {
    throw new Error("Unexpected response format");
  }

  return normalizeAuthResponse(authData);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    // Wrap fetch to auto-refresh tokens on 401 responses for /api/* calls.
    window.fetch = createAutoRefreshFetch(originalFetch, {
      origin: window.location.origin,
      waitForInitialRefresh: true,
    });

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch("/api/user/me", {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUser(normalizeAuthResponse(result.data));
        }
      }
    } catch (err) {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    })
      .then(() => undefined)
      .catch(() => undefined);

    setInitialRefreshPromise(refreshPromise);

    refreshPromise.finally(() => {
      if (!cancelled) {
        checkAuth();
      }
    });

    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  const saveAuth = useCallback((authData: AuthResponse) => {
    setUser(authData);
    setError(null);
  }, []);

  const clearAuth = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const updateUser = useCallback((updatedUser: AuthResponse | null) => {
    setUser(updatedUser);
    setError(null);
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Login failed");
        }
        const authData = normalizeAuthResponse(result.data);
        saveAuth(authData);
        return authData;
      } catch (err) {
        const authError =
          err instanceof Error ? err : new Error("Login failed");
        setError(authError);
        throw authError;
      } finally {
        setLoading(false);
      }
    },
    [saveAuth]
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      try {
        setError(null);

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          credentials: "include",
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          const signupError = new Error(
            result.error || result.message || "Signup failed"
          );
          (signupError as Error & { status?: number; data?: unknown }).status =
            response.status;
          (signupError as Error & { status?: number; data?: unknown }).data = result;
          throw signupError;
        }
        const authData = normalizeAuthResponse(result.data);
        saveAuth(authData);
        return authData;
      } catch (err) {
        const authError =
          err instanceof Error ? err : new Error("Signup failed");
        setError(authError);
        throw authError;
      }
    },
    [saveAuth]
  );

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Token refresh failed");
      }
      const authData = normalizeAuthResponse(result.data);
      saveAuth(authData);
      return authData;
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error("Token refresh failed");
      setError(authError);
      throw authError;
    } finally {
      setLoading(false);
    }
  }, [saveAuth]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      clearAuth();
    } catch (err) {
      // Even if logout fails, clear local state
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      login,
      signup,
      refreshAuth,
      logout,
      updateUser,
    }),
    [error, loading, login, logout, refreshAuth, signup, updateUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
