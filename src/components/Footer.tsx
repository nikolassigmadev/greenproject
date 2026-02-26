import { Leaf, Heart, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t border-border/50 bg-gradient-to-b from-muted/30 to-muted/50 py-12 mt-auto">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-lg">
                Scan<span className="text-primary">2</span>Source
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making sustainable choices easier, one scan at a time. 
              Discover the true impact of your purchases.
            </p>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-eco-terracotta fill-eco-terracotta animate-pulse" />
              <span className="text-sm text-muted-foreground">Made for the planet</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span className="w-0 h-0 group-hover:w-1 group-hover:h-1 bg-primary rounded-full transition-all duration-200" />
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/products" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span className="w-0 h-0 group-hover:w-1 group-hover:h-1 bg-primary rounded-full transition-all duration-200" />
                  Browse Products
                </Link>
              </li>
              <li>
                <Link 
                  to="/scan" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span className="w-0 h-0 group-hover:w-1 group-hover:h-1 bg-primary rounded-full transition-all duration-200" />
                  Scan Product
                </Link>
              </li>
            </ul>
          </div>

          {/* Database Link */}
          <div className="space-y-4">
            <h3 className="font-display font-semibold text-foreground">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/database"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  <span className="w-0 h-0 group-hover:w-1 group-hover:h-1 bg-primary rounded-full transition-all duration-200" />
                  Food Database
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {currentYear} Scan2Source. All rights reserved.
            </div>
            
            <div className="flex items-center gap-6">
              {/* Admin Link */}
              <Link 
                to="/admin" 
                className="text-muted-foreground/50 hover:text-muted-foreground transition-colors group"
                title="Admin Panel"
              >
                <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
