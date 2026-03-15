import { createBrowserRouter } from "react-router-dom";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Scan from "./pages/Scan";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";
import { CalAIShowcase } from "./components/CalAIShowcase";

// Import admin components - uncomment to enable
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";

export const router = createBrowserRouter([
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
    path: "/scan",
    element: <Scan />,
  },
  {
    path: "/database",
    element: <Database />,
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
]);
