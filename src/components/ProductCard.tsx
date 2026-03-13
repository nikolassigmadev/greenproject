import { Link } from "react-router-dom";
import { Product, calculateScore } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const score = calculateScore(product);

  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-500' : 'text-red-500';
  const scoreBg = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  const laborEmoji = product.laborRisk === 'low' ? '🟢' : product.laborRisk === 'medium' ? '🟡' : '🔴';

  return (
    <Link to={`/product/${product.id.replace('#', '')}`}>
      <div className="group bg-white rounded-3xl border border-green-100 overflow-hidden hover:border-green-300 hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative h-44 bg-gray-50 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {product.category === 'Food & Beverage' || product.category === 'Snacks & Packaged Foods' ? '🥬' :
               product.category === 'Clothing' ? '👕' :
               product.category === 'Personal Care' ? '🧴' :
               product.category === 'Footwear' ? '👟' :
               product.category === 'Electronics & Appliances' ? '📱' : '📦'}
            </div>
          )}
          {/* Score badge */}
          <div className={`absolute top-3 right-3 ${scoreBg} rounded-xl px-2.5 py-1`}>
            <span className={`font-black text-sm ${scoreColor}`}>{score}</span>
          </div>
          {score >= 90 && (
            <div className="absolute top-3 left-3 bg-green-900 rounded-xl px-2.5 py-1">
              <span className="font-black text-white text-xs">Top Rated</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">{product.category}</p>
          <h3 className="font-black text-green-950 text-base leading-tight line-clamp-1 mb-0.5 group-hover:text-green-700 transition-colors">{product.name}</h3>
          <p className="text-sm text-gray-500 font-semibold mb-3">{product.brand}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
              {laborEmoji} {product.laborRisk} risk
            </span>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg">
              🌿 {product.carbonFootprint}kg CO₂
            </span>
            {product.certifications.length > 0 && (
              <span className="text-xs font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg">
                ✅ {product.certifications.length} cert{product.certifications.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
