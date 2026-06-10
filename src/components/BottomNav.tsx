import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Clock, Info, SlidersHorizontal } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

// ───────────────────────────────────────────────────────────────────────────
// BottomNav is mounted ONCE inside RootLayout so it survives every page
// navigation — no flicker, no remount. Pages that need to slide it away
// (currently only /scan during camera capture) reach in via this context
// and set `hidden`. On unmount the page restores `hidden = false`.
// ───────────────────────────────────────────────────────────────────────────
interface BottomNavContextValue {
  hidden: boolean;
  setHidden: (hidden: boolean) => void;
}

const BottomNavContext = createContext<BottomNavContextValue>({
  hidden: false,
  setHidden: () => {},
});

export function useBottomNav(): BottomNavContextValue {
  return useContext(BottomNavContext);
}

export function BottomNavProvider({ children }: { children: ReactNode }) {
  const [hidden, setHiddenState] = useState(false);
  const setHidden = useCallback((next: boolean) => setHiddenState(next), []);
  return (
    <BottomNavContext.Provider value={{ hidden, setHidden }}>
      {children}
    </BottomNavContext.Provider>
  );
}

const BRAND_GREEN = "#3DBA82";
const ICON_IDLE = "rgba(255,255,255,0.62)";
const ACTIVE_BG = "rgba(61,186,130,0.16)";

const NAV_LEFT = [
  { path: "/",          label: "Home",    icon: Home  },
  { path: "/dashboard", label: "History", icon: Clock },
];

const NAV_RIGHT = [
  { path: "/preferences", label: "Values", icon: SlidersHorizontal },
  { path: "/about",       label: "About",  icon: Info              },
];

function ScanIcon({ color, size = 23 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" stroke={color} strokeWidth="1.9" strokeLinecap="round">
      <rect x="3.5" y="3.5" width="6" height="6" rx="1.5"/>
      <rect x="18.5" y="3.5" width="6" height="6" rx="1.5"/>
      <rect x="3.5" y="18.5" width="6" height="6" rx="1.5"/>
      <rect x="18.5" y="18.5" width="6" height="6" rx="1.5"/>
      <path d="M14 8v12"/>
    </svg>
  );
}

function cellStyle(): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textDecoration: "none",
    WebkitTapHighlightColor: "transparent",
  };
}

function activePillStyle(active: boolean): React.CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 34,
    borderRadius: 999,
    background: active ? ACTIVE_BG : "transparent",
    transition: "background 180ms ease",
  };
}

export function BottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { hidden } = useBottomNav();

  // When hidden, the pill slides straight down past the safe area and fades.
  // The /scan page controls this via useBottomNav(); every other page leaves
  // it false so the footer reads as a fixed element across navigation.
  const hiddenTransform =
    "translate(-50%, calc(100% + env(safe-area-inset-bottom, 0px) + 28px))";
  const visibleTransform = "translateX(-50%)";

  return (
    <nav
      className="md:hidden"
      aria-label="Main navigation"
      style={{
        position: "fixed",
        left: "50%",
        transform: hidden ? hiddenTransform : visibleTransform,
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition:
          "transform 540ms cubic-bezier(0.32, 0.72, 0, 1), opacity 320ms ease-out",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 22px)",
        // Sits in the document root now (rendered by RootLayout), so it has
        // to clear page-level fixed overlays — notably /scan at z 60.
        zIndex: 70,
        width: "calc(100% - 56px)",
        maxWidth: 360,
        height: 56,
        borderRadius: 999,
        background: "rgba(20,20,22,0.72)",
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 10px 30px rgba(0,0,0,0.32), 0 2px 8px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.06)",
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        alignItems: "center",
        padding: "0 4px",
      }}
    >
      {NAV_LEFT.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;
        const c = active ? BRAND_GREEN : ICON_IDLE;
        return (
          <Link key={item.path} to={item.path} aria-label={item.label} style={cellStyle()}>
            <span style={activePillStyle(active)}>
              <Icon
                style={{
                  width: 23,
                  height: 23,
                  color: c,
                  strokeWidth: active ? 2.4 : 1.9,
                  transition: "color 160ms ease, stroke-width 160ms ease",
                }}
              />
            </span>
          </Link>
        );
      })}

      <button
        onClick={() => navigate("/scan")}
        aria-label="Scan a product"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          ...cellStyle(),
        }}
      >
        <span style={activePillStyle(pathname === "/scan")}>
          <ScanIcon color={pathname === "/scan" ? BRAND_GREEN : ICON_IDLE} />
        </span>
      </button>

      {NAV_RIGHT.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.path;
        const c = active ? BRAND_GREEN : ICON_IDLE;
        return (
          <Link key={item.path} to={item.path} aria-label={item.label} style={cellStyle()}>
            <span style={activePillStyle(active)}>
              <Icon
                style={{
                  width: 23,
                  height: 23,
                  color: c,
                  strokeWidth: active ? 2.4 : 1.9,
                  transition: "color 160ms ease, stroke-width 160ms ease",
                }}
              />
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
