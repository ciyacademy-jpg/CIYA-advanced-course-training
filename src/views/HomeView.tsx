import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Truck, 
  Percent, 
  Zap, 
  ArrowRight, 
  Heart, 
  ShoppingBag, 
  Eye, 
  Star, 
  Apple, 
  Scale, 
  Utensils, 
  CheckCircle, 
  Compass, 
  Users, 
  HeartHandshake,
  Edit3,
  Trash2,
  Plus,
  Crown,
  Settings
} from 'lucide-react';
import { Product, AdminRole } from '../types';
import { getAdminPermissions, SUPER_ADMIN_EMAIL } from '../lib/adminService';
import { HARVEST_CATEGORIES } from '../lib/productService';

interface HomeViewProps {
  products: Product[];
  onAddToCart: (product: Product, qty: number) => void;
  onToggleWishlist: (product: Product) => void;
  wishlist: string[];
  onQuickView: (product: Product) => void;
  onNavigate: (view: string) => void;
  currentRole?: AdminRole | null;
  currentEmail?: string | null;
  onOpenAdminPortal?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (id: string) => Promise<void>;
  onAddNewProduce?: () => void;
}

const liveOrders = [
  { name: "Chinedu", location: "Lekki Phase 1", action: "just bought 10kg Abakaliki Rice", time: "1m ago" },
  { name: "Folake", location: "Ikeja GRA", action: "ordered Nigerian Soup Ingredients Bundle", time: "3m ago" },
  { name: "Okon", location: "Wuse II, Abuja", action: "subscribed to Weekly Fruits & Veggies Pack", time: "5m ago" },
  { name: "Yusuf", location: "GRA Phase 2, PH", action: "saved ₦3,500 on Daily Deals tomatoes", time: "7m ago" },
  { name: "Amara", location: "Surulere, Lagos", action: "unlocked VIP Bronze reward milestone", time: "10m ago" }
];

const categoryCards = [
  { name: "Fresh Fruits", count: "35 items", icon: "🍎", image: "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&q=80&w=300" },
  { name: "Fresh Vegetables", count: "48 items", icon: "🥬", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300" },
  { name: "Meat & Seafood", count: "29 items", icon: "🥩", image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=300" },
  { name: "Rice & Grains", count: "22 items", icon: "🌾", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=300" },
  { name: "Beverages", count: "42 items", icon: "🧃", image: "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=300" },
  { name: "Bakery", count: "18 items", icon: "🍞", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=300" }
];

const features = [
  { title: "Farm-Fresh Produce Daily", text: "Harvested at 4:00 AM, delivered directly from our vetted farms to your kitchen in record time.", icon: "🌱" },
  { title: "Same-Day Delivery Guarantee", text: "Order before 2:00 PM and get your grocery basket delivered same-day, clean and sorted.", icon: "⚡" },
  { title: "Affordable Everyday Prices", text: "We cut out the middlemen to offer you direct wholesale pricing, saving you up to 25%.", icon: "💰" },
  { title: "100% Freshness Guarantee", text: "Not satisfied with the quality of any fresh item? We will swap it or refund you instantly, no questions.", icon: "🤝" }
];

const socialCounters = [
  { label: "Orders Handled", val: "1,240,500+" },
  { label: "Happy Shoppers", val: "250,000+" },
  { label: "Partner Farms", val: "54 Farms" },
  { label: "Cities Served", val: "15+ Cities" }
];

const customerTestimonials = [
  { name: "Chioma Nnadi", loc: "Lekki, Lagos", products: "Tomatoes, Catfish", comment: "The stone-free Abakaliki rice is literally a lifesaver. No stones, no dirt, cooks super clean. The catfish pepper soup bundle was also extremely fresh. 10/10!", rating: 5, date: "July 19, 2026" },
  { name: "Tunde Bakare", loc: "Ikeja, Lagos", products: "Monthly Family Pack", comment: "The subscription grocery plan is perfect for working dads. We get fresh tomatoes, eggs, oil, and rice delivered every Saturday without opening an app. Saved us tons of time.", rating: 5, date: "July 15, 2026" },
  { name: "Halima Ibrahim", loc: "Wuse II, Abuja", products: "Fresh Fruit Basket", comment: "Stunning pineapples and mangoes. Super sweet, completely ripe, and clean. Delivery was prompt and the rider was very polite.", rating: 5, date: "July 12, 2026" }
];

export default function HomeView({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlist,
  onQuickView,
  onNavigate,
  currentRole,
  currentEmail,
  onOpenAdminPortal,
  onEditProduct,
  onDeleteProduct,
  onAddNewProduce
}: HomeViewProps) {
  // Live ticker active index
  const [tickerIndex, setTickerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hrs: 14, mins: 42, secs: 19 });
  
  // Harvest category filter
  const [selectedHarvestCategory, setSelectedHarvestCategory] = useState<string>('All Harvest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Admin permissions resolution
  const permissions = getAdminPermissions(currentRole);
  
  // Smart planner state
  const [plannerMode, setPlannerMode] = useState<'soup' | 'student' | 'family'>('soup');
  
  // Lifecycle ticker loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveOrders.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Countdown timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hrs > 0) return { hrs: prev.hrs - 1, mins: 59, secs: 59 };
        return { hrs: 14, mins: 42, secs: 19 }; // Reset
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter 3 hot deals for the Deals Section
  const hotDeals = products.filter(p => p.originalPrice).slice(0, 3);
  
  // Featured list of 15 items
  const featuredProducts = products.slice(0, 15);

  // Sub-bundles of products for collections
  const soupBundleProducts = products.filter(p => ['prod-2', 'prod-3', 'prod-6']).slice(0, 3);
  const studentBundleProducts = products.filter(p => ['prod-14', 'prod-9', 'prod-5', 'prod-18']).slice(0, 4);

  const addBundleToCart = (bundle: Product[]) => {
    bundle.forEach(p => onAddToCart(p, 1));
    alert("🥘 Success! The customized healthy living bundle ingredients have been packed into your basket.");
  };

  return (
    <div className="font-sans text-white bg-transparent pb-16">
      
      {/* Live Order Ticker Bar */}
      <div className="bg-[#0b2b16]/70 backdrop-blur-md border-b border-white/10 py-2 px-4 text-xs font-semibold text-white/80 relative z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#F97316] animate-ping"></span>
            <span className="text-[10px] uppercase font-black text-[#FACC15] tracking-wider">Live Feed:</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={tickerIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-white/80 font-medium"
              >
                <b>{liveOrders[tickerIndex].name}</b> in {liveOrders[tickerIndex].location} {liveOrders[tickerIndex].action} ({liveOrders[tickerIndex].time})
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="hidden sm:inline text-[10px] text-[#FACC15] font-bold">12 Active Couriers in Lagos</span>
        </div>
      </div>

      {/* Hero Visual Section */}
      <section className="relative bg-emerald-950 text-white overflow-hidden py-16 lg:py-24">
        {/* Floating background gradient circles */}
        <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Copywriting */}
          <div className="lg:col-span-7 space-y-6 lg:pr-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-900/60 border border-emerald-800 px-3.5 py-1.5 text-xs text-yellow-400 font-bold">
              <Sparkles className="h-4 w-4" />
              <span>₦10,000 Cashback on first subscription pack!</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-black font-sans leading-[1.1] tracking-tight">
              Fresh Groceries <br />
              <span className="text-emerald-400">Delivered To Your</span> <br />
              Doorstep.
            </h1>
            
            <p className="text-base lg:text-lg text-emerald-100 max-w-xl leading-relaxed">
              Farm-fresh produce, trusted quality, same-day delivery, and unbeatable wholesale prices across Nigeria.
            </p>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => onNavigate('shop')}
                className="rounded-full bg-emerald-500 hover:bg-emerald-400 px-7 py-4 text-sm font-bold text-emerald-950 shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
              >
                <span>Shop Fresh Produce</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => onNavigate('shop?filter=deals')}
                className="rounded-full bg-transparent border-2 border-emerald-700 hover:border-emerald-500 hover:bg-emerald-900/40 px-6 py-3.5 text-sm font-bold text-white transition cursor-pointer"
              >
                Today&apos;s Deals
              </button>
              <button
                onClick={() => onNavigate('subscriptions')}
                className="rounded-full bg-orange-500 hover:bg-orange-400 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/10 transition cursor-pointer"
              >
                Subscribe & Save
              </button>
            </div>

            {/* Quick trust metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-emerald-900 text-left max-w-md mx-auto lg:mx-0">
              <div>
                <h4 className="text-base font-bold text-emerald-400">100%</h4>
                <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Freshness Assured</p>
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-400">4.9★</h4>
                <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Over 10k Reviews</p>
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-400">Epe Farm</h4>
                <p className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Direct Sourcing</p>
              </div>
            </div>
          </div>

          {/* Hero Right Cinematic Visual Module */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-900/40 aspect-[4/3] bg-emerald-900">
              
              {/* Simulated looping background video - HTML5 video player with clean visual overlays */}
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600"
                alt="Cinematic Grocery Sourcing Background"
                className="absolute inset-0 w-full h-full object-cover opacity-85 hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/20 to-transparent" />

              {/* Autoplay animated ticker cards on visual frame */}
              <div className="absolute bottom-4 left-4 right-4 bg-emerald-950/80 backdrop-blur-md rounded-2xl p-4 border border-emerald-800 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl overflow-hidden border border-emerald-700 shrink-0">
                    <img src="https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=150" alt="Roma Tomatoes" className="object-cover h-full w-full" />
                  </div>
                  <div>
                    <span className="inline-block bg-orange-500 text-[9px] font-black uppercase text-white px-1.5 py-0.5 rounded mb-1">BEST SELLER</span>
                    <h5 className="text-xs font-bold text-white">Jos Red Roma Tomatoes</h5>
                    <p className="text-[10px] text-emerald-300">Harvested yesterday morning</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const tomatoes = products.find(p => p.id === 'prod-2');
                    if (tomatoes) onAddToCart(tomatoes, 1);
                  }}
                  className="rounded-full bg-emerald-500 hover:bg-emerald-400 p-2 text-emerald-950 shadow transition shrink-0"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
              </div>

              {/* Top floating premium badge */}
              <div className="absolute top-4 right-4 bg-emerald-500/90 text-emerald-950 backdrop-blur-sm rounded-full py-1 px-3 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <ShieldCheck className="h-3.5 w-3.5" /> Checked for pesticides
              </div>
            </div>

            {/* floating feedback card */}
            <div className="absolute -top-6 -left-6 bg-white text-stone-800 p-3 rounded-2xl shadow-xl hidden sm:flex items-center gap-3 border border-stone-100 max-w-[200px]">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold shrink-0 text-xs">🚀</div>
              <div>
                <h5 className="text-[11px] font-extrabold text-stone-800 leading-none">Express delivery</h5>
                <p className="text-[9px] text-stone-500 mt-1 leading-tight">Same day dispatch cross Lagos</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Shop By Category Cards */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
          <div>
            <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Premium Departments</span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">Shop By Farm Category</h2>
          </div>
          <button
            onClick={() => onNavigate('shop')}
            className="text-xs font-bold text-[#FACC15] hover:text-white flex items-center gap-1 transition cursor-pointer"
          >
            <span>See All Categories</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categoryCards.map((cat, i) => (
            <div
              key={i}
              onClick={() => onNavigate(`shop?category=${encodeURIComponent(cat.name)}`)}
              className="group bg-white/10 rounded-2xl border border-white/15 hover:border-[#16A34A] hover:bg-white/20 hover:shadow-xl p-4 text-center cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-md"
            >
              <div className="h-20 w-full rounded-xl overflow-hidden mb-3 relative bg-white/5">
                <img src={cat.image} alt={cat.name} className="object-cover h-full w-full group-hover:scale-110 transition duration-500" />
                <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full h-8 w-8 flex items-center justify-center text-lg shadow-sm text-white">
                  {cat.icon}
                </span>
              </div>
              <h3 className="text-xs font-extrabold text-white group-hover:text-[#FACC15] transition leading-none truncate">
                {cat.name}
              </h3>
              <p className="text-[10px] text-white/50 font-semibold mt-1.5">{cat.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daily Deals Section (Urgency, Countdown timer) */}
      <section className="bg-white/5 border border-white/10 backdrop-blur-2xl text-white py-14 px-4 lg:px-8 overflow-hidden rounded-3xl max-w-7xl mx-auto my-6 relative shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-800/20 rounded-full blur-3xl translate-x-20 -translate-y-20" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Flash Deal Promo Copy */}
          <div className="space-y-4 max-w-md shrink-0 text-center lg:text-left">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#F97316] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
              <Zap className="h-3.5 w-3.5 fill-current animate-bounce" /> Flash Discount Limit 
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight font-sans">Weekend Fresh Deals Live!</h2>
            <p className="text-white/70 text-xs leading-relaxed">
              Premium farm produce available at massive discounts. Stock is extremely limited and prices reset when the timer reaches zero.
            </p>
            
            {/* Countdown timer */}
            <div className="flex gap-2 justify-center lg:justify-start pt-2">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[64px] border border-white/10">
                <span className="block text-xl font-black text-[#FACC15]">{String(timeLeft.hrs).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-bold text-white/50">Hours</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[64px] border border-white/10">
                <span className="block text-xl font-black text-[#FACC15]">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-bold text-white/50">Mins</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center min-w-[64px] border border-white/10">
                <span className="block text-xl font-black text-[#FACC15]">{String(timeLeft.secs).padStart(2, '0')}</span>
                <span className="text-[9px] uppercase font-bold text-white/50">Secs</span>
              </div>
            </div>
          </div>

          {/* Flash Deal Product Cards Grid */}
          <div className="grid sm:grid-cols-3 gap-5 w-full">
            {hotDeals.map((prod) => {
              const savings = prod.originalPrice ? prod.originalPrice - prod.price : 0;
              const discountPct = prod.originalPrice ? Math.round((savings / prod.originalPrice) * 100) : 0;
              
              return (
                <div key={prod.id} className="bg-white/10 text-white rounded-2xl border border-white/15 backdrop-blur-md overflow-hidden shadow-lg p-3 relative flex flex-col">
                  {/* Discount percentage tag */}
                  <span className="absolute top-2 left-2 bg-[#F97316] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full z-10">
                    -{discountPct}% OFF
                  </span>
                  
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-white/5 relative cursor-pointer" onClick={() => onQuickView(prod)}>
                    <img src={prod.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt={prod.name} className="object-cover h-full w-full hover:scale-105 transition duration-500" />
                  </div>
                  
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">{prod.category}</span>
                      <h4 className="text-xs font-bold text-stone-800 mt-1 cursor-pointer line-clamp-1" onClick={() => onQuickView(prod)}>
                        {prod.name}
                      </h4>
                      <p className="text-[10px] text-stone-500 mt-0.5">{prod.size}</p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-stone-100">
                      {/* Price / Savings display */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-sm font-black text-emerald-800">₦{prod.price.toLocaleString()}</span>
                          <span className="text-[10px] text-stone-400 line-through ml-1.5">₦{prod.originalPrice?.toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] text-orange-600 font-extrabold bg-orange-50 px-1.5 py-0.5 rounded">
                          Save ₦{savings.toLocaleString()}
                        </span>
                      </div>

                      {/* Stock Progress urgency bar */}
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[9px] text-stone-500 font-bold mb-1">
                          <span>Only {prod.stock} items left</span>
                          <span className="text-orange-500">Urgent!</span>
                        </div>
                        <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-orange-500 h-full rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                        </div>
                      </div>

                      <button
                        onClick={() => onAddToCart(prod, 1)}
                        className="w-full mt-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 text-xs flex items-center justify-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-white" />
                        <span>Add To Basket</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Fresh Basket Harvest Section (20+ Items with Live Categories & Admin Management) */}
      <section id="fresh-basket-harvest" className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 border-b border-white/10 pb-4 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Fresh Basket Harvest</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {products.length} Farm Fresh Items Available
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans mt-1">
              Fresh Basket Harvest Produce
            </h2>
            <p className="text-xs text-white/60 mt-1">
              Direct-from-farm daily harvests with real-time inventory and pricing synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {currentRole && (
              <button
                onClick={onOpenAdminPortal}
                className="text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3.5 py-2 rounded-xl border border-amber-500/40 flex items-center gap-2 transition cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5" />
                <span>Admin Operations Center</span>
              </button>
            )}

            {permissions.canCreate && (
              <button
                onClick={onAddNewProduce}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Produce</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('shop')}
              className="text-xs font-bold text-[#FACC15] hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl border border-white/20 transition cursor-pointer"
            >
              Catalog View ({products.length})
            </button>
          </div>
        </div>

        {/* Harvest Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-thin scrollbar-thumb-white/20">
          {HARVEST_CATEGORIES.map((cat) => {
            const count = cat === 'All Harvest'
              ? products.length
              : products.filter(p => p.category === cat).length;
            const isSelected = selectedHarvestCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedHarvestCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isSelected ? 'bg-black/20 text-white' : 'bg-white/10 text-white/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Produce Cards Grid (20+ Farm Fresh Items) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {(selectedHarvestCategory === 'All Harvest'
            ? products
            : products.filter(p => p.category === selectedHarvestCategory)
          ).map((prod) => {
            const hasDiscount = !!prod.originalPrice;
            const discountPct = hasDiscount && prod.originalPrice ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100) : 0;
            const isWishlisted = wishlist.includes(prod.id);

            return (
              <div 
                key={prod.id} 
                className="bg-white/10 rounded-2xl border border-white/15 hover:border-[#16A34A] hover:bg-white/15 hover:shadow-xl p-3 flex flex-col justify-between transition-all duration-300 relative group backdrop-blur-md text-white"
              >
                {/* Wishlist Heart Icon absolute */}
                <button
                  onClick={() => onToggleWishlist(prod)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition cursor-pointer ${
                    isWishlisted ? 'bg-orange-500 text-white' : 'bg-black/40 text-white/70 hover:text-white'
                  }`}
                >
                  <Heart className={`h-4.5 w-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Badges container */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
                  {hasDiscount && (
                    <span className="bg-[#F97316] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                      -{discountPct}% OFF
                    </span>
                  )}
                  {prod.freshnessScore >= 98 && (
                    <span className="bg-[#16A34A] text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md shadow-sm">
                      🌿 ULTRA FRESH
                    </span>
                  )}
                  <span className="bg-black/60 backdrop-blur-md text-white/90 text-[8px] font-mono px-2 py-0.5 rounded-md">
                    Stock: {prod.stock}
                  </span>
                </div>

                {/* Product Media Display */}
                <div 
                  className="relative h-40 w-full rounded-xl overflow-hidden bg-white/5 mb-3.5 cursor-pointer" 
                  onClick={() => onQuickView(prod)}
                >
                  <img src={prod.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt={prod.name} className="object-cover h-full w-full group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-300">
                    <span className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-stone-800 flex items-center gap-1 shadow">
                      <Eye className="h-3.5 w-3.5 text-stone-600" /> Quick View
                    </span>
                  </div>
                </div>

                {/* Product Detail Fields */}
                <div className="flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{prod.category}</span>
                    <h4 
                      className="text-xs font-bold text-white mt-1 leading-snug cursor-pointer hover:text-[#FACC15] transition line-clamp-2" 
                      onClick={() => onQuickView(prod)}
                    >
                      {prod.name}
                    </h4>
                    {prod.localName && (
                      <p className="text-[10px] text-yellow-400/90 italic font-medium">"{prod.localName}"</p>
                    )}
                    
                    {/* Star Rating display */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} className={`h-3 w-3 ${idx < Math.floor(prod.rating) ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                      <span className="text-[10px] text-white/40 font-bold">({prod.reviewsCount})</span>
                    </div>
                  </div>

                  {/* Freshness Badge / Delivery Estimate */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2 space-y-1">
                    <p className="text-[9px] text-[#FACC15] font-extrabold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span>
                      {prod.freshnessText}
                    </p>
                    <p className="text-[9px] text-white/60 font-medium truncate">📍 Origin: {prod.origin}</p>
                  </div>

                  {/* Price & Add to Cart Action */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#FACC15]">₦{prod.price.toLocaleString()}</p>
                      <p className="text-[9px] text-white/50">{prod.size}</p>
                    </div>
                    <button
                      onClick={() => onAddToCart(prod, 1)}
                      className="rounded-full bg-[#16A34A] hover:bg-[#15803d] text-white p-2.5 shadow transition-all cursor-pointer"
                      title="Add to basket"
                    >
                      <ShoppingBag className="h-4 w-4 text-white" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Smart Grocery Planner (Budget calculators) */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16 bg-white/5 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-2xl text-white relative overflow-hidden">
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl" />
        
        <div className="grid lg:grid-cols-12 gap-12 items-center relative z-10">
          
          <div className="lg:col-span-5 space-y-5">
            <div>
              <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">AI Kitchen Tool</span>
              <h2 className="text-3xl font-bold tracking-tight text-white font-sans mt-1">Smart Grocery Planner</h2>
            </div>
            
            <p className="text-xs text-white/70 leading-relaxed">
              Create complete grocery packs instantly based on your exact household need. Our calculator estimates cost and lets you load everything with a single tap.
            </p>

            {/* Selector tabs */}
            <div className="flex gap-1.5 bg-white/10 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setPlannerMode('soup')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                  plannerMode === 'soup' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-white/65 hover:bg-white/5'
                }`}
              >
                🥘 Soup Ingredients
              </button>
              <button
                onClick={() => setPlannerMode('student')}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition cursor-pointer ${
                  plannerMode === 'student' ? 'bg-[#16A34A] text-white shadow-sm' : 'text-white/65 hover:bg-white/5'
                }`}
              >
                🎓 Student Pack
              </button>
            </div>

            {/* Selected mode items display */}
            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-white">
                {plannerMode === 'soup' ? "Essential Stew & Jollof Bundle Ingredients" : "2-Week Student Essentials Pack"}
              </h4>
              <div className="space-y-2">
                {(plannerMode === 'soup' ? soupBundleProducts : studentBundleProducts).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-white/5 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-[#FACC15] shrink-0" />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[9px] text-white/50">{item.size}</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-[#FACC15]">₦{item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white/10 text-white rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl relative border border-white/15 backdrop-blur-2xl">
            <h3 className="text-lg font-bold font-sans">Estimated Bundle Invoice</h3>
            
            <div className="space-y-3.5 text-xs border-b border-emerald-900 pb-5">
              <div className="flex justify-between">
                <span className="text-emerald-200">Total Items Sourced</span>
                <span className="font-bold">
                  {plannerMode === 'soup' ? soupBundleProducts.length : studentBundleProducts.length} items
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">Base Subtotal</span>
                <span className="font-bold">
                  ₦{(plannerMode === 'soup' 
                    ? soupBundleProducts.reduce((sum, p) => sum + p.price, 0)
                    : studentBundleProducts.reduce((sum, p) => sum + p.price, 0)
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">Delivery Dispatch Fee</span>
                <span className="font-bold text-emerald-400">FREE Promo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-200">Loyalty Points Earned</span>
                <span className="font-bold text-yellow-400">
                  {plannerMode === 'soup' ? "150 Pts" : "220 Pts"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[10px] text-emerald-300 uppercase font-bold tracking-wider">Estimated Total</span>
                <span className="text-2xl font-black text-orange-400 font-sans">
                  ₦{(plannerMode === 'soup' 
                    ? soupBundleProducts.reduce((sum, p) => sum + p.price, 0)
                    : studentBundleProducts.reduce((sum, p) => sum + p.price, 0)
                  ).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => addBundleToCart(plannerMode === 'soup' ? soupBundleProducts : studentBundleProducts)}
                className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] px-6 py-3.5 text-xs font-bold text-white flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <span>Add Bundle To Basket</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Why Shop with FreshBasket */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Quality Assured</span>
          <h2 className="text-3xl font-bold tracking-tight text-white font-sans mt-1">Why Shop With FreshBasket?</h2>
          <p className="text-xs text-white/60 mt-2 leading-relaxed">
            We are redefining African food commerce by bringing transparency, freshness, and speed back to the marketplace.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <div key={i} className="bg-white/10 rounded-3xl border border-white/15 p-6 flex flex-col justify-start hover:bg-white/15 hover:shadow-xl transition-all backdrop-blur-md">
              <span className="text-4xl mb-4 inline-block">{feat.icon}</span>
              <h3 className="text-sm font-extrabold text-white mb-2">{feat.title}</h3>
              <p className="text-xs text-white/70 leading-relaxed">{feat.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof Stats Counters */}
      <section className="bg-white/5 border-y border-white/10 backdrop-blur-xl text-white py-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {socialCounters.map((count, i) => (
            <div key={i} className="space-y-1.5">
              <h3 className="text-3xl lg:text-4xl font-black text-[#FACC15] font-sans leading-none">{count.val}</h3>
              <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{count.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Testimonials Review Grid */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Verified Reviews</span>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">What Nigerian Shoppers Say</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {customerTestimonials.map((review, i) => (
            <div key={i} className="bg-white/10 rounded-3xl border border-white/15 p-6 shadow-sm relative flex flex-col justify-between backdrop-blur-md text-white">
              <div>
                <div className="flex text-yellow-400 gap-0.5 mb-3">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-white/80 leading-relaxed italic mb-4">
                  &ldquo;{review.comment}&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{review.name}</h4>
                  <p className="text-[10px] text-white/50 font-semibold mt-1">{review.loc}</p>
                </div>
                <span className="inline-block bg-white/10 text-[#FACC15] text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border border-white/5">
                  Verified Buyer
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Gallery Grid */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-16">
        <div className="text-center max-w-lg mx-auto mb-12">
          <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Social Proof</span>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">FreshBasket In Nigerian Kitchens</h2>
          <p className="text-xs text-white/60 mt-2">
            See photos shared by our customers and local partner farmers harvesting produce.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-white/5 border border-white/10 relative group">
            <img src="https://images.unsplash.com/photo-1590779033100-9f60a05a013d?auto=format&fit=crop&q=80&w=400" alt="African Yams Freshly Picked" className="object-cover h-full w-full group-hover:scale-105 transition" />
            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full py-1 px-2.5 text-[9px] font-bold text-white shadow-sm">🌿 Harvest State</span>
          </div>
          <div className="rounded-2xl overflow-hidden aspect-[1/1] bg-white/5 border border-white/10 relative group md:col-span-2">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600" alt="Supermarket Shelf Sorting" className="object-cover h-full w-full group-hover:scale-105 transition" />
            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full py-1 px-2.5 text-[9px] font-bold text-white shadow-sm">📍 sorted in Lekki Warehouse</span>
          </div>
          <div className="rounded-2xl overflow-hidden aspect-[3/4] bg-white/5 border border-white/10 relative group">
            <img src="https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&q=80&w=400" alt="Preparing Jollof Recipe" className="object-cover h-full w-full group-hover:scale-105 transition animate-pulse-slow" />
            <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm rounded-full py-1 px-2.5 text-[9px] font-bold text-white shadow-sm">🍳 Chioma&apos;s kitchen</span>
          </div>
        </div>
      </section>

    </div>
  );
}
