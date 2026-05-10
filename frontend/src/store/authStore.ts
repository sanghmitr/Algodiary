import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (accessToken: string, user: User) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
}

const storedToken = localStorage.getItem("algodiary_token");

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: storedToken,
  setAuth: (accessToken, user) => {
    localStorage.setItem("algodiary_token", accessToken);
    set({ accessToken, user });
  },
  setUser: (user) => set({ user }),
  clearAuth: () => {
    localStorage.removeItem("algodiary_token");
    set({ accessToken: null, user: null });
  },
}));

