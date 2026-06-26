import { create } from "zustand";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  return {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    initialize: () => {
      if (typeof window !== "undefined") {
        const initialUser = localStorage.getItem("bookhub_user");
        const initialToken = localStorage.getItem("bookhub_token");
        set({
          user: initialUser ? JSON.parse(initialUser) : null,
          token: initialToken || null,
          isAuthenticated: !!initialToken,
        });
      }
    },
    setUser: (user) => {
      if (typeof window !== "undefined") {
        if (user) localStorage.setItem("bookhub_user", JSON.stringify(user));
        else localStorage.removeItem("bookhub_user");
      }
      set({ user, isAuthenticated: !!user });
    },
    setToken: (token) => {
      if (typeof window !== "undefined") {
        if (token) localStorage.setItem("bookhub_token", token);
        else localStorage.removeItem("bookhub_token");
      }
      set({ token, isAuthenticated: !!token });
    },
    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("bookhub_user");
        localStorage.removeItem("bookhub_token");
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

