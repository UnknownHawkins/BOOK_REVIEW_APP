"use client";

import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/utils/api";

export default function ClerkAuthSync() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useUser();
  const { initialize, user, setUser, setToken, logout } = useAuthStore();

  // Load stored credentials on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoaded) return;

    const syncAuth = async () => {
      if (isSignedIn && clerkUser) {
        try {
          const token = await getToken();
          if (token) {
            setToken(token);
            // Fetch/Create user profile on Express backend
            const res = await api.get("/users/me");
            setUser(res.data.user);
          }
        } catch (err) {
          console.error("Error syncing auth with backend:", err);
        }
      } else {
        if (user) {
          logout();
        }
      }
    };

    syncAuth();
    // Periodically refresh the token to keep Axios requests active
    const interval = setInterval(async () => {
      if (isSignedIn) {
        const token = await getToken();
        if (token) setToken(token);
      }
    }, 1000 * 60 * 5); // 5 minutes

    return () => clearInterval(interval);
  }, [isSignedIn, clerkUser, isLoaded, initialize]);

  return null;
}

