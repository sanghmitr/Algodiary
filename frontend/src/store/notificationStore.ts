import { create } from "zustand";
import type { NotificationItem } from "../types";

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  setNotifications: (notifications: NotificationItem[]) => void;
  pushNotification: (notification: NotificationItem) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications, unreadCount: notifications.filter((item) => !item.is_read).length }),
  pushNotification: (notification) =>
    set((state) => {
      const notifications = [notification, ...state.notifications];
      return { notifications, unreadCount: notifications.filter((item) => !item.is_read).length };
    }),
}));

