import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Camera, BarChart3, Info, Settings } from "lucide-react";

const BLUE = "#2979FF";
const GRAY = "#9CA3AF";

const NAV_ITEMS = [
  { path: "/",            label: "Home",    icon: Home     },
  { path: "/dashboard",   label: "History", icon: BarChart3 },
  { path: "/about",       label: "About",   icon: Info     },
  { path: "/preferences", label: "Values",  icon: Settings },
];

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scanActive = pathname === "/scan";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bottom-nav"
      aria-label="Main navigation"
    >
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.3fr 1fr 1fr",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 2px)",
        background: "#fff",
      }}>

        {/* Left nav items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
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
                padding: "10px 4px 8px",
                gap: 3,
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  color: active ? BLUE : GRAY,
                  strokeWidth: active ? 2.5 : 1.8,
                  transition: "color 0.15s",
                }}
              />
              <span style={{
                fontSize: "0.62rem",
                fontWeight: active ? 700 : 500,
                color: active ? BLUE : GRAY,
                letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  width: 24,
                  height: 2.5,
                  borderRadius: "0 0 3px 3px",
                  background: BLUE,
                }} />
              )}
            </Link>
          );
        })}

        {/* Centre SCAN button */}
        <button
          onClick={() => navigate("/scan")}
          aria-label="Scan a product"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "0",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingBottom: 8,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <div style={{
            marginTop: "-1.2rem",
            background: scanActive ? BLUE : BLUE,
            width: "3.5rem",
            height: "3.5rem",
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            boxShadow: `0 4px 16px rgba(41,121,255,0.45)`,
            transition: "box-shadow 0.2s, transform 0.15s",
          }}>
            <Camera style={{ width: 20, height: 20, color: "#fff", strokeWidth: 2 }} />
          </div>
          <span style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: scanActive ? BLUE : GRAY,
            marginTop: 4,
            letterSpacing: "0.01em",
          }}>Scan</span>
        </button>

        {/* Right nav items */}
        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;
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
                padding: "10px 4px 8px",
                gap: 3,
                WebkitTapHighlightColor: "transparent",
                position: "relative",
              }}
            >
              <Icon
                style={{
                  width: 20,
                  height: 20,
                  color: active ? BLUE : GRAY,
                  strokeWidth: active ? 2.5 : 1.8,
                  transition: "color 0.15s",
                }}
              />
              <span style={{
                fontSize: "0.62rem",
                fontWeight: active ? 700 : 500,
                color: active ? BLUE : GRAY,
                letterSpacing: "0.01em",
                transition: "color 0.15s",
              }}>
                {item.label}
              </span>
              {active && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  width: 24,
                  height: 2.5,
                  borderRadius: "0 0 3px 3px",
                  background: BLUE,
                }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
