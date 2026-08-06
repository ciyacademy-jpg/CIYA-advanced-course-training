import { useState } from 'react';
import { motion } from 'motion/react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { User, ShoppingBag, Calendar, Heart, Gift, Award, HelpCircle, MapPin, Phone, RefreshCw, Star, Trash2 } from 'lucide-react';
import { Order, Product, ReferralMilestone } from '../types';

interface DashboardViewProps {
  orders: Order[];
  wishlist: string[];
  products: Product[];
  onRemoveWishlistItem: (p: Product) => void;
  onAddToCart: (p: Product, qty: number) => void;
  onNavigate: (view: string) => void;
  onSelectActiveOrder: (order: Order) => void;
  initialTab?: string;
}

const initialMilestones: ReferralMilestone[] = [
  { id: "mil-1", friendsCount: 5, rewardName: "Free Plantains Combo", rewardValue: "₦2,800 Value", description: "Invite 5 friends to register and place their first order.", unlocked: true },
  { id: "mil-2", friendsCount: 10, rewardName: "₦5,000 Voucher", rewardValue: "₦5,000 Cash", description: "Invite 10 friends to buy fresh produce bundles.", unlocked: false },
  { id: "mil-3", friendsCount: 25, rewardName: "VIP Member Pricing + Free Shipping", rewardValue: "Lifetime VIP", description: "Invite 25 friends and unlock ultimate grocery savings.", unlocked: false }
];

// Analytical spending data for Recharts
const monthlySpendingData = [
  { name: "Feb", spend: 28000 },
  { name: "Mar", spend: 45000 },
  { name: "Apr", spend: 32000 },
  { name: "May", spend: 54000 },
  { name: "Jun", spend: 41000 },
  { name: "Jul", spend: 68500 }
];

export default function DashboardView({
  orders,
  wishlist,
  products,
  onRemoveWishlistItem,
  onAddToCart,
  onNavigate,
  onSelectActiveOrder,
  initialTab = "overview"
}: DashboardViewProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [milestones, setMilestones] = useState<ReferralMilestone[]>(initialMilestones);
  const [loyaltyPoints, setLoyaltyPoints] = useState(1420);
  const [copiedLink, setCopiedLink] = useState(false);

  const wishlistProducts = products.filter(p => wishlist.includes(p.id));

  const handleCopyReferral = () => {
    navigator.clipboard.writeText("https://freshbasket.ng/refer/yinka-olamide-482a");
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Dashboard Top Header */}
      <div className="bg-white/10 border border-white/15 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-2xl border-2 border-white/10 shadow">
            YO
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Eku Àbọ̀, Yinka Olamide!</h2>
            <p className="text-xs text-white/60 mt-1">Lekki Phase 1 Sector • Premium Gold Tier Member</p>
          </div>
        </div>

        {/* Loyalty Points summary card */}
        <div className="bg-[#0b2b16]/90 text-white rounded-2xl p-4 border border-white/15 flex items-center gap-4 shrink-0 shadow-2xl backdrop-blur-md">
          <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center text-[#FACC15] text-xl font-black border border-white/10">
            🏆
          </div>
          <div>
            <p className="text-[10px] text-white/50 uppercase font-black tracking-widest">Rewards Points Balance</p>
            <p className="text-xl font-black font-sans text-[#FACC15]">{loyaltyPoints.toLocaleString()} Pts</p>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation and Panels */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar menu lists */}
        <div className="lg:col-span-3 bg-white/10 border border-white/15 rounded-3xl p-4 space-y-1 shadow-2xl backdrop-blur-md">
          {[
            { id: "overview", label: "Dashboard Overview", icon: User },
            { id: "orders", label: "Order History", icon: ShoppingBag, badge: orders.length },
            { id: "subscriptions", label: "Schedules & Subscriptions", icon: Calendar },
            { id: "wishlist", label: "My Wishlist", icon: Heart, badge: wishlistProducts.length },
            { id: "rewards", label: "Refer & Earn Milestones", icon: Gift },
            { id: "analytics", label: "Grocery Spend Analytics", icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition text-left cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#16A34A]/20 border border-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <tab.icon className={`h-4.5 w-4.5 ${activeTab === tab.id ? 'text-[#FACC15]' : 'text-white/40'}`} />
                <span>{tab.label}</span>
              </div>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="rounded-full bg-[#16A34A] px-2 py-0.5 text-[10px] font-black text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Right Active Panel Area */}
        <div className="lg:col-span-9 bg-white/10 border border-white/15 rounded-3xl p-5 lg:p-6 shadow-2xl backdrop-blur-xl min-h-[400px] text-white">
          
          {/* Dashboard Overview Panel */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Account overview</h3>
              </div>
              
              {/* Quick statistics widgets */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-white/50">Total Orders Placed</span>
                  <p className="text-2xl font-black text-[#FACC15] mt-1">{orders.length}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-white/50">Monthly Sourcing spend</span>
                  <p className="text-2xl font-black text-[#FACC15] mt-1">₦68,500</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-xs font-semibold text-white/50">Vetted Subscriptions</span>
                  <p className="text-2xl font-black text-[#FACC15] mt-1">1 Active</p>
                </div>
              </div>

              {/* Latest Order display */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-bold text-white">Most Recent Order Logistics</h4>
                {orders.length > 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold text-white">{orders[0].id}</p>
                      <p className="text-[11px] text-white/60 mt-1">Placed on {orders[0].date} • Total: ₦{orders[0].total.toLocaleString()}</p>
                      <p className="text-[11px] text-[#FACC15] font-bold mt-1.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]"></span>
                        Status: {orders[0].status}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        onSelectActiveOrder(orders[0]);
                        onNavigate('tracking');
                      }}
                      className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold px-4 py-2 text-xs transition cursor-pointer"
                    >
                      Track Order Delivery
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-white/50 italic">No orders recorded yet. Visit the shop to make your first purchase!</p>
                )}
              </div>
            </div>
          )}

          {/* Order History Panel */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Your Complete Order Logs</h3>
              </div>
              
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="bg-white/5 border border-white/10 rounded-3xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                        <div>
                          <p className="text-xs font-extrabold text-white">Order Ref: {ord.id}</p>
                          <p className="text-[11px] text-white/50 mt-0.5">Purchased on {ord.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-[#FACC15]">₦{ord.total.toLocaleString()}</p>
                          <p className="text-[10px] text-white/40">{ord.items.length} Sourced Items</p>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4 items-center">
                        {/* List items mini preview */}
                        <div className="space-y-1.5">
                          {ord.items.map((it, idx) => (
                            <p key={idx} className="text-xs text-white/70 font-semibold truncate">
                              • {it.quantity}x {it.product.name} ({it.selectedSize})
                            </p>
                          ))}
                        </div>

                        {/* tracking redirection */}
                        <div className="flex sm:justify-end gap-2.5">
                          <button
                            onClick={() => {
                              onSelectActiveOrder(ord);
                              onNavigate('tracking');
                            }}
                            className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 px-4 text-xs transition cursor-pointer"
                          >
                            Live Map Tracking
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">No orders recorded yet.</p>
              )}
            </div>
          )}

          {/* Subscriptions Panel */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Subscription Savings Calendar</h3>
              </div>
              
              <div className="bg-[#0b2b16]/95 text-white rounded-3xl p-5 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl backdrop-blur-md">
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="bg-[#FACC15] text-[#0b2b16] text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                    ACTIVE WEEKLY PLAN
                  </span>
                  <h4 className="text-base font-extrabold text-white">Lekki Family Vegetables & Fruits Bundle</h4>
                  <p className="text-xs text-white/60">Scheduled delivery: Every Saturday morning at 9:00 AM.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => alert("⏸️ Subscription plan paused. Automatic payments are halted.")}
                    className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-3.5 text-xs transition cursor-pointer"
                  >
                    Pause Schedule
                  </button>
                  <button
                    onClick={() => onNavigate('subscriptions')}
                    className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2 px-3.5 text-xs transition cursor-pointer"
                  >
                    Manage Items
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist Panel */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Saved Wishlist items ({wishlistProducts.length})</h3>
              </div>
              
              {wishlistProducts.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {wishlistProducts.map((p) => (
                    <div key={p.id} className="bg-white/5 rounded-2xl border border-white/10 p-3 flex gap-3.5 items-center group">
                      <img src={p.imageUrls[0]} alt="" className="h-16 w-16 object-cover rounded-xl shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-[#FACC15] transition truncate">{p.name}</h4>
                        <p className="text-xs font-extrabold text-[#FACC15] mt-1">₦{p.price.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => onAddToCart(p, 1)}
                          className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white p-2 text-xs transition cursor-pointer"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemoveWishlistItem(p)}
                          className="rounded-xl border border-white/10 hover:bg-orange-500/10 hover:text-orange-400 p-2 text-white/40 transition cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/50 italic">No items saved in your wishlist yet.</p>
              )}
            </div>
          )}

          {/* Referral Milestones Panel */}
          {activeTab === 'rewards' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Refer & Earn Dashboard</h3>
              </div>

              {/* Referral link box */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-3.5">
                <h4 className="text-xs font-bold text-white">Your Exclusive Invitation Link</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://freshbasket.ng/refer/yinka-olamide-482a"
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 text-white/60 text-xs px-3 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyReferral}
                    className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 px-4 text-xs transition cursor-pointer"
                  >
                    {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Share your link with friends on WhatsApp or social media. When they register and place their first fresh grocery order, you both earn <b>1,000 Points</b> plus special milestone bundles!
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white">Rewards Milestones Unlock</h4>
                <div className="space-y-3">
                  {milestones.map((mil) => (
                    <div
                      key={mil.id}
                      className={`rounded-2xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        mil.unlocked ? 'bg-[#16A34A]/20 border-[#16A34A]/30 text-white font-bold' : 'bg-white/5 border-white/10 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Award className={`h-4.5 w-4.5 ${mil.unlocked ? 'text-[#FACC15]' : 'text-white/40'}`} />
                          <h5 className="text-xs font-bold">{mil.rewardName} ({mil.rewardValue})</h5>
                        </div>
                        <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{mil.description}</p>
                      </div>
                      <span className={`inline-block rounded-full py-1 px-3 text-[10px] font-black uppercase text-center shrink-0 ${
                        mil.unlocked ? 'bg-[#16A34A] text-white border border-white/10' : 'bg-white/10 text-white/40 border border-white/5'
                      }`}>
                        {mil.unlocked ? "✓ Unlocked & Claimed" : "🔒 Locked"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Spending Analytics Panel */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <h3 className="text-sm font-bold text-white">Grocery Spend breakdown</h3>
              </div>
              
              <p className="text-xs text-white/60 leading-relaxed">
                Analyze your monthly historical investment in farm-fresh produce and grocery delivery. Spending is highly optimized with subscription discounts.
              </p>

              {/* Recharts Area Chart Container */}
              <div className="h-64 w-full bg-white/5 rounded-3xl border border-white/10 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlySpendingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} fontWeight="bold" />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} fontWeight="bold" tickFormatter={(v) => `₦${v/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0b2b16', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px' }} itemStyle={{ color: '#ffffff' }} labelStyle={{ fontWeight: 'bold', fontSize: '12px', color: '#FACC15' }} formatter={(value) => [`₦${value.toLocaleString()}`, "Amount Spend"]} />
                    <Area type="monotone" dataKey="spend" stroke="#16A34A" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-[#16A34A]/10 border border-[#16A34A]/20 rounded-2xl p-4 text-white text-xs leading-relaxed font-semibold">
                💡 Chef Assistant Insight: You spent 12% less in June compared to July by bundles grouping and early weekly deals purchases. Keep leveraging Jollof and egusi meal bundles!
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
