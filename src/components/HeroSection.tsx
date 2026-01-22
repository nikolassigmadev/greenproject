import { Link } from "react-router-dom";
import { Camera, Database, ArrowRight, Leaf, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-illustration.jpg";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <img 
          src={heroImage} 
          alt="Sustainable products scanning concept" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="container">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium animate-fade-in">
            <Leaf className="w-4 h-4" />
            <span>Sustainable Shopping Made Simple</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Know the <span className="text-gradient-hero">True Cost</span> of
            <br />What You Buy
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Scan any product to reveal its environmental impact, labor practices, 
            and discover more ethical alternatives. Make informed choices that matter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button asChild size="lg" className="bg-gradient-hero hover:opacity-90 text-lg px-8 shadow-card">
              <Link to="/scan">
                <Camera className="w-5 h-5 mr-2" />
                Start Scanning
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/products">
                <Database className="w-5 h-5 mr-2" />
                Browse Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
    <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-soft hover:shadow-card transition-all duration-300 group">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
