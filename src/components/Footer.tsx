import { Link } from "react-router-dom";
import { DS } from "@/styles/design-tokens";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block" style={{
      borderTop: `1px solid ${DS.hair}`,
      background: DS.bg,
      padding: "32px 0",
      marginTop: "auto",
      fontFamily: DS.font,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 24 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="GoodScan" style={{ width: 22, height: 22, borderRadius: 5 }} />
            <span style={{ fontWeight: 700, color: DS.ink }}>GoodScan</span>
          </span>
          <nav style={{ display: "flex", alignItems: "center", gap: 24 }} aria-label="Footer navigation">
            {[
              { to: "/", label: "Home" },
              { to: "/basket", label: "Basket" },
              { to: "/scan", label: "Scan" },
              { to: "/dashboard", label: "History" },
              { to: "/preferences", label: "Values" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                style={{ fontSize: 14, color: DS.muted, textDecoration: "none" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p style={{ fontSize: 12, color: DS.muted, opacity: 0.7 }}>
            © {currentYear} GoodScan
          </p>
        </div>
      </div>
    </footer>
  );
}
