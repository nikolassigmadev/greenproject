import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, Info, SlidersHorizontal } from "lucide-react";
import { DS } from "@/styles/design-tokens";

const NAV_LEFT = [
  { path: "/",            label: "Home",    icon: Home    },
  { path: "/dashboard",   label: "History", icon: Clock   },
];

const NAV_RIGHT = [
  { path: "/preferences", label: "Values",  icon: SlidersHorizontal },
  { path: "/about",       label: "About",   icon: Info    },
];

function ScanIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1.5"/>
      <rect x="18.5" y="3.5" width="6" height="6" rx="1.5"/>
      <rect x="3.5" y="18.5" width="6" height="6" rx="1.5"/>
      <rect x="18.5" y="18.5" width="6" height="6" rx="1.5"/>
      <path d="M14 8v12"/>
    </svg>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav"
      aria-label="Main navigation"
      style={{
        background: DS.card,
        borderTop: `1px solid ${DS.hair}`,
        paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)",
      }}
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.3fr 1fr 1fr",
        padding: "10px 12px 0",
      }}>
        {/* Left items */}
        {NAV_LEFT.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          const c = active ? DS.ink : DS.muted;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon style={{ width: 22, height: 22, color: c, strokeWidth: 1.8 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: c }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Centre SCAN button — raised */}
        <button
          onClick={() => navigate("/scan")}
          aria-label="Scan a product"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            background: DS.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: -22,
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          }}>
            <ScanIcon color={DS.card} />
          </div>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: DS.ink,
            marginTop: 4,
          }}>Scan</span>
        </button>

        {/* Right items */}
        {NAV_RIGHT.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          const c = active ? DS.ink : DS.muted;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon style={{ width: 22, height: 22, color: c, strokeWidth: 1.8 }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: c }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
