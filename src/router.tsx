import { useState } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { HackerTransition } from "./components/HackerTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav, BottomNavProvider } from "./components/BottomNav";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { isStandalonePWA } from "./components/AddToHomeScreen";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import OpenFoodFactsDetail from "./pages/OpenFoodFactsDetail";
import Scan from "./pages/Scan";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";
import Preferences from "./pages/Preferences";
import Dashboard from "./pages/Dashboard";
import ShoppingList from "./pages/ShoppingList";
import AboutUs from "./pages/AboutUs";
import SupplyChain from "./pages/SupplyChain";
import Methodology from "./pages/Methodology";
import Privacy from "./pages/Privacy";
import { CalAIShowcase } from "./components/CalAIShowcase";
import ChatGPTScan from "./pages/ChatGPTScan";
import Watchlist from "./pages/Watchlist";
import Compare from "./pages/Compare";
import SubmitFlag from "./pages/SubmitFlag";
import ShelfScan from "./pages/ShelfScan";

// Import admin components - uncomment to enable
// import Admin from "./pages/Admin";
// import AdminLogin from "./pages/AdminLogin";


// Onboarding (country, city, priorities) is part of the *installed* experience.
// It must only appear once the app is launched from the Home Screen — i.e. a
// standalone PWA, fullscreen display, or the native app — never in a regular
// browser tab (where the user is instead nudged to add it to their Home Screen).
function isInstalledExperience(): boolean {
  if ((window as { Capacitor?: unknown }).Capacitor) return true;
  try {
    if (window.matchMedia?.("(display-mode: fullscreen)").matches) return true;
  } catch {
    /* ignore */
  }
  return isStandalonePWA();
}

function RootLayout() {
  const location = useLocation();
  // One-time animated onboarding (country, city, priorities). Persisted to
  // localStorage so it only ever runs once per device, and gated so it only
  // ever runs inside the Home-Screen / installed app.
  const [showOnboarding, setShowOnboarding] = useState(
    () => isInstalledExperience() && !hasCompletedOnboarding(),
  );
  return (
    <BottomNavProvider>
      <ScrollToTop />
      <HackerTransition />
      <ErrorBoundary key={location.pathname}>
        <div className="page-transition" style={{ isolation: 'auto' }}>
          <Outlet />
        </div>
      </ErrorBoundary>
      {/* Footer is mounted once at the layout level so it stays fixed across
          page transitions. The /scan page reaches in via useBottomNav() to
          control its slide-down animation; nothing else touches it. */}
      <BottomNav />
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
    </BottomNavProvider>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/products",
        element: <Products />,
      },
      {
        path: "/product/:id",
        element: <ProductDetail />,
      },
      {
        path: "/product-off/:barcode",
        element: <OpenFoodFactsDetail />,
      },
      {
        path: "/scan",
        element: <Scan />,
      },
      {
        path: "/database",
        element: <Database />,
      },
      {
        path: "/preferences",
        element: <Preferences />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/basket",
        element: <ShoppingList />,
      },
      {
        path: "/shelf",
        element: <ShelfScan />,
      },
      {
        path: "/about",
        element: <AboutUs />,
      },
      {
        path: "/supply-chain",
        element: <SupplyChain />,
      },
      {
        path: "/methodology",
        element: <Methodology />,
      },
      {
        path: "/privacy",
        element: <Privacy />,
      },
      {
        path: "/chatgpt",
        element: <ChatGPTScan />,
      },
      {
        path: "/watchlist",
        element: <Watchlist />,
      },
      {
        path: "/compare",
        element: <Compare />,
      },
      {
        path: "/submit-flag",
        element: <SubmitFlag />,
      },
      {
        path: "/design-system",
        element: <CalAIShowcase />,
      },
      // Uncomment admin routes to enable
      //{
        //path: "/admin",
        //element: <Admin />,
      //},
      //{
        //path: "/admin/login",
        //element: <AdminLogin />,
      //},
    ],
  },
]);
