import { Link, useLocation } from "react-router-dom";
import { Scan, ShoppingBag, Database, Camera, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/products', label: 'Products', icon: ShoppingBag },
    { path: '/database', label: 'Database', icon: Database },
    { path: '/scan', label: 'Scan', icon: Camera },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-900 rounded-xl flex items-center justify-center">
              <Scan className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tight text-green-950">
              Scan<span className="text-green-600">2</span>Source
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200",
                    isActive
                      ? "bg-green-900 text-white"
                      : "text-gray-500 hover:text-green-900 hover:bg-green-50"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center gap-1 flex-1 py-2"
              >
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                  isActive ? "bg-green-900" : "bg-transparent"
                )}>
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-400")} />
                </div>
                <span className={cn("text-[10px] font-semibold", isActive ? "text-green-900" : "text-gray-400")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile bottom nav spacer */}
      <div className="md:hidden h-16" />
    </>
  );
}
