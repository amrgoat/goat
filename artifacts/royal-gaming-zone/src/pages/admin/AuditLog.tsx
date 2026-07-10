import { useState, useEffect } from "react";
import { ScrollText } from "lucide-react";
import { useLocation } from "wouter";
import AdminNav from "@/components/admin/AdminNav";
import { formatISTDate, formatISTTime } from "@/lib/ist-time";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface AuditEntry {
  id: number;
  adminName: string;
  action: string;
  targetUser: string | null;
  details: string | null;
  createdAt: string;
}

export default function AuditLog() {
  const [, setLocation] = useLocation();
  const token = localStorage.getItem("rgz_admin_token");
  if (!token) setLocation("/admin");

  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/api/settings/audit-log`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => { setLogs(data.logs ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-[500px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none"></div>
      <AdminNav />

      <main className="container mx-auto px-4 py-8 relative z-10">
        <h1 className="font-display font-bold text-2xl text-white tracking-wider mb-2 flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-purple-400" /> Audit Log
        </h1>
        <p className="text-gray-500 text-sm mb-6">Every admin action, who performed it, on whom, and when.</p>

        {loading ? (
          <div className="text-primary font-display animate-pulse">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="glass-panel border border-white/10 rounded-xl p-16 text-center">
            <ScrollText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">No admin actions logged yet.</p>
          </div>
        ) : (
          <div className="glass-panel border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 bg-card/50">
                    <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">When</th>
                    <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Admin</th>
                    <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Action</th>
                    <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Target</th>
                    <th className="px-5 py-4 text-xs text-gray-400 uppercase tracking-wider font-display">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                        {formatISTDate(l.createdAt)}{" "}
                        {formatISTTime(l.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-white font-bold text-sm">{l.adminName}</td>
                      <td className="px-5 py-4"><span className="px-2 py-1 rounded-full text-xs font-bold uppercase border text-primary bg-primary/10 border-primary/30">{l.action}</span></td>
                      <td className="px-5 py-4 text-gray-300 text-sm">{l.targetUser ?? "—"}</td>
                      <td className="px-5 py-4 text-gray-400 text-sm">{l.details ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
