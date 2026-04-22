import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Camera, BarChart3, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/basket",     label: "Cart",    icon: ShoppingCart },
  { path: "/scan",       label: "Scan",    icon: Camera, fab: true },
  { path: "/dashboard",  label: "History", icon: BarChart3  },
  { path: "/about",      label: "About",   icon: Info       },
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
      className="flex flex-col items-center select-none flex-shrink-0"
      style={{ marginTop: "-2.375rem" }}
    >
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform duration-200 active:scale-90",
          isActive ? "scale-105" : "scale-100 hover:scale-[1.03]"
        )}
      >
        {/* FAB circle — red */}
        <div
          className="relative w-[3.5rem] h-[3.5rem] rounded-full flex items-center justify-center"
          style={{
            background: "#00c853",
            boxShadow: isActive
              ? "0 0 24px rgba(240, 0, 7, 0.6), 0 4px 16px rgba(240, 0, 7, 0.4)"
              : "0 4px 16px rgba(240, 0, 7, 0.35), 0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          <Camera className="w-[1.3rem] h-[1.3rem] text-white" strokeWidth={2} />
        </div>
      </div>
      <span
        className="font-mono uppercase"
        style={{
          fontSize: "0.48rem",
          marginTop: "0.3rem",
          letterSpacing: "0.12em",
          color: isActive ? "#ffffff" : "#84898E",
        }}
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
      {/* Black backdrop — no blur */}
      <div
        className="absolute inset-0"
        style={{
          background: "#000000",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      />

      {/* Tab row */}
      <div
        className="relative menu items-end px-2 pt-2"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 8px)" }}
      >
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
