import { useState } from "react";
import { createBrowserRouter, Navigate, Outlet, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { HackerTransition } from "./components/HackerTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav, BottomNavProvider } from "./components/BottomNav";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { AddToHomeScreen, isStandalonePWA } from "./components/AddToHomeScreen";
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
import ChocolateDirectory from "./pages/ChocolateDirectory";
import Privacy from "./pages/Privacy";
import TermsOfService from "./pages/TermsOfService";
import TermsAndConditions from "./pages/TermsAndConditions";
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

// Escape hatch for the owner / testing: visiting any URL that contains "bypass"
// (e.g. goodscan.shop/bypass or goodscan.shop/?bypass) permanently unlocks the
// app in a regular browser, so it can be used without adding it to the Home
// Screen. The grant is persisted so it survives reloads and navigation.
const BYPASS_KEY = "gs-install-bypass";

function isInstallBypassed(): boolean {
  try {
    const { pathname, search } = window.location;
    if (/bypass/i.test(pathname) || new URLSearchParams(search).has("bypass")) {
      localStorage.setItem(BYPASS_KEY, "1");
      return true;
    }
    return localStorage.getItem(BYPASS_KEY) === "1";
  } catch {
    return false;
  }
}

function RootLayout() {
  const location = useLocation();

  // Hard install gate: in a regular browser the app is unusable until it's added
  // to the Home Screen (or unlocked via a bypass URL). When that's the case we
  // render *only* the Add-to-Home-Screen screen — no app content, no escape.
  const [installGated, setInstallGated] = useState(
    () => !isInstalledExperience() && !isInstallBypassed(),
  );

  // One-time animated onboarding (country, city, priorities). Persisted to
  // localStorage so it only ever runs once per device, and gated so it only
  // ever runs inside the Home-Screen / installed app.
  const [showOnboarding, setShowOnboarding] = useState(
    () => isInstalledExperience() && !hasCompletedOnboarding(),
  );

  if (installGated) {
    return <AddToHomeScreen onInstalled={() => setInstallGated(false)} />;
  }

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
        // Owner/testing escape hatch. isInstallBypassed() records the grant from
        // the URL during render, so by the time this route matches the gate is
        // already lifted — we just send the visitor on to the home screen.
        path: "/bypass",
        element: <Navigate to="/" replace />,
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
        path: "/chocolate",
        element: <ChocolateDirectory />,
      },
      {
        path: "/privacy",
        element: <Privacy />,
      },
      {
        path: "/terms-of-service",
        element: <TermsOfService />,
      },
      {
        path: "/terms-and-conditions",
        element: <TermsAndConditions />,
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
