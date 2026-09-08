import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, Heart, ShoppingBag, X, Calendar, Gift, Award, CheckCircle2, ChevronRight, Landmark, ShieldCheck } from 'lucide-react';

// Data layers
import { recipes } from './data/recipes';
import { blogArticles } from './data/blog';

// Global Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SmartAssistant from './components/SmartAssistant';
import { AdminPortalModal } from './components/AdminPortalModal';
import { AdminProduceModal } from './components/AdminProduceModal';

// Views
import HomeView from './views/HomeView';
import ShopView from './views/ShopView';
import ProductDetailView from './views/ProductDetailView';
import CartView from './views/CartView';
import CheckoutView from './views/CheckoutView';
import DashboardView from './views/DashboardView';
import DeliveryTrackingView from './views/DeliveryTrackingView';
import RecipeHubView from './views/RecipeHubView';
import MealPlannerView from './views/MealPlannerView';
import BlogView from './views/BlogView';
import StaticViews from './views/StaticViews';
import AuthView from './views/AuthView';
import ProfileView from './views/ProfileView';

import { Product, CartItem, Order, LoyaltyReward, UserProfileData, AdminRole, AdminUser } from './types';
import { testFirebaseConnection, auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  saveUserProfileToFirestore, 
  fetchUserProfileFromFirestore, 
  subscribeToUserProfile,
  isProfileComplete
} from './lib/userProfileService';
import { 
  SUPER_ADMIN_EMAIL, 
  isImmutableSuperAdmin,
  resolveUserAdminRole,
  resolveUserAdminRoleAsync,
  subscribeToAdminStaff
} from './lib/adminService';
import { 
  getLocalLiveProducts, 
  subscribeToLiveProducts, 
  saveLiveProduct, 
  deleteLiveProduct,
  seedFirestoreProductsIfEmpty
} from './lib/productService';

// Loyalty Rewards database
const initialRewards: LoyaltyReward[] = [
  { id: "rew-1", title: "₦2,500 Cash Discount", pointsCost: 600, description: "Get ₦2,500 off your next direct farm shopping cart.", code: "LOYAL-25K", type: "discount" },
  { id: "rew-2", title: "Free Express Cold-Chain Logistics", pointsCost: 400, description: "Free delivery upgrade to thermal insulation bag transport.", code: "LOYAL-CODL", type: "free_delivery" },
  { id: "rew-3", title: "Complimentary Vegetable Salad Bowl", pointsCost: 350, description: "Includes fresh lettuce, sweet tomatoes, spring onions, and carrots.", code: "LOYAL-GIFT", type: "gift" }
];

export default function App() {
  const [activeView, setActiveView] = useState<string>('home');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // URL parameters emulation
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [dashboardActiveTab, setDashboardActiveTab] = useState("overview");

  // State for interactive loyalty shop - dynamic & persistent per user
  const [currentUser, setCurrentUser] = useState<User | null>(() => auth.currentUser);
  const [rewardsPoints, setRewardsPoints] = useState<number>(() => {
    try {
      const userKey = auth.currentUser ? auth.currentUser.uid : 'guest';
      const stored = localStorage.getItem(`freshbasket_rewards_pts_${userKey}`);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
      return auth.currentUser ? 150 : 0;
    } catch {
      return 0;
    }
  });
  const [vouchersClaimed, setVouchersClaimed] = useState<string[]>([]);

  // Live Produce Catalog State (25 Farm Fresh items with real-time updates)
  const [liveProducts, setLiveProducts] = useState<Product[]>(() => getLocalLiveProducts());

  // Subscribe to real-time produce updates & seed firestore if needed
  useEffect(() => {
    seedFirestoreProductsIfEmpty();
    const unsub = subscribeToLiveProducts((freshItems) => {
      setLiveProducts(freshItems);
    });
    return () => unsub();
  }, []);

  // RBAC Admin States
  const [resolvedAdminRole, setResolvedAdminRole] = useState<AdminRole | null>(null);
  const [simulatedRole, setSimulatedRole] = useState<AdminRole | null>(null);
  const [simulatedEmail, setSimulatedEmail] = useState<string | null>(null);
  const [hasDismissedAdminBanner, setHasDismissedAdminBanner] = useState(false);

  // Admin Modals
  const [isAdminPortalOpen, setIsAdminPortalOpen] = useState(false);
  const [isProduceEditorOpen, setIsProduceEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Resolve admin role dynamically for current user and listen to staff changes
  useEffect(() => {
    let isMounted = true;

    const syncRole = (staffList?: AdminUser[]) => {
      if (!currentUser?.email) {
        setResolvedAdminRole(null);
        return;
      }
      const email = currentUser.email.trim().toLowerCase();
      if (isImmutableSuperAdmin(email)) {
        setResolvedAdminRole('super_admin');
        return;
      }

      // Check synchronous cache / supplied staff list first
      const role = resolveUserAdminRole(email, staffList);
      if (role) {
        setResolvedAdminRole(role);
      } else {
        // Asynchronously check Central Server in case client local storage was cold
        resolveUserAdminRoleAsync(email).then(freshRole => {
          if (isMounted && freshRole) {
            setResolvedAdminRole(freshRole);
          }
        });
      }
    };

    syncRole();
    if (currentUser) {
      seedFirestoreProductsIfEmpty();
    }
    const unsub = subscribeToAdminStaff((freshStaff) => {
      if (isMounted) {
        syncRole(freshStaff);
      }
    });
    return () => {
      isMounted = false;
      unsub();
    };
  }, [currentUser]);

  // Compute effective role & email
  // If simulation is set via Admin Center switcher, use that; otherwise use authenticated user status
  // Defaults to 'super_admin' when unauthenticated so admin preview actions work immediately
  const effectiveAdminRole: AdminRole | null = simulatedRole !== null
    ? simulatedRole
    : (currentUser?.email ? resolvedAdminRole : null);

  const effectiveAdminEmail: string | null = simulatedEmail !== null
    ? simulatedEmail
    : (currentUser?.email || null);

  // Produce CRUD Handlers with immediate state reflection
  const handleSaveProduce = async (produceItem: Product): Promise<boolean> => {
    if (!effectiveAdminRole) {
      alert('⚠️ Access Denied: You must be an authorized admin staff member to edit produce.');
      return false;
    }
    const res = await saveLiveProduct(produceItem, effectiveAdminRole, effectiveAdminEmail || '');
    if (res.success) {
      // Immediate live state reflection across all views
      setLiveProducts(res.updatedList);
      return true;
    } else {
      alert(`⚠️ Action Denied: ${res.message}`);
      return false;
    }
  };

  const handleDeleteProduce = async (productId: string) => {
    if (!effectiveAdminRole) {
      alert('⚠️ Access Denied: You must be an authorized admin staff member to delete produce.');
      return;
    }
    const res = await deleteLiveProduct(productId, effectiveAdminRole, effectiveAdminEmail || '');
    if (res.success) {
      // Immediate live state reflection across all views
      setLiveProducts(res.updatedList);
    } else {
      alert(`⚠️ Delete Denied: ${res.message}`);
    }
  };

  // User Profile State (Strictly unique per user, never unkeyed or shared across sessions)
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(() => {
    try {
      localStorage.removeItem('freshbasket_current_user_profile');
      if (auth.currentUser) {
        const saved = localStorage.getItem(`freshbasket_profile_${auth.currentUser.uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.userId === auth.currentUser.uid) {
            return parsed;
          }
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync profile when currentUser changes (load profile unique to this user from local storage and backend Firestore)
  useEffect(() => {
    // Clean up any legacy unkeyed profile
    try {
      localStorage.removeItem('freshbasket_current_user_profile');
    } catch {}

    if (currentUser) {
      const userKey = `freshbasket_profile_${currentUser.uid}`;
      try {
        const saved = localStorage.getItem(userKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.userId === currentUser.uid) {
            setUserProfile(parsed);
          } else {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      }

      // Fetch from Firestore backend
      let isSubscribed = true;
      fetchUserProfileFromFirestore(currentUser.uid).then((cloudProfile) => {
        if (!isSubscribed) return;
        if (cloudProfile && cloudProfile.userId === currentUser.uid) {
          setUserProfile({ ...cloudProfile, backendSynced: true });
          try {
            localStorage.setItem(userKey, JSON.stringify(cloudProfile));
          } catch {
            // ignore
          }
        }
      });

      // Real-time subscription to cloud changes
      const unsubscribe = subscribeToUserProfile(currentUser.uid, (remoteProfile) => {
        if (!isSubscribed) return;
        if (remoteProfile && remoteProfile.userId === currentUser.uid) {
          setUserProfile({ ...remoteProfile, backendSynced: true });
        }
      });

      // Sync user rewards points
      const rewardsKey = currentUser.uid;
      try {
        const stored = localStorage.getItem(`freshbasket_rewards_pts_${rewardsKey}`);
        if (stored !== null) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed)) {
            setRewardsPoints(parsed);
          }
        } else {
          // New member bonus of 150 points
          setRewardsPoints(150);
          localStorage.setItem(`freshbasket_rewards_pts_${rewardsKey}`, '150');
        }
      } catch {
        // ignore
      }

      return () => {
        isSubscribed = false;
        unsubscribe();
      };
    } else {
      // When signed out or no user: user profile, orders, and points are strictly reset!
      setUserProfile(null);
      setRewardsPoints(0);
      setOrders([]);
    }
  }, [currentUser]);

  const handleSaveProfile = async (newProfile: UserProfileData) => {
    const targetUid = currentUser?.uid || newProfile.userId;
    if (!targetUid) return { success: false, backendSaved: false };
    const profileWithUid = { ...newProfile, userId: targetUid };
    setUserProfile(profileWithUid);

    // Save profile locally strictly scoped to this specific user
    try {
      localStorage.setItem(`freshbasket_profile_${targetUid}`, JSON.stringify(profileWithUid));
      localStorage.removeItem('freshbasket_current_user_profile');

      // Award one-time profile completion bonus points (100 pts)
      const bonusKey = `freshbasket_profile_bonus_${targetUid}`;
      if (!localStorage.getItem(bonusKey)) {
        localStorage.setItem(bonusKey, 'true');
        setRewardsPoints((prev) => {
          const updated = prev + 100;
          localStorage.setItem(`freshbasket_rewards_pts_${targetUid}`, updated.toString());
          return updated;
        });
      }
    } catch {
      // ignore
    }

    // Persist to Firestore backend
    try {
      const syncRes = await saveUserProfileToFirestore(newProfile);
      if (syncRes && syncRes.backendSaved) {
        setUserProfile((prev) => prev ? { ...prev, backendSynced: true } : prev);
      }
      return syncRes;
    } catch (e) {
      console.warn('Backend sync notice:', e);
      return { success: true, backendSaved: false };
    }
  };

  const handleRefreshProfile = async (): Promise<boolean> => {
    const uid = currentUser?.uid || userProfile?.userId;
    if (!uid) return false;
    const cloudProfile = await fetchUserProfileFromFirestore(uid);
    if (cloudProfile) {
      setUserProfile({ ...cloudProfile, backendSynced: true });
      return true;
    }
    return false;
  };

  // Listen to Firebase Auth state changes
  useEffect(() => {
    testFirebaseConnection();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Load and synchronize orders dynamically for the active user
  useEffect(() => {
    const userKey = currentUser ? currentUser.uid : 'guest';
    const savedOrdersRaw = localStorage.getItem(`freshbasket_orders_${userKey}`);
    if (savedOrdersRaw) {
      try {
        setOrders(JSON.parse(savedOrdersRaw));
      } catch {
        setOrders([]);
      }
    } else {
      setOrders([]);
    }
  }, [currentUser]);

  // Strict Route Guard:
  // 1. Unauthenticated or unverified users cannot access the dashboard -> redirected to 'auth'
  // 2. Authenticated users MUST complete their member profile form before gaining access to their dashboard -> redirected to 'profile'
  useEffect(() => {
    if (activeView === 'dashboard') {
      if (!currentUser || !currentUser.emailVerified) {
        setActiveView('auth');
      } else if (!isProfileComplete(userProfile)) {
        setActiveView('profile');
      }
    }
  }, [activeView, currentUser, userProfile]);

  // Global Cart Event Actions
  const handleAddToCart = (product: Product, qty: number) => {
    const sizeToUse = product.size || "Standard";
    setCart(prev => {
      const idx = prev.findIndex(item => item.product.id === product.id && item.selectedSize === sizeToUse);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx].quantity += qty;
        return copy;
      }
      return [...prev, { product, quantity: qty, selectedSize: sizeToUse }];
    });
  };

  const handleUpdateQuantity = (productId: string, size: string, change: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId && item.selectedSize === size) {
          const newQty = item.quantity + change;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string, size: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.selectedSize === size)));
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      }
      return [...prev, product.id];
    });
  };

  const handleAddOrder = (order: Order) => {
    setOrders(prev => {
      const updated = [order, ...prev];
      const userKey = currentUser ? currentUser.uid : 'guest';
      try {
        localStorage.setItem(`freshbasket_orders_${userKey}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save orders locally:', e);
      }
      return updated;
    });
    setActiveOrder(order);
    
    // Earn real points based on order total: 1 point for every ₦100 spent (minimum 50 pts)
    const pointsEarned = Math.max(50, Math.floor(order.total / 100));
    setRewardsPoints(prev => {
      const updated = prev + pointsEarned;
      try {
        const userKey = currentUser ? currentUser.uid : 'guest';
        localStorage.setItem(`freshbasket_rewards_pts_${userKey}`, updated.toString());
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Advanced router
  const handleNavigate = (path: string) => {
    let targetView = path;
    let queryParams: URLSearchParams | null = null;

    if (path.includes('?')) {
      const [view, queryStr] = path.split('?');
      targetView = view;
      queryParams = new URLSearchParams(queryStr);
    }

    // Strict profile completion mandate: existing or new users cannot access dashboard until profile is complete
    if (targetView === 'dashboard') {
      if (!currentUser || !currentUser.emailVerified) {
        targetView = 'auth';
      } else if (!isProfileComplete(userProfile)) {
        targetView = 'profile';
      }
    }

    setActiveView(targetView);

    if (queryParams) {
      const cat = queryParams.get('category');
      const search = queryParams.get('search');
      const tab = queryParams.get('tab');
      
      setSelectedCategoryFilter(cat || "");
      setSearchFilter(search || "");
      if (tab) setDashboardActiveTab(tab);
    } else {
      setSelectedCategoryFilter("");
      setSearchFilter("");
      setDashboardActiveTab("overview");
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickView = (product: Product) => {
    setSelectedProduct(product);
  };

  // Redeeming dynamic loyalty rewards vouchers
  const handleRedeemReward = (reward: LoyaltyReward) => {
    if (rewardsPoints < reward.pointsCost) {
      alert("⚠️ Insufficient Reward Points! Place more fresh produce orders to accumulate points.");
      return;
    }

    setRewardsPoints(prev => {
      const updated = Math.max(0, prev - reward.pointsCost);
      try {
        const userKey = currentUser ? currentUser.uid : 'guest';
        localStorage.setItem(`freshbasket_rewards_pts_${userKey}`, updated.toString());
      } catch {
        // ignore
      }
      return updated;
    });
    setVouchersClaimed(prev => [...prev, reward.code]);
    alert(`🎉 Successfully redeemed! Use Code: ${reward.code} at checkout to claim your reward.`);
  };

  return (
    <div className="min-h-screen bg-[#051e10] flex flex-col justify-between selection:bg-[#FACC15]/30">
      
      {/* Navigation Headers */}
      <Navbar
        currentView={activeView}
        onNavigate={handleNavigate}
        cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
        wishlistCount={wishlist.length}
        products={liveProducts}
        onQuickView={handleQuickView}
        onAddToCart={handleAddToCart}
        currentUser={currentUser}
        userProfile={userProfile}
        currentRole={effectiveAdminRole}
        onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
      />

      {/* Authenticated Staff or Simulated Preview Authorization Recognition Banner */}
      {effectiveAdminRole && !hasDismissedAdminBanner && (
        <div className={`border-b px-4 py-2.5 text-white text-xs backdrop-blur-md shadow-md transition ${
          effectiveAdminRole === 'super_admin' ? 'bg-gradient-to-r from-[#1b1402] via-[#092414] to-[#1b1402] border-amber-500/30' :
          effectiveAdminRole === 'manager' ? 'bg-gradient-to-r from-[#071927] via-[#0c2b42] to-[#071927] border-blue-500/30' :
          effectiveAdminRole === 'supervisor' ? 'bg-gradient-to-r from-[#1b0a29] via-[#2d1143] to-[#1b0a29] border-purple-500/30' :
          'bg-gradient-to-r from-[#062414] via-[#0d3b22] to-[#062414] border-emerald-500/30'
        }`}>
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  effectiveAdminRole === 'super_admin' ? 'bg-amber-400' :
                  effectiveAdminRole === 'manager' ? 'bg-blue-400' :
                  effectiveAdminRole === 'supervisor' ? 'bg-purple-400' : 'bg-emerald-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  effectiveAdminRole === 'super_admin' ? 'bg-amber-500' :
                  effectiveAdminRole === 'manager' ? 'bg-blue-500' :
                  effectiveAdminRole === 'supervisor' ? 'bg-purple-500' : 'bg-emerald-500'
                }`}></span>
              </span>
              <span className="font-bold flex items-center gap-1.5 text-white">
                <ShieldCheck className={`h-4 w-4 ${
                  effectiveAdminRole === 'super_admin' ? 'text-amber-400' :
                  effectiveAdminRole === 'manager' ? 'text-blue-400' :
                  effectiveAdminRole === 'supervisor' ? 'text-purple-400' : 'text-emerald-400'
                }`} />
                <span>
                  {simulatedRole ? 'Staff Role Preview Active:' : 'Admin Authorization Active:'}
                </span>
              </span>
              <span className="text-white/90">
                Operating with{' '}
                <span className={`uppercase font-black px-2 py-0.5 rounded border text-[11px] ${
                  effectiveAdminRole === 'super_admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                  effectiveAdminRole === 'manager' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  effectiveAdminRole === 'supervisor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                }`}>
                  {effectiveAdminRole.replace('_', ' ')}
                </span>{' '}
                privileges
                {effectiveAdminEmail && (
                  <> (Account: <b className="font-mono text-white/95">{effectiveAdminEmail}</b>)</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {simulatedRole && (
                <button
                  onClick={() => {
                    setSimulatedRole(null);
                    setSimulatedEmail(null);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white font-bold px-2.5 py-1 rounded-xl text-[11px] border border-white/20 transition cursor-pointer"
                >
                  Exit Preview
                </button>
              )}
              <button
                onClick={() => setIsAdminPortalOpen(true)}
                className={`font-bold px-3.5 py-1.5 rounded-xl text-[11px] transition flex items-center gap-1.5 cursor-pointer shadow ${
                  effectiveAdminRole === 'super_admin' ? 'bg-amber-500 hover:bg-amber-400 text-black' :
                  effectiveAdminRole === 'manager' ? 'bg-blue-500 hover:bg-blue-400 text-white' :
                  effectiveAdminRole === 'supervisor' ? 'bg-purple-500 hover:bg-purple-400 text-white' :
                  'bg-emerald-500 hover:bg-emerald-400 text-black'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Open Admin Center</span>
              </button>
              <button
                onClick={() => setHasDismissedAdminBanner(true)}
                className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
                title="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Routed Canvas Sections */}
      <main className="flex-1">
        
        {/* Render active View layouts */}
        {activeView === 'auth' && (
          <AuthView
            currentUser={currentUser}
            userProfile={userProfile}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'home' && (
          <HomeView
            products={liveProducts}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            onQuickView={handleQuickView}
            onNavigate={handleNavigate}
            currentRole={effectiveAdminRole}
            currentEmail={effectiveAdminEmail}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsProduceEditorOpen(true);
            }}
            onDeleteProduct={handleDeleteProduce}
            onAddNewProduce={() => {
              setEditingProduct(null);
              setIsProduceEditorOpen(true);
            }}
          />
        )}

        {activeView === 'shop' && (
          <ShopView
            products={liveProducts}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            onQuickView={handleQuickView}
            initialCategory={selectedCategoryFilter}
            initialSearch={searchFilter}
            currentRole={effectiveAdminRole}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
            onEditProduct={(p) => {
              setEditingProduct(p);
              setIsProduceEditorOpen(true);
            }}
            onDeleteProduct={handleDeleteProduce}
            onAddNewProduce={() => {
              setEditingProduct(null);
              setIsProduceEditorOpen(true);
            }}
          />
        )}

        {activeView === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlist={wishlist}
            products={liveProducts}
            onQuickView={handleQuickView}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'cart' && (
          <CartView
            cart={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'checkout' && (
          <CheckoutView
            cart={cart}
            onClearCart={handleClearCart}
            onNavigate={handleNavigate}
            onAddOrder={handleAddOrder}
            userProfile={userProfile}
          />
        )}

        {activeView === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            userProfile={userProfile}
            onSaveProfile={handleSaveProfile}
            onNavigate={handleNavigate}
            onRefreshProfile={handleRefreshProfile}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            orders={orders}
            wishlist={wishlist}
            products={liveProducts}
            onRemoveWishlistItem={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
            onSelectActiveOrder={setActiveOrder}
            initialTab={dashboardActiveTab}
            userProfile={userProfile}
            onSaveProfile={handleSaveProfile}
            currentUser={currentUser}
            onRefreshProfile={handleRefreshProfile}
            rewardsPoints={rewardsPoints}
            currentRole={effectiveAdminRole}
            onOpenAdminPortal={() => setIsAdminPortalOpen(true)}
          />
        )}

        {activeView === 'tracking' && (
          <DeliveryTrackingView
            activeOrder={activeOrder}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'recipes' && (
          <RecipeHubView
            recipes={recipes}
            products={liveProducts}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'mealplanner' && (
          <MealPlannerView
            recipes={recipes}
            products={liveProducts}
            onAddToCart={handleAddToCart}
            onNavigate={handleNavigate}
          />
        )}

        {activeView === 'blog' && (
          <BlogView posts={blogArticles} />
        )}

        {/* Corporate compliance and about lists */}
        {['about', 'contact', 'faq', 'policies'].includes(activeView) && (
          <StaticViews initialSection={activeView as any} />
        )}

        {/* Dedicated Subscription Savings View */}
        {activeView === 'subscriptions' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
            <div className="border-b border-white/10 pb-4 mb-8">
              <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Automated Sourcing</span>
              <h2 className="text-2xl font-bold text-white font-sans mt-1">Subscription Savings Program</h2>
              <p className="text-xs text-white/70 mt-1">Schedule fresh vegetable bundles, rice grains, or egg packs delivered to your door and save 15% on catalog rates.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: "Lekki Stew Starter Bundle", price: 12500, desc: "Includes tomatoes, scotch bonnet, onions, and vegetable oil.", period: "Weekly", icon: "🍅" },
                { name: "Family Grains & Roots Carton", price: 42000, desc: "Includes parboiled rice, white yams, and honey beans.", period: "Bi-weekly", icon: "🌾" },
                { name: "High-Protein Energy Basket", price: 18500, desc: "Includes farm fresh eggs, frozen chicken, and Greek yoghurt.", period: "Weekly", icon: "🥩" }
              ].map((sub, i) => (
                <div key={i} className="bg-white/10 border border-white/15 rounded-3xl p-5 lg:p-6 shadow-2xl backdrop-blur-xl hover:border-[#16A34A] hover:shadow-2xl transition flex flex-col justify-between space-y-5 text-white">
                  <div className="space-y-2">
                    <span className="text-3xl">{sub.icon}</span>
                    <h3 className="text-sm font-extrabold text-white leading-tight">{sub.name}</h3>
                    <p className="text-xs text-white/60">{sub.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-black text-[#FACC15]">₦{sub.price.toLocaleString()}</p>
                      <p className="text-[10px] text-white/40">Delivered {sub.period}</p>
                    </div>
                    <button
                      onClick={() => alert(`📦 Successfully activated the ${sub.name}! Automatically scheduled for next Saturday.`)}
                      className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 px-4 text-xs shadow-lg transition cursor-pointer"
                    >
                      Subscribe & Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dedicated Loyalty Rewards Store */}
        {activeView === 'loyalty' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
            
            {/* Top Reward Point Balancer */}
            <div className="bg-[#0b2b16]/70 backdrop-blur-md border border-white/10 text-white rounded-3xl p-6 lg:p-10 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] font-black uppercase text-yellow-400 tracking-widest bg-[#16A34A]/20 px-3 py-1 rounded-full border border-white/10">
                  Gold Elite Sourcing Tier
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold font-sans text-white">Your Rewards Points Store</h2>
                <p className="text-xs text-white/70">Redeem points earned from checkout payments to claim shopping vouchers.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center shrink-0 min-w-[180px]">
                <span className="block text-[10px] text-white/50 uppercase font-black">Points Balance</span>
                <span className="text-2xl font-black text-yellow-400 font-sans">{rewardsPoints.toLocaleString()} Pts</span>
              </div>
            </div>

            {/* List of exchangeable rewards vouchers */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase text-[#FACC15] tracking-wider">Available Rewards Milestones</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {initialRewards.map((reward) => {
                  const isClaimed = vouchersClaimed.includes(reward.code);
                  return (
                    <div
                      key={reward.id}
                      className="bg-white/10 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-xl hover:border-[#16A34A] transition-all flex flex-col justify-between space-y-4 text-white"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#FACC15] bg-[#16A34A]/20 border border-white/10 px-2 py-0.5 rounded-full">
                          🪙 {reward.pointsCost} Points
                        </span>
                        <h4 className="text-xs font-extrabold text-white mt-2">{reward.title}</h4>
                        <p className="text-[11px] text-white/60 leading-relaxed">{reward.description}</p>
                      </div>

                      <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                        {isClaimed ? (
                          <span className="text-xs font-extrabold text-[#FACC15] bg-[#16A34A]/20 border border-[#16A34A]/30 rounded-xl py-2 px-4 block w-full text-center">
                            Claimed Code: {reward.code}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleRedeemReward(reward)}
                            disabled={rewardsPoints < reward.pointsCost}
                            className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-4 text-xs shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            Redeem Reward Card
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer Area */}
      <Footer onNavigate={handleNavigate} />

      {/* Global AI Smart Assistant Drawer Widget */}
      <SmartAssistant
        products={liveProducts}
        onAddToCart={handleAddToCart}
        onNavigate={handleNavigate}
      />

      {/* Global Quick View Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#113d22]/95 border border-white/15 backdrop-blur-2xl rounded-3xl p-5 lg:p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto space-y-5 text-white"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#FACC15] tracking-wider">
                    Quick Sourcing Details
                  </span>
                  <h3 className="text-xs lg:text-sm font-black text-white mt-1">{selectedProduct.name}</h3>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="rounded-full hover:bg-white/10 p-1">
                  <X className="h-5.5 w-5.5 text-white/70" />
                </button>
              </div>

              <div className="h-48 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                <img src={selectedProduct.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt="" className="object-cover h-full w-full" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-black text-[#FACC15]">₦{selectedProduct.price.toLocaleString()}</span>
                  <span className="text-xs text-white/50">{selectedProduct.size}</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">{selectedProduct.description}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex gap-2">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setActiveView('product');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex-1 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold py-2.5 text-xs transition"
                >
                  View Full Details
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct, 1);
                    setSelectedProduct(null);
                    alert(`🛒 Added ${selectedProduct.name} to your basket!`);
                  }}
                  className="flex-1 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white font-bold py-2.5 text-xs shadow-lg shadow-orange-950/20 transition cursor-pointer"
                >
                  Pack Into Basket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RBAC Admin Operations & Produce Portal */}
      <AdminPortalModal
        isOpen={isAdminPortalOpen}
        onClose={() => setIsAdminPortalOpen(false)}
        products={liveProducts}
        currentRole={effectiveAdminRole}
        currentEmail={effectiveAdminEmail}
        isSimulatingRole={simulatedRole !== null}
        onSelectRoleForPreview={(role, email) => {
          setSimulatedRole(role);
          setSimulatedEmail(email || null);
        }}
        onRefreshProducts={() => setLiveProducts(getLocalLiveProducts())}
        onSaveProduct={handleSaveProduce}
        onDeleteProduct={handleDeleteProduce}
        onNavigateToAuth={() => {
          setIsAdminPortalOpen(false);
          setActiveView('auth');
        }}
      />

      {/* Direct Produce Editor Modal */}
      <AdminProduceModal
        isOpen={isProduceEditorOpen}
        onClose={() => {
          setIsProduceEditorOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        operatorRole={effectiveAdminRole}
        operatorEmail={effectiveAdminEmail}
        onSave={handleSaveProduce}
      />

    </div>
  );
}
