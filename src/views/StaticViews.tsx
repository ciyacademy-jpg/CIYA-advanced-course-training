import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Landmark, Phone, Mail, MapPin, HelpCircle, FileText, ChevronRight, Check } from 'lucide-react';

interface StaticViewsProps {
  initialSection?: 'about' | 'contact' | 'faq' | 'policies';
}

export default function StaticViews({ initialSection = "about" }: StaticViewsProps) {
  const [activeSection, setActiveSection] = useState<'about' | 'contact' | 'faq' | 'policies'>(initialSection);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [submittedForm, setSubmittedForm] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedForm(true);
    setTimeout(() => {
      setContactForm({ name: "", email: "", message: "" });
      setSubmittedForm(false);
      alert("📬 Thank you! Your message has been sent to support@freshbasketng.com. Our customer care team will reply within 2 hours.");
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Sidebar switches and content area */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left selector menu */}
        <div className="lg:col-span-3 bg-white/10 border border-white/15 rounded-3xl p-4 space-y-1 shadow-2xl backdrop-blur-md">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2.5 px-3">
            Company Directory
          </h3>
          {[
            { id: "about", label: "About FreshBasket", icon: Landmark },
            { id: "contact", label: "Contact Customer Care", icon: Phone },
            { id: "faq", label: "Frequently Asked Questions", icon: HelpCircle },
            { id: "policies", label: "Corporate Policies", icon: FileText }
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id as any)}
              className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-xs font-bold transition text-left cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-[#16A34A]/20 border border-white/10 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <sec.icon className={`h-4.5 w-4.5 ${activeSection === sec.id ? 'text-[#FACC15]' : 'text-white/40'}`} />
                <span>{sec.label}</span>
              </div>
              <ChevronRight className={`h-4 w-4 ${activeSection === sec.id ? 'text-white' : 'text-white/20'}`} />
            </button>
          ))}
        </div>

        {/* Right content display card */}
        <div className="lg:col-span-9 bg-white/10 border border-white/15 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-xl min-h-[400px] text-white">
          
          {/* About us view */}
          {activeSection === 'about' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase font-bold text-[#FACC15]">Who We Are</span>
                <h3 className="text-sm font-bold text-white mt-1">About FreshBasket Nigeria</h3>
              </div>
              
              <div className="space-y-4 text-xs text-white/70 leading-relaxed font-semibold">
                <p>
                  FreshBasket Nigeria is Lagos&apos; leading direct-to-consumer digital grocery marketplace, dedicated to improving dietary health and sourcing transparency since 2024. Our operations bridge the gap between rural farmers and urban tables.
                </p>
                <p>
                  We partner directly with sustainable, chemical-free vegetable farms in the fertile hills of Jos, poultry breeders in Epe, and grain mills in Kebbi. By eliminating middlemen markups, we secure premium household foodstuffs for Lagos families while returning maximum revenue to the agricultural workforce.
                </p>

                <div className="grid sm:grid-cols-3 gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-2xl">🌱</span>
                    <h4 className="text-xs font-bold text-white">100% Organic</h4>
                    <p className="text-[10px] text-white/50">Cultivated in nutrient-dense organic topsoil.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-2xl">🚜</span>
                    <h4 className="text-xs font-bold text-white">Direct Sourced</h4>
                    <p className="text-[10px] text-white/50">Harvested within 6 hours of dispatch.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-1">
                    <span className="text-2xl">🏍️</span>
                    <h4 className="text-xs font-bold text-white">Cold Chain</h4>
                    <p className="text-[10px] text-white/50">Dispatched in custom insulated bags.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact view */}
          {activeSection === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase font-bold text-[#FACC15]">Get in touch</span>
                <h3 className="text-sm font-bold text-white mt-1">Contact Our Customer Care</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Coordinates & Office details */}
                <div className="space-y-4 text-xs text-white/70 font-semibold leading-relaxed">
                  <div className="flex gap-3 items-start">
                    <MapPin className="h-5 w-5 text-[#16A34A] shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">Lagos Head Office</h4>
                      <p className="text-white/60 mt-1">24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Phone className="h-5 w-5 text-[#16A34A] shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">Phone Logistics Dispatch</h4>
                      <p className="text-white/60 mt-1">+234 812 456 7812 • Toll-Free (9am - 8pm daily)</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <Mail className="h-5 w-5 text-[#16A34A] shrink-0" />
                    <div>
                      <h4 className="font-bold text-white">Email Inquiries</h4>
                      <p className="text-white/60 mt-1">support@freshbasketng.com • response within 2 hours</p>
                    </div>
                  </div>
                </div>

                {/* Email feedback Form */}
                <form onSubmit={handleContactSubmit} className="space-y-3.5 bg-white/5 border border-white/10 p-4 rounded-3xl shadow-inner">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase">Your Name</label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A] focus:bg-white/10 text-white placeholder-white/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A] focus:bg-white/10 text-white placeholder-white/30"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-white/40 uppercase">Message</label>
                    <textarea
                      required
                      rows={3}
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs focus:outline-none focus:border-[#16A34A] focus:bg-white/10 text-white placeholder-white/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 text-xs transition shadow-md cursor-pointer"
                  >
                    Send Secure Message
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* FAQ view */}
          {activeSection === 'faq' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase font-bold text-[#FACC15]">Common questions</span>
                <h3 className="text-sm font-bold text-white mt-1">Frequently Asked Questions</h3>
              </div>

              <div className="space-y-4">
                {[
                  { q: "Where does FreshBasket source their produce?", a: "We work directly with certified farm owners in Epe (Lagos), Jos, and Kebbi to source vegetables, fresh fish, and grains directly from harvests, bypass middlemen wholesale operations." },
                  { q: "What is your delivery timing in Lagos?", a: "We offer Express Same-Day delivery for orders placed before 11:00 AM. Orders placed later are dispatched the next morning via our temperature-controlled cold chain logistics riders." },
                  { q: "How do you guarantee 'stone-free' grains?", a: "All local rice varieties (e.g., Lake Rice, Ofada) go through 3 levels of modern pneumatic destoning machines and color-sorting in our clean packaging warehouses in Lekki." },
                  { q: "Can I schedule recurring weekly orders?", a: "Yes, you can configure Weekly or Bi-weekly automated produce baskets via our Subscription Savings portal to receive automated deliveries and save up to 15%." }
                ].map((faq, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1.5">
                    <h4 className="text-xs font-black text-white flex items-center gap-1">
                      <span>❓</span> {faq.q}
                    </h4>
                    <p className="text-xs text-white/60 leading-relaxed font-semibold pl-6">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policies view */}
          {activeSection === 'policies' && (
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-3">
                <span className="text-[10px] uppercase font-bold text-[#FACC15]">Legal Agreement disclaimers</span>
                <h3 className="text-sm font-bold text-white mt-1">Corporate Agreements & Policies</h3>
              </div>

              <div className="space-y-6 text-xs text-white/70 leading-relaxed font-semibold">
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">1. Freshness & Refund Policy</h4>
                  <p>
                    We operate a strict 100% Satisfaction Guarantee. If any item is damaged or falls below freshness metrics during doorstep inspection, we provide instant wallet credits or direct bank transfers with zero administrative friction.
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">2. Logistical Delivery Standards</h4>
                  <p>
                    Our riders require a secure 4-digit OTP code to confirm successful delivery. This code is visible in your Customer Dashboard. If you are unavailable, the rider will request verification from security desks.
                  </p>
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs mb-1.5">3. Secure Privacy Shield</h4>
                  <p>
                    We never sell or distribute your private address coordinates or contact details to third-party advertising companies. Payment card data is handled exclusively by PCI-DSS certified Paystack/Flutterwave gateways.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
