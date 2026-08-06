import { useState } from 'react';
import { motion } from 'motion/react';
import { Star, Heart, ShoppingBag, ShieldCheck, HelpCircle, ChevronRight, Share2, Info, ArrowLeft } from 'lucide-react';
import { Product } from '../types';

interface ProductDetailViewProps {
  product: Product;
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: string[];
  products: Product[];
  onQuickView: (product: Product) => void;
  onNavigate: (view: string) => void;
}

export default function ProductDetailView({
  product,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  products,
  onQuickView,
  onNavigate
}: ProductDetailViewProps) {
  const [selectedImage, setSelectedImage] = useState(product.imageUrls[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(product.size);
  const [activeTab, setActiveTab] = useState<'info' | 'nutrition' | 'storage'>('info');

  const isWishlisted = wishlist.includes(product.id);
  const related = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 3);

  const incrementQty = () => setQuantity(prev => prev + 1);
  const decrementQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Back to shop navigation */}
      <button
        onClick={() => onNavigate('shop')}
        className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-[#FACC15] transition mb-6 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace Catalog
      </button>

      {/* Main product showcase grid */}
      <div className="grid lg:grid-cols-12 gap-12 bg-white/10 rounded-3xl border border-white/15 p-6 lg:p-10 shadow-2xl backdrop-blur-xl items-start text-white">
        
        {/* Left Column - Product Photos */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 aspect-[4/3]">
            <img src={selectedImage} alt={product.name} className="object-cover h-full w-full" />
            
            {/* Quick badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5">
              {product.originalPrice && (
                <span className="bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                  SAVE ₦{(product.originalPrice - product.price).toLocaleString()}
                </span>
              )}
              {product.isOrganic && (
                <span className="bg-[#16A34A] text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase">
                  🌿 100% Organic
                </span>
              )}
            </div>
          </div>

          {/* Multiple thumbnails */}
          {product.imageUrls.length > 1 && (
            <div className="flex gap-2.5">
              {product.imageUrls.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`h-16 w-20 rounded-xl overflow-hidden bg-white/5 border-2 transition cursor-pointer ${
                    selectedImage === img ? 'border-[#16A34A]' : 'border-white/10'
                  }`}
                >
                  <img src={img} alt="" className="object-cover h-full w-full" />
                </button>
              ))}
            </div>
          )}

          {/* Interactive mock 360 Rotator viewer */}
          <div className="bg-white/5 rounded-2xl border border-white/10 p-4 text-center space-y-1">
            <h5 className="text-[10px] font-black uppercase text-white tracking-wider">🔬 Interactive 360° Rotator View</h5>
            <p className="text-[11px] text-white/60">Drag thumbnail images above to swap perspective angles instantly.</p>
          </div>
        </div>

        {/* Right Column - Product Purchase Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-[#FACC15]">{product.category}</span>
            <h1 className="text-2xl lg:text-3xl font-bold font-sans mt-1 text-white">{product.name}</h1>
            {product.localName && (
              <p className="text-sm font-semibold text-white/70 italic mt-0.5">{product.localName}</p>
            )}

            {/* Star ratings */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`} />
                ))}
              </div>
              <span className="text-xs text-white/50 font-bold">{product.rating} Rating ({product.reviewsCount} customer reviews)</span>
            </div>
          </div>

          {/* Price blocks */}
          <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-bold text-white/50">Estimated Price</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-[#FACC15]">₦{product.price.toLocaleString()}</span>
                {product.originalPrice && (
                  <span className="text-sm text-white/40 line-through">₦{product.originalPrice.toLocaleString()}</span>
                )}
              </div>
            </div>
            
            {/* Freshness Badge Slider */}
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-white/50 mb-1">Freshness Index</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 px-3 py-1 text-xs font-bold text-[#FACC15]">
                🌱 {product.freshnessScore}% Fresh
              </span>
            </div>
          </div>

          <p className="text-xs text-white/70 leading-relaxed">{product.description}</p>

          {/* Sizes Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Select Size Options</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold border-2 transition cursor-pointer ${
                      selectedSize === s
                        ? 'border-[#16A34A] bg-[#16A34A]/20 text-white'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity selector and Add-to-cart block */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between border border-white/10 rounded-xl px-3 py-2 bg-white/5 sm:w-32 shrink-0">
              <button onClick={decrementQty} className="text-white/60 font-bold hover:text-white px-2 text-base cursor-pointer">-</button>
              <span className="text-xs font-bold text-white">{quantity}</span>
              <button onClick={incrementQty} className="text-white/60 font-bold hover:text-white px-2 text-base cursor-pointer">+</button>
            </div>

            <button
              onClick={() => {
                onAddToCart({ ...product, size: selectedSize }, quantity);
                alert(`🛒 Added ${quantity}x ${product.name} (${selectedSize}) to your basket!`);
              }}
              className="flex-1 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3.5 px-6 text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10 transition cursor-pointer"
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>Pack Into Shopping Basket</span>
            </button>

            <button
              onClick={() => onToggleWishlist(product)}
              className={`p-3.5 rounded-xl border transition shrink-0 cursor-pointer ${
                isWishlisted ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-white/10 bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Secondary Details Accordion tabs (Info, Nutrition, Storage) */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex gap-4 border-b border-white/10 text-xs font-semibold text-white/50 pb-2">
              <button
                onClick={() => setActiveTab('info')}
                className={`hover:text-[#FACC15] transition pb-2 border-b-2 -mb-2.5 cursor-pointer ${
                  activeTab === 'info' ? 'border-[#16A34A] text-white font-extrabold' : 'border-transparent'
                }`}
              >
                Key Facts
              </button>
              <button
                onClick={() => setActiveTab('nutrition')}
                className={`hover:text-[#FACC15] transition pb-2 border-b-2 -mb-2.5 cursor-pointer ${
                  activeTab === 'nutrition' ? 'border-[#16A34A] text-white font-extrabold' : 'border-transparent'
                }`}
              >
                Nutrition Tables
              </button>
              <button
                onClick={() => setActiveTab('storage')}
                className={`hover:text-[#FACC15] transition pb-2 border-b-2 -mb-2.5 cursor-pointer ${
                  activeTab === 'storage' ? 'border-[#16A34A] text-white font-extrabold' : 'border-transparent'
                }`}
              >
                Storage Advice
              </button>
            </div>

            <div className="pt-5 text-xs text-white/70 leading-relaxed">
              {activeTab === 'info' && (
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  <div>
                    <span className="block text-[10px] text-white/40 font-bold uppercase">Source Location</span>
                    <span className="font-semibold text-white">{product.origin}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 font-bold uppercase">Harvest/Batch Date</span>
                    <span className="font-semibold text-white">{product.harvestDate || "Vetted batch"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 font-bold uppercase">Best Before Expiry</span>
                    <span className="font-semibold text-white">{product.expiryDate || "Consume fresh"}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 font-bold uppercase">Delivery Dispatched From</span>
                    <span className="font-semibold text-white">Lekki Phase 1 Warehouse</span>
                  </div>
                </div>
              )}

              {activeTab === 'nutrition' && (
                <div className="bg-white/5 rounded-2xl border border-white/10 p-4 space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider mb-2">Nutrition facts per {product.size}</h4>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] text-white/40 font-normal">Calories</span>
                      <span className="text-white font-extrabold">{product.nutritionFacts.calories}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] text-white/40 font-normal">Protein</span>
                      <span className="text-white font-extrabold">{product.nutritionFacts.protein}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] text-white/40 font-normal">Carbs</span>
                      <span className="text-white font-extrabold">{product.nutritionFacts.carbs}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-xl border border-white/10">
                      <span className="block text-[10px] text-white/40 font-normal">Fat</span>
                      <span className="text-white font-extrabold">{product.nutritionFacts.fat}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'storage' && (
                <p className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-white text-xs leading-relaxed font-medium">
                  {product.storageInstructions}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Related cross selling items */}
      {related.length > 0 && (
        <section className="mt-14 space-y-6">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-lg font-bold text-white">Frequently Bought Together</h3>
            <p className="text-xs text-white/60 mt-0.5">Vetted by our AI assistant based on purchase combinations.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {related.map((p) => (
              <div key={p.id} className="bg-white/10 border border-white/15 rounded-2xl p-3 flex gap-3.5 items-center hover:border-[#16A34A] hover:shadow-2xl transition group text-white">
                <img src={p.imageUrls[0]} alt="" className="h-16 w-16 object-cover rounded-xl shrink-0 cursor-pointer" onClick={() => onQuickView(p)} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#FACC15] transition truncate cursor-pointer" onClick={() => onQuickView(p)}>
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-white/50 font-semibold">{p.size}</p>
                  <p className="text-xs font-extrabold text-[#FACC15] mt-1">₦{p.price.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => onAddToCart(p, 1)}
                  className="rounded-full bg-[#16A34A]/20 text-[#FACC15] hover:bg-[#16A34A] hover:text-white p-2 transition shrink-0 cursor-pointer"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
