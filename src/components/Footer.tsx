import { Leaf } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block border-t border-border/50 bg-muted/30 py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-hero flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-foreground">
              Good<span className="text-primary">Scan</span>
            </span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6" aria-label="Footer navigation">
            {[
              { to: "/", label: "Home" },
              { to: "/basket", label: "Basket" },
              { to: "/scan", label: "Scan" },
              { to: "/dashboard", label: "History" },
              { to: "/preferences", label: "Priorities" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground/70">
            © {currentYear} GoodScan
          </p>
        </div>
      </div>
    </footer>
  );
}
