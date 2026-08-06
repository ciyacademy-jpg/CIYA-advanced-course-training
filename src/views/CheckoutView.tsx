import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Truck, Calendar, Sparkles, CheckCircle, ArrowRight, ArrowLeft, ShieldCheck, Landmark, Check } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CheckoutViewProps {
  cart: CartItem[];
  onClearCart: () => void;
  onNavigate: (view: string) => void;
  onAddOrder: (order: Order) => void;
}

export default function CheckoutView({
  cart,
  onClearCart,
  onNavigate,
  onAddOrder
}: CheckoutViewProps) {
  const [formData, setFormData] = useState({
    fullName: "Yinka Olamide",
    phone: "+234 812 456 7812",
    street: "Apartment 4B, Oceanview Towers, 24 Admiralty Way",
    city: "Lekki Phase 1",
    state: "Lagos State",
    notes: ""
  });
  const [deliveryDate, setDeliveryDate] = useState("Tomorrow, July 22");
  const [deliverySlot, setDeliverySlot] = useState("Morning (9:00 AM - 12:00 PM)");
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank' | 'cod'>('paystack');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Totals calculations
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal >= 25000 ? 0 : 3500;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate gateway delay
    setTimeout(() => {
      const orderId = `FB-${Math.floor(100000 + Math.random() * 90000)}`;
      const newOrder: Order = {
        id: orderId,
        items: [...cart],
        subtotal,
        deliveryFee,
        tax: 0,
        discount: 0,
        total,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'Received',
        deliveryAddress: {
          fullName: formData.fullName,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          phone: formData.phone
        },
        riderName: "Tunde Alao",
        riderPhone: "+234 803 111 2222",
        otp: "5492",
        estimatedArrival: `${deliveryDate}, ${deliverySlot.split(' ')[0]}`
      };

      onAddOrder(newOrder);
      setPlacedOrder(newOrder);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleSuccessClose = () => {
    onClearCart();
    setShowSuccessModal(false);
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-4 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Secure Checkout</h2>
        <p className="text-xs text-white/60 mt-1">Provide delivery address, select dispatch schedule, and pay safely.</p>
      </div>

      <form onSubmit={handleSubmitOrder} className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form Panel */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Shipping Address Fields */}
          <div className="bg-white/10 rounded-3xl border border-white/15 p-5 lg:p-6 space-y-4 shadow-2xl backdrop-blur-xl text-white">
            <h3 className="text-xs font-bold text-[#FACC15] flex items-center gap-1.5 uppercase tracking-wider border-b border-white/10 pb-2.5">
              🚚 1. Delivery Logistics Address
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Full Recipient Name</label>
                <input
                  type="text"
                  required
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Active Phone Number</label>
                <input
                  type="tel"
                  required
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Street Address (Lekki, GRA, etc)</label>
                <input
                  type="text"
                  required
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">City</label>
                <input
                  type="text"
                  required
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">State</label>
                <input
                  type="text"
                  required
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Special Rider Dispatch Instructions (Optional)</label>
                <textarea
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="E.g., Ring doorbell, drop off at reception desk..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:bg-white/10 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
            </div>
          </div>

          {/* Logistics Scheduler */}
          <div className="bg-white/10 rounded-3xl border border-white/15 p-5 lg:p-6 space-y-4 shadow-2xl backdrop-blur-xl text-white">
            <h3 className="text-xs font-bold text-[#FACC15] flex items-center gap-1.5 uppercase tracking-wider border-b border-white/10 pb-2.5">
              <Calendar className="h-4.5 w-4.5 text-[#FACC15]" /> 2. Delivery Date & Time Slot
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Choose Dispatch Date</label>
                <div className="space-y-2 text-xs">
                  {["Today, July 21 (Express)", "Tomorrow, July 22", "Thursday, July 23"].map((date) => (
                    <label key={date} className="flex items-center gap-2.5 cursor-pointer p-3.5 rounded-2xl bg-white/5 border border-white/10 font-semibold text-white/80 hover:bg-white/10">
                      <input
                        type="radio"
                        name="deliveryDate"
                        checked={deliveryDate === date}
                        onChange={() => setDeliveryDate(date)}
                        className="accent-[#16A34A] h-4.5 w-4.5 cursor-pointer"
                      />
                      <span>{date}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-wider">Available Hour Window</label>
                <div className="space-y-2 text-xs">
                  {["Morning (9:00 AM - 12:00 PM)", "Afternoon (1:00 PM - 4:00 PM)", "Evening (5:00 PM - 8:00 PM)"].map((slot) => (
                    <label key={slot} className="flex items-center gap-2.5 cursor-pointer p-3.5 rounded-2xl bg-white/5 border border-white/10 font-semibold text-white/80 hover:bg-white/10">
                      <input
                        type="radio"
                        name="deliverySlot"
                        checked={deliverySlot === slot}
                        onChange={() => setDeliverySlot(slot)}
                        className="accent-[#16A34A] h-4.5 w-4.5 cursor-pointer"
                      />
                      <span>{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment gateways selection */}
          <div className="bg-white/10 rounded-3xl border border-white/15 p-5 lg:p-6 space-y-4 shadow-2xl backdrop-blur-xl text-white">
            <h3 className="text-xs font-bold text-[#FACC15] flex items-center gap-1.5 uppercase tracking-wider border-b border-white/10 pb-2.5">
              💳 3. Secure Payment Gateway Mode
            </h3>
            
            <div className="space-y-2.5">
              {/* Paystack / Flutterwave choice */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition cursor-pointer ${
                paymentMethod === 'paystack' ? 'border-[#16A34A] bg-[#16A34A]/20 text-white font-extrabold shadow-sm' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'paystack'}
                    onChange={() => setPaymentMethod('paystack')}
                    className="accent-[#16A34A] h-4.5 w-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold block text-white">Pay Online via Paystack / Cards</span>
                    <span className="text-[10px] text-white/50 mt-1 font-semibold block">Visa, Mastercard, Verve, Apple Pay, Google Pay</span>
                  </div>
                </div>
                <CreditCard className="h-5 w-5 text-[#FACC15] shrink-0" />
              </label>

              {/* Direct Bank Transfer */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition cursor-pointer ${
                paymentMethod === 'bank' ? 'border-[#16A34A] bg-[#16A34A]/20 text-white font-extrabold shadow-sm' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'bank'}
                    onChange={() => setPaymentMethod('bank')}
                    className="accent-[#16A34A] h-4.5 w-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold block text-white">Direct Bank Transfer</span>
                    <span className="text-[10px] text-white/50 mt-1 font-semibold block">Make a direct mobile app transfer to our GTBank account</span>
                  </div>
                </div>
                <Landmark className="h-5 w-5 text-[#FACC15] shrink-0" />
              </label>

              {/* Cash On Delivery */}
              <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition cursor-pointer ${
                paymentMethod === 'cod' ? 'border-[#16A34A] bg-[#16A34A]/20 text-white font-extrabold shadow-sm' : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="accent-[#16A34A] h-4.5 w-4.5 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold block text-white">Cash / Card on Delivery</span>
                    <span className="text-[10px] text-white/50 mt-1 font-semibold block">Pay on delivery with cash or POS card terminal at eligible locations</span>
                  </div>
                </div>
                <span className="text-xl shrink-0">💵</span>
              </label>
            </div>

            {/* Bank details expansion if chosen */}
            {paymentMethod === 'bank' && (
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1.5 text-xs text-white/80 leading-relaxed font-semibold">
                <p className="text-[10px] text-white/50 font-bold uppercase">GTBank Account Details</p>
                <p className="text-white">Account Name: <b className="text-[#FACC15]">FreshBasket Nigeria Ltd</b></p>
                <p className="text-white">Account Number: <b className="text-[#FACC15]">0482129302</b></p>
                <p className="text-white">Bank: <b className="text-[#FACC15]">Guaranty Trust Bank (GTB)</b></p>
                <p className="text-[10px] text-white/50 font-normal leading-snug pt-1">
                  💡 Note: Please put your name or Order Number as the transfer memo. We verify transfers instantly.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right Invoice Invoice Sidebar */}
        <div className="lg:col-span-4 bg-[#0b2b16]/90 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-xl sticky top-28 space-y-6 text-white">
          <div className="border-b border-white/10 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Basket Checkout Review</h3>
          </div>

          {/* mini list of items */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex gap-2.5 items-center justify-between text-xs">
                <div className="flex gap-2 items-center min-w-0">
                  <img src={item.product.imageUrls[0]} alt="" className="h-8 w-8 object-cover rounded-lg shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate leading-tight">{item.product.name}</p>
                    <p className="text-[9px] text-white/50">{item.quantity}x • {item.selectedSize}</p>
                  </div>
                </div>
                <span className="font-extrabold text-[#FACC15]">₦{(item.product.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10" />

          {/* Subtotals list */}
          <div className="space-y-3.5 text-xs text-white/60 font-semibold">
            <div className="flex justify-between">
              <span>Basket Subtotal</span>
              <span className="text-white font-extrabold">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Express Logistics Delivery</span>
              <span className="text-white font-extrabold">
                {deliveryFee === 0 ? 'FREE Promo' : `₦${deliveryFee.toLocaleString()}`}
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between text-sm font-black text-white">
              <span>Grand Total</span>
              <span className="text-lg text-[#FACC15] font-sans">₦{total.toLocaleString()}</span>
            </div>
          </div>

          {/* Submit CTA button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-4 text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#16A34A]/10 transition cursor-pointer disabled:bg-white/10"
          >
            {isSubmitting ? (
              <span>Verifying secure gateway...</span>
            ) : (
              <>
                <span>Complete Order Securely</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="flex justify-center items-center gap-1.5 text-[10px] text-white/40 font-bold">
            <ShieldCheck className="h-4 w-4 text-[#FACC15]" />
            <span>Encrypted with 256-bit SSL gateway protocol</span>
          </div>
        </div>

      </form>

      {/* Confetti Successful Checkout Modal */}
      <AnimatePresence>
        {showSuccessModal && placedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#06180c]/80 backdrop-blur-md"
            />

            {/* Custom falling colorful confetti circles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full animate-bounce"
                  style={{
                    backgroundColor: ['#16A34A', '#F97316', '#FACC15', '#3B82F6', '#EC4899'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: `-${Math.random() * 20}px`,
                    width: `${Math.random() * 12 + 8}px`,
                    height: `${Math.random() * 12 + 8}px`,
                    opacity: Math.random() * 0.7 + 0.3,
                    animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-lg bg-[#0b2b16]/95 border border-white/10 rounded-3xl p-6 lg:p-8 text-center shadow-2xl z-20 space-y-6 overflow-hidden text-white"
            >
              <div className="h-16 w-16 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
                <Check className="h-8 w-8 text-[#FACC15]" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#FACC15] bg-white/10 border border-white/10 px-2.5 py-1 rounded-full">
                  Payment Confirmed • Verified
                </span>
                <h3 className="text-xl lg:text-2xl font-bold font-sans text-white mt-2">Order Placed Successfully!</h3>
                <p className="text-xs text-white/60">
                  Ẹ ṣeun, {formData.fullName}! Your payment has been secured and dispatched to Epe farm pickers.
                </p>
              </div>

              {/* Order specifics */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3.5 text-xs text-left">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/40 font-bold">Order Number</span>
                  <span className="font-extrabold text-white">{placedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/40 font-bold">Courier Assigned</span>
                  <span className="font-extrabold text-white">{placedOrder.riderName} ({placedOrder.riderPhone})</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/40 font-bold">Delivery OTP Code</span>
                  <span className="font-extrabold text-[#FACC15] text-sm tracking-widest">{placedOrder.otp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40 font-bold">Logistics Schedule</span>
                  <span className="font-extrabold text-[#FACC15]">{placedOrder.estimatedArrival}</span>
                </div>
              </div>

              <p className="text-[11px] text-white/40 leading-snug">
                Please write down or screenshot your <b>OTP: {placedOrder.otp}</b>. Our courier will request this digits at Admiralty Way to verify successful drop-off.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    alert(`📥 Downloading Invoice-${placedOrder.id}.pdf to your storage device.`);
                  }}
                  className="flex-1 rounded-xl border border-white/10 hover:bg-white/5 text-white/80 font-bold py-3 text-xs transition cursor-pointer"
                >
                  Download Invoice
                </button>
                <button
                  type="button"
                  onClick={handleSuccessClose}
                  className="flex-1 rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-3 text-xs shadow transition cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded falling confetti CSS keyframes */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
          }
        }
      `}</style>

    </div>
  );
}
