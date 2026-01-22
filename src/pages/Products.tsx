import { useState, useMemo, useEffect } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { calculateScore } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const Products = () => {
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'carbon'>('score');
  const [minScore, setMinScore] = useState<number | null>(null);
  const [searchParams] = useSearchParams();

  // Handle category from URL parameter
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    const minScoreFromUrl = searchParams.get('minScore');

    if (categoryFromUrl) setSelectedCategory(decodeURIComponent(categoryFromUrl));
    else setSelectedCategory('All');

    if (minScoreFromUrl && !Number.isNaN(Number(minScoreFromUrl))) setMinScore(Number(minScoreFromUrl));
    else setMinScore(null);
  }, [searchParams]);

  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = 
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.id.toLowerCase().includes(search.toLowerCase()) ||
        product.keywords.some(k => k.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;

      const matchesMinScore = minScore === null || calculateScore(product) >= minScore;
      
      return matchesSearch && matchesCategory && matchesMinScore;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'score') return calculateScore(b) - calculateScore(a);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'carbon') return a.carbonFootprint - b.carbonFootprint;
      return 0;
    });

    return filtered;
  }, [products, search, selectedCategory, sortBy, minScore]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              Product Database
            </h1>
            <p className="text-muted-foreground">
              Browse {products.length} products and discover their sustainability scores
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands, or codes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-card border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A-Z</option>
                <option value="carbon">Lowest Carbon</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Filter className="w-4 h-4 text-muted-foreground mt-1.5" />
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedCategory === category 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/10"
                )}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>

          {/* Results count */}
          <p className="text-sm text-muted-foreground mb-6">
            Showing {filteredProducts.length} of {products.length} products
          </p>

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No products found matching your criteria.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
