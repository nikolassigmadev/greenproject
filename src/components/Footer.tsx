import { Link } from "react-router-dom";
import { Settings } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border py-8 mt-auto">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400 font-medium">
          © {new Date().getFullYear()} Scan2Source
        </p>
        <div className="flex items-center gap-6 text-sm text-gray-400">
          <Link to="/products" className="hover:text-green-900 transition-colors font-medium">Products</Link>
          <Link to="/database" className="hover:text-green-900 transition-colors font-medium">Database</Link>
          <Link to="/scan" className="hover:text-green-900 transition-colors font-medium">Scan</Link>
          <Link to="/admin" className="hover:text-green-900 transition-colors" title="Admin">
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
