import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal, Filter } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { calculateScore } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";

const Products = () => {
  const products = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"score" | "name" | "carbon">("score");
  const [minScore, setMinScore] = useState<number | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    const minScoreFromUrl = searchParams.get("minScore");
    if (categoryFromUrl) setSelectedCategory(decodeURIComponent(categoryFromUrl));
    else setSelectedCategory("All");
    if (minScoreFromUrl && !Number.isNaN(Number(minScoreFromUrl))) setMinScore(Number(minScoreFromUrl));
    else setMinScore(null);
  }, [searchParams]);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.brand.toLowerCase().includes(search.toLowerCase()) ||
        product.id.toLowerCase().includes(search.toLowerCase()) ||
        product.keywords.some((k) => k.toLowerCase().includes(search.toLowerCase()));
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesMinScore = minScore === null || calculateScore(product) >= minScore;
      return matchesSearch && matchesCategory && matchesMinScore;
    });

    filtered.sort((a, b) => {
      if (sortBy === "score") return calculateScore(b) - calculateScore(a);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "carbon") return a.carbonFootprint - b.carbonFootprint;
      return 0;
    });

    return filtered;
  }, [products, search, selectedCategory, sortBy, minScore]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 pb-nav">
        {/* Page header */}
        <div
          className="px-5 pt-10 pb-12 text-center"
          style={{ background: "var(--gradient-hero)" }}
        >
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-display font-extrabold tracking-tight mb-1.5" style={{ color: "#ffffff" }}>
              Product Database
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
              {products.length} products — browse, filter, and discover ethical alternatives
            </p>
          </div>
        </div>

        {/* Search + filter bar — sticky, overlapping hero */}
        <div className="px-5 -mt-5 relative z-10 mb-5">
          <div className="max-w-2xl mx-auto bg-card rounded-2xl border border-border/60 shadow-card p-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search products, brands, or codes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 bg-muted/60 border-0 focus-visible:ring-1 text-sm"
                />
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "score" | "name" | "carbon")}
                  className="h-9 px-3 rounded-lg bg-muted/60 border-0 text-sm text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                >
                  <option value="score">Highest Score</option>
                  <option value="name">Name A–Z</option>
                  <option value="carbon">Lowest Carbon</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className="px-5 mb-5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold border transition-all duration-150 cursor-pointer",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground border-primary shadow-soft"
                      : "bg-card text-muted-foreground border-border/70 hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-5 mb-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs text-muted-foreground font-medium">
              {filteredProducts.length === products.length
                ? `${products.length} products`
                : `${filteredProducts.length} of ${products.length} products`}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="px-5">
          <div className="max-w-2xl mx-auto">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/60">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm font-semibold text-foreground mb-1">No products found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default Products;
