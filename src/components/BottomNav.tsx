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

function NavTab({ path, label, icon: Icon, isActive }: {
  path: string; label: string; icon: typeof Home; isActive: boolean;
}) {
  return (
    <Link
      to={path}
      aria-current={isActive ? "page" : undefined}
      className={cn("menu__item", isActive && "active")}
    >
      <div className="menu__icon">
        <Icon className="icon" />
      </div>
      <span className={cn("menu__text", isActive && "active")}>
        {label}
      </span>
    </Link>
  );
}

function ScanFab({ isActive }: { isActive: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/scan")}
      aria-label="Scan a product"
      className="flex flex-col items-center -mt-5 select-none flex-shrink-0"
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform duration-200 active:scale-90",
          isActive ? "scale-105" : "scale-100 hover:scale-[1.03]"
        )}
      >
        {/* FAB circle */}
        <div
          className="relative w-[3.5rem] h-[3.5rem] rounded-full flex items-center justify-center"
          style={{
            background: "hsl(220 14% 12%)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.22), 0 1px 4px rgba(0,0,0,0.12)",
          }}
        >
          <Camera className="w-[1.3rem] h-[1.3rem] text-white" strokeWidth={2.1} />
        </div>
      </div>
      <span
        className="text-[10px] mt-1.5 font-semibold tracking-wide"
        style={{ color: isActive ? "hsl(220 14% 10%)" : "hsl(220 10% 56%)" }}
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
      {/* White backdrop */}
      <div
        className="absolute inset-0 border-t border-black/[0.06]"
        style={{
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          boxShadow: "var(--shadow-bottom-nav)",
        }}
      />

      {/* Tab row */}
      <div className="relative menu items-end px-2 pt-2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}>
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
