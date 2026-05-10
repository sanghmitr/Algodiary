import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Bell, Building2, CalendarDays, Save, UserRound } from "lucide-react";
import { removePushSubscription, savePushSubscription, updateProfile } from "../api/users";
import { useAuth } from "../hooks/useAuth";
import { useAuthStore } from "../store/authStore";
import { TARGET_COMPANIES } from "../utils/constants";
import { cn } from "../utils/helpers";
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-900">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function Settings() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const interviewPlanRef = useRef<HTMLDivElement | null>(null);
  const [fullName, setFullName] = useState("");
  const [dailyGoal, setDailyGoal] = useState(3);
  const [targetDate, setTargetDate] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [pushMessage, setPushMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name ?? "");
    setDailyGoal(user.daily_goal_hours ?? 3);
    setTargetDate(user.target_date ?? "");
    setTargetCompanies(user.target_companies ?? []);
    setEnabled(Boolean(user.push_subscription));
  }, [user]);

  useEffect(() => {
    if (searchParams.get("section") !== "interview-plan") return;
    interviewPlanRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [searchParams]);

  const update = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });

  const push = useMutation({
    mutationFn: async (checked: boolean) => {
      if (!checked) {
        await removePushSubscription();
        return null;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push notifications are not supported in this browser.");
      }
      const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
      if (!vapid) {
        throw new Error("VAPID public key is not configured.");
      }
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToArrayBuffer(vapid) });
      return savePushSubscription(subscription.toJSON());
    },
    onSuccess: (updatedUser, checked) => {
      setEnabled(checked);
      setPushMessage(checked ? "Push notifications enabled." : "Push notifications disabled.");
      if (updatedUser) setUser(updatedUser);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (error) => {
      setEnabled(false);
      setPushMessage(error instanceof Error ? error.message : "Unable to update push notifications.");
    },
  });

  const saveProfile = () => {
    update.mutate({
      full_name: fullName.trim(),
      daily_goal_hours: dailyGoal,
      target_date: targetDate || null,
      target_companies: targetCompanies,
    });
  };

  const toggleCompany = (company: string) => {
    setTargetCompanies((current) => (current.includes(company) ? current.filter((item) => item !== company) : [...current, company]));
  };

  const daysRemaining = useMemo(() => {
    if (!targetDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(`${targetDate}T00:00:00`);
    return Math.ceil((target.getTime() - today.getTime()) / 86400000);
  }, [targetDate]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your prep profile, target companies, interview date, and reminders.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <UserRound className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="font-semibold">Profile</h2>
                <p className="text-sm text-slate-500">This name appears in the top bar.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Full name">
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your name" />
              </Field>
              <Field label="Daily study goal" hint="Hours per day. Used as your planning baseline.">
                <Input type="number" value={dailyGoal} onChange={(event) => setDailyGoal(Number(event.target.value))} min="0.5" step="0.5" />
              </Field>
            </CardContent>
          </Card>

          <Card ref={interviewPlanRef} className={searchParams.get("section") === "interview-plan" ? "border-brand-300 ring-2 ring-brand-100" : undefined}>
            <CardHeader className="flex flex-row items-center gap-3">
              <CalendarDays className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="font-semibold">Interview Plan</h2>
                <p className="text-sm text-slate-500">Set the date that drives your dashboard countdown.</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem]">
              <Field label="Target interview date">
                <Input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
              </Field>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Days remaining</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{daysRemaining ?? "Set date"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Building2 className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="font-semibold">Target Companies</h2>
                <p className="text-sm text-slate-500">Choose the companies you are actively preparing for.</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {TARGET_COMPANIES.map((company) => {
                const selected = targetCompanies.includes(company);
                return (
                  <button
                    key={company}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      selected ? "border-brand-500 bg-brand-50 text-brand-700" : "border-slate-200 bg-white text-slate-700 hover:border-brand-300",
                    )}
                    onClick={() => toggleCompany(company)}
                  >
                    {company}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3">
              <Bell className="h-5 w-5 text-brand-600" />
              <div>
                <h2 className="font-semibold">Notifications</h2>
                <p className="text-sm text-slate-500">Browser push reminders for study nudges.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Push notifications</p>
                  <p className="text-xs text-slate-500">{enabled ? "Enabled on this browser." : "Currently disabled."}</p>
                </div>
                <Switch checked={enabled} onCheckedChange={(checked) => push.mutate(checked)} />
              </div>
              {pushMessage ? <p className="text-sm text-slate-500">{pushMessage}</p> : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold">Save Changes</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={saveProfile} disabled={update.isPending}>
                <Save className="h-4 w-4" />
                {update.isPending ? "Saving..." : "Save settings"}
              </Button>
              {update.isSuccess ? <p className="text-sm text-emerald-700">Settings saved.</p> : null}
              {update.isError ? <p className="text-sm text-red-600">Unable to save settings.</p> : null}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="flex flex-row items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h2 className="font-semibold">Danger Zone</h2>
                <p className="text-sm text-slate-500">Account deletion is not wired yet.</p>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="danger" disabled className="w-full">Delete account</Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
