import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Shield, LogOut, Users, Wallet, CreditCard, Send, Bell, ScrollText, ChevronDown } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef    = useRef<HTMLDivElement>(null);

  const current = LINKS.find(
    (l) =>
      location === l.href ||
      (l.href === "/admin/accounts" && location.startsWith("/admin/accounts"))
  ) ?? LINKS[0];

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // Keyboard: Escape closes and returns focus to trigger
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    setLocation(href);
    triggerRef.current?.focus();
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("rgz_admin_token");
    setLocation("/admin");
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/8">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">

        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <Shield className="w-4 h-4 text-red-400" />
          <span className="font-display font-bold text-sm tracking-widest text-white/70 uppercase">
            Admin
          </span>
        </div>

        <div className="w-px h-5 bg-white/10 shrink-0" />

        {/* Section picker */}
        <div className="relative flex-1">
          <button
            ref={triggerRef}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls="admin-nav-menu"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/12 border border-red-500/25 text-red-400 text-sm font-semibold transition-all hover:bg-red-500/18"
          >
            <current.icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
            {current.label}
            <ChevronDown
              className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>

          {open && (
            <div
              id="admin-nav-menu"
              ref={menuRef}
              role="menu"
              aria-label="Admin sections"
              className="absolute left-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[#0f0f17]/95 backdrop-blur-md shadow-2xl shadow-black/60 overflow-hidden"
            >
              {LINKS.map(({ href, label, icon: Icon }) => {
                const active =
                  location === href ||
                  (href === "/admin/accounts" && location.startsWith("/admin/accounts"));
                return (
                  <button
                    key={href}
                    role="menuitem"
                    onClick={() => navigate(href)}
                    aria-current={active ? "page" : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-red-500/15 text-red-400"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden />
                    {label}
                    {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-400" aria-hidden />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-red-500/8 border border-transparent hover:border-red-500/20 transition-all shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" aria-hidden />
          Logout
        </button>

      </div>
    </header>
  );
}
