import { Link } from "react-router-dom";
import { Camera, Database, ArrowRight, Leaf, Globe, Shield, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import heroImage from "@/assets/hero-illustration.jpg";

export function HeroSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, hsl(152 45% 28% / 0.15) 0%, transparent 50%)`,
          }}
        />
        <img 
          src={heroImage} 
          alt="Sustainable products scanning concept" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-eco-leaf/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-eco-sage/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-eco-amber/20 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 backdrop-blur-sm transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Sustainable Shopping Made Simple</span>
            <TrendingUp className="w-4 h-4" />
          </div>

          {/* Heading */}
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight transition-all duration-1000 delay-100 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Know the <span className="text-gradient-hero animate-pulse-slow">True Cost</span> of
            <br />What You Buy
          </h1>

          {/* Subheading */}
          <p className={`text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Scan any product to reveal its environmental impact, labor practices, 
            and discover more ethical alternatives. Make informed choices that matter.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-300 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <Button asChild size="lg" className="btn-aurora bg-gradient-hero hover:opacity-90 text-lg px-8 shadow-card hover:shadow-elevated transform hover:scale-105 transition-all duration-300 group">
              <Link to="/scan">
                <Camera className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                Start Scanning
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="btn-aurora text-lg px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 group">
              <Link to="/products">
                <Database className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Browse Products
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <FeatureCard 
              icon={Globe}
              title="Origin Tracking"
              description="Trace where products and materials come from around the world"
            />
            <FeatureCard 
              icon={Shield}
              title="Labor Risk Assessment"
              description="Evaluate child and forced labor risks in supply chains"
            />
            <FeatureCard 
              icon={Leaf}
              title="Carbon Impact"
              description="Calculate environmental footprint from production to shelf"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-soft hover:shadow-elevated hover:-translate-y-2 transition-all duration-500 hover:bg-card">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary group-hover:text-primary/80" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2 group-hover:text-primary transition-colors">{title}</h3>
      <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{description}</p>
    </div>
  );
}
