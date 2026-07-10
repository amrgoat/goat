import { Link, useLocation } from "wouter";
import { Menu, X, Gamepad2, User, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function useAuth() {
  const [user, setUser] = useState<{ phone: string; name: string | null } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("rgz_token");
    const phone = localStorage.getItem("rgz_phone");
    if (!token || !phone) { setUser(null); return; }

    setUser({ phone, name: localStorage.getItem("rgz_name") });

    fetch(`${BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.name !== undefined) {
          localStorage.setItem("rgz_name", data.name ?? "");
          setUser({ phone, name: data.name });
        }
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem("rgz_token");
    localStorage.removeItem("rgz_phone");
    localStorage.removeItem("rgz_name");
    setUser(null);
    window.location.href = "/";
  };

  return { user, logout };
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  /* ── Secret owner access: 5 rapid clicks on the logo ── */
  const logoTaps = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function handleLogoClick(e: React.MouseEvent) {
    e.preventDefault(); // always intercept; we handle navigation ourselves
    logoTaps.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    if (logoTaps.current >= 5) {
      logoTaps.current = 0;
      navigate("/admin");
      return;
    }
    // Navigate home on taps 1-4
    navigate("/");
    tapTimer.current = setTimeout(() => { logoTaps.current = 0; }, 2000);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Gaming Zones", href: "/#zones" },
    { name: "Games", href: "/#games" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Menu", href: "/menu" },
    { name: "Gallery", href: "/#gallery" },
    { name: "Contact", href: "/#contact" },
  ];

  const displayName = user?.name?.trim() || user?.phone;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-panel-heavy py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" onClick={handleLogoClick}>
          <Gamepad2 className="w-8 h-8 text-primary group-hover:animate-pulse" />
          <div className="font-display font-bold text-2xl tracking-widest text-white text-glow">
            ROYAL GAMING ZONE
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                {link.href.startsWith("/#") ? (
                  <a href={link.href} className="text-sm font-medium text-gray-300 hover:text-primary transition-colors uppercase tracking-wider">
                    {link.name}
                  </a>
                ) : (
                  <Link href={link.href} className="text-sm font-medium text-gray-300 hover:text-primary transition-colors uppercase tracking-wider">
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>

          {user ? (
            <div className="flex items-center gap-3">
              <Link href="/customer-portal">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-primary/30 flex items-center justify-center text-primary text-xs font-bold">
                    {(displayName ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white max-w-[120px] truncate">{displayName}</span>
                </div>
              </Link>
              <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/customer-portal">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-black gap-2 box-glow">
                <User className="w-4 h-4" />
                PORTAL
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button className="md:hidden text-gray-300 hover:text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel absolute top-full left-0 right-0 border-t border-primary/20 py-4 px-4 flex flex-col gap-4">
          {navLinks.map((link) => (
            <div key={link.name}>
              {link.href.startsWith("/#") ? (
                <a href={link.href} className="block text-lg font-medium text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>
                  {link.name}
                </a>
              ) : (
                <Link href={link.href} className="block text-lg font-medium text-gray-300 hover:text-primary py-2" onClick={() => setMobileMenuOpen(false)}>
                  {link.name}
                </Link>
              )}
            </div>
          ))}

          {user ? (
            <div className="flex flex-col gap-2 mt-2">
              <Link href="/customer-portal" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/10">
                  <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-primary font-bold">
                    {(displayName ?? "?")[0].toUpperCase()}
                  </div>
                  <span className="text-white font-medium">{displayName}</span>
                </div>
              </Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-red-400 py-2 text-sm">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          ) : (
            <Link href="/customer-portal" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-primary text-black hover:bg-primary/90 mt-2">
                CUSTOMER PORTAL
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
