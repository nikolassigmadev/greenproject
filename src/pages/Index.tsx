import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { calculateScore } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { Shirt, Home, Smartphone, Apple, Heart, Coffee, FootprintsIcon, Package, ArrowRight, Camera, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const categoryConfig: Record<string, { icon: typeof Shirt; emoji: string; description: string }> = {
  'Clothing': { icon: Shirt, emoji: '👕', description: 'Sustainable apparel' },
  'Drinkware': { icon: Home, emoji: '🥤', description: 'Eco-friendly containers' },
  'Food & Beverage': { icon: Apple, emoji: '🍎', description: 'Ethical food choices' },
  'Personal Care': { icon: Heart, emoji: '💚', description: 'Natural body care' },
  'Footwear': { icon: FootprintsIcon, emoji: '👟', description: 'Sustainable shoes' },
  'Meat, Dairy & Eggs': { icon: Package, emoji: '🥚', description: 'Ethical animal products' },
  'Electronics & Appliances': { icon: Smartphone, emoji: '📱', description: 'Green technology' },
  'Snacks & Packaged Foods': { icon: Coffee, emoji: '🍫', description: 'Healthy snacks' },
};

const Index = () => {
  const products = useProducts();
  const categories = [...new Set(products.map(p => p.category))];

  const topProducts = products
    .map(p => ({ product: p, score: calculateScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ product }) => product);

  const alternativeProducts = products
    .map(p => ({ product: p, score: calculateScore(p) }))
    .filter(({ score }) => score >= 97)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ product }) => product);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-green-900 text-white">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
            <div className="max-w-2xl">
              <p className="text-green-300 font-bold text-sm uppercase tracking-widest mb-4">Ethical Shopping</p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tighter leading-none mb-6">
                Know the<br />
                <span className="text-green-300">True Cost</span><br />
                of What You Buy
              </h1>
              <p className="text-green-200/70 text-lg leading-relaxed mb-10 max-w-lg">
                Scan any product to reveal its environmental impact, labor practices, and discover more ethical alternatives.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-green-900 font-black text-base hover:bg-green-50 transition-colors"
                >
                  <Camera className="w-5 h-5" />
                  Start Scanning
                </Link>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 text-white font-black text-base hover:bg-white/20 transition-colors border border-white/20"
                >
                  Browse Products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-b border-gray-100">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-3 gap-6 sm:gap-12">
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-green-950">{products.length}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">Products Rated</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-green-950">{categories.length}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl sm:text-4xl font-black text-green-600">{alternativeProducts.length}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">Top Ethical</p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-20">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950 mb-12">How it works</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {[
                { n: '01', title: 'Scan Product', desc: 'Use your camera to scan a barcode or capture product text', emoji: '📷' },
                { n: '02', title: 'Get Insights', desc: 'Instantly see ethical scores, origin data, and carbon impact', emoji: '📊' },
                { n: '03', title: 'Choose Better', desc: 'Discover sustainable alternatives that match your values', emoji: '🌱' },
              ].map(step => (
                <div key={step.n} className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-green-900 text-white flex items-center justify-center flex-shrink-0 font-black text-sm">{step.n}</div>
                  <div>
                    <p className="text-2xl mb-1">{step.emoji}</p>
                    <h3 className="font-black text-green-950 text-lg mb-1">{step.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 sm:py-20 bg-green-50/50">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950">Shop by category</h2>
              <Link to="/products" className="text-sm font-bold text-gray-500 hover:text-green-900 transition-colors flex items-center gap-1">
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {categories.map(cat => {
                const config = categoryConfig[cat] || { icon: Package, emoji: '📦', description: 'Product category' };
                const count = products.filter(p => p.category === cat).length;
                return (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="group bg-white rounded-2xl p-5 border border-green-100 hover:border-green-800 hover:shadow-lg transition-all duration-200"
                  >
                    <span className="text-3xl block mb-3">{config.emoji}</span>
                    <h3 className="font-black text-green-950 text-sm leading-tight mb-1 group-hover:text-green-900">{cat}</h3>
                    <p className="text-xs text-gray-400 font-semibold">{count} products</p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Top ethical products */}
        {alternativeProducts.length > 0 && (
          <section className="py-16 sm:py-20">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-green-950">The Alternative</h2>
                  <p className="text-gray-500 font-medium mt-1">Products scoring 97 or higher</p>
                </div>
                <Link to="/products?minScore=97" className="text-sm font-bold text-gray-500 hover:text-green-900 transition-colors flex items-center gap-1">
                  See all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {alternativeProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 sm:py-24 bg-green-900">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-6">
              Ready to shop <span className="text-green-300">consciously?</span>
            </h2>
            <p className="text-green-200/70 text-lg mb-10 max-w-xl mx-auto">
              Start scanning products today to join thousands making more sustainable choices.
            </p>
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-white text-green-900 font-black text-lg hover:bg-green-50 transition-colors"
            >
              <Camera className="w-5 h-5" />
              Start Your First Scan
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
