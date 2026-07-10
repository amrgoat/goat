import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Wallet, User as UserIcon, CheckCircle } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminNav from "@/components/admin/AdminNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface UserResult {
  id: number;
  username: string | null;
  name: string | null;
  phone: string;
  balance: number;
  role: string;
}

export default function RechargeWallet() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_admin_token");
  if (!token) setLocation("/admin");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<UserResult | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const search = async (q: string) => {
    setQuery(q);
    setSelected(null);
    setSuccess("");
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`${BASE}/api/admin/search?query=${encodeURIComponent(q)}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setResults(data.users ?? []);
    setSearching(false);
  };

  const recharge = async () => {
    if (!selected) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return setError("Enter a valid amount");
    setError(""); setSuccess(""); setSaving(true);
    const res = await fetch(`${BASE}/api/admin/wallet/recharge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: selected.id, amount: amt }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Failed to recharge wallet");
    setSelected({ ...selected, balance: data.newBalance });
    setSuccess(`₹${amt} credited. New balance: ₹${data.newBalance}`);
    setAmount("");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-green-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <AdminNav />

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        <h1 className="font-display font-bold text-2xl text-white tracking-wider mb-2 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-green-400" /> Recharge Wallet
        </h1>
        <p className="text-gray-500 text-sm mb-6">Search a user by username, ID, or phone number and credit their wallet.</p>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Search by username, ID, or phone..."
            className="bg-card border-white/10 pl-10 h-12 font-display"
            value={query}
            onChange={(e) => search(e.target.value)}
          />
        </div>

        {searching && <p className="text-gray-500 text-sm mb-4">Searching...</p>}

        {!selected && results.length > 0 && (
          <div className="glass-panel border border-white/10 rounded-xl overflow-hidden mb-6">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelected(u); setResults([]); setQuery(""); }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-left"
              >
                <div className="flex items-center gap-3">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-white font-bold">{u.name ?? u.username ?? "—"} <span className="text-gray-500 font-mono text-xs">#{u.id}</span></div>
                    <div className="text-xs text-gray-500">+91 {u.phone} {u.username ? `· @${u.username}` : ""}</div>
                  </div>
                </div>
                <div className="text-primary font-display font-bold">₹{u.balance}</div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel border border-green-500/30 rounded-xl p-6 box-glow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white font-bold text-lg">{selected.name ?? selected.username ?? "—"} <span className="text-gray-500 font-mono text-sm">#{selected.id}</span></div>
                <div className="text-xs text-gray-500">+91 {selected.phone} {selected.username ? `· @${selected.username}` : ""}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wider">Current Balance</div>
                <div className="text-2xl font-display font-bold text-primary">₹{selected.balance}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Amount to credit"
                className="bg-card border-white/10 h-12 font-display flex-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <Button disabled={saving} onClick={recharge} className="h-12 px-8 bg-green-500 text-black hover:bg-green-400 font-bold tracking-widest uppercase">
                {saving ? "Processing..." : "Credit Wallet"}
              </Button>
            </div>

            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            {success && (
              <p className="text-green-400 text-sm mt-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</p>
            )}

            <button onClick={() => { setSelected(null); setSuccess(""); setError(""); }} className="text-gray-500 hover:text-white text-xs mt-4 uppercase tracking-wider">
              ← Search another user
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
