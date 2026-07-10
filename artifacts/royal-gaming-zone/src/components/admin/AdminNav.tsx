import { Link, useLocation } from "wouter";
import { Shield, LogOut, Users, Wallet, CreditCard, Send, Bell, ScrollText } from "lucide-react";

const LINKS = [
  { href: "/admin/accounts",              label: "Accounts",      icon: Users       },
  { href: "/admin/recharge",              label: "Recharge",      icon: Wallet      },
  { href: "/admin/payment",               label: "Payment",       icon: CreditCard  },
  { href: "/admin/telegram-settings",     label: "Telegram",      icon: Send        },
  { href: "/admin/notification-settings", label: "Notifications", icon: Bell        },
  { href: "/admin/audit-log",             label: "Audit Log",     icon: ScrollText  },
];

export default function AdminNav() {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("rgz_admin_token");
    setLocation("/admin");
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/8">
      <div className="container mx-auto px-4 h-14 flex items-center gap-4">

        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0 mr-2">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="font-display font-bold text-sm tracking-widest text-white/80 uppercase">
            Admin
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Nav links — scrollable on small screens */}
        <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active =
              location === href ||
              (href === "/admin/accounts" && location.startsWith("/admin/accounts"));
            return (
              <Link key={href} href={href}>
                <button
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? "bg-red-500/15 text-red-400 border border-red-500/25"
                      : "text-gray-400 hover:text-white hover:bg-white/6 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>
    </header>
  );
}
