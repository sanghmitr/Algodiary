import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "../utils/constants";
import { useAuthStore } from "../store/authStore";

interface SocketEvent {
  type: "task_updated" | "progress_logged" | "notification" | "achievement" | "kb_updated" | "user_stats_update";
  data: Record<string, unknown>;
}

export function useWebSocket(): void {
  const token = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;
    const wsUrl = API_BASE_URL.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsUrl}/ws?token=${encodeURIComponent(token)}`);
    socket.onmessage = (event: MessageEvent<string>) => {
      const payload = JSON.parse(event.data) as SocketEvent;
      if (payload.type === "kb_updated") queryClient.invalidateQueries({ queryKey: ["kb"] });
      if (payload.type === "task_updated") queryClient.invalidateQueries({ queryKey: ["tasks"] });
      if (payload.type === "progress_logged") queryClient.invalidateQueries({ queryKey: ["progress"] });
      if (payload.type === "notification") queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    return () => socket.close();
  }, [queryClient, token]);
}

