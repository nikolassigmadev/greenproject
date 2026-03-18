import { Link, useLocation } from "react-router-dom";
import { Leaf, Camera, Home, ShoppingBag, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/products", label: "Browse", icon: ShoppingBag },
  { path: "/scan", label: "Scan", icon: Camera },
  { path: "/dashboard", label: "History", icon: BarChart3 },
  { path: "/preferences", label: "Priorities", icon: Settings },
];

export function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-200",
        isScrolled
          ? "bg-background/94 backdrop-blur-2xl border-b border-border/40 shadow-[0_1px_12px_-2px_hsl(150_20%_20%/0.08)]"
          : "bg-background/60 backdrop-blur-xl border-b border-transparent"
      )}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      {/* ── Mobile header ── */}
      <div className="md:hidden flex items-center justify-between px-4 h-12">
        {/* Logo mark */}
        <Link to="/" className="flex items-center gap-2 group">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-150 group-active:scale-90"
            style={{
              background: "linear-gradient(145deg, hsl(152 52% 28%) 0%, hsl(148 55% 38%) 100%)",
              boxShadow: "0 2px 8px hsl(152 52% 28% / 0.35)",
            }}
          >
            <Leaf className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-base text-foreground">
            Ethical<span className="text-primary">Shopper</span>
          </span>
        </Link>

        {/* Scan shortcut — top right */}
        <Link
          to="/scan"
          aria-label="Scan a product"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95",
            location.pathname === "/scan"
              ? "bg-primary/15 text-primary"
              : "bg-primary text-primary-foreground shadow-[0_2px_10px_hsl(152_52%_28%/0.35)]"
          )}
        >
          <Camera className="w-3.5 h-3.5" strokeWidth={2.2} />
          Scan
        </Link>
      </div>

      {/* ── Desktop header ── */}
      <div className="hidden md:flex container items-center justify-between h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
            style={{
              background: "linear-gradient(145deg, hsl(152 52% 28%) 0%, hsl(148 55% 38%) 100%)",
              boxShadow: "0 2px 12px hsl(152 52% 28% / 0.35)",
            }}
          >
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            Ethical<span className="text-primary">Shopper</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="flex items-center gap-0.5" aria-label="Main navigation">
          {navItems.filter(i => i.path !== "/scan").map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Scan CTA */}
          <Link
            to="/scan"
            className="ml-2 flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, hsl(152 52% 28%) 0%, hsl(148 55% 38%) 100%)",
              color: "#ffffff",
              boxShadow: "0 2px 12px hsl(152 52% 28% / 0.35)",
            }}
          >
            <Camera className="w-3.5 h-3.5" />
            Scan Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
