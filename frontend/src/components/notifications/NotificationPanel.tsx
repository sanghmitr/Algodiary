import type { NotificationItem } from "../../types";
import { Card, CardContent } from "../ui/card";

interface Props {
  notifications: NotificationItem[];
}

export function NotificationPanel({ notifications }: Props) {
  return (
    <Card>
      <CardContent className="space-y-3">
        {notifications.length ? (
          notifications.map((item) => (
            <div key={item.id} className="rounded-md border border-slate-100 p-3">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-sm text-slate-600">{item.body}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No notifications yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

