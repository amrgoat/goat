import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, User, Wallet, X, CalendarCheck, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatISTDate } from "@/lib/ist-time";
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

const ROLE_STYLE: Record<string, string> = {
  owner: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
  admin: "text-red-400 bg-red-500/20 border-red-500/30",
  staff: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  player: "text-gray-400 bg-gray-500/20 border-gray-500/30",
};

interface Booking {
  id: number;
  userId: number;
  game: string;
  bookingDate: string;
  timeSlot: string;
  notes: string | null;
  status: string;
  paymentStatus?: string;
  createdAt: string;
  phone: string | null;
  name: string | null;
}

export default function AdminAccounts() {
  const [tab, setTab] = useState<"accounts" | "bookings">("accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [, setLocation] = useLocation();

  const token = localStorage.getItem("rgz_admin_token");

  const fetchAccounts = () => {
    if (!token) { setLocation("/admin"); return; }
    setLoading(true);
    fetch(`${BASE}/api/admin/accounts`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { localStorage.removeItem("rgz_admin_token"); setLocation("/admin"); throw new Error("Unauthorized"); }
        return r.json();
      })
      .then((data) => { setAccounts(data.accounts || []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  const fetchBookings = () => {
    if (!token) return;
    fetch(`${BASE}/api/admin/bookings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => setBookings(data.bookings || []))
      .catch(() => {});
  };

  useEffect(() => { fetchAccounts(); fetchBookings(); }, []);

  const updateBookingStatus = async (id: number, status: string) => {
    if (!token) return;
    const res = await fetch(`${BASE}/api/admin/bookings/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => null);
    fetchBookings();

    if (data?.userPhone && (status === "confirmed" || status === "cancelled")) {
      const b = bookings.find((bk) => bk.id === id);
      const msg =
        status === "confirmed"
          ? `Hi${data.userName ? " " + data.userName : ""}! Your Royal Gaming Zone booking${b ? ` for ${b.game} on ${new Date(b.bookingDate).toLocaleDateString("en-IN")} at ${b.timeSlot}` : ""} is confirmed. See you soon!`
          : `Hi${data.userName ? " " + data.userName : ""}, your Royal Gaming Zone booking${b ? ` for ${b.game}` : ""} has been cancelled. Please contact us if you have questions.`;
      window.open(`https://wa.me/91${data.userPhone}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const markCashPaid = async (id: number) => {
    if (!token) return;
    await fetch(`${BASE}/api/admin/bookings/${id}/pay-cash`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchBookings();
  };

  const filtered = accounts.filter(
    (a) => a.phone.includes(search) || (a.name && a.name.toLowerCase().includes(search.toLowerCase())),
  );

  const statusColor = (s: string) =>
    s === "confirmed" ? "text-green-400 bg-green-500/10 border-green-500/30"
    : s === "cancelled" ? "text-red-400 bg-red-500/10 border-red-500/30"
    : s === "completed" ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
    : s === "no_show" ? "text-gray-400 bg-gray-500/10 border-gray-500/30"
    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-display text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-red-400 font-display text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none"></div>

      <AdminNav />

      {/* Sub-tabs */}
      <div className="border-b border-white/10 bg-card/30 relative z-10">
        <div className="container mx-auto px-4 flex gap-0">
          <button
            onClick={() => setTab("accounts")}
            className={`px-6 py-4 text-sm font-display font-bold uppercase tracking-wider border-b-2 transition-colors ${tab === "accounts" ? "border-primary text-primary bg-primary/5" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setTab("bookings")}
            className={`px-6 py-4 text-sm font-display font-bold uppercase tracking-wider border-b-2 transition-colors ${tab === "bookings" ? "border-primary text-primary bg-primary/5" : "border-transparent text-gray-400 hover:text-white"}`}
          >
            <CalendarCheck className="w-4 h-4 inline mr-2" />
            Bookings ({bookings.length})
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 relative z-10">

        {/* ACCOUNTS TAB */}
        {tab === "accounts" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input placeholder="Search by phone or name..." className="bg-card border-white/10 pl-10 h-12 font-display" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Button className="h-12 bg-primary text-black hover:bg-primary/90 font-bold tracking-widest uppercase gap-2" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4" /> Add Account
              </Button>
            </div>

            {showModal && (
              <AddAccountModal
                token={token!}
                onClose={() => setShowModal(false)}
                onCreated={() => { setShowModal(false); fetchAccounts(); }}
              />
            )}

            <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-card/50">
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">ID</th>
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Phone</th>
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Username</th>
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Name</th>
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Balance</th>
                      <th className="px-6 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((account) => (
                      <tr key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                        <td className="px-6 py-4 text-gray-300 font-mono">{account.id}</td>
                        <td className="px-6 py-4">
                          <Link href={`/admin/accounts/${account.phone}`} className="text-primary font-display font-bold hover:underline">
                            +91 {account.phone}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{account.username ? `@${account.username}` : "—"}</td>
                        <td className="px-6 py-4 text-gray-300"><div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-500" />{account.name ?? "—"}</div></td>
                        <td className="px-6 py-4"><div className="flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /><span className="font-display font-bold text-white">₹{account.balance}</span></div></td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${ROLE_STYLE[account.role] ?? ROLE_STYLE.player}`}>
                            {account.role ?? "player"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No accounts found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* BOOKINGS TAB */}
        {tab === "bookings" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-500 text-sm">All booking requests from customers. Confirm or cancel each one.</p>
              <button onClick={fetchBookings} className="text-xs text-gray-500 hover:text-primary transition-colors uppercase tracking-wider">↻ Refresh</button>
            </div>

            {bookings.length === 0 ? (
              <div className="glass-panel border border-white/10 rounded-xl p-16 text-center">
                <CalendarCheck className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500">No bookings yet.</p>
              </div>
            ) : (
              <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/10 bg-card/50">
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Customer</th>
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Game</th>
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Date</th>
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Time Slot</th>
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Status</th>
                        <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-5 py-4">
                            <div className="text-white font-bold">{b.name ?? "—"}</div>
                            <div className="text-xs text-gray-500">+91 {b.phone}</div>
                          </td>
                          <td className="px-5 py-4 text-gray-300 font-medium">{b.game}</td>
                          <td className="px-5 py-4 text-gray-300">{formatISTDate(b.bookingDate, { day: "numeric", month: "short", year: "numeric" })}</td>
                          <td className="px-5 py-4 text-gray-300 text-sm">{b.timeSlot}</td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase border ${statusColor(b.status)}`}>
                              {b.status.replace("_", " ")}
                            </span>
                            {b.paymentStatus === "pending_cash" && (
                              <button
                                onClick={() => markCashPaid(b.id)}
                                className="ml-2 px-2 py-1 rounded-full text-xs font-bold uppercase border text-orange-400 bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20 transition-colors"
                                title="Mark cash payment received"
                              >
                                Cash Due · Mark Paid
                              </button>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2 flex-wrap">
                              {b.status !== "confirmed" && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, "confirmed")}
                                  className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
                                  title="Confirm"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              {b.status !== "cancelled" && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, "cancelled")}
                                  className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                                  title="Cancel"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              {b.status !== "completed" && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, "completed")}
                                  className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                  title="Mark Completed"
                                >
                                  <CalendarCheck className="w-4 h-4" />
                                </button>
                              )}
                              {b.status !== "no_show" && (
                                <button
                                  onClick={() => updateBookingStatus(b.id, "no_show")}
                                  className="p-1.5 rounded-lg bg-gray-500/10 border border-gray-500/30 text-gray-400 hover:bg-gray-500/20 transition-colors"
                                  title="Mark No Show"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function AddAccountModal({ token, onClose, onCreated }: { token: string; onClose: () => void; onCreated: () => void }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("0");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (phone.length !== 10) return setErr("Phone must be 10 digits");
    if (password.length < 8) return setErr("Password must be at least 8 characters");
    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return setErr("Username must be 3–20 characters: letters, numbers, or underscores only");
    }
    setSaving(true);
    const res = await fetch(`${BASE}/api/admin/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone, password, username: username || undefined, name: name || undefined, balance: Number(balance) || 0 }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErr(data.error ?? "Failed");
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel border border-primary/30 rounded-2xl p-8 w-full max-w-md relative z-10 box-glow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display font-bold text-white tracking-wider">Add Account</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Phone</Label>
            <div className="flex">
              <div className="bg-card border border-white/10 border-r-0 rounded-l-md px-3 flex items-center text-gray-400 font-display text-sm shrink-0">+91</div>
              <Input className="bg-card border-white/10 rounded-l-none h-10" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Password</Label>
            <Input type="password" className="bg-card border-white/10 h-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Username (optional)</Label>
            <Input className="bg-card border-white/10 h-10" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="3–20 chars: letters, numbers, _" />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Name (optional)</Label>
            <Input className="bg-card border-white/10 h-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Player name" />
          </div>
          <div className="space-y-1">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Initial Balance</Label>
            <Input type="number" className="bg-card border-white/10 h-10" value={balance} onChange={(e) => setBalance(e.target.value)} />
          </div>
          {err && <p className="text-red-400 text-sm">{err}</p>}
          <Button type="submit" disabled={saving} className="w-full h-10 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90">
            {saving ? "Creating..." : "Create Account"}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
