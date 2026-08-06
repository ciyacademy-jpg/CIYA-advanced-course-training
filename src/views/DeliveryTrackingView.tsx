import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Phone, CheckCircle2, Circle, Truck, Compass, ShieldCheck, MapPin, AlertCircle } from 'lucide-react';
import { Order } from '../types';

interface DeliveryTrackingViewProps {
  activeOrder: Order | null;
  onNavigate: (view: string) => void;
}

const stepsList = [
  { id: 'Received', label: 'Order Received', desc: 'Secure payment confirmed. Receipt sent to customer email.' },
  { id: 'Confirmed', label: 'Payment Confirmed', desc: 'Dispatched to farm picker schedules.' },
  { id: 'Picking', label: 'Picking Items', desc: 'Hand-sorting ripe tomatoes and fresh produce.' },
  { id: 'Inspection', label: 'Quality Inspection', desc: 'Testing for freshness, weights, and pests.' },
  { id: 'Packed', label: 'Packed & Insulated', desc: 'Loaded into standard cardboard boxes with thermal cooling sheets.' },
  { id: 'OutForDelivery', label: 'Out For Delivery', desc: 'Courier dispatched from Lekki Phase 1 sector.' },
  { id: 'Nearby', label: 'Rider Nearby', desc: 'Courier has reached Admiralty Way gates.' },
  { id: 'Delivered', label: 'Delivered', desc: 'OTP verification successful. Handed over.' }
];

export default function DeliveryTrackingView({ activeOrder, onNavigate }: DeliveryTrackingViewProps) {
  // Use local state so the user can interactively trigger / simulate order status steps
  const [currentStepIndex, setCurrentStepIndex] = useState(2); // Starts at 'Picking' for realism

  useEffect(() => {
    if (activeOrder) {
      // Map order status to starting index
      const mappedIdx = stepsList.findIndex(s => s.id === activeOrder.status);
      if (mappedIdx !== -1) {
        setCurrentStepIndex(mappedIdx);
      }
    }
  }, [activeOrder]);

  const simulateNextStep = () => {
    setCurrentStepIndex(prev => (prev < stepsList.length - 1 ? prev + 1 : prev));
  };

  const simulatePrevStep = () => {
    setCurrentStepIndex(prev => (prev > 0 ? prev - 1 : 0));
  };

  if (!activeOrder) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-16 text-center font-sans text-white">
        <div className="max-w-md mx-auto space-y-4 bg-white/10 border border-white/15 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          <span className="text-4xl block">🚚</span>
          <h2 className="text-lg font-bold text-white">No Active Orders to Track</h2>
          <p className="text-xs text-white/60 leading-relaxed">
            You don&apos;t have any active dispatches in transit right now. Visit your Customer Dashboard to view complete historical orders.
          </p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-2.5 px-5 text-xs shadow-lg transition cursor-pointer"
          >
            Go to Customer Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      
      {/* Title */}
      <div className="border-b border-white/10 pb-4 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-wider">Logistics Control</span>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans mt-1">
            Track Delivery: {activeOrder.id}
          </h2>
          <p className="text-xs text-white/60 mt-0.5">Est. Arrival: {activeOrder.estimatedArrival || "Same day delivery"}</p>
        </div>

        {/* Interactive Simulator Tools */}
        <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={simulatePrevStep}
            disabled={currentStepIndex === 0}
            className="rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold py-1.5 px-3 text-xs disabled:opacity-40 border border-white/5 transition cursor-pointer"
          >
            Previous
          </button>
          <span className="text-[10px] font-black uppercase text-white/40 self-center px-1">Simulator</span>
          <button
            onClick={simulateNextStep}
            disabled={currentStepIndex === stepsList.length - 1}
            className="rounded-xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold py-1.5 px-3 text-xs disabled:opacity-40 border border-white/5 transition cursor-pointer"
          >
            Advance Step
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Live status timeline */}
        <div className="lg:col-span-8 bg-white/10 border border-white/15 rounded-3xl p-5 lg:p-6 space-y-6 shadow-2xl backdrop-blur-xl">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2.5">
            Interactive Courier Timeline
          </h3>

          <div className="space-y-6 relative pl-8">
            {/* vertical timeline bar line */}
            <div className="absolute top-2 bottom-2 left-[15px] w-[2px] bg-white/10" />

            {stepsList.map((step, idx) => {
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const isLocked = idx > currentStepIndex;

              return (
                <div key={step.id} className="relative space-y-1">
                  
                  {/* Circle indicator point */}
                  <div className="absolute -left-[31px] top-0 bg-transparent p-0.5 rounded-full z-10">
                    {isPassed ? (
                      <CheckCircle2 className="h-5.5 w-5.5 text-[#16A34A] fill-[#0b2b16]" />
                    ) : isCurrent ? (
                      <div className="h-5.5 w-5.5 rounded-full bg-[#16A34A]/20 border-2 border-[#16A34A] flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-[#FACC15] animate-pulse" />
                      </div>
                    ) : (
                      <Circle className="h-5.5 w-5.5 text-white/20 fill-[#0b2b16]" />
                    )}
                  </div>

                  <h4 className={`text-xs font-bold font-sans leading-none ${isCurrent ? 'text-[#FACC15] text-sm font-black' : isLocked ? 'text-white/50' : 'text-white'}`}>
                    {step.label}
                  </h4>
                  <p className={`text-[11px] leading-relaxed ${isLocked ? 'text-white/20' : 'text-white/60'}`}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column - Rider & OTP summary panel */}
        <div className="lg:col-span-4 bg-white/10 border border-white/15 rounded-3xl p-5 shadow-2xl backdrop-blur-xl sticky top-28 space-y-5 text-white">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/10 pb-2.5">
            Logistics Verification
          </h3>

          {/* Rider details */}
          <div className="flex gap-3 items-center bg-white/5 p-3.5 rounded-2xl border border-white/10">
            <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg shadow-inner border border-white/10">
              🏍️
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-[10px] text-white/40 font-bold uppercase leading-none">Courier assigned</span>
              <h4 className="text-xs font-bold text-white mt-1">{activeOrder.riderName || "Tunde Alao"}</h4>
              <p className="text-[10px] text-white/60 font-semibold">{activeOrder.riderPhone || "+234 803 111 2222"}</p>
            </div>
            <a
              href={`tel:${activeOrder.riderPhone || "+2348031112222"}`}
              className="p-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 text-white transition shrink-0 shadow-md cursor-pointer"
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>

          {/* Secure OTP box */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center space-y-2">
            <span className="block text-[10px] uppercase font-black text-orange-400 tracking-widest">Doorstep Delivery OTP</span>
            <span className="block text-2xl font-black font-mono text-orange-400 tracking-widest leading-none my-1">
              {activeOrder.otp || "5492"}
            </span>
            <p className="text-[11px] text-white/70 leading-relaxed font-semibold">
              Provide this security code to our courier <b>Tunde Alao</b> when he arrives at Admiralty Way. This verifies successful delivery.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-start gap-2 text-[10px] text-white/50 leading-snug">
            <ShieldCheck className="h-5 w-5 text-[#16A34A] shrink-0" />
            <span>All our riders are medically audited, carry temperature-controlled insulation kits, and practice contactless delivery.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
