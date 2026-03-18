import { Link, useLocation } from "react-router-dom";
import { Home, Camera, ShoppingBag, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/products", label: "Browse", icon: ShoppingBag },
  { path: "/scan", label: "Scan", icon: Camera, primary: true },
  { path: "/dashboard", label: "History", icon: BarChart3 },
  { path: "/preferences", label: "More", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      aria-label="Main navigation"
    >
      {/* Glass background layer */}
      <div
        className="absolute inset-0 border-t border-white/10"
        style={{
          background: "rgba(var(--background-rgb, 247 242 235) / 0.92)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 -1px 0 0 hsl(var(--border) / 0.5), 0 -8px 32px -4px hsl(150 20% 20% / 0.08)",
        }}
      />

      <div className="relative flex items-end justify-around px-2 pt-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          /* ── Scan FAB ── */
          if (tab.primary) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label="Scan a product"
                className="flex flex-col items-center -mt-7 select-none"
              >
                {/* Outer glow ring when active */}
                <div
                  className={cn(
                    "relative flex items-center justify-center transition-transform duration-200 active:scale-90",
                    isActive ? "scale-105" : "scale-100 hover:scale-[1.03]"
                  )}
                >
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-full blur-md opacity-50"
                    style={{
                      background: "linear-gradient(135deg, hsl(152 55% 32%) 0%, hsl(148 62% 44%) 100%)",
                      transform: "scale(0.9)",
                    }}
                  />
                  {/* FAB */}
                  <div
                    className="relative w-[3.75rem] h-[3.75rem] rounded-full flex items-center justify-center shadow-elevated"
                    style={{
                      background: "linear-gradient(145deg, hsl(152 52% 30%) 0%, hsl(148 58% 40%) 60%, hsl(144 50% 46%) 100%)",
                      boxShadow: "0 6px 24px hsl(152 55% 28% / 0.5), 0 2px 8px hsl(152 55% 28% / 0.3), inset 0 1px 0 rgba(255,255,255,0.18)",
                    }}
                  >
                    <Icon className="w-[1.375rem] h-[1.375rem] text-white" strokeWidth={2.2} />
                  </div>
                </div>
                <span
                  className="text-[10px] mt-1.5 font-bold tracking-wide"
                  style={{ color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          /* ── Regular tabs ── */
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="relative flex flex-col items-center py-1 px-1 min-w-[3.5rem] select-none active:opacity-70 transition-opacity duration-100"
              aria-current={isActive ? "page" : undefined}
            >
              {/* Pill indicator behind icon */}
              <span
                className={cn(
                  "absolute top-0.5 left-1/2 -translate-x-1/2 h-8 rounded-2xl transition-all duration-200",
                  isActive ? "w-14 opacity-100" : "w-0 opacity-0"
                )}
                style={{ backgroundColor: "hsl(var(--primary) / 0.1)" }}
                aria-hidden
              />

              <Icon
                className={cn(
                  "relative w-[1.35rem] h-[1.35rem] transition-all duration-200 mt-0.5",
                  isActive ? "text-primary" : "text-muted-foreground/55"
                )}
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5 transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground/55"
                )}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
