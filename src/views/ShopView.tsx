import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { SlidersHorizontal, Grid, List, Search, Star, Heart, ShoppingBag, Eye, X, Check, RefreshCw, Plus, Edit3, Trash2, ShieldCheck } from 'lucide-react';
import { Product, AdminRole } from '../types';
import { getAdminPermissions } from '../lib/adminService';

interface ShopViewProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: string[];
  onQuickView: (product: Product) => void;
  initialCategory?: string;
  initialSearch?: string;
  currentRole?: AdminRole | null;
  onOpenAdminPortal?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => Promise<void>;
  onAddNewProduce?: () => void;
}

export default function ShopView({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  onQuickView,
  initialCategory = "",
  initialSearch = "",
  currentRole,
  onOpenAdminPortal,
  onEditProduct,
  onDeleteProduct,
  onAddNewProduce
}: ShopViewProps) {
  const permissions = getAdminPermissions(currentRole);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [filterOrganic, setFilterOrganic] = useState<boolean>(false);
  const [filterImported, setFilterImported] = useState<boolean>(false);
  const [filterFreshToday, setFilterFreshToday] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("default");

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedPriceRange("all");
    setFilterOrganic(false);
    setFilterImported(false);
    setFilterFreshToday(false);
    setSortBy("default");
  };

  // Extract unique categories from product list
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return Array.from(list);
  }, [products]);

  // Compute filtered & sorted product lists
  const processedProducts = useMemo(() => {
    let list = [...products];

    // Search query matching
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.localName && p.localName.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    }

    // Category matching
    if (selectedCategory) {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Price filters
    if (selectedPriceRange !== "all") {
      if (selectedPriceRange === "under-5k") {
        list = list.filter(p => p.price < 5000);
      } else if (selectedPriceRange === "5k-15k") {
        list = list.filter(p => p.price >= 5000 && p.price <= 15000);
      } else if (selectedPriceRange === "above-15k") {
        list = list.filter(p => p.price > 15000);
      }
    }

    // Boolean flags
    if (filterOrganic) {
      list = list.filter(p => p.isOrganic);
    }
    if (filterImported) {
      list = list.filter(p => p.isImported);
    }
    if (filterFreshToday) {
      list = list.filter(p => p.freshnessScore >= 98);
    }

    // Sort options
    if (sortBy === "price-low-high") {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high-low") {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === "discount") {
      list.sort((a, b) => {
        const discA = a.originalPrice ? a.originalPrice - a.price : 0;
        const discB = b.originalPrice ? b.originalPrice - b.price : 0;
        return discB - discA;
      });
    }

    return list;
  }, [products, searchQuery, selectedCategory, selectedPriceRange, filterOrganic, filterImported, filterFreshToday, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Title / Banner header */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-10 text-white mb-8 relative overflow-hidden shadow-2xl backdrop-blur-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-700/10 via-emerald-950/10 to-transparent" />
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/10 inline-block">
            Direct Sourcing Guaranteed
          </span>
          <h2 className="text-2xl lg:text-3xl font-bold font-sans">Premium Nigerian Marketplace</h2>
          <p className="text-xs text-white/70 leading-relaxed">
            Browse our carefully vetted list of fresh fruits, hand-sorted vegetables, stone-free rice grains, and essential kitchen ingredients. Sourced raw, delivered ripe.
          </p>

          {currentRole && onOpenAdminPortal && (
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                onClick={onOpenAdminPortal}
                className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3.5 py-2 rounded-xl border border-amber-500/40 flex items-center gap-2 transition cursor-pointer shadow"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                <span>Admin Operations Center</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-amber-500/30 text-amber-200 rounded">
                  {currentRole.replace('_', ' ')}
                </span>
              </button>

              {permissions.canCreate && onAddNewProduce && (
                <button
                  onClick={onAddNewProduce}
                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Produce</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filter Layout */}
      <div className="grid lg:grid-cols-4 gap-8 items-start">
        
        {/* Left Filters Sidebar */}
        <div className="lg:col-span-1 bg-white/10 border border-white/15 rounded-3xl p-5 space-y-6 shadow-2xl backdrop-blur-xl sticky top-28 text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <SlidersHorizontal className="h-4.5 w-4.5 text-[#FACC15]" /> Advanced Filters
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" /> Reset
            </button>
          </div>

          {/* Search bar within filters */}
          <div>
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Search Catalog</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type item keyword..."
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 pl-9 text-xs focus:bg-white/10 focus:outline-none text-white placeholder-white/40 transition"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
            </div>
          </div>

          {/* Categories select list */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1">Categories</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory("")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                  selectedCategory === "" ? 'bg-[#16A34A] text-white' : 'text-white/85 hover:bg-white/5'
                }`}
              >
                <span>All Departments</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
                    selectedCategory === cat ? 'bg-[#16A34A] text-white' : 'text-white/85 hover:bg-white/5'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Price Range</label>
            <div className="space-y-1.5 text-xs text-white/80">
              <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === "all"}
                  onChange={() => setSelectedPriceRange("all")}
                  className="accent-[#16A34A]"
                />
                <span>All Prices</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === "under-5k"}
                  onChange={() => setSelectedPriceRange("under-5k")}
                  className="accent-[#16A34A]"
                />
                <span>Under ₦5,000</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === "5k-15k"}
                  onChange={() => setSelectedPriceRange("5k-15k")}
                  className="accent-[#16A34A]"
                />
                <span>₦5,000 - ₦15,000</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-white/5 rounded">
                <input
                  type="radio"
                  name="priceRange"
                  checked={selectedPriceRange === "above-15k"}
                  onChange={() => setSelectedPriceRange("above-15k")}
                  className="accent-[#16A34A]"
                />
                <span>Above ₦15,000</span>
              </label>
            </div>
          </div>

          {/* Attributes filters (Organic, Imported, Fresh Today) */}
          <div className="space-y-2.5 pt-3 border-t border-white/10">
            <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Product Tags</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white/85">
                <input
                  type="checkbox"
                  checked={filterOrganic}
                  onChange={(e) => setFilterOrganic(e.target.checked)}
                  className="h-4 w-4 rounded text-[#16A34A] accent-[#16A34A]"
                />
                <span>🌿 100% Organic</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white/85">
                <input
                  type="checkbox"
                  checked={filterImported}
                  onChange={(e) => setFilterImported(e.target.checked)}
                  className="h-4 w-4 rounded text-[#16A34A] accent-[#16A34A]"
                />
                <span>✈️ Premium Imported</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-white/85">
                <input
                  type="checkbox"
                  checked={filterFreshToday}
                  onChange={(e) => setFilterFreshToday(e.target.checked)}
                  className="h-4 w-4 rounded text-[#16A34A] accent-[#16A34A]"
                />
                <span>🌟 Ultra Fresh (98%+)</span>
              </label>
            </div>
          </div>

        </div>

        {/* Right Product Grid Area */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar (Sorting, View Toggle, Result Count) */}
          <div className="bg-white/10 border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-2xl backdrop-blur-xl text-white">
            <p className="text-xs text-white/70 font-bold">
              Showing <span className="text-[#FACC15]">{processedProducts.length}</span> of {products.length} products
            </p>
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
              
              {/* Sorting Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50 font-bold whitespace-nowrap">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white font-bold focus:outline-none focus:bg-white/10 cursor-pointer"
                >
                  <option value="default" className="text-stone-900">Default Match</option>
                  <option value="price-low-high" className="text-stone-900">Price: Low to High</option>
                  <option value="price-high-low" className="text-stone-900">Price: High to Low</option>
                  <option value="rating" className="text-stone-900">Highest Rated</option>
                  <option value="discount" className="text-stone-900">Biggest Discounts</option>
                </select>
              </div>

              {/* Grid / List toggle */}
              <div className="flex rounded-xl bg-white/5 p-1 border border-white/10 backdrop-blur-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    viewMode === 'list' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Active filter pills */}
          {(selectedCategory || selectedPriceRange !== "all" || filterOrganic || filterImported || filterFreshToday || searchQuery) && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Active Filters:</span>
              {searchQuery && (
                <span className="bg-white/5 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  &quot;{searchQuery}&quot; <X className="h-3 w-3 text-white/40 hover:text-white cursor-pointer" onClick={() => setSearchQuery("")} />
                </span>
              )}
              {selectedCategory && (
                <span className="bg-[#16A34A]/20 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  Category: {selectedCategory} <X className="h-3 w-3 text-white/50 hover:text-white cursor-pointer" onClick={() => setSelectedCategory("")} />
                </span>
              )}
              {selectedPriceRange !== "all" && (
                <span className="bg-orange-500/20 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  Price: {selectedPriceRange} <X className="h-3 w-3 text-white/50 hover:text-white cursor-pointer" onClick={() => setSelectedPriceRange("all")} />
                </span>
              )}
              {filterOrganic && (
                <span className="bg-white/5 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  🌿 Organic <X className="h-3 w-3 text-white/40 hover:text-white cursor-pointer" onClick={() => setFilterOrganic(false)} />
                </span>
              )}
              {filterImported && (
                <span className="bg-white/5 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  ✈️ Imported <X className="h-3 w-3 text-white/40 hover:text-white cursor-pointer" onClick={() => setFilterImported(false)} />
                </span>
              )}
              {filterFreshToday && (
                <span className="bg-white/5 text-white border border-white/10 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                  🌟 Fresh <X className="h-3 w-3 text-white/40 hover:text-white cursor-pointer" onClick={() => setFilterFreshToday(false)} />
                </span>
              )}
            </div>
          )}

          {/* Catalog list block */}
          {processedProducts.length > 0 ? (
            <div className={viewMode === 'grid' ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {processedProducts.map((p) => {
                const isWishlisted = wishlist.includes(p.id);
                const hasDiscount = !!p.originalPrice;
                const discountPct = hasDiscount && p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;

                // Grid Card representation
                if (viewMode === 'grid') {
                  return (
                    <div key={p.id} className="bg-white/10 rounded-3xl border border-white/15 p-3 flex flex-col justify-between hover:border-[#16A34A] hover:bg-white/15 hover:shadow-2xl group transition-all duration-300 relative backdrop-blur-md text-white">
                      <button
                        onClick={() => onToggleWishlist(p)}
                        className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                          isWishlisted ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60 hover:text-white'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                      </button>

                      <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                        {hasDiscount && (
                          <span className="bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                            -{discountPct}% OFF
                          </span>
                        )}
                        {p.isOrganic && (
                          <span className="bg-[#16A34A] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                            🌿 ORGANIC
                          </span>
                        )}
                      </div>

                      <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 mb-3 cursor-pointer" onClick={() => onQuickView(p)}>
                        <img src={p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt={p.name} className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
                      </div>

                      <div className="flex-1 flex flex-col justify-between space-y-2">
                        <div>
                          <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{p.category}</span>
                          <h4 className="text-xs font-bold text-white leading-snug mt-1 cursor-pointer group-hover:text-[#FACC15] transition line-clamp-1" onClick={() => onQuickView(p)}>
                            {p.name}
                          </h4>
                          {p.localName && (
                            <p className="text-[10px] text-white/60 italic font-medium leading-none">{p.localName}</p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5">
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, idx) => (
                                <Star key={idx} className={`h-3 w-3 ${idx < Math.floor(p.rating) ? 'fill-current' : ''}`} />
                              ))}
                            </div>
                            <span className="text-[10px] text-white/50 font-bold">({p.reviewsCount})</span>
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-xl p-2 space-y-0.5 text-[9px] backdrop-blur-sm">
                          <p className="text-[#FACC15] font-bold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span>
                            {p.freshnessText}
                          </p>
                          <p className="text-white/60">🚚 Estimate: {p.deliveryTimeEstimate}</p>
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black text-[#FACC15]">₦{p.price.toLocaleString()}</p>
                            <p className="text-[9px] text-white/50">{p.size}</p>
                          </div>
                          <button
                            onClick={() => onAddToCart(p, 1)}
                            className="rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white p-2.5 shadow transition-all cursor-pointer"
                          >
                            <ShoppingBag className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                // List Row representation
                return (
                  <div key={p.id} className="bg-white/10 rounded-3xl border border-white/15 p-4 flex flex-col sm:flex-row items-center gap-4 hover:border-[#16A34A] hover:bg-white/15 hover:shadow-2xl transition group backdrop-blur-md text-white">
                    <div className="h-28 w-28 shrink-0 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative cursor-pointer" onClick={() => onQuickView(p)}>
                      <img src={p.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt={p.name} className="object-cover h-full w-full group-hover:scale-105 transition" />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1.5 text-center sm:text-left">
                      <div>
                        <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{p.category}</span>
                        <h4 className="text-sm font-bold text-white cursor-pointer group-hover:text-[#FACC15] transition" onClick={() => onQuickView(p)}>
                          {p.name}
                        </h4>
                        {p.localName && (
                          <p className="text-xs text-white/60 italic leading-none">{p.localName}</p>
                        )}
                      </div>
                      <p className="text-xs text-white/70 line-clamp-1">{p.description}</p>
                      
                      <div className="flex items-center justify-center sm:justify-start gap-3">
                        <span className="text-[10px] text-[#FACC15] font-bold bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                          {p.freshnessText}
                        </span>
                        <span className="text-[10px] text-white/60 font-bold">🚚 {p.deliveryTimeEstimate}</span>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 text-center sm:text-right space-y-2 flex sm:flex-col justify-between items-center sm:items-end">
                      <div>
                        <p className="text-base font-black text-[#FACC15]">₦{p.price.toLocaleString()}</p>
                        <p className="text-xs text-white/50">{p.size}</p>
                        {hasDiscount && (
                          <p className="text-[10px] text-white/40 line-through">₦{p.originalPrice?.toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onToggleWishlist(p)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer ${
                            isWishlisted ? 'border-orange-500/20 bg-orange-500 text-white' : 'border-white/10 hover:bg-white/5 text-white/60'
                          }`}
                        >
                          <Heart className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => onAddToCart(p, 1)}
                          className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold px-4 py-2 text-xs flex items-center gap-1.5 shadow transition cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" /> <span>Add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white/10 border border-white/15 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-2xl backdrop-blur-xl text-white">
              <span className="text-4xl">🌾</span>
              <h3 className="text-sm font-bold text-white">No Products Found</h3>
              <p className="text-xs text-white/60 leading-relaxed">
                We couldn&apos;t find any items matching your active filter criteria. Try adjusting your search query, price ranges, or departments.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 text-xs transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
