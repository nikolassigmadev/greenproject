import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { ProductCard } from "@/components/ProductCard";
import { calculateScore } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { ArrowRight, Shirt, Home, Smartphone, Apple, Heart, Coffee, FootprintsIcon, Package } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  const products = useProducts();
  
  // Get unique categories and count products
  const categories = [...new Set(products.map(p => p.category))];
  
  // Category icons and colors
  const categoryConfig = {
    'Clothing': { icon: Shirt, color: 'bg-blue-100 text-blue-600', description: 'Sustainable apparel' },
    'Drinkware': { icon: Home, color: 'bg-cyan-100 text-cyan-600', description: 'Eco-friendly containers' },
    'Food & Beverage': { icon: Apple, color: 'bg-green-100 text-green-600', description: 'Ethical food choices' },
    'Personal Care': { icon: Heart, color: 'bg-pink-100 text-pink-600', description: 'Natural body care' },
    'Footwear': { icon: FootprintsIcon, color: 'bg-amber-100 text-amber-600', description: 'Sustainable shoes' },
    'Meat, Dairy & Eggs': { icon: Package, color: 'bg-red-100 text-red-600', description: 'Ethical animal products' },
    'Electronics & Appliances': { icon: Smartphone, color: 'bg-purple-100 text-purple-600', description: 'Green technology' },
    'Snacks & Packaged Foods': { icon: Coffee, color: 'bg-orange-100 text-orange-600', description: 'Healthy snacks' },
  };

  // Get featured products for each category (highest scored)
  const categoryProducts = categories.map(category => {
    const categoryProducts = products.filter(p => p.category === category);
    const featured = categoryProducts.length > 0 
      ? categoryProducts.reduce((best, current) => 
          calculateScore(current) > calculateScore(best) ? current : best
        )
      : null;
    
    return {
      category,
      config: categoryConfig[category as keyof typeof categoryConfig] || { icon: Package, color: 'bg-gray-100 text-gray-600', description: 'Product category' },
      count: categoryProducts.length,
      featured,
    };
  });

  const alternativeProducts = products
    .map((p) => ({ product: p, score: calculateScore(p) }))
    .filter(({ score }) => score >= 97)
    .sort((a, b) => b.score - a.score)
    .map(({ product }) => product)
    .slice(0, 4);

  return (<div className="min-h-screen flex flex-col bg-[#1a2332] text-[#f0f4f8] min-h-screen">
      <Header />
      
      <main className="flex-1">
        <HeroSection />

        {/* Categories Section */}
        <section className="py-16" style={{ backgroundColor: 'hsl(210 35% 18%)' }}>
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(210 15% 94%)' }}>
                Shop by Category
              </h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(210 15% 63%)' }}>
                Explore our curated categories and discover sustainable products that align with your values
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categoryProducts.map(({ category, config, count, featured }) => {
                const Icon = config.icon;
                return (
                  <Link key={category} to={`/products?category=${encodeURIComponent(category)}`}>
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer" style={{ backgroundColor: 'hsl(210 35% 18%)', borderColor: 'hsl(210 30% 20%)', borderWidth: '2px' }}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className="text-sm font-medium px-2 py-1 rounded-full" style={{ backgroundColor: 'hsl(210 35% 22%)', color: 'hsl(210 15% 63%)' }}>
                            {count} products
                          </span>
                        </div>

                        <h3 className="font-semibold text-lg mb-2 transition-colors group-hover:" style={{ color: 'hsl(210 15% 94%)' }}>
                          {category}
                        </h3>

                        <p className="text-sm mb-4" style={{ color: 'hsl(210 15% 63%)' }}>
                          {config.description}
                        </p>

                        {featured && (
                          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'hsl(210 35% 22%)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs mb-1" style={{ color: 'hsl(210 15% 63%)' }}>Featured</p>
                              <p className="text-sm font-medium truncate" style={{ color: 'hsl(210 15% 94%)' }}>{featured.name}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 transition-colors" style={{ color: 'hsl(38 92% 50%)' }} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Button asChild size="lg" className="shadow-soft">
                <Link to="/products">
                  View All Products
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {alternativeProducts.length > 0 && (
          <section className="py-16" style={{ backgroundColor: 'hsl(210 40% 10%)' }}>
            <div className="container">
              <div className="flex items-end justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-display font-bold mb-2" style={{ color: 'hsl(210 15% 94%)' }}>
                    The Alternative
                  </h2>
                  <p className="text-lg leading-relaxed" style={{ color: 'hsl(210 15% 63%)' }}>
                    Products with a sustainability score of 97 or higher.
                  </p>
                </div>
                <Button asChild variant="outline">
                  <Link to="/products?minScore=97">See all</Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {alternativeProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="py-16" style={{ backgroundColor: 'hsl(210 35% 18%)' }}>
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4" style={{ color: 'hsl(210 15% 94%)' }}>
                How It Works
              </h2>
              <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'hsl(210 15% 63%)' }}>
                Three simple steps to make more informed purchasing decisions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <StepCard 
                number={1}
                title="Scan Product"
                description="Use your camera to scan a barcode or capture product text"
              />
              <StepCard 
                number={2}
                title="Get Insights"
                description="Instantly see ethical scores, origin data, and carbon impact"
              />
              <StepCard 
                number={3}
                title="Choose Better"
                description="Discover sustainable alternatives that match your values"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-hero text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-3xl sm:text-4xl font-display font-bold mb-6">
              Ready to Shopp Consciously?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Start scanning products today to join thousands making more sustainable choices for a better future.
            </p>
            <Button asChild size="lg" variant="secondary" className="shadow-card text-lg px-8 py-3">
              <Link to="/scan">
                Start Your First Scan
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

function StepCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-2xl font-display font-bold text-2xl flex items-center justify-center mx-auto mb-4 shadow-soft" style={{ backgroundColor: 'hsl(38 92% 50%)', color: 'white' }}>
        {number}
      </div>
      <h3 className="font-display font-semibold text-lg mb-2" style={{ color: 'hsl(210 15% 94%)' }}>{title}</h3>
      <p className="text-sm" style={{ color: 'hsl(210 15% 63%)' }}>{description}</p>
    </div>
  );
}

export default Index;
