import { Link, useLocation } from "react-router-dom";
import { Leaf, Menu, X, Camera, Settings, BarChart3, ShoppingBag, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-transparent bg-background/80 backdrop-blur-xl transition-all duration-300",
        isScrolled && "border-border/50 shadow-soft bg-background/96"
      )}
    >
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-hero flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            Ethical<span className="text-primary">Shopper</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/scan"
            className="ml-2 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all duration-200 shadow-soft hover:shadow-card"
          >
            <Camera className="w-3.5 h-3.5" />
            Scan Now
          </Link>
        </nav>

        {/* Mobile: hamburger (visible only when needed for extra nav) */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden w-9 h-9"
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* Mobile dropdown (preferences + database — not in bottom nav) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/97 backdrop-blur-xl animate-fade-in">
          <nav className="container py-3 space-y-0.5" aria-label="Extended navigation">
            {[
              { path: "/preferences", label: "My Priorities", icon: Settings },
              { path: "/database", label: "Food Database", icon: ShoppingBag },
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
