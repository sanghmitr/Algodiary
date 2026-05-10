import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import * as authApi from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function useAuth() {
  const queryClient = useQueryClient();
  const { accessToken, user, setAuth, setUser, clearAuth } = useAuthStore();
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: Boolean(accessToken),
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data && (!user || user.id !== meQuery.data.id)) {
      setUser(meQuery.data);
    }
  }, [meQuery.data, setUser, user]);

  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });

  const register = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => setAuth(data.access_token, data.user),
  });

  const logout = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });

  return { user: user ?? meQuery.data ?? null, accessToken, meQuery, login, register, logout };
}
