import { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, ShieldCheck, HeartHandshake, Package, ShoppingCart, ArrowRight, Truck, Info } from 'lucide-react';
import { CartItem } from '../types';

interface CartViewProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, size: string, change: number) => void;
  onRemoveItem: (productId: string, size: string) => void;
  onNavigate: (view: string) => void;
}

export default function CartView({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onNavigate
}: CartViewProps) {
  const [packagingOption, setPackagingOption] = useState<'standard' | 'thermal'>('standard');
  const [addDonation, setAddDonation] = useState<boolean>(true);

  // Math totals
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const packagingFee = packagingOption === 'thermal' ? 2500 : 0;
  const donationFee = addDonation ? 1000 : 0;
  const deliveryThreshold = 25000;
  const deliveryFee = subtotal >= deliveryThreshold || subtotal === 0 ? 0 : 3500;
  const total = subtotal + packagingFee + donationFee + deliveryFee;

  // Free delivery metrics
  const freeDeliveryProgress = Math.min((subtotal / deliveryThreshold) * 100, 100);
  const remainderForFreeDelivery = deliveryThreshold - subtotal;

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 text-center font-sans text-white">
        <div className="max-w-md mx-auto space-y-4 bg-white/10 border border-white/15 rounded-3xl p-8 shadow-2xl backdrop-blur-xl text-white">
          <div className="h-20 w-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
            🛒
          </div>
          <h2 className="text-xl font-bold text-white">Your Basket is Currently Empty</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            You haven&apos;t loaded any farm-fresh produce, rice grains, or beverages yet. Visit our shop catalog and start planning your meals!
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 px-6 text-xs shadow-lg transition cursor-pointer"
          >
            Browse Fresh Market
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      <div className="border-b border-white/10 pb-4 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Your FreshBasket Review</h2>
        <p className="text-xs text-white/60 mt-1">Review items, packaging, and dispatch preferences before checkout.</p>
      </div>

      {/* Free delivery tracker banner */}
      <div className="bg-[#16A34A]/10 rounded-2xl border border-white/10 p-4 mb-8 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-semibold text-white">
          <div className="flex items-center gap-1.5">
            <Truck className="h-4.5 w-4.5 text-[#FACC15]" />
            {freeDeliveryProgress >= 100 ? (
              <span>🎉 Congratulations! You&apos;ve unlocked <b>FREE Express Delivery</b>!</span>
            ) : (
              <span>Add <b>₦{remainderForFreeDelivery.toLocaleString()}</b> more to unlock FREE Delivery!</span>
            )}
          </div>
          <span className="font-extrabold text-[#FACC15]">{Math.round(freeDeliveryProgress)}%</span>
        </div>
        <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden">
          <div className="bg-[#16A34A] h-full rounded-full transition-all duration-500" style={{ width: `${freeDeliveryProgress}%` }}></div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - List of Items */}
        <div className="lg:col-span-8 space-y-4">
          {cart.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedSize}`}
              className="bg-white/10 rounded-2xl border border-white/15 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl backdrop-blur-md text-white"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img src={item.product.imageUrls[0]} alt="" className="h-16 w-16 object-cover rounded-xl shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.name}</h4>
                  <p className="text-[10px] text-white/50 font-semibold uppercase">{item.product.category}</p>
                  <p className="text-xs font-semibold text-white/70 mt-0.5">Size: {item.selectedSize}</p>
                </div>
              </div>

              {/* Quantity controls and price calculations */}
              <div className="flex items-center justify-between w-full sm:w-auto gap-6 border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
                <div className="flex items-center justify-between border border-white/10 rounded-xl px-2.5 py-1.5 bg-white/5 w-24 shrink-0">
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.selectedSize, -1)}
                    className="text-white/60 font-bold hover:text-white text-sm px-1.5 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-white">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.product.id, item.selectedSize, 1)}
                    className="text-white/60 font-bold hover:text-white text-sm px-1.5 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div className="text-right shrink-0 min-w-[100px]">
                  <p className="text-sm font-black text-[#FACC15]">
                    ₦{(item.product.price * item.quantity).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-white/50">₦{item.product.price.toLocaleString()} each</p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.product.id, item.selectedSize)}
                  className="rounded-xl border border-white/10 hover:border-orange-500/30 hover:bg-orange-500/10 text-white/40 hover:text-orange-500 p-2 transition shrink-0 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Premium Packaging Options */}
          <div className="bg-white/10 rounded-3xl border border-white/15 p-5 space-y-4 shadow-2xl backdrop-blur-md text-white">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Package className="h-4.5 w-4.5 text-[#FACC15]" /> Premium Packing Options
            </h3>
            <p className="text-xs text-white/60">
              Select how you want your agricultural items packed and transported to guarantee absolute freshness.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setPackagingOption('standard')}
                className={`flex flex-col text-left p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                  packagingOption === 'standard'
                    ? 'border-[#16A34A] bg-[#16A34A]/20 text-white font-extrabold'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-bold">Standard Carton Box</span>
                <span className="text-[10px] text-white/50 mt-1 font-semibold leading-relaxed">
                  Eco-friendly, thick double-wall cardboard box. Sorted and insulated. (FREE)
                </span>
              </button>
              <button
                onClick={() => setPackagingOption('thermal')}
                className={`flex flex-col text-left p-3.5 rounded-2xl border-2 transition cursor-pointer ${
                  packagingOption === 'thermal'
                    ? 'border-[#16A34A] bg-[#16A34A]/20 text-white font-extrabold'
                    : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-bold">Thermal Cold-Chain Bag</span>
                  <span className="text-[10px] font-black bg-orange-500/30 text-white px-1.5 py-0.5 rounded border border-orange-500/20">
                    +₦2,500
                  </span>
                </div>
                <span className="text-[10px] text-white/50 mt-1 font-semibold leading-relaxed">
                  Heavy foil thermal bubble bags lined with frozen dry ice sheets. Perfect for catfish and meat.
                </span>
              </button>
            </div>
          </div>

          {/* Charity Food Donation Choice */}
          <div className="bg-orange-500/10 rounded-3xl border border-orange-500/20 p-5 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-2xl backdrop-blur-md text-white">
            <div className="flex gap-3 items-start text-center sm:text-left">
              <span className="text-3xl shrink-0">🤝</span>
              <div>
                <h4 className="text-xs font-extrabold text-orange-200">Add ₦1,000 to feed a local family</h4>
                <p className="text-[11px] text-white/70 mt-0.5 leading-relaxed max-w-md">
                  In partnership with the Lagos Food Bank Initiative, we match every voluntary ₦1,000 donation to package daily egg-milk meals for underprivileged communities in Ajegunle.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 font-bold text-xs text-white bg-white/5 border border-white/10 rounded-full py-2 px-4 shadow-sm cursor-pointer hover:bg-white/10 shrink-0">
              <input
                type="checkbox"
                checked={addDonation}
                onChange={(e) => setAddDonation(e.target.checked)}
                className="accent-orange-600 h-4 w-4"
              />
              <span>Donate ₦1,000</span>
            </label>
          </div>
        </div>

        {/* Right Column - Invoice Summary */}
        <div className="lg:col-span-4 bg-[#0b2b16]/90 border border-white/15 rounded-3xl p-5 lg:p-6 space-y-6 shadow-2xl backdrop-blur-xl sticky top-28 text-white">
          <h3 className="text-sm font-bold text-white border-b border-white/10 pb-3">Order Invoice Summary</h3>
          
          <div className="space-y-3.5 text-xs text-white/80">
            <div className="flex justify-between">
              <span>Fresh Basket Subtotal</span>
              <span className="font-bold text-white">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Packaging Style Fee</span>
              <span className="font-bold text-white">
                {packagingOption === 'thermal' ? '₦2,500' : 'FREE Standard'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Ajegunle Food Bank Donation</span>
              <span className="font-bold text-white">
                {addDonation ? '₦1,000' : '₦0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Express Logistics Delivery</span>
              <span className="font-bold text-white">
                {deliveryFee === 0 ? (
                  <span className="text-[#FACC15] font-extrabold">FREE</span>
                ) : (
                  `₦${deliveryFee.toLocaleString()}`
                )}
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between text-sm font-black text-white">
              <span>Estimated Invoice Total</span>
              <span className="text-lg text-[#FACC15] font-sans">₦{total.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('checkout')}
            className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-4 text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/10 transition cursor-pointer"
          >
            <span>Proceed To Secure Checkout</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </button>

          <div className="bg-white/5 rounded-2xl p-3 border border-white/10 flex items-center gap-2.5 text-[10px] text-white/60 leading-snug">
            <ShieldCheck className="h-5 w-5 text-[#FACC15] shrink-0" />
            <span>Guaranteed secure payment channels encrypted with SSL. Direct payout via Paystack API proxy.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
