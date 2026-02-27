import { useState, useCallback } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, Globe, Tag, Leaf, Apple, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { browseProducts, lookupBarcode, type BrowseResult } from "@/services/openfoodfacts";
import type { OpenFoodFactsResult } from "@/services/openfoodfacts/types";
import { EnvironmentalImpactCard } from "@/components/EnvironmentalImpactCard";
import { cn } from "@/lib/utils";
import { getBrandFlag } from "@/data/brandFlags";
import { LaborFlagBanner } from "@/components/LaborFlagBanner";

const CATEGORIES = [
  "All",
  "Beverages",
  "Dairy",
  "Snacks",
  "Cereals",
  "Meats",
  "Fruits",
  "Vegetables",
  "Frozen foods",
  "Breads",
  "Canned foods",
  "Condiments",
  "Chocolates",
  "Biscuits",
  "Cheeses",
  "Yogurts",
  "Juices",
  "Pastas",
  "Sauces",
  "Oils",
  "Coffees",
  "Teas",
  "Baby foods",
  "Pet foods",
];

const COUNTRIES = [
  "All",
  // North America
  "United States",
  "Canada",
  "Mexico",
  // Europe
  "France",
  "Germany",
  "United Kingdom",
  "Spain",
  "Italy",
  "Belgium",
  "Switzerland",
  "Netherlands",
  "Portugal",
  "Sweden",
  "Austria",
  "Poland",
  "Denmark",
  "Norway",
  "Finland",
  "Ireland",
  "Greece",
  // Indonesia
  "Indonesia",
];

function hasEcoScore(product: OpenFoodFactsResult): boolean {
  return !!product.ecoscoreGrade;
}

/**
 * Returns true if the product has a full environmental breakdown
 * (lifecycle CO2 data from Agribalyse, not just an eco-score letter).
 */
function hasFullBreakdown(product: OpenFoodFactsResult): boolean {
  const agri = product.ecoscoreData?.agribalyse;
  return !!(agri && typeof agri.co2_total === "number" && agri.co2_total > 0);
}

/**
 * Score a product's relevance to the search query.
 * Higher score = shown first.
 *
 * Priority:
 *   1. Product name contains the query  (+200)
 *   2. Has full environmental breakdown  (+100)
 *   3. Has carbon footprint data         (+50)
 *   4. Has an image                      (+10)
 */
function relevanceScore(product: OpenFoodFactsResult, query: string): number {
  let score = 0;
  const q = query.toLowerCase().trim();

  if (q) {
    const name = (product.productName || "").toLowerCase();
    const brand = (product.brand || "").toLowerCase();

    // Exact name match gets the highest boost
    if (name === q) {
      score += 300;
    } else if (name.includes(q)) {
      score += 200;
    } else if (brand.includes(q)) {
      // Brand match is useful but lower priority than name match
      score += 50;
    }
  }

  if (hasFullBreakdown(product)) score += 100;
  if (product.carbonFootprint100g !== null) score += 50;
  if (product.imageUrl) score += 10;

  return score;
}

function gradeColor(grade: string | null): string {
  if (!grade) return "bg-muted text-muted-foreground";
  switch (grade.toLowerCase()) {
    case "a": return "bg-score-excellent text-white";
    case "b": return "bg-score-good text-white";
    case "c": return "bg-score-fair text-white";
    case "d": return "bg-score-poor text-white";
    case "e": return "bg-score-critical text-white";
    default: return "bg-muted text-muted-foreground";
  }
}

const Database = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCountry, setSelectedCountry] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BrowseResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<OpenFoodFactsResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchProducts = useCallback(async (newPage: number = 1) => {
    setLoading(true);
    setPage(newPage);

    const query = search.trim();

    // Fetch more results so we have enough to filter from
    const data = await browseProducts({
      query: query || undefined,
      category: selectedCategory !== "All" ? selectedCategory : undefined,
      country: selectedCountry !== "All" ? selectedCountry : undefined,
      page: newPage,
      pageSize: query ? 100 : 24,
    });

    let filtered = data.products.filter(hasEcoScore);

    if (query) {
      // Sort by relevance — name matches first, then products with richer data
      filtered.sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query));
      filtered = filtered.slice(0, 24);
    }

    setResult({ ...data, products: filtered });
    setHasSearched(true);
    setLoading(false);
  }, [search, selectedCategory, selectedCountry]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(1);
  };

  const handleProductClick = async (product: OpenFoodFactsResult) => {
    setSelectedProduct(product);
    setDetailLoading(true);
    // Fetch full product data (search results may lack ecoscore_data)
    const full = await lookupBarcode(product.barcode);
    if (full.found) {
      setSelectedProduct(full);
    }
    setDetailLoading(false);
  };

  const totalPages = result ? Math.min(result.pageCount, 100) : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
              OpenFoodFacts Database
            </h1>
            <p className="text-muted-foreground">
              Browse over 3 million products from the open food database. Filter by category and country.
            </p>
          </div>

          {/* Filters */}
          <form onSubmit={handleSearch} className="space-y-4 mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products, brands..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-card border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Country */}
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="bg-card border border-input rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                <span className="ml-2">Search</span>
              </Button>
            </div>
          </form>

          {/* Results count */}
          {hasSearched && result && (
            <p className="text-sm text-muted-foreground mb-6">
              {result.totalCount.toLocaleString()} products found
              {result.totalCount > 0 && ` — Page ${page} of ${totalPages.toLocaleString()}`}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Searching OpenFoodFacts...</span>
            </div>
          )}

          {/* No search yet */}
          {!hasSearched && !loading && (
            <div className="text-center py-20">
              <Apple className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">Select filters and click Search to browse products</p>
              <p className="text-muted-foreground text-sm">You can search by name, filter by category, country, or any combination</p>
            </div>
          )}

          {/* Empty results */}
          {hasSearched && !loading && result && result.products.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No products found matching your criteria. Try adjusting your filters.</p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && result && result.products.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {result.products.map((product, idx) => (
                  <Card key={`${product.barcode}-${idx}`} className="overflow-hidden hover:shadow-card transition-all duration-300 group cursor-pointer" onClick={() => handleProductClick(product)}>
                    {/* Product Image */}
                    <div className="aspect-square bg-muted/50 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName || "Product"}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Apple className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}

                      {/* Score Badges */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        {product.ecoscoreGrade && (
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1", gradeColor(product.ecoscoreGrade))}>
                            <Leaf className="w-3 h-3" />
                            {product.ecoscoreGrade}
                          </span>
                        )}
                        {product.nutriscoreGrade && (
                          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full uppercase", gradeColor(product.nutriscoreGrade))}>
                            N {product.nutriscoreGrade}
                          </span>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {product.productName || "Unknown Product"}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
                      )}

                      {/* Labor flag */}
                      {getBrandFlag(product.brand) && (
                        <div className="mb-2">
                          <LaborFlagBanner flag={getBrandFlag(product.brand)!} compact />
                        </div>
                      )}

                      {/* Categories */}
                      {product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.categories.slice(0, 3).map((cat) => (
                            <Badge key={cat} variant="outline" className="text-[10px] px-1.5 py-0">
                              {cat}
                            </Badge>
                          ))}
                          {product.categories.length > 3 && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              +{product.categories.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* NOVA Group */}
                      {product.novaGroup && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          NOVA Group {product.novaGroup}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || loading}
                    onClick={() => fetchProducts(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {page > 2 && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => fetchProducts(1)}>1</Button>
                        {page > 3 && <span className="text-muted-foreground px-1">...</span>}
                      </>
                    )}
                    {page > 1 && (
                      <Button variant="ghost" size="sm" onClick={() => fetchProducts(page - 1)}>{page - 1}</Button>
                    )}
                    <Button variant="default" size="sm">{page}</Button>
                    {page < totalPages && (
                      <Button variant="ghost" size="sm" onClick={() => fetchProducts(page + 1)}>{page + 1}</Button>
                    )}
                    {page < totalPages - 1 && (
                      <>
                        {page < totalPages - 2 && <span className="text-muted-foreground px-1">...</span>}
                        <Button variant="ghost" size="sm" onClick={() => fetchProducts(totalPages)}>{totalPages}</Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages || loading}
                    onClick={() => fetchProducts(page + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => { if (!open) setSelectedProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Environmental Impact</DialogTitle>
          </DialogHeader>
          {detailLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading full product data...</span>
            </div>
          )}
          {selectedProduct && (
            <EnvironmentalImpactCard result={selectedProduct} />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Database;
