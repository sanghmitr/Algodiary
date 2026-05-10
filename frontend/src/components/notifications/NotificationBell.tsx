import { Bell } from "lucide-react";
import { Button } from "../ui/button";
import { useNotificationStore } from "../../store/notificationStore";

export function NotificationBell() {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  return (
    <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
      <Bell className="h-5 w-5" />
      {unreadCount > 0 ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" /> : null}
    </Button>
  );
}

