import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function AdminLogin() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`${BASE}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      return setError(data.error ?? "Login failed");
    }

    localStorage.setItem("rgz_admin_token", data.token);
    setLocation("/admin/accounts");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden items-center justify-center">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-[500px] bg-primary/5 blur-[150px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel border border-red-500/30 rounded-2xl overflow-hidden box-glow relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

        <div className="text-center pt-8 px-8 pb-4">
          <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white tracking-wider mb-1">Admin Panel</h2>
          <p className="text-gray-400 text-sm">Authorized access only</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Phone Number</Label>
            <div className="flex">
              <div className="bg-card border border-white/10 border-r-0 rounded-l-md px-4 flex items-center text-gray-400 font-display text-lg shrink-0">
                +91
              </div>
              <Input
                type="tel"
                placeholder="10-digit number"
                className="bg-card border-white/10 rounded-l-none font-display text-lg h-12 focus-visible:ring-red-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-xs uppercase tracking-wider">Password</Label>
            <div className="relative">
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Admin password"
                className="bg-card border-white/10 font-display h-12 focus-visible:ring-red-500 pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            disabled={phone.length < 10 || !password || loading}
            className="w-full h-12 bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-black font-bold tracking-widest uppercase transition-all"
          >
            {loading ? "Authenticating..." : "Enter Admin Panel"}
          </Button>
        </form>
      </motion.div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-gray-500 hover:text-primary text-sm transition-colors">
          Back to Royal Gaming Zone
        </Link>
      </div>
    </div>
  );
}
