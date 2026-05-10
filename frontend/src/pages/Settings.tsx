import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { savePushSubscription, updateProfile } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import { TARGET_COMPANIES } from "../utils/constants";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("_", "/");
  const rawData = window.atob(base64);
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index);
  }
  return output.buffer as ArrayBuffer;
}

export function Settings() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [dailyGoal, setDailyGoal] = useState(user?.daily_goal_hours ?? 3);
  const [enabled, setEnabled] = useState(Boolean(user?.push_subscription));
  const update = useMutation({ mutationFn: updateProfile });
  const subscribe = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    const registration = await navigator.serviceWorker.register("/sw.js");
    const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapid) return;
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToArrayBuffer(vapid) });
    await savePushSubscription(subscription.toJSON());
    setEnabled(true);
  };
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><h2 className="font-semibold">Profile</h2></CardHeader>
          <CardContent className="space-y-4">
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
            <Input type="number" value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))} min="0.5" step="0.5" />
            <Button onClick={() => update.mutate({ full_name: fullName, daily_goal_hours: dailyGoal })}>Save profile</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><h2 className="font-semibold">Targets and notifications</h2></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TARGET_COMPANIES.map((company) => <span key={company} className="rounded-full bg-slate-100 px-3 py-1 text-sm">{company}</span>)}
            </div>
            <Switch checked={enabled} onCheckedChange={(checked) => { if (checked) void subscribe(); else setEnabled(false); }} label="Push notifications" />
            <Button variant="danger">Delete account</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
