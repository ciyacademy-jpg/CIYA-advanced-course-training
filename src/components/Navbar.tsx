import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBasket, Heart, User, MapPin, ChevronDown, Sparkles, Flame, Calendar, Gift, Menu, X, Check, LogIn, LogOut, UserCheck } from 'lucide-react';
import { Product, UserProfileData } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { signOutCurrentUser } from '../lib/authService';
import { isProfileComplete } from '../lib/userProfileService';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  cartCount: number;
  wishlistCount: number;
  products: Product[];
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, qty: number) => void;
  currentUser?: FirebaseUser | null;
  userProfile?: UserProfileData | null;
}

const locations = [
  "Lekki Phase 1, Lagos",
  "Ikeja GRA, Lagos",
  "Wuse II, Abuja",
  "Maitama, Abuja",
  "GRA Phase 2, Port Harcourt",
  "Osu, Accra (Ghana)"
];

const categories = [
  { name: "Fresh Fruits", count: 2, icon: "🍎", id: "fruits" },
  { name: "Fresh Vegetables", count: 2, icon: "🥬", id: "vegetables" },
  { name: "Meat & Seafood", count: 3, icon: "🥩", id: "meat" },
  { name: "Rice & Grains", count: 3, icon: "🌾", id: "grains" },
  { name: "Beverages", count: 2, icon: "🧃", id: "beverages" },
  { name: "Snacks", count: 1, icon: "🍿", id: "snacks" },
  { name: "Bakery", count: 2, icon: "🍞", id: "bakery" },
  { name: "Dairy & Eggs", count: 2, icon: "🥛", id: "dairy" },
  { name: "Household Essentials", count: 1, icon: "🧼", id: "household" },
  { name: "Baby Products", count: 2, icon: "👶", id: "baby" },
  { name: "Health Foods", count: 1, icon: "🍯", id: "health" }
];

export default function Navbar({
  currentView,
  onNavigate,
  cartCount,
  wishlistCount,
  products,
  onQuickView,
  onAddToCart,
  currentUser,
  userProfile
}: NavbarProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navDisplayName = userProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Member';
  const navInitial = navDisplayName.charAt(0).toUpperCase();

  const filteredSearchProducts = searchQuery.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`shop?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchDropdown(false);
    }
  };

  return (
    <>
      {/* Top Banner (Ticker/Urgency) */}
      <div className="bg-[#0b2b16]/90 backdrop-blur-md border-b border-white/5 text-white py-2 px-4 text-center text-xs font-semibold tracking-wide flex justify-between items-center z-40 relative">
        <div className="flex items-center gap-1.5 mx-auto">
          <span className="inline-block h-2 w-2 rounded-full bg-[#F97316] animate-pulse"></span>
          <span>🚚 FREE same-day delivery across Lagos for orders above <b>₦25,000</b>!</span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] text-emerald-300">
          <span>Call: +234 812 456 7812</span>
          <span>Support: 24/7 Available</span>
        </div>
      </div>

      {/* Primary Sticky Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="h-10 w-10 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-lg shadow-green-950/20 text-white font-black text-xl">
              F
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-black tracking-tight italic text-white font-sans">
                FreshBasket<span className="text-[#FACC15]">NG</span>
              </h1>
              <p className="text-[10px] text-white/50 font-medium">Lekki • Lagos</p>
            </div>
          </div>

          {/* Desktop Location Switcher */}
          <button
            id="location-switcher-btn"
            onClick={() => setShowLocationModal(true)}
            className="hidden md:flex items-center gap-1.5 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs text-white transition"
          >
            <MapPin className="h-3.5 w-3.5 text-[#FACC15]" />
            <span className="font-semibold">{selectedLocation}</span>
            <ChevronDown className="h-3 w-3 text-white/60" />
          </button>

          {/* Desktop Search Engine */}
          <div className="hidden lg:block flex-1 max-w-md relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                placeholder="Search premium rice, fresh tomatoes, scent leaves..."
                className="w-full rounded-full border border-white/25 bg-white/10 px-5 py-2.5 pl-11 text-sm text-white placeholder-white/50 focus:border-[#16A34A] focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-[#16A34A] transition"
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-white/50" />
            </form>

            {/* Instant Search Dropdown */}
            <AnimatePresence>
              {showSearchDropdown && searchQuery.trim() && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/15 bg-[#14532D]/95 backdrop-blur-2xl p-2 shadow-xl z-50 max-h-96 overflow-y-auto"
                >
                  <div className="p-2 border-b border-white/10 text-[11px] font-bold text-white/50 uppercase tracking-wider">
                    Instant Matches
                  </div>
                  {filteredSearchProducts.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {filteredSearchProducts.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-xl cursor-pointer transition"
                          onClick={() => {
                            onQuickView(p);
                            setShowSearchDropdown(false);
                            setSearchQuery("");
                          }}
                        >
                          <img src={p.imageUrls[0]} alt={p.name} className="h-10 w-10 object-cover rounded-lg" />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                            <p className="text-[10px] text-white/60 truncate">{p.localName || p.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-extrabold text-[#FACC15]">₦{p.price.toLocaleString()}</p>
                            <p className="text-[9px] text-white/40">{p.size}</p>
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => {
                          onNavigate(`shop?search=${encodeURIComponent(searchQuery)}`);
                          setShowSearchDropdown(false);
                        }}
                        className="p-2.5 text-center text-xs text-[#FACC15] font-bold hover:bg-white/10 rounded-xl cursor-pointer border-t border-white/10 mt-1"
                      >
                        See all search results
                      </div>
                    </div>
                  ) : (
                    <p className="p-4 text-center text-xs text-stone-500">No products found matching &quot;{searchQuery}&quot;</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Action Icons Panel */}
          <div className="flex items-center gap-2.5">
            {/* Wishlist Button */}
            <button
              onClick={() => onNavigate('dashboard?tab=wishlist')}
              className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition"
            >
              <Heart className="h-5.5 w-5.5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-[#F97316] text-[10px] font-black text-white flex items-center justify-center border-2 border-[#14532D]">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Auth / Account Link */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-1.5 py-1 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-xs font-bold text-white transition cursor-pointer"
                  title={`Signed in as ${currentUser.email}`}
                >
                  <div className="h-6 w-6 rounded-full bg-[#16A34A] text-[#FACC15] flex items-center justify-center font-black text-[10px]">
                    {navInitial}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{navDisplayName}</span>
                  <ChevronDown className={`h-3 w-3 text-white/70 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showUserDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0b2b16]/95 border border-white/20 backdrop-blur-2xl p-2 shadow-2xl z-50 text-white"
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-xs font-bold text-white truncate">{navDisplayName}</p>
                        <p className="text-[10px] text-white/60 truncate font-mono">{currentUser.email}</p>
                      </div>
                      <div className="py-1 space-y-0.5 text-xs font-medium">
                        <button
                          onClick={() => {
                            onNavigate('profile');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-xl flex items-center justify-between text-white/90 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>My Profile & Delivery Form</span>
                          </div>
                          {!isProfileComplete(userProfile) && (
                            <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-bold">
                              Required
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (!isProfileComplete(userProfile)) {
                              onNavigate('profile');
                            } else {
                              onNavigate('dashboard');
                            }
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-xl flex items-center justify-between text-white/90 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-[#FACC15]" />
                            <span>My Account Dashboard</span>
                          </div>
                          {!isProfileComplete(userProfile) && (
                            <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-bold">
                              Locked
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (!isProfileComplete(userProfile)) {
                              onNavigate('profile');
                            } else {
                              onNavigate('dashboard?tab=orders');
                            }
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-xl flex items-center gap-2 text-white/90 cursor-pointer"
                        >
                          <ShoppingBasket className="h-3.5 w-3.5 text-[#16A34A]" />
                          <span>Order History</span>
                        </button>
                      </div>
                      <div className="pt-1 border-t border-white/10">
                        <button
                          onClick={async () => {
                            setShowUserDropdown(false);
                            await signOutCurrentUser();
                            onNavigate('home');
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-red-500/20 rounded-xl flex items-center gap-2 text-red-300 font-bold text-xs cursor-pointer transition"
                        >
                          <LogOut className="h-3.5 w-3.5 text-red-400" />
                          <span>Sign Out / Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('auth')}
                className="flex items-center gap-1.5 py-1.5 px-3 bg-[#16A34A] hover:bg-[#15803d] border border-white/20 rounded-full text-xs font-bold text-white shadow transition cursor-pointer"
              >
                <User className="h-4 w-4 text-white" />
                <span className="hidden sm:inline">Sign In / Up</span>
              </button>
            )}

            {/* Cart Selector Panel Trigger */}
            <button
              id="navbar-cart-btn"
              onClick={() => onNavigate('cart')}
              className="flex items-center gap-2 rounded-full bg-[#F97316] hover:bg-[#ea580c] px-4 py-2 text-white shadow-lg shadow-orange-950/40 transition"
            >
              <ShoppingBasket className="h-5 w-5 text-white" />
              <span className="hidden md:inline text-xs font-bold font-sans">Basket</span>
              <span className="rounded-full bg-[#FACC15] px-2 py-0.5 text-[11px] font-black text-[#14532D]">
                {cartCount}
              </span>
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Categories / Hub Links Sub-Navbar */}
        <nav className="hidden lg:block border-t border-white/10 bg-white/5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm font-semibold text-white/80">
              
              {/* Mega Menu Toggle */}
              <div className="relative">
                <button
                  onMouseEnter={() => setIsMegaMenuOpen(true)}
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  className="flex items-center gap-1 text-[#FACC15] hover:text-yellow-300 transition cursor-pointer font-bold"
                >
                  <Menu className="h-4 w-4" />
                  <span>Shop Categories</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {/* Glassmorphic Mega Menu */}
                <AnimatePresence>
                  {isMegaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      onMouseLeave={() => setIsMegaMenuOpen(false)}
                      className="absolute left-0 mt-3.5 w-[560px] rounded-3xl border border-white/15 bg-[#14532D]/95 backdrop-blur-2xl p-5 shadow-2xl z-50 grid grid-cols-2 gap-4"
                    >
                      <div className="col-span-2 pb-2 border-b border-white/10 flex items-center justify-between">
                        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Departments</span>
                        <span className="text-xs font-bold text-[#FACC15] cursor-pointer hover:text-yellow-300" onClick={() => { onNavigate('shop'); setIsMegaMenuOpen(false); }}>Shop All</span>
                      </div>
                      {categories.map((cat, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            onNavigate(`shop?category=${encodeURIComponent(cat.name)}`);
                            setIsMegaMenuOpen(false);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-white/10 rounded-2xl cursor-pointer transition-all"
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-white leading-none">{cat.name}</h4>
                            <p className="text-[10px] text-white/60 mt-1 font-medium">{cat.count} Premium Products</p>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="h-4 w-px bg-white/15" />

              <button onClick={() => onNavigate('home')} className={`hover:text-[#FACC15] transition ${currentView === 'home' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Home</button>
              <button onClick={() => onNavigate('shop')} className={`hover:text-[#FACC15] transition ${currentView.startsWith('shop') ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Shop</button>
              <button onClick={() => onNavigate('recipes')} className={`hover:text-[#FACC15] transition ${currentView === 'recipes' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Recipe Hub</button>
              <button onClick={() => onNavigate('mealplanner')} className={`hover:text-[#FACC15] transition ${currentView === 'mealplanner' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Meal Planner</button>
              <button onClick={() => onNavigate('subscriptions')} className={`hover:text-[#FACC15] transition ${currentView === 'subscriptions' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Subscriptions</button>
              <button onClick={() => onNavigate('loyalty')} className={`hover:text-[#FACC15] transition ${currentView === 'loyalty' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Rewards</button>
              <button onClick={() => onNavigate('blog')} className={`hover:text-[#FACC15] transition ${currentView === 'blog' ? 'text-[#FACC15] font-extrabold border-b-2 border-[#FACC15]' : ''}`}>Healthy Living</button>
            </div>

            {/* Right Quick Links */}
            <div className="flex items-center gap-4 text-xs font-bold text-white/60">
              <button onClick={() => onNavigate('about')} className="hover:text-white transition">About</button>
              <button onClick={() => onNavigate('contact')} className="hover:text-white transition">Contact</button>
              <span className="text-white/20">|</span>
              <span className="text-[#FACC15] animate-pulse flex items-center gap-1 font-extrabold">
                <Flame className="h-3.5 w-3.5 fill-current" /> Weekly Deals Live!
              </span>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Navigation Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-50 bg-[#113d22]/95 border-l border-white/10 backdrop-blur-2xl p-6 flex flex-col md:hidden overflow-y-auto text-white"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#16A34A] flex items-center justify-center text-white font-extrabold">F</div>
                <h2 className="text-sm font-extrabold text-white">FreshBasket.ng</h2>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="rounded-full bg-white/10 p-2 text-white/80 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Location Selector */}
            <div className="mt-6">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Delivery Location</p>
              <button
                onClick={() => {
                  setShowLocationModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between rounded-xl bg-white/10 border border-white/10 p-3 text-white font-semibold text-sm"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#FACC15]" />
                  <span>{selectedLocation}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-white/60" />
              </button>
            </div>

            {/* Mobile Search bar */}
            <div className="mt-5">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2">Search Products</p>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Premium rice, tomatoes, plantains..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 pl-10 text-xs text-white placeholder-white/50 focus:outline-none"
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-white/50" />
              </form>
            </div>

            {/* Navigation Links */}
            <div className="mt-6 flex-1 space-y-3.5 flex flex-col justify-start">
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider border-b border-white/10 pb-1">Account & Access</p>
              <button
                onClick={() => {
                  if (currentUser) {
                    if (!isProfileComplete(userProfile)) {
                      onNavigate('profile');
                    } else {
                      onNavigate('dashboard');
                    }
                  } else {
                    onNavigate('auth');
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left text-sm font-bold flex items-center justify-between gap-2 ${currentView === 'auth' || currentView === 'dashboard' || currentView === 'profile' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>👤 {currentUser ? `Account (${currentUser.email})` : 'Sign In / Sign Up'}</span>
                {currentUser && !isProfileComplete(userProfile) && (
                  <span className="text-[10px] bg-amber-500/30 text-amber-200 px-1.5 py-0.5 rounded font-bold">
                    Profile Required
                  </span>
                )}
              </button>
              {currentUser && (
                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await signOutCurrentUser();
                    onNavigate('home');
                  }}
                  className="w-full text-left text-sm font-bold flex items-center gap-2 text-red-300 hover:text-red-200"
                >
                  <LogOut className="h-4 w-4 text-red-400" />
                  <span>Sign Out / Logout</span>
                </button>
              )}

              <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider border-b border-white/10 pb-1 pt-2">Shop & Discover</p>
              <button
                onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'home' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>🏠 Home</span>
              </button>
              <button
                onClick={() => { onNavigate('shop'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView.startsWith('shop') ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>🛍️ Shop All Products</span>
              </button>
              <button
                onClick={() => { onNavigate('recipes'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'recipes' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>🍲 Recipe Hub</span>
              </button>
              <button
                onClick={() => { onNavigate('mealplanner'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'mealplanner' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>📅 Meal Planner</span>
              </button>
              <button
                onClick={() => { onNavigate('subscriptions'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'subscriptions' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>📦 Subscription Saving Plans</span>
              </button>
              <button
                onClick={() => { onNavigate('loyalty'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'loyalty' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>🎖️ Loyalty Rewards</span>
              </button>
              <button
                onClick={() => { onNavigate('blog'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'blog' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>📚 Healthy Living Blog</span>
              </button>
              <button
                onClick={() => { onNavigate('about'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'about' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>🌾 About Our Farmers</span>
              </button>
              <button
                onClick={() => { onNavigate('contact'); setIsMobileMenuOpen(false); }}
                className={`w-full text-left text-sm font-bold flex items-center gap-2 ${currentView === 'contact' ? 'text-[#FACC15]' : 'text-white/80'}`}
              >
                <span>📞 Contact & Support</span>
              </button>
            </div>

            {/* Quick Mobile Action footer */}
            <div className="mt-auto border-t border-white/10 pt-4 flex justify-between text-xs text-white/50">
              <span>support@freshbasketng.com</span>
              <span className="font-bold text-[#F97316]">₦ Currency</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLocationModal(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-3xl bg-[#113d22]/95 border border-white/15 backdrop-blur-2xl p-6 shadow-2xl z-10 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <h3 className="text-base font-extrabold text-white">Select Your Delivery Location</h3>
                <button onClick={() => setShowLocationModal(false)} className="rounded-full hover:bg-white/10 p-1">
                  <X className="h-5 w-5 text-white/70" />
                </button>
              </div>
              <p className="text-xs text-white/70 mb-4 leading-relaxed">
                Choose your city to view correct delivery pricing, fresh food harvest availability, and express same-day dispatch routes.
              </p>
              <div className="space-y-2">
                {locations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setSelectedLocation(loc);
                      setShowLocationModal(false);
                    }}
                    className={`w-full flex items-center justify-between rounded-2xl p-3.5 text-xs font-semibold text-left transition ${
                      selectedLocation === loc
                        ? 'bg-white/25 text-[#FACC15] border-2 border-[#FACC15]'
                        : 'bg-white/5 text-white/80 border-2 border-transparent hover:bg-white/10'
                    }`}
                  >
                    <span>{loc}</span>
                    {selectedLocation === loc && <Check className="h-4 w-4 text-[#FACC15]" />}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
