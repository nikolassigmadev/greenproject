import { useState, useMemo, useEffect } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Page header */}
        <div className="border-b border-border py-8">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl sm:text-4xl font-black text-green-950 tracking-tight mb-1">Products</h1>
            <p className="text-gray-500 font-medium">{products.length} products rated for ethics & sustainability</p>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6">
          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Search products, brands, or codes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 rounded-2xl border border-green-200 bg-green-50/50 pl-11 pr-4 text-sm font-medium text-green-950 placeholder:text-gray-400 focus:outline-none focus:border-green-700 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'carbon')}
                className="h-12 rounded-2xl border border-green-200 bg-green-50/50 px-4 text-sm font-semibold text-green-950 focus:outline-none focus:border-green-700 transition-colors"
              >
                <option value="score">Highest Score</option>
                <option value="name">Name A–Z</option>
                <option value="carbon">Lowest Carbon</option>
              </select>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-200",
                  selectedCategory === cat
                    ? "bg-green-900 text-white"
                    : "bg-green-100/60 text-green-800 hover:bg-green-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="text-sm text-gray-400 font-semibold mb-6">
            {filteredProducts.length} of {products.length} products
          </p>

          {/* Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="font-black text-xl text-green-950 mb-2">No products found</p>
              <p className="text-gray-500 font-medium">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
