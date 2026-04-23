import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Camera, BarChart3, Info, Settings } from "lucide-react";

const D  = "'Bebas Neue', sans-serif";
const M  = "'JetBrains Mono', monospace";
const G  = "#00c853";
const GR = "#84898E";

const NAV_ITEMS = [
  { path: "/basket",      label: "CART",    icon: ShoppingCart, idx: "01" },
  { path: "/dashboard",   label: "HISTORY", icon: BarChart3,    idx: "02" },
  { path: "/about",       label: "ABOUT",   icon: Info,         idx: "04" },
  { path: "/preferences", label: "VALUES",  icon: Settings,     idx: "05" },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scanActive = pathname === "/scan";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Main navigation"
      style={{ fontFamily: M }}
    >
      {/* Top border — green line */}
      <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${G}, transparent)`, opacity: 0.5 }} />

      {/* Main bar */}
      <div style={{
        background: "#000",
        borderTop: `1px solid rgba(0,200,83,0.12)`,
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.4fr 1fr 1fr",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 4px)",
      }}>

        {/* Regular nav items — left two */}
        {NAV_ITEMS.slice(0, 2).map((item, i) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              padding: "10px 4px 10px",
              borderRight: `1px solid rgba(0,200,83,0.1)`,
              position: "relative",
              gap: 4,
              WebkitTapHighlightColor: "transparent",
            }}>
              {/* Active top bar */}
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
                  background: G, boxShadow: `0 0 8px rgba(0,200,83,0.8)`,
                }} />
              )}
              <span style={{
                fontFamily: M, fontSize: "0.36rem", color: active ? "rgba(0,200,83,0.5)" : "rgba(132,137,142,0.3)",
                letterSpacing: "0.1em", position: "absolute", top: 8, left: 6,
              }}>{item.idx}</span>
              <Icon style={{ width: 16, height: 16, color: active ? G : GR, strokeWidth: active ? 2 : 1.5 }} />
              <span style={{
                fontFamily: M, fontSize: "0.4rem", letterSpacing: "0.14em",
                color: active ? G : GR,
                textTransform: "uppercase",
              }}>{item.label}</span>
            </Link>
          );
        })}

        {/* Centre SCAN button */}
        <button
          onClick={() => navigate("/scan")}
          aria-label="Scan a product"
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "0",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            borderRight: `1px solid rgba(0,200,83,0.1)`,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{
            marginTop: "-1.4rem",
            background: scanActive ? G : "#000",
            border: `2px solid ${G}`,
            width: "3.6rem", height: "3.6rem",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 3,
            boxShadow: scanActive
              ? `0 0 24px rgba(0,200,83,0.7), 0 0 48px rgba(0,200,83,0.3)`
              : `0 0 12px rgba(0,200,83,0.25)`,
            transition: "box-shadow 0.2s, background 0.2s",
            position: "relative",
          }}>
            {/* Corner marks */}
            {(["tl","tr","bl","br"] as const).map(c => (
              <div key={c} style={{
                position: "absolute",
                [c.startsWith("t") ? "top" : "bottom"]: 3,
                [c.endsWith("l") ? "left" : "right"]: 4,
                fontFamily: "monospace", fontSize: 8,
                color: scanActive ? "rgba(0,0,0,0.4)" : "rgba(0,200,83,0.35)",
                userSelect: "none", lineHeight: 1,
              }}>+</div>
            ))}
            <Camera style={{ width: 18, height: 18, color: scanActive ? "#000" : G, strokeWidth: 1.5 }} />
            <span style={{
              fontFamily: D, fontSize: "0.75rem", letterSpacing: "0.08em", lineHeight: 1,
              color: scanActive ? "#000" : G,
            }}>SCAN</span>
          </div>
        </button>

        {/* Regular nav items — right two */}
        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
          return (
            <Link key={item.path} to={item.path} style={{
              textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end",
              padding: "10px 4px 10px",
              borderLeft: `1px solid rgba(0,200,83,0.1)`,
              position: "relative",
              gap: 4,
              WebkitTapHighlightColor: "transparent",
            }}>
              {active && (
                <div style={{
                  position: "absolute", top: 0, left: "20%", right: "20%", height: 2,
                  background: G, boxShadow: `0 0 8px rgba(0,200,83,0.8)`,
                }} />
              )}
              <span style={{
                fontFamily: M, fontSize: "0.36rem", color: active ? "rgba(0,200,83,0.5)" : "rgba(132,137,142,0.3)",
                letterSpacing: "0.1em", position: "absolute", top: 8, right: 6,
              }}>{item.idx}</span>
              <Icon style={{ width: 16, height: 16, color: active ? G : GR, strokeWidth: active ? 2 : 1.5 }} />
              <span style={{
                fontFamily: M, fontSize: "0.4rem", letterSpacing: "0.14em",
                color: active ? G : GR,
                textTransform: "uppercase",
              }}>{item.label}</span>
            </Link>
          );
        })}

      </div>
    </nav>
  );
}
