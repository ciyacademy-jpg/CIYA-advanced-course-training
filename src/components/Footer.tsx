import React from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare, Instagram, Facebook, Video, Twitter } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Ẹ ṣeun! Thanks for subscribing. You've unlocked 10% off your next FreshBasket order!");
  };

  return (
    <footer className="backdrop-blur-xl bg-white/5 border-t border-white/10 text-white/80 font-sans mt-auto">
      {/* Top Newsletter banner section */}
      <div className="border-b border-white/10 bg-[#0c2e17]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-12 grid lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <h3 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
              🌽 Fresh Deals Straight To Your Inbox
            </h3>
            <p className="text-white/70 text-xs mt-2 max-w-lg leading-relaxed">
              Join 150,000+ Nigerian shoppers. Get weekly recipes, exclusive discounts, flash sale updates, and direct-from-farm harvest reports.
            </p>
          </div>
          <div className="lg:col-span-5">
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                required
                placeholder="Enter your active email..."
                className="flex-1 rounded-xl bg-white/10 border border-white/25 px-4 py-3 text-xs text-white placeholder-white/50 focus:border-[#FACC15] focus:outline-none focus:ring-1 focus:ring-[#FACC15] transition"
              />
              <button
                type="submit"
                className="rounded-xl bg-[#F97316] hover:bg-[#ea580c] px-6 py-3 text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg shadow-orange-950/30 transition"
              >
                <span>Subscribe</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Content Grid */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-14 lg:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-8">
        
        {/* Brand and contact Column */}
        <div className="col-span-2 lg:col-span-4 space-y-5">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-extrabold text-lg shadow">
              F
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              FreshBasket<span className="text-[#FACC15]">NG</span>
            </span>
          </div>
          <p className="text-xs text-white/70 leading-relaxed">
            Premium Nigerian grocery marketplace. We work directly with verified local farmers to deliver fresh, affordable, stone-free products straight to your doorstep same-day.
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="h-4 w-4 text-[#FACC15] shrink-0" />
              <span>24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Phone className="h-4 w-4 text-[#FACC15] shrink-0" />
              <span>+234 812 456 7812</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <Mail className="h-4 w-4 text-[#FACC15] shrink-0" />
              <span>support@freshbasketng.com</span>
            </div>
          </div>
        </div>

        {/* Categories Column */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider">Departments</h4>
          <ul className="space-y-2.5 text-xs text-white/70 font-medium">
            <li><button onClick={() => onNavigate('shop?category=Fresh Fruits')} className="hover:text-white transition text-left">Fresh Fruits</button></li>
            <li><button onClick={() => onNavigate('shop?category=Fresh Vegetables')} className="hover:text-white transition text-left">Fresh Vegetables</button></li>
            <li><button onClick={() => onNavigate('shop?category=Meat & Seafood')} className="hover:text-white transition text-left">Meat & Seafood</button></li>
            <li><button onClick={() => onNavigate('shop?category=Rice & Grains')} className="hover:text-white transition text-left">Rice & Grains</button></li>
            <li><button onClick={() => onNavigate('shop?category=Bakery')} className="hover:text-white transition text-left">Fresh Bakery</button></li>
            <li><button onClick={() => onNavigate('shop?category=Dairy & Eggs')} className="hover:text-white transition text-left">Dairy & Eggs</button></li>
          </ul>
        </div>

        {/* Resources / Discover Column */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider">Discover</h4>
          <ul className="space-y-2.5 text-xs text-white/70 font-medium">
            <li><button onClick={() => onNavigate('recipes')} className="hover:text-white transition text-left">Recipe Hub</button></li>
            <li><button onClick={() => onNavigate('mealplanner')} className="hover:text-white transition text-left">Meal Planner</button></li>
            <li><button onClick={() => onNavigate('subscriptions')} className="hover:text-white transition text-left">Subscriptions</button></li>
            <li><button onClick={() => onNavigate('loyalty')} className="hover:text-white transition text-left">Loyalty & Rewards</button></li>
            <li><button onClick={() => onNavigate('blog')} className="hover:text-white transition text-left">Healthy Living Blog</button></li>
            <li><button onClick={() => onNavigate('dashboard')} className="hover:text-white transition text-left">Customer Dashboard</button></li>
          </ul>
        </div>

        {/* Company & Support Column */}
        <div className="col-span-2 lg:col-span-4 space-y-4">
          <h4 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider">Company & Policies</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs text-white/70 font-medium">
            <button onClick={() => onNavigate('about')} className="hover:text-white transition text-left">About Us</button>
            <button onClick={() => onNavigate('contact')} className="hover:text-white transition text-left">Contact Us</button>
            <button onClick={() => onNavigate('faq')} className="hover:text-white transition text-left">FAQs & Help</button>
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-white transition text-left">Privacy Policy</button>
            <button onClick={() => onNavigate('terms')} className="hover:text-white transition text-left">Terms & Conditions</button>
            <button onClick={() => onNavigate('refund-policy')} className="hover:text-white transition text-left">Refund & Returns</button>
            <button onClick={() => onNavigate('delivery-policy')} className="hover:text-white transition text-left">Delivery Policy</button>
          </div>
          
          {/* Social Icons */}
          <div className="pt-3 border-t border-white/10">
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider mb-2.5">Join the Community</p>
            <div className="flex gap-2.5">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition">
                <Video className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://wa.me/2348124567812" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition">
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Security Bottom Footer */}
      <div className="bg-[#0b2b16]/90 py-6 px-4 lg:px-8 border-t border-white/10 text-xs text-white/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p>© 2026 FreshBasket Nigeria. All rights reserved. Registered RC: 1782390.</p>
            <p className="text-[10px] text-white/40 mt-1">Grown with passion on Nigerian soils. Delivered with care to African homes.</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-white/40">Secure payments by:</span>
            <div className="flex gap-2.5 text-white/70 font-bold tracking-tight text-xs bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10">
              <span className="text-emerald-400">paystack</span>
              <span className="text-white/30">|</span>
              <span className="text-orange-400">flutterwave</span>
              <span className="text-white/30">|</span>
              <span className="text-white/60 font-medium">visa • mastercard</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
