"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { storeAuth, clearAuth, getStoredUser, User } from "@/lib/auth";
import toast from "react-hot-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    setUser(storedUser);
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await authApi.login({ username, password });
      const { access_token, refresh_token, user: userData } = res.data;
      storeAuth(access_token, refresh_token, userData);
      setUser(userData);
      toast.success(`Welcome back, ${userData.username}!`);
      router.push(userData.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Login failed";
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const signup = useCallback(async (data: any) => {
    setLoading(true);
    try {
      await authApi.signup(data);
      toast.success("Account created! Please log in.");
      router.push("/login");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Signup failed";
      toast.error(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
    toast.success("Logged out successfully");
  }, [router]);

  return { user, loading, login, signup, logout };
}
