import { lazy, Suspense, useState } from "react";
import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { ScrollManager } from "./components/ScrollManager";
import { HackerTransition } from "./components/HackerTransition";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav, BottomNavProvider } from "./components/BottomNav";
import { Onboarding, hasCompletedOnboarding } from "./components/Onboarding";
import { AddToHomeScreen, isStandalonePWA } from "./components/AddToHomeScreen";
// The two entry points stay eager so first paint never waits on a chunk fetch;
// every other page is code-split and loads on navigation.
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import NotFound from "./pages/NotFound";

const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const OpenFoodFactsDetail = lazy(() => import("./pages/OpenFoodFactsDetail"));
const Database = lazy(() => import("./pages/Database"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ShoppingList = lazy(() => import("./pages/ShoppingList"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const SupplyChain = lazy(() => import("./pages/SupplyChain"));
const Methodology = lazy(() => import("./pages/Methodology"));
const ChocolateDirectory = lazy(() => import("./pages/ChocolateDirectory"));
const Privacy = lazy(() => import("./pages/Privacy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const CalAIShowcase = lazy(() => import("./components/CalAIShowcase"));
const ChatGPTScan = lazy(() => import("./pages/ChatGPTScan"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Compare = lazy(() => import("./pages/Compare"));
const SubmitFlag = lazy(() => import("./pages/SubmitFlag"));
const ShelfScan = lazy(() => import("./pages/ShelfScan"));

// Import admin components - uncomment to enable
// const Admin = lazy(() => import("./pages/Admin"));
// const AdminLogin = lazy(() => import("./pages/AdminLogin"));

// Shown while a lazy page chunk downloads. Neutral (no theme assumptions) and
// deliberately minimal — on a decent connection it flashes for <100ms.
function PageLoading() {
  return (
    <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 28,
          height: 28,
          border: "3px solid rgba(128,128,128,0.25)",
          borderTopColor: "#00c853",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


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
          <Suspense fallback={<PageLoading />}>
            <Outlet />
          </Suspense>
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
