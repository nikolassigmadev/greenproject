import { Link, useLocation } from "react-router-dom";
import { Home, Camera, ShoppingBag, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/products", label: "Browse", icon: ShoppingBag },
  { path: "/scan", label: "Scan", icon: Camera, primary: true },
  { path: "/dashboard", label: "History", icon: BarChart3 },
  { path: "/preferences", label: "Priorities", icon: Settings },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/97 backdrop-blur-xl border-t border-border/60 shadow-bottom-nav"
      aria-label="Main navigation"
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;

          if (tab.primary) {
            return (
              <Link
                key={tab.path}
                to={tab.path}
                aria-label="Scan a product"
                className="flex flex-col items-center -mt-5"
              >
                <div
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-elevated",
                    isActive
                      ? "bg-primary scale-105"
                      : "bg-primary hover:scale-105 active:scale-95"
                  )}
                >
                  <Icon className="w-6 h-6 text-primary-foreground" strokeWidth={2} />
                </div>
                <span
                  className={cn(
                    "text-[10px] mt-1.5 font-semibold tracking-wide",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 py-1 px-2 min-w-[3rem] relative"
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
