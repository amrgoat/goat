import { Link, useLocation } from "wouter";
import { Shield, LogOut, Users, CalendarCheck, Wallet, CreditCard, Send, Bell, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/admin/accounts", label: "Accounts", icon: Users },
  { href: "/admin/recharge", label: "Recharge Wallet", icon: Wallet },
  { href: "/admin/payment", label: "Payment", icon: CreditCard },
  { href: "/admin/telegram-settings", label: "Telegram", icon: Send },
  { href: "/admin/notification-settings", label: "Notifications", icon: Bell },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText },
];

export default function AdminNav() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("rgz_admin_token");
    setLocation("/admin");
  };

  return (
    <>
      <header className="glass-panel-heavy py-4 relative z-20 border-b border-white/10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-red-400" />
            <div className="font-display font-bold text-xl tracking-widest text-white">
              ADMIN <span className="text-red-400 opacity-80">|</span> PANEL
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </header>
      <div className="border-b border-white/10 bg-card/30 relative z-10 overflow-x-auto">
        <div className="container mx-auto px-4 flex gap-0 min-w-max">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href === "/admin/accounts" && location.startsWith("/admin/accounts"));
            return (
              <Link key={href} href={href} title={label}>
                <button
                  aria-label={label}
                  className={`px-5 py-4 border-b-2 transition-colors whitespace-nowrap ${
                    active ? "border-primary text-primary bg-primary/5" : "border-transparent text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
