import { Leaf, Heart, Settings } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/30 py-8 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm">
              Making sustainable choices easier, one scan at a time.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>Built with</span>
              <Heart className="w-4 h-4 text-eco-terracotta fill-eco-terracotta" />
              <span>for the planet</span>
            </div>
            <Link 
              to="/admin" 
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              title="Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
