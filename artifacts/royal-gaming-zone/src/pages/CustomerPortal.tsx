import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gamepad2, Wallet, Clock, History, LogOut, ChevronRight, Lock, Eye, EyeOff, TrendingUp, TrendingDown, CalendarPlus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatISTDate, formatISTTime } from "@/lib/ist-time";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiPost(path: string, body: object) {
  const res = await fetch(`${BASE}/api/auth${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${BASE}/api/auth${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function apiGetBookings(token: string) {
  const res = await fetch(`${BASE}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

type SubMode = "login" | "register";

interface UserProfile {
  id: number;
  phone: string;
  username: string | null;
  name: string | null;
  balance: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface Booking {
  id: number;
  game: string;
  bookingDate: string;
  timeSlot: string;
  status: string;
  createdAt: string;
}

export default function CustomerPortal() {
  const [token, setToken] = useState(() => localStorage.getItem("rgz_token") ?? "");
  const [loggedPhone, setLoggedPhone] = useState(() => localStorage.getItem("rgz_phone") ?? "");

  const isLoggedIn = !!token;

  const handleAuthSuccess = useCallback((t: string, p: string, u?: string) => {
    localStorage.setItem("rgz_token", t);
    localStorage.setItem("rgz_phone", p);
    if (u) localStorage.setItem("rgz_username", u);
    setToken(t);
    setLoggedPhone(p);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("rgz_token");
    localStorage.removeItem("rgz_phone");
    localStorage.removeItem("rgz_username");
    setToken("");
    setLoggedPhone("");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>

      <header className="glass-panel-heavy py-4 relative z-20 border-b border-primary/20">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Gamepad2 className="w-6 h-6 text-primary" />
            <div className="font-display font-bold text-xl tracking-widest text-white">
              RGZ <span className="text-primary opacity-80">|</span> PORTAL
            </div>
          </Link>
          {isLoggedIn && (
            <Button variant="ghost" className="text-gray-400 hover:text-white" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12 relative z-10 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {!isLoggedIn ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md"
            >
              <AuthPanel onSuccess={handleAuthSuccess} />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Dashboard phone={loggedPhone} token={token} onLogout={handleLogout} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function AuthPanel({ onSuccess }: { onSuccess: (token: string, phone: string, username?: string) => void }) {
  const [subMode, setSubMode] = useState<SubMode>("login");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (m: SubMode) => {
    setSubMode(m);
    setError("");
    setPassword("");
    setUsername("");
  };

  const usernameValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (subMode === "register") {
      if (password.length < 8) return setError("Password must be at least 8 characters");
      if (!usernameValid) return setError("Username must be 3–20 characters: letters, numbers, or underscores only");
    }
    setLoading(true);
    const path = subMode === "login" ? "/login" : "/register";
    const body = subMode === "register" ? { phone, username, password } : { phone, password };
    const { ok, data } = await apiPost(path, body);
    setLoading(false);
    if (!ok) return setError(data.error ?? "Something went wrong");
    onSuccess(data.token, data.phone, data.username);
  };

  return (
    <div className="glass-panel border border-primary/30 rounded-2xl overflow-hidden box-glow relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => switchMode("login")}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${subMode === "login" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-gray-400 hover:text-white"}`}
          data-testid="tab-login"
        >
          Login
        </button>
        <button
          onClick={() => switchMode("register")}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${subMode === "register" ? "text-primary border-b-2 border-primary bg-primary/5" : "text-gray-400 hover:text-white"}`}
          data-testid="tab-register"
        >
          Create Account
        </button>
      </div>

      <div className="p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-wider mb-1">
            {subMode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-gray-400 text-sm">
            {subMode === "login" ? "Login with your phone and password" : "Choose a username and sign up"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username — register only */}
          {subMode === "register" && (
            <div className="space-y-2">
              <Label className="text-gray-300 text-xs uppercase tracking-wider">Username</Label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="e.g. ProGamer_99"
                  maxLength={20}
                  className={`bg-card border-white/10 font-display h-12 focus-visible:ring-primary pr-10 ${
                    username.length > 0 ? (usernameValid ? "border-green-500/40" : "border-red-500/40") : ""
                  }`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
                  required
                  data-testid="input-username"
                />
                {username.length > 0 && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold ${usernameValid ? "text-green-400" : "text-red-400"}`}>
                    {usernameValid ? "✓" : "✗"}
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-[11px]">Letters, numbers, underscores · 3–20 chars · no spaces</p>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Phone Number</Label>
            <div className="flex">
              <div className="bg-card border border-white/10 border-r-0 rounded-l-md px-4 flex items-center text-gray-400 font-display text-lg shrink-0">
                +91
              </div>
              <Input
                type="tel"
                placeholder="10-digit number"
                className="bg-card border-white/10 rounded-l-none font-display text-lg h-12 focus-visible:ring-primary"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                data-testid="input-phone"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder={subMode === "register" ? "Min 8 characters" : "Your password"}
                className="bg-card border-white/10 font-display h-12 focus-visible:ring-primary pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <Button
            type="submit"
            disabled={
              phone.length < 10 ||
              password.length < (subMode === "register" ? 8 : 1) ||
              (subMode === "register" && !usernameValid) ||
              loading
            }
            className="w-full h-12 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90 box-glow-hover transition-all"
            data-testid="button-submit"
          >
            {loading ? "Please wait..." : subMode === "login" ? "Login" : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  if (status === "confirmed") return { icon: <CheckCircle className="w-4 h-4" />, text: "Confirmed", cls: "text-green-400 bg-green-500/10 border-green-500/30" };
  if (status === "cancelled") return { icon: <XCircle className="w-4 h-4" />, text: "Cancelled", cls: "text-red-400 bg-red-500/10 border-red-500/30" };
  if (status === "completed") return { icon: <CheckCircle className="w-4 h-4" />, text: "Completed", cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
  if (status === "no_show") return { icon: <XCircle className="w-4 h-4" />, text: "No Show", cls: "text-gray-400 bg-gray-500/10 border-gray-500/30" };
  return { icon: <AlertCircle className="w-4 h-4" />, text: "Pending Approval", cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" };
}

function Dashboard({ phone, token, onLogout }: { phone: string; token: string; onLogout: () => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profileRes, txRes, bookingRes] = await Promise.all([
        apiGet("/me", token),
        apiGet("/transactions", token),
        apiGetBookings(token),
      ]);
      if (profileRes.ok) setProfile(profileRes.data);
      if (txRes.ok) setTransactions(txRes.data.transactions ?? []);
      if (bookingRes.ok) setBookings(bookingRes.data.bookings ?? []);
      setLoading(false);
    }
    load();
  }, [token]);

  const balance = profile?.balance ?? 0;

  // Upcoming = today or tomorrow, not cancelled
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  const upcomingBookings = bookings.filter(
    (b) => (b.bookingDate === today || b.bookingDate === tomorrow) && b.status !== "cancelled"
  );
  const latestUpcoming = upcomingBookings[0] ?? null;

  return (
    <>
      <div className="space-y-6 md:col-span-1">
        <div className="glass-panel border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/50 text-xl font-display font-bold uppercase">
              {(profile?.username ?? profile?.name ?? phone)?.[0] ?? "?"}
            </div>
            <div>
              {profile?.username && (
                <p className="text-primary text-xs font-bold uppercase tracking-widest leading-none mb-0.5">@{profile.username}</p>
              )}
              <h3 className="text-white font-bold tracking-wide">
                {profile?.name ?? profile?.username ?? "Player"}
                {profile?.id && (
                  <span className="ml-2 text-gray-500 font-mono text-xs font-normal">#{profile.id}</span>
                )}
              </h3>
              <p className="text-xs text-gray-400">+91 {phone}</p>
            </div>
          </div>
          <Separator className="bg-white/10 my-4" />
          <Button variant="ghost" size="sm" className="w-full text-gray-400 hover:text-white hover:bg-white/5 mt-1" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="glass-panel border border-primary/30 bg-primary/5 rounded-xl p-6 relative overflow-hidden box-glow">
          <div className="absolute -right-6 -top-6 text-primary/10">
            <Wallet className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Wallet className="w-5 h-5" />
              <span className="font-display font-bold uppercase tracking-wider text-sm">Wallet Balance</span>
            </div>
            {loading ? (
              <div className="text-4xl font-display font-bold text-white mb-6 animate-pulse">...</div>
            ) : (
              <div className="text-4xl font-display font-bold text-white mb-6">₹{balance}</div>
            )}
            <p className="text-gray-500 text-xs">Contact staff to recharge your wallet</p>
          </div>
        </div>

        {/* Upcoming Session */}
        <div className="glass-panel border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 text-gray-400 mb-3">
            <Clock className="w-4 h-4" />
            <span className="font-display font-bold uppercase tracking-wider text-sm">Upcoming Session</span>
          </div>
          {loading ? (
            <p className="text-gray-600 text-sm animate-pulse">Loading...</p>
          ) : latestUpcoming ? (
            <div className="space-y-2">
              <p className="text-white font-bold text-sm">{latestUpcoming.game}</p>
              <p className="text-gray-400 text-xs">{latestUpcoming.bookingDate === today ? "Today" : "Tomorrow"} · {latestUpcoming.timeSlot}</p>
              {(() => {
                const badge = statusBadge(latestUpcoming.status);
                return (
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold uppercase ${badge.cls}`}>
                    {badge.icon}
                    {badge.text}
                  </span>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming session</p>
          )}
        </div>

        <Link href="/booking">
          <Button className="w-full h-12 bg-primary text-black font-bold tracking-widest uppercase hover:bg-primary/90 box-glow gap-2">
            <CalendarPlus className="w-4 h-4" />
            Book a Session
          </Button>
        </Link>
      </div>

      <div className="md:col-span-2 glass-panel border border-white/10 rounded-xl p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-white">
            <History className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-xl tracking-wider uppercase text-glow">Recent Activity</h3>
          </div>
        </div>

        <div className="flex-grow space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-primary font-display animate-pulse">Loading history...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="w-12 h-12 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">No transactions yet.</p>
              <p className="text-gray-600 text-xs mt-1">Your wallet activity will appear here.</p>
            </div>
          ) : (
            transactions.map((tx, i) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg bg-card border border-white/5 hover:border-white/10 transition-colors"
                data-testid={`row-history-${i}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-400"}`}>
                    {tx.type === "credit" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-white font-medium">{tx.description}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span>{formatISTDate(tx.createdAt)} at {formatISTTime(tx.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className={`font-display font-bold text-lg ${tx.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                  {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
