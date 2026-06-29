import { useState } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { ScrollManager } from "./components/ScrollManager";
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

// Desktop / laptop visitors can use the app straight from the browser — "Add to
// Home Screen" is a mobile concept, so we never show them the install gate. We
// treat a device as desktop when it has no mobile/tablet user-agent, isn't an
// iPad masquerading as a Mac, and drives a fine pointer (mouse/trackpad).
function isDesktopDevice(): boolean {
  try {
    const ua = navigator.userAgent || "";
    const mobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle/i;
    const isMobileUA = mobileUA.test(ua);
    const isIpadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (isMobileUA || isIpadOS) return false;
    return window.matchMedia?.("(pointer: fine)").matches ?? true;
  } catch {
    return false;
  }
}

function RootLayout() {
  const location = useLocation();

  // Hard install gate: in a regular *mobile* browser the app is unusable until
  // it's added to the Home Screen — we render only the Add-to-Home-Screen
  // screen, so every mobile user installs and then passes through onboarding
  // (incl. accepting the policies). Desktop/laptop visitors skip the gate.
  const [installGated, setInstallGated] = useState(
    () => !isDesktopDevice() && !isInstalledExperience(),
  );

  // One-time animated onboarding (country, city, priorities, consent). Persisted
  // to localStorage so it only runs once per device. It runs inside the
  // installed app *and* for desktop visitors (who never hit the install gate),
  // so the policies are always accepted before the app is used.
  const [showOnboarding, setShowOnboarding] = useState(
    () => (isInstalledExperience() || isDesktopDevice()) && !hasCompletedOnboarding(),
  );

  if (installGated) {
    return <AddToHomeScreen onInstalled={() => setInstallGated(false)} />;
  }

  return (
    <BottomNavProvider>
      {/* Scrolls to top on forward navigation, but restores the previous scroll
          position on Back — so returning from a policy page lands you exactly
          where you tapped. */}
      <ScrollManager />
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
