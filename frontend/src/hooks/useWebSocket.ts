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
      if (payload.type === "kb_updated") {
        queryClient.invalidateQueries({ queryKey: ["kb"], refetchType: "none" });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"], refetchType: "none" });
      }
      if (payload.type === "task_updated") {
        queryClient.invalidateQueries({ queryKey: ["tasks"] });
        queryClient.invalidateQueries({ queryKey: ["tasks-upcoming"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["progress-summary"] });
      }
      if (payload.type === "progress_logged") {
        queryClient.invalidateQueries({ queryKey: ["progress"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
      if (payload.type === "notification") queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    return () => socket.close();
  }, [queryClient, token]);
}
