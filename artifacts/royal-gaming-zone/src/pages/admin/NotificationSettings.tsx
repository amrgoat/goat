import { useState, useEffect } from "react";
import { Bell, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import AdminNav from "@/components/admin/AdminNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const LABELS: Record<string, string> = {
  notify_new_user: "New User Registration",
  notify_wallet_recharge: "Wallet Recharge",
  notify_wallet_deduction: "Wallet Deduction / Payment",
  notify_booking_created: "New Booking (Pending Approval)",
  notify_booking_approval_request: "Booking Approval Request",
  notify_booking_confirmed: "Booking Confirmed",
  notify_booking_cancelled: "Booking Cancelled",
  notify_daily_report: "Daily Report (11:59 PM)",
  notify_emergency_alerts: "Emergency Alerts",
};

export default function NotificationSettings() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_admin_token");
  if (!token) setLocation("/admin");

  const [settings, setSettings] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/settings/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setSettings(data.settings ?? {}); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggle = (key: string) => setSettings((s) => ({ ...s, [key]: !s[key] }));

  const save = async () => {
    setSaving(true); setSaved(false);
    await fetch(`${BASE}/api/settings/notifications`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary font-display text-xl animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-yellow-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <AdminNav />

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-xl">
        <h1 className="font-display font-bold text-2xl text-white tracking-wider mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6 text-yellow-400" /> Notification Settings
        </h1>
        <p className="text-gray-500 text-sm mb-6">Choose which events trigger a Telegram notification.</p>

        <div className="glass-panel border border-white/10 rounded-xl divide-y divide-white/5">
          {Object.entries(LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between px-6 py-4">
              <span className="text-white text-sm">{label}</span>
              <button
                onClick={() => toggle(key)}
                className={`w-12 h-6 rounded-full relative transition-colors ${settings[key] ? "bg-primary" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${settings[key] ? "left-6" : "left-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 mt-6">
          <Button disabled={saving} onClick={save} className="h-12 px-8 bg-primary text-black hover:bg-primary/90 font-bold tracking-widest uppercase">
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {saved && <span className="text-green-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Saved</span>}
        </div>
      </main>
    </div>
  );
}
