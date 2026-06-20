import { Link, useLocation } from "react-router-dom";
import { Camera, Home, ShoppingCart, BarChart3, Settings, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { loadBasket } from "@/utils/basketStorage";
import { ThemeToggleCompact } from "@/components/ThemeToggle";
import { Logo, Wordmark } from "@/components/Logo";
import { DS } from "@/styles/design-tokens";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/basket", label: "Basket", icon: ShoppingCart },
  { path: "/scan", label: "Scan", icon: Camera },
  { path: "/dashboard", label: "History", icon: BarChart3 },
  { path: "/about", label: "About", icon: Info },
  { path: "/preferences", label: "Values", icon: Settings },
];

export function Header() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [basketCount, setBasketCount] = useState(() => loadBasket().length);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = () => setBasketCount(loadBasket().length);
    window.addEventListener("basketUpdated", handler);
    return () => window.removeEventListener("basketUpdated", handler);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        background: isScrolled ? "hsl(var(--background) / 0.94)" : "hsl(var(--background) / 0.6)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: isScrolled ? `1px solid ${DS.hair}` : "1px solid transparent",
        transition: "all 0.2s",
        paddingTop: "env(safe-area-inset-top)",
        fontFamily: DS.font,
      }}
    >
      {/* Mobile header */}
      <div className="md:hidden" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 48 }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <Logo size={26} />
          <Wordmark fontSize={17} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ThemeToggleCompact />
          <Link
            to="/basket"
            aria-label="Shopping basket"
            style={{
              position: "relative",
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 10,
              background: location.pathname === "/basket" ? DS.hair : "transparent",
              color: location.pathname === "/basket" ? DS.ink : DS.muted,
              textDecoration: "none",
            }}
          >
            <ShoppingCart style={{ width: 18, height: 18 }} strokeWidth={2} />
            {basketCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                minWidth: 16, height: 16, padding: "0 4px",
                borderRadius: 99, background: DS.ink, color: DS.card,
                fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {basketCount}
              </span>
            )}
          </Link>
          <Link
            to="/scan"
            aria-label="Scan a product"
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 10,
              background: DS.ink, color: DS.card,
              textDecoration: "none", fontSize: 12, fontWeight: 700,
            }}
          >
            <Camera style={{ width: 14, height: 14 }} strokeWidth={2.2} />
            Scan
          </Link>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:flex" style={{ maxWidth: 1200, margin: "0 auto", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 24px" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Logo size={30} />
          <Wordmark fontSize={19} />
        </Link>
        <nav style={{ display: "flex", alignItems: "center", gap: 4 }} aria-label="Main navigation">
          {navItems.filter(i => i.path !== "/scan").map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 12px", borderRadius: 8,
                  fontSize: 14, fontWeight: 500, textDecoration: "none",
                  background: isActive ? DS.hair : "transparent",
                  color: isActive ? DS.ink : DS.muted,
                }}
              >
                <item.icon style={{ width: 14, height: 14 }} />
                {item.label}
              </Link>
            );
          })}
          <ThemeToggleCompact />
          <Link
            to="/scan"
            style={{
              marginLeft: 4,
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 16px", borderRadius: 10,
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              background: DS.ink, color: DS.card,
            }}
          >
            <Camera style={{ width: 14, height: 14 }} />
            Scan Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
