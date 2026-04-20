import { createBrowserRouter, Outlet, useLocation } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
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
import ReceiptScanner from "./pages/ReceiptScanner";
import { CalAIShowcase } from "./components/CalAIShowcase";

// Import admin components - uncomment to enable
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

function RootLayout() {
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
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
        path: "/receipt",
        element: <ReceiptScanner />,
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
    ],
  },
]);
