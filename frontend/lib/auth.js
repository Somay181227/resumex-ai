"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback((data) => {
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const login = (email, password) => api("/auth/login", { method: "POST", body: { email, password }, auth: false }).then(handleAuth);
  const register = (name, email, password) =>
    api("/auth/register", { method: "POST", body: { name, email, password }, auth: false }).then(handleAuth);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function useRequireAuth({ admin = false } = {}) {
  const ctx = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (ctx.loading) return;
    if (!ctx.user) router.replace("/login");
    else if (admin && ctx.user.role !== "admin") router.replace("/dashboard");
  }, [ctx.loading, ctx.user, admin, router]);
  const ready = !ctx.loading && !!ctx.user && (!admin || ctx.user.role === "admin");
  return { ...ctx, ready };
}
