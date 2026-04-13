import { useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, Camera, BarChart3, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/",          label: "Home",    icon: Home        },
  { path: "/basket",    label: "Basket",  icon: ShoppingCart },
  { path: "/scan",      label: "Scan",    icon: Camera, fab: true },
  { path: "/dashboard", label: "History", icon: BarChart3   },
  { path: "/receipt",   label: "Receipt", icon: Receipt     },
];

// Regular tab — uses InteractiveMenu CSS classes (.menu__item, .menu__icon, .menu__text)
function NavTab({ path, label, icon: Icon, isActive }: {
  path: string; label: string; icon: typeof Home; isActive: boolean;
}) {
  const itemRef = useRef<HTMLAnchorElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const setLineWidth = () => {
      if (itemRef.current && textRef.current) {
        itemRef.current.style.setProperty('--lineWidth', `${textRef.current.offsetWidth}px`);
      }
    };
    setLineWidth();
    window.addEventListener('resize', setLineWidth);
    return () => window.removeEventListener('resize', setLineWidth);
  }, [isActive, label]);

  return (
    <Link
      ref={itemRef}
      to={path}
      aria-current={isActive ? "page" : undefined}
      className={cn("menu__item", isActive && "active")}
      style={{ '--lineWidth': '0px' } as React.CSSProperties}
    >
      <div className="menu__icon">
        <Icon className="icon" />
      </div>
      <span
        ref={textRef}
        className={cn("menu__text", isActive && "active")}
      >
        {label}
      </span>
    </Link>
  );
}

// Centre Scan FAB — elevated pill/circle button
function ScanFab({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/scan")}
      aria-label="Scan a product"
      className="flex flex-col items-center -mt-7 select-none flex-shrink-0"
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform duration-200 active:scale-90",
          isActive ? "scale-105" : "scale-100 hover:scale-[1.03]"
        )}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-full opacity-50 blur-md"
          style={{
            background: "linear-gradient(135deg, hsl(196 88% 24%) 0%, hsl(172 82% 38%) 100%)",
            transform: "scale(0.9)",
          }}
        />
        {/* FAB circle */}
        <div
          className="relative w-[3.75rem] h-[3.75rem] rounded-full flex items-center justify-center shadow-elevated"
          style={{
            background: "linear-gradient(145deg, hsl(196 88% 22%) 0%, hsl(180 85% 30%) 60%, hsl(162 82% 38%) 100%)",
            boxShadow:
              "0 6px 24px hsl(180 80% 28% / 0.55), 0 2px 8px hsl(180 80% 28% / 0.35), inset 0 1px 0 rgba(255,255,255,0.20)",
          }}
        >
          <Camera className="w-[1.375rem] h-[1.375rem] text-white" strokeWidth={2.2} />
        </div>
      </div>
      <span
        className="text-[10px] mt-1.5 font-bold tracking-wide"
        style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
      >
        Scan
      </span>
    </button>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Main navigation"
    >
      {/* Glass backdrop */}
      <div
        className="absolute inset-0 border-t border-white/10"
        style={{
          background: "hsl(var(--background) / 0.94)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow:
            "0 -1px 0 0 hsl(var(--border) / 0.5), 0 -8px 32px -4px hsl(180 50% 20% / 0.10)",
        }}
      />

      {/* Tab row */}
      <div className="relative menu items-end px-2 pt-2 pb-safe">
        {NAV_ITEMS.map((tab) =>
          tab.fab ? (
            <ScanFab key={tab.path} isActive={pathname === tab.path} />
          ) : (
            <NavTab
              key={tab.path}
              path={tab.path}
              label={tab.label}
              icon={tab.icon}
              isActive={pathname === tab.path}
            />
          )
        )}
      </div>
    </nav>
  );
}
