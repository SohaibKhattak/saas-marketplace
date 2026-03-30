"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, ApiError } from "@/lib/api-client";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "CUSTOMER" | "DEVELOPER" | "ADMIN";
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role?: string) => Promise<{ verifyToken?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  fetchUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{ data: { accessToken: string; user: User } }>(
            "/auth/login",
            { email, password }
          );
          set({
            accessToken: res.data.accessToken,
            user: res.data.user,
            isLoading: false,
          });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Login failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      register: async (email, password, fullName, role?) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{ data: User; _dev?: { verifyToken: string } }>(
            "/auth/register",
            { email, password, fullName, role }
          );
          set({ isLoading: false });
          return { verifyToken: res._dev?.verifyToken };
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "Registration failed";
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch {
          // Ignore logout errors
        }
        set({ user: null, accessToken: null, error: null });
      },

      refreshToken: async () => {
        try {
          const res = await api.post<{ data: { accessToken: string } }>("/auth/refresh");
          set({ accessToken: res.data.accessToken });
        } catch {
          set({ user: null, accessToken: null });
        }
      },

      fetchUser: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        try {
          const res = await api.get<{ data: User }>("/users/me", { token: accessToken });
          set({ user: res.data });
        } catch {
          set({ user: null, accessToken: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
