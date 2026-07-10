import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Save, User, Wallet, Calendar, Edit3, Plus, Minus, History, TrendingUp, TrendingDown, Key, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { formatISTDate, formatISTTime } from "@/lib/ist-time";
import AdminNav from "@/components/admin/AdminNav";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Account {
  id: number;
  phone: string;
  username: string | null;
  name: string | null;
  balance: number;
  isAdmin: boolean;
  role: string;
  createdAt: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "player", label: "Player", color: "text-gray-400 bg-gray-500/20 border-gray-500/30" },
  { value: "staff", label: "Staff", color: "text-blue-400 bg-blue-500/20 border-blue-500/30" },
  { value: "admin", label: "Admin", color: "text-red-400 bg-red-500/20 border-red-500/30" },
  { value: "owner", label: "Owner", color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" },
];

function roleStyle(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? ROLE_OPTIONS[0];
}

export default function AdminAccountDetail() {
  const [, params] = useRoute("/admin/accounts/:phone");
  const phone = params?.phone ?? "";
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_admin_token");

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  const [balanceMode, setBalanceMode] = useState<"add" | "remove">("add");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDesc, setBalanceDesc] = useState("");
  const [balanceSaving, setBalanceSaving] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [balanceSuccess, setBalanceSuccess] = useState("");

  // Role management
  const [selectedRole, setSelectedRole] = useState("player");
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleMsg, setRoleMsg] = useState("");

  // Password reset
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = async () => {
    if (!token) { setLocation("/admin"); return; }
    if (!phone) return;
    try {
      const [accountRes, txRes] = await Promise.all([
        fetch(`${BASE}/api/admin/accounts/${phone}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/api/admin/accounts/${phone}/transactions`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (accountRes.status === 401 || accountRes.status === 403) {
        localStorage.removeItem("rgz_admin_token");
        setLocation("/admin");
        return;
      }
      const accountData = await accountRes.json();
      const txData = await txRes.json();
      if (accountData.error) throw new Error(accountData.error);
      setAccount(accountData);
      setName(accountData.name ?? "");
      setSelectedRole(accountData.role ?? "player");
      setTransactions(txData.transactions ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [phone, token]);

  const handleSaveName = async () => {
    if (!token || !account) return;
    setSaving(true);
    const res = await fetch(`${BASE}/api/admin/accounts/${phone}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setError(data.error ?? "Save failed");
    setAccount(data);
    setError("");
  };

  const handleBalanceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setBalanceError("");
    setBalanceSuccess("");
    const amt = Number(balanceAmount);
    if (!amt || amt <= 0) return setBalanceError("Enter a valid amount");
    setBalanceSaving(true);
    const delta = balanceMode === "add" ? amt : -amt;
    const res = await fetch(`${BASE}/api/admin/accounts/${phone}/balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: delta, description: balanceDesc || undefined }),
    });
    const data = await res.json();
    setBalanceSaving(false);
    if (!res.ok) return setBalanceError(data.error ?? "Failed");
    setAccount(data);
    setBalanceAmount("");
    setBalanceDesc("");
    setBalanceSuccess(`₹${amt} ${balanceMode === "add" ? "added" : "removed"} successfully`);
    fetchData();
  };

  const handleRoleChange = async () => {
    if (!token || !account) return;
    setRoleSaving(true);
    setRoleMsg("");
    const res = await fetch(`${BASE}/api/admin/accounts/${phone}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role: selectedRole }),
    });
    const data = await res.json();
    setRoleSaving(false);
    if (!res.ok) return setRoleMsg(data.error ?? "Failed to update role");
    setAccount(data);
    setRoleMsg("Role updated successfully");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setPasswordSaving(true);
    setPasswordMsg("");
    const res = await fetch(`${BASE}/api/admin/accounts/${phone}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ password: newPassword }),
    });
    const data = await res.json();
    setPasswordSaving(false);
    if (!res.ok) return setPasswordMsg(data.error ?? "Failed");
    setNewPassword("");
    setPasswordMsg("Password updated successfully");
  };

  const handleDelete = async () => {
    if (!token || !account) return;
    setDeleteLoading(true);
    const res = await fetch(`${BASE}/api/admin/accounts/${phone}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setDeleteLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Delete failed");
      setDeleteConfirm(false);
      return;
    }
    setLocation("/admin/accounts");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-display text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-400 font-display text-xl">{error ?? "Account not found"}</div>
      </div>
    );
  }

  const rs = roleStyle(account.role);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <AdminNav />

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-3xl space-y-6">
        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white -mt-2" asChild>
          <Link href="/admin/accounts">
            <ArrowLeft className="w-4 h-4 mr-2" />
            All Accounts
          </Link>
        </Button>
        {/* Account Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel border border-white/10 rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-2xl font-display font-bold text-primary">
                  {account.name ? account.name[0].toUpperCase() : account.phone.slice(-2)}
                </div>
                <div>
                  <h1 className="text-2xl font-display font-bold text-white tracking-wider">
                    {account.name ?? "Unnamed Player"}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-gray-400 text-sm">+91 {account.phone}</span>
                    {account.username && <span className="text-primary text-sm font-display">@{account.username}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${rs.color}`}>
                      {rs.label}
                    </span>
                  </div>
                </div>
              </div>
              {/* Delete button */}
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-bold transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs font-bold">Sure?</span>
                  <button
                    onClick={handleDelete}
                    disabled={deleteLoading}
                    className="px-3 py-1.5 rounded-lg bg-red-500 text-black text-xs font-bold hover:bg-red-400 transition-all disabled:opacity-50"
                  >
                    {deleteLoading ? "Deleting..." : "Yes, Delete"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 text-xs font-bold hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="glass-panel border border-primary/30 bg-primary/5 rounded-lg p-4 box-glow">
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider mb-1">
                <Wallet className="w-3.5 h-3.5" /> Wallet Balance
              </div>
              <div className="text-3xl font-display font-bold text-white">₹{account.balance}</div>
            </div>
            <div className="glass-panel border border-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs uppercase tracking-wider mb-1">
                <Calendar className="w-3.5 h-3.5" /> Member Since
              </div>
              <div className="text-lg font-display font-bold text-white">
                {formatISTDate(account.createdAt, { day: "numeric", month: "short", year: "numeric" })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Role Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="glass-panel border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-display font-bold text-white tracking-wider flex items-center gap-2 mb-5">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Role Management
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                className={`py-2.5 px-3 rounded-lg border font-bold text-sm uppercase tracking-wider transition-all ${
                  selectedRole === r.value ? `${r.color} ring-2 ring-offset-1 ring-offset-background` : "border-white/10 text-gray-500 hover:border-white/20"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {roleMsg && (
            <p className={`text-sm mb-3 ${roleMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>{roleMsg}</p>
          )}
          <Button
            onClick={handleRoleChange}
            disabled={roleSaving || selectedRole === account.role}
            className="h-10 px-6 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90"
          >
            {roleSaving ? "Saving..." : "Apply Role"}
          </Button>
        </motion.div>

        {/* Balance Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-display font-bold text-white tracking-wider flex items-center gap-2 mb-5">
            <Wallet className="w-5 h-5 text-primary" />
            Balance Management
          </h3>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setBalanceMode("add")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-sm uppercase tracking-wider transition-all ${balanceMode === "add" ? "bg-green-500/20 border-green-500/50 text-green-400" : "border-white/10 text-gray-500 hover:border-white/20"}`}
            >
              <Plus className="w-4 h-4" /> Add Balance
            </button>
            <button
              onClick={() => setBalanceMode("remove")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border font-bold text-sm uppercase tracking-wider transition-all ${balanceMode === "remove" ? "bg-red-500/20 border-red-500/50 text-red-400" : "border-white/10 text-gray-500 hover:border-white/20"}`}
            >
              <Minus className="w-4 h-4" /> Remove Balance
            </button>
          </div>

          <form onSubmit={handleBalanceChange} className="space-y-3">
            <div>
              <Label className="text-gray-300 text-xs uppercase tracking-wider">Amount (₹)</Label>
              <Input
                type="number"
                min="1"
                placeholder="Enter amount"
                className="bg-card border-white/10 h-11 mt-1"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label className="text-gray-300 text-xs uppercase tracking-wider">Description (optional)</Label>
              <Input
                placeholder={balanceMode === "add" ? "e.g. Wallet recharge" : "e.g. Gaming session 1hr"}
                className="bg-card border-white/10 h-11 mt-1"
                value={balanceDesc}
                onChange={(e) => setBalanceDesc(e.target.value)}
              />
            </div>
            {balanceError && <p className="text-red-400 text-sm">{balanceError}</p>}
            {balanceSuccess && <p className="text-green-400 text-sm">{balanceSuccess}</p>}
            <Button
              type="submit"
              disabled={balanceSaving}
              className={`w-full h-11 font-bold tracking-widest uppercase ${balanceMode === "add" ? "bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500 hover:text-black" : "bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500 hover:text-white"}`}
            >
              {balanceSaving ? "Processing..." : balanceMode === "add" ? `Add ₹${balanceAmount || "0"}` : `Remove ₹${balanceAmount || "0"}`}
            </Button>
          </form>
        </motion.div>

        {/* Edit Name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-panel border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-display font-bold text-white tracking-wider flex items-center gap-2 mb-4">
            <Edit3 className="w-5 h-5 text-primary" />
            Edit Name
          </h3>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                className="bg-card border-white/10 pl-10 h-12 focus-visible:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Player name"
              />
            </div>
            <Button
              onClick={handleSaveName}
              disabled={saving}
              className="h-12 px-6 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </motion.div>

        {/* Reset Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.17 }}
          className="glass-panel border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-display font-bold text-white tracking-wider flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            Reset Password
          </h3>
          <form onSubmit={handlePasswordReset} className="flex gap-3">
            <Input
              type="password"
              placeholder="New password (min 8 chars)"
              className="bg-card border-white/10 h-12 focus-visible:ring-primary flex-1"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
            <Button
              type="submit"
              disabled={passwordSaving || newPassword.length < 8}
              className="h-12 px-6 bg-white/10 text-white border border-white/20 hover:bg-white/20 font-bold tracking-widest uppercase shrink-0"
            >
              {passwordSaving ? "Saving..." : "Reset"}
            </Button>
          </form>
          {passwordMsg && (
            <p className={`text-sm mt-2 ${passwordMsg.includes("success") ? "text-green-400" : "text-red-400"}`}>{passwordMsg}</p>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel border border-white/10 rounded-xl p-6"
        >
          <h3 className="text-lg font-display font-bold text-white tracking-wider flex items-center gap-2 mb-5">
            <History className="w-5 h-5 text-primary" />
            Transaction History
          </h3>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No transactions yet.</div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
                      {tx.type === "credit" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium">{tx.description}</div>
                      <div className="text-gray-500 text-xs">
                        {formatISTDate(tx.createdAt)} {formatISTTime(tx.createdAt)}
                      </div>
                    </div>
                  </div>
                  <span className={`font-display font-bold ${tx.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                    {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
