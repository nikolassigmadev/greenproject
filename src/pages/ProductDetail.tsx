import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, Leaf, AlertTriangle, Award, Package, ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { calculateScore, findAlternatives } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { ScoreBreakdownSlider } from "@/components/ScoreBreakdownSlider";
import { lookupBarcode, isValidBarcode } from "@/services/openfoodfacts";
import { OpenFoodFactsCard } from "@/components/OpenFoodFactsCard";
import { EnvironmentalImpactCard } from "@/components/EnvironmentalImpactCard";
import { useState } from "react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const products = useProducts();
  const product = products.find((p) => p.id === `#${id}`);
  const [showEnvDetail, setShowEnvDetail] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <p className="text-6xl mb-6">🔍</p>
            <h1 className="text-2xl font-black text-black mb-3">Product Not Found</h1>
            <p className="text-gray-500 mb-8">The product you're looking for doesn't exist.</p>
            <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-black text-white font-bold">
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const score = calculateScore(product);
  const alternatives = findAlternatives(product, products);
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  const laborEmoji = product.laborRisk === 'low' ? '🟢' : product.laborRisk === 'medium' ? '🟡' : '🔴';

  const offQuery = useQuery({
    queryKey: ['openfoodfacts', product.barcode],
    queryFn: () => lookupBarcode(product.barcode!),
    enabled: !!product.barcode && isValidBarcode(product.barcode),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* Product image banner */}
      <div className="relative bg-black">
        <div className="relative h-72 sm:h-96 overflow-hidden">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl bg-gray-900">
              {product.category === 'Food & Beverage' || product.category === 'Snacks & Packaged Foods' ? '🥬' :
               product.category === 'Clothing' ? '👕' :
               product.category === 'Personal Care' ? '🧴' :
               product.category === 'Footwear' ? '👟' :
               product.category === 'Electronics & Appliances' ? '📱' : '📦'}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
          {/* Back button */}
          <Link to="/products" className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          {/* Ethics score floating label */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-white rounded-2xl px-4 py-2 shadow-2xl inline-flex flex-col">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ethics</p>
              <p className={`font-black text-3xl leading-none ${scoreColor}`}>{score}</p>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* White results card */}
        <div className="bg-white -mt-4 rounded-t-3xl relative z-10">
          <div className="max-w-screen-md mx-auto px-5 sm:px-6 pt-6 pb-8">
            {/* Category chip + product header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex-1">
                <span className="inline-flex mb-3 px-3 py-1 rounded-full bg-black text-white text-xs font-bold">{product.category}</span>
                <h1 className="text-2xl sm:text-3xl font-black text-black leading-tight">{product.name}</h1>
                <p className="text-base text-gray-500 font-semibold mt-1">{product.brand}</p>
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-400 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {product.origin.country}{product.origin.region ? `, ${product.origin.region}` : ''}
                </div>
              </div>
              {/* Quantity selector */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 flex-shrink-0 mt-6">
                <span className="text-gray-400 font-bold text-lg leading-none select-none">−</span>
                <span className="font-black text-black text-sm px-1">1</span>
                <span className="text-gray-400 font-bold text-lg leading-none select-none">+</span>
              </div>
            </div>

            {/* Certifications */}
            {product.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {product.certifications.map((cert, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 text-xs font-bold">
                    <Award className="w-3 h-3" />{cert}
                  </span>
                ))}
              </div>
            )}

            {/* Metrics grid - Cal AI style */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌱</span><span className="text-xs font-semibold text-gray-500">Ethics Score</span></div>
                <span className={`text-3xl font-black ${scoreColor}`}>{score}</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">⚠️</span><span className="text-xs font-semibold text-gray-500">Labor Risk</span></div>
                <span className="text-xl font-black text-black">{laborEmoji} <span className="capitalize">{product.laborRisk}</span></span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">🌿</span><span className="text-xs font-semibold text-gray-500">Carbon kg CO₂</span></div>
                <span className="text-3xl font-black text-black">{product.carbonFootprint}</span>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1"><span className="text-lg">✅</span><span className="text-xs font-semibold text-gray-500">Certifications</span></div>
                <span className="text-3xl font-black text-black">{product.certifications.length}</span>
              </div>
            </div>

            {/* Ethics score bar */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2"><span className="text-lg">💚</span><span className="text-sm font-bold text-black">Ethics score</span></div>
                <span className={`text-sm font-black ${scoreColor}`}>{score}/100</span>
              </div>
              <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: score >= 80 ? '#16a34a' : score >= 60 ? '#eab308' : '#ef4444' }}
                />
              </div>
            </div>

            {/* Score breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <p className="text-sm font-bold text-black mb-3">Score Breakdown</p>
              <ScoreBreakdownSlider product={product} />
            </div>

            {/* Materials */}
            {product.materials.length > 0 && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3"><Package className="w-4 h-4 text-gray-500" /><p className="text-sm font-bold text-black">Contents / Materials</p></div>
                <div className="flex flex-wrap gap-2">
                  {product.materials.map((mat, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-700">{mat}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Transport */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2"><Truck className="w-4 h-4 text-gray-500" /><p className="text-sm font-bold text-black">Transport Distance</p></div>
              <p className="text-2xl font-black text-black">{product.transportDistance.toLocaleString()} <span className="text-sm font-semibold text-gray-500">km</span></p>
            </div>

            {/* Comments */}
            {product.comments && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-sm font-bold text-black mb-2">Product Information</p>
                <p className="text-sm text-gray-600 leading-relaxed">{product.comments}</p>
              </div>
            )}

            {/* OpenFoodFacts data */}
            {offQuery.isLoading && (
              <div className="bg-gray-50 rounded-2xl p-4 mb-4 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-green-600" />
                <span className="text-sm text-gray-500 font-medium">Fetching environmental data…</span>
              </div>
            )}
            {offQuery.data?.found && (
              <div className="mb-4">
                {!showEnvDetail ? (
                  <div className="space-y-3">
                    <OpenFoodFactsCard result={offQuery.data} />
                    <button
                      onClick={() => setShowEnvDetail(true)}
                      className="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-black font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Leaf className="w-4 h-4 text-green-600" />View Full Environmental Impact
                    </button>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setShowEnvDetail(false)} className="mb-3 text-sm font-semibold text-gray-500 flex items-center gap-1.5 hover:text-black transition-colors">
                      <ArrowLeft className="w-4 h-4" />Back
                    </button>
                    <EnvironmentalImpactCard result={offQuery.data} />
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3 pt-2">
              <Link
                to="/scan"
                className="w-full py-4 rounded-2xl border-2 border-gray-200 text-black font-bold text-base flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                ✨ Fix Results
              </Link>
              <Link
                to="/products"
                className="w-full py-4 rounded-2xl bg-black text-white font-bold text-base flex items-center justify-center"
              >
                Done
              </Link>
            </div>
          </div>
        </div>

        {/* Better alternatives */}
        {alternatives.length > 0 && (
          <section className="py-12 bg-gray-50">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-black tracking-tight">Better Alternatives</h2>
                  <p className="text-gray-500 font-medium text-sm mt-1">More sustainable options</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {alternatives.map(alt => (
                  <ProductCard key={alt.id} product={alt} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
