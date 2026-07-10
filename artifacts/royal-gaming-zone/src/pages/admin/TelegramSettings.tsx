import { useState, useEffect } from "react";
import { Send, CheckCircle, XCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminNav from "@/components/admin/AdminNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function TelegramSettings() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_admin_token");
  if (!token) setLocation("/admin");

  const [botToken, setBotToken] = useState("");
  const [hasBotToken, setHasBotToken] = useState(false);
  const [chatId, setChatId] = useState("");
  const [groupChatId, setGroupChatId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/settings/telegram`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        setHasBotToken(data.hasBotToken);
        setChatId(data.chatId ?? "");
        setGroupChatId(data.groupChatId ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMessage(null);
    const res = await fetch(`${BASE}/api/settings/telegram`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ botToken: botToken || undefined, chatId, groupChatId }),
    });
    setSaving(false);
    if (res.ok) {
      setMessage({ type: "success", text: "Settings saved successfully." });
      if (botToken) { setHasBotToken(true); setBotToken(""); }
    } else {
      const data = await res.json();
      setMessage({ type: "error", text: data.error ?? "Failed to save settings" });
    }
  };

  const test = async () => {
    setTesting(true); setMessage(null);
    const res = await fetch(`${BASE}/api/settings/telegram/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ botToken, chatId }),
    });
    const data = await res.json();
    setTesting(false);
    setMessage(data.success
      ? { type: "success", text: "Test message sent successfully! Check your Telegram." }
      : { type: "error", text: data.error ?? "Connection test failed" });
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-primary font-display text-xl animate-pulse">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-sky-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <AdminNav />

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-xl">
        <h1 className="font-display font-bold text-2xl text-white tracking-wider mb-2 flex items-center gap-2">
          <Send className="w-6 h-6 text-sky-400" /> Telegram Settings
        </h1>
        <p className="text-gray-500 text-sm mb-6">Connect your Telegram bot for booking approvals, sales commands, daily reports, and emergency alerts. Saved settings persist across restarts.</p>

        <div className="glass-panel border border-white/10 rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Bot Token</Label>
            <Input
              type="password"
              placeholder={hasBotToken ? "•••••••••••••••••••• (already set — enter to replace)" : "e.g. 123456:ABC-DEF1234ghIkl..."}
              className="bg-card border-white/10 h-12 font-mono"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
            />
            <p className="text-gray-600 text-[11px]">Get this from @BotFather on Telegram.</p>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Chat ID (admin / owner)</Label>
            <Input
              placeholder="e.g. 123456789"
              className="bg-card border-white/10 h-12 font-mono"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Group Chat ID (optional)</Label>
            <Input
              placeholder="e.g. -100123456789"
              className="bg-card border-white/10 h-12 font-mono"
              value={groupChatId}
              onChange={(e) => setGroupChatId(e.target.value)}
            />
            <p className="text-gray-600 text-[11px]">Used for booking approval requests if set, otherwise falls back to the admin chat.</p>
          </div>

          {message && (
            <p className={`text-sm flex items-center gap-2 ${message.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {message.text}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button disabled={saving} onClick={save} className="flex-1 h-12 bg-primary text-black hover:bg-primary/90 font-bold tracking-widest uppercase">
              {saving ? "Saving..." : "Save Settings"}
            </Button>
            <Button disabled={testing || !chatId} onClick={test} variant="outline" className="flex-1 h-12 border-sky-500/40 text-sky-400 hover:bg-sky-500/10 font-bold tracking-widest uppercase">
              {testing ? "Testing..." : "Test Connection"}
            </Button>
          </div>
        </div>

        <div className="glass-panel border border-white/10 rounded-xl p-6 mt-6">
          <h3 className="text-white font-display font-bold uppercase tracking-wider text-sm mb-3">Bot Commands</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <p><code className="text-primary">/users</code> — total users, today's signups, wallet total</p>
            <p><code className="text-primary">/today</code> — today's bookings by status</p>
            <p><code className="text-primary">/sales [YYYY-MM-DD]</code> — sales breakdown for a date</p>
            <p><code className="text-primary">/overallsales</code> — today, weekly, monthly, lifetime revenue</p>
          </div>
        </div>
      </main>
    </div>
  );
}
