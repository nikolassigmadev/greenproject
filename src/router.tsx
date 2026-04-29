import { createBrowserRouter, Outlet, useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import { ScrollToTop } from "./components/ScrollToTop";
import { HackerTransition } from "./components/HackerTransition";

function HomeButton() {
  const { pathname } = useLocation();
  if (pathname === "/" || pathname === "/scan" || pathname === "/basket") return null;
  return (
    <Link
      to="/"
      aria-label="Home"
      style={{
        position: "fixed",
        top: "max(14px, env(safe-area-inset-top))",
        right: 16,
        zIndex: 200,
        width: 34,
        height: 34,
        borderRadius: 10,
        border: "1px solid #E5E7EB",
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#6B7280",
        textDecoration: "none",
        flexShrink: 0,
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      }}
    >
      <Home size={14} strokeWidth={1.5} />
    </Link>
  );
}
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
import Methodology from "./pages/Methodology";
import { CalAIShowcase } from "./components/CalAIShowcase";

// Import admin components - uncomment to enable
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import AdminDisputes from "./pages/AdminDisputes";

function RootLayout() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <HackerTransition />
      <HomeButton />
      <div key={location.pathname} className="page-transition" style={{ isolation: 'auto' }}>
        <Outlet />
      </div>
    </>
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
        path: "/about",
        element: <AboutUs />,
      },
      {
        path: "/methodology",
        element: <Methodology />,
      },
      {
        path: "/design-system",
        element: <CalAIShowcase />,
      },
      // Uncomment admin routes to enable
      {
        path: "/admin",
        element: <Admin />,
      },
      {
        path: "/admin/login",
        element: <AdminLogin />,
      },
      {
        path: "/admin/disputes",
        element: <AdminDisputes />,
      },
    ],
  },
]);
