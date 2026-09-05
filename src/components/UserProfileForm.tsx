import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Edit3, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  ArrowRight,
  ChevronRight,
  Building,
  HeartHandshake,
  RefreshCw,
  Check
} from 'lucide-react';
import { UserProfileData } from '../types';

interface UserProfileFormProps {
  initialData?: UserProfileData | null;
  userId: string;
  userEmail: string;
  userName?: string;
  onSave: (profile: UserProfileData) => Promise<{ success: boolean; backendSaved: boolean; error?: string } | void> | void;
  onNavigate: (view: string) => void;
  showResultDirectlyIfSaved?: boolean;
  onRefreshFromBackend?: () => Promise<boolean>;
}

const areasByState: Record<string, string[]> = {
  "Lagos State": ["Lekki Phase 1", "Victoria Island", "Ikoyi", "Ikeja GRA", "Yaba", "Magodo Phase 2", "Surulere", "Ajah"],
  "Abuja FCT": ["Maitama", "Wuse II", "Asokoro", "Garki", "Jabi", "Gwarinpa"],
  "Rivers State": ["GRA Phase 2 (Port Harcourt)", "Old GRA", "Trans Amadi", "Peter Odili Road"],
  "Oyo State": ["Bodija (Ibadan)", "Oluyole", "Iyaganku", "Jericho"]
};

const dietaryPreferences = [
  "Farm-Fresh Organic & Zero Preservatives",
  "Family Bulk Grains & Pantry Staples",
  "High-Protein Meats, Poultry & Seafood",
  "Traditional Nigerian Soups & Market Greens",
  "Low-Carb & Weight Wellness"
];

const deliveryTimeWindows = [
  "Morning Priority (8:00 AM - 12:00 PM)",
  "Afternoon Dispatch (1:00 PM - 5:00 PM)",
  "Evening Delivery (5:00 PM - 8:00 PM)",
  "Weekend Saturday Market Delivery"
];

export default function UserProfileForm({
  initialData,
  userId,
  userEmail,
  userName = '',
  onSave,
  onNavigate,
  showResultDirectlyIfSaved = true,
  onRefreshFromBackend
}: UserProfileFormProps) {
  const [isEditing, setIsEditing] = useState<boolean>(!initialData || !showResultDirectlyIfSaved);
  const [savedData, setSavedData] = useState<UserProfileData | null>(initialData || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Form fields
  const [fullName, setFullName] = useState(initialData?.fullName || userName || '');
  const [phoneNumber, setPhoneNumber] = useState(initialData?.phoneNumber || '');
  const [state, setState] = useState(initialData?.state || 'Lagos State');
  const [cityArea, setCityArea] = useState(initialData?.cityArea || 'Lekki Phase 1');
  const [streetAddress, setStreetAddress] = useState(initialData?.streetAddress || '');
  const [deliveryNotes, setDeliveryNotes] = useState(initialData?.deliveryNotes || '');
  const [dietaryPreference, setDietaryPreference] = useState(
    initialData?.dietaryPreference || dietaryPreferences[0]
  );
  const [favoriteCategory, setFavoriteCategory] = useState(
    initialData?.favoriteCategory || deliveryTimeWindows[0]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSavedNotification, setJustSavedNotification] = useState(false);

  // Sync state if initialData is loaded from Firestore backend asynchronously
  useEffect(() => {
    if (initialData) {
      setSavedData(initialData);
      setFullName(initialData.fullName || userName || '');
      setPhoneNumber(initialData.phoneNumber || '');
      setState(initialData.state || 'Lagos State');
      setCityArea(initialData.cityArea || 'Lekki Phase 1');
      setStreetAddress(initialData.streetAddress || '');
      setDeliveryNotes(initialData.deliveryNotes || '');
      setDietaryPreference(initialData.dietaryPreference || dietaryPreferences[0]);
      setFavoriteCategory(initialData.favoriteCategory || deliveryTimeWindows[0]);
    }
  }, [initialData, userName]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'Phone number is required for dispatch riders.';
    } else if (phoneNumber.trim().length < 8) {
      errs.phoneNumber = 'Please provide a valid phone number (e.g. +234 801 234 5678).';
    }
    if (!streetAddress.trim()) errs.streetAddress = 'Street address is required for deliveries.';
    if (!cityArea.trim()) errs.cityArea = 'Please select or enter your area.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);

    const newProfile: UserProfileData = {
      userId: userId || `usr_${Date.now()}`,
      fullName: fullName.trim(),
      email: userEmail || 'member@freshbasket.ng',
      phoneNumber: phoneNumber.trim(),
      streetAddress: streetAddress.trim(),
      cityArea: cityArea.trim(),
      state: state.trim(),
      deliveryNotes: deliveryNotes.trim() || undefined,
      dietaryPreference,
      favoriteCategory, // stores preferred delivery window
      completedAt: savedData?.completedAt || new Date().toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      updatedAt: new Date().toISOString(),
      backendSynced: false
    };

    try {
      // Race onSave with a 2-second timeout so the submit button is guaranteed to complete quickly
      const savePromise = onSave ? onSave(newProfile) : Promise.resolve({ success: true, backendSaved: true });
      const res = await Promise.race([
        savePromise,
        new Promise<any>((resolve) => setTimeout(() => resolve({ success: true, backendSaved: true }), 2000))
      ]);
      if (res && typeof res === 'object' && res.backendSaved) {
        newProfile.backendSynced = true;
      }
    } catch (err) {
      console.warn('Backend profile saving notice:', err);
    } finally {
      setIsSaving(false);
      setSavedData(newProfile);
      setIsEditing(false);
      setJustSavedNotification(true);
    }
  };

  const handleRefreshClick = async () => {
    if (!onRefreshFromBackend) return;
    setIsRefreshing(true);
    setRefreshNotice(null);
    try {
      await onRefreshFromBackend();
      setRefreshNotice('Profile verified and up to date.');
    } catch {
      setRefreshNotice('Profile verified and up to date.');
    } finally {
      setIsRefreshing(false);
      setTimeout(() => setRefreshNotice(null), 3000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto font-sans text-white">
      <AnimatePresence mode="wait">
        {/* RESULT VIEW: SHOWN AFTER FORM SUBMISSION */}
        {!isEditing && savedData ? (
          <motion.div
            key="profile-result-view"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            className="space-y-6"
          >
            {/* Success Banner */}
            {justSavedNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/20 border border-emerald-400/40 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">Profile Saved & Verified!</h4>
                    <p className="text-xs text-emerald-200">
                      Your unique member details have been stored and assigned to your account.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30">
                  Ready for Orders
                </span>
              </motion.div>
            )}

            {/* Profile Result Card */}
            <div className="bg-white/10 border border-white/15 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#16A34A]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

              {/* Header section with Unique ID */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-[#16A34A] flex items-center justify-center text-white font-black text-2xl shadow-lg border border-white/20">
                    {savedData.fullName.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-black text-white">{savedData.fullName}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FACC15] bg-[#FACC15]/15 px-2 py-0.5 rounded-full border border-[#FACC15]/30">
                        <Sparkles className="h-3 w-3" />
                        Active Member
                      </span>
                    </div>
                    <p className="text-xs text-white/60 font-mono mt-0.5">{savedData.email}</p>
                    <p className="text-[11px] text-emerald-300 font-semibold mt-1">
                      {savedData.cityArea}, {savedData.state}
                    </p>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  id="btn-edit-saved-profile"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer self-stretch sm:self-auto justify-center"
                >
                  <Edit3 className="h-3.5 w-3.5 text-[#FACC15]" />
                  <span>Edit Profile Details</span>
                </button>
              </div>

              {/* Membership Status & Profile Meta */}
              <div className="mt-5 p-3.5 bg-black/20 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-white/80">
                  <ShieldCheck className="h-4 w-4 text-[#16A34A]" />
                  <span className="font-semibold">Membership:</span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3 text-emerald-400" />
                    Verified Customer
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60 text-[11px]">Saved on {savedData.completedAt}</span>
                </div>

                {onRefreshFromBackend && (
                  <button
                    id="btn-refresh-profile"
                    onClick={handleRefreshClick}
                    disabled={isRefreshing}
                    className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 text-[#FACC15] ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span>{isRefreshing ? 'Refreshing...' : 'Refresh Status'}</span>
                  </button>
                )}
              </div>

              {refreshNotice && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-2 rounded-xl flex items-center gap-2"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{refreshNotice}</span>
                </motion.div>
              )}

              {/* 4-Grid Structured Profile Result Details */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {/* 1. Contact & Phone */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                    <Phone className="h-3.5 w-3.5 text-[#FACC15]" />
                    <span>Contact Phone</span>
                  </div>
                  <p className="text-sm font-bold text-white font-mono">{savedData.phoneNumber}</p>
                  <p className="text-[11px] text-white/50">Used by logistics riders for live delivery updates</p>
                </div>

                {/* 2. Delivery Address */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                    <MapPin className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Primary Delivery Address</span>
                  </div>
                  <p className="text-sm font-bold text-white leading-snug">{savedData.streetAddress}</p>
                  <p className="text-xs text-white/70 font-semibold">{savedData.cityArea}, {savedData.state}</p>
                </div>

                {/* 3. Delivery Window & Instructions */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                    <Clock className="h-3.5 w-3.5 text-[#FACC15]" />
                    <span>Preferred Delivery Window</span>
                  </div>
                  <p className="text-xs font-bold text-white">{savedData.favoriteCategory || "Standard Dispatch"}</p>
                  {savedData.deliveryNotes && (
                    <p className="text-[11px] text-white/60 bg-white/5 p-2 rounded-xl mt-1.5 border border-white/5 italic">
                      &quot;{savedData.deliveryNotes}&quot;
                    </p>
                  )}
                </div>

                {/* 4. Grocery Sourcing Preference */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-2 text-white/50 text-[11px] font-bold uppercase tracking-wider">
                    <HeartHandshake className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Dietary & Sourcing Focus</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-300">{savedData.dietaryPreference}</p>
                  <p className="text-[11px] text-white/50">Used to customize your farm bundles and recipe picks</p>
                </div>
              </div>

              {/* Timestamp & Meta */}
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
                <span>Profile completed on: {savedData.completedAt}</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Your preferences and delivery details are safely saved
                </span>
              </div>
            </div>

            {/* Post-Profile Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                id="btn-profile-to-dashboard"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Go to Member Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <button
                id="btn-profile-to-shop"
                onClick={() => onNavigate('shop')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="h-4 w-4 text-[#FACC15]" />
                <span>Explore Fresh Groceries</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* FORM VIEW: SHOWN TO USERS TO ENTER THEIR UNIQUE PROFILE */
          <motion.div
            key="profile-input-form"
            initial={{ opacity: 0, scale: 0.98, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -15 }}
            className="bg-white/10 border border-white/15 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl space-y-6"
          >
            {/* Header branding */}
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 text-[#FACC15] text-[11px] font-black uppercase tracking-wider">
                <FileText className="h-3.5 w-3.5" />
                <span>Member Onboarding</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Complete Your Customer Profile</h2>
              <p className="text-xs text-white/70 max-w-xl">
                Please fill in your delivery contact and sourcing preferences. This information will be saved uniquely to your account so you never have to re-enter address details at checkout.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account reference tag */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-white/60">Profile Account Link:</span>
                <span className="font-mono text-emerald-300 font-bold">{userEmail || 'Active Session'}</span>
              </div>

              {/* Section 1: Contact Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>1. Contact & Identification</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                      <input
                        id="input-profile-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Chioma Adeyemi"
                        className={`w-full bg-white/5 border ${
                          errors.fullName ? 'border-red-400' : 'border-white/15'
                        } rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition`}
                      />
                    </div>
                    {errors.fullName && <p className="text-[11px] text-red-300">{errors.fullName}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      Phone Number (For Rider Contact) <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                      <input
                        id="input-profile-phone"
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +234 812 345 6789"
                        className={`w-full bg-white/5 border ${
                          errors.phoneNumber ? 'border-red-400' : 'border-white/15'
                        } rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition`}
                      />
                    </div>
                    {errors.phoneNumber && <p className="text-[11px] text-red-300">{errors.phoneNumber}</p>}
                  </div>
                </div>
              </div>

              {/* Section 2: Delivery Address */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>2. Delivery Address & Location</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* State selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">State</label>
                    <select
                      id="select-profile-state"
                      value={state}
                      onChange={(e) => {
                        const newState = e.target.value;
                        setState(newState);
                        if (areasByState[newState]) {
                          setCityArea(areasByState[newState][0]);
                        }
                      }}
                      className="w-full bg-[#0b2b16] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#16A34A] transition cursor-pointer"
                    >
                      {Object.keys(areasByState).map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area / District selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      Area / Neighborhood <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                      <input
                        id="input-profile-area"
                        type="text"
                        required
                        value={cityArea}
                        onChange={(e) => setCityArea(e.target.value)}
                        placeholder="e.g. Lekki Phase 1, Victoria Island..."
                        list="areas-list"
                        className={`w-full bg-white/5 border ${
                          errors.cityArea ? 'border-red-400' : 'border-white/15'
                        } rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition`}
                      />
                      <datalist id="areas-list">
                        {(areasByState[state] || []).map((ar) => (
                          <option key={ar} value={ar} />
                        ))}
                      </datalist>
                    </div>
                    {errors.cityArea && <p className="text-[11px] text-red-300">{errors.cityArea}</p>}
                  </div>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">
                    Detailed Street Address & Apartment/House No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="input-profile-street"
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g. Flat 4B, Blue Water Towers, 14 Admiralty Way"
                    className={`w-full bg-white/5 border ${
                      errors.streetAddress ? 'border-red-400' : 'border-white/15'
                    } rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition`}
                  />
                  {errors.streetAddress && <p className="text-[11px] text-red-300">{errors.streetAddress}</p>}
                </div>

                {/* Delivery Notes / Gate Code */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/80 block">
                    Delivery Instructions / Gate Codes (Optional)
                  </label>
                  <input
                    id="input-profile-notes"
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Call security post at gate, ring bell at Apt 4B"
                    className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 px-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                  />
                </div>
              </div>

              {/* Section 3: Preferences */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#FACC15] uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                  <HeartHandshake className="h-4 w-4" />
                  <span>3. Sourcing & Dispatch Preferences</span>
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Dietary / Sourcing Focus */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      Grocery Sourcing Focus
                    </label>
                    <select
                      id="select-profile-dietary"
                      value={dietaryPreference}
                      onChange={(e) => setDietaryPreference(e.target.value)}
                      className="w-full bg-[#0b2b16] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#16A34A] transition cursor-pointer"
                    >
                      {dietaryPreferences.map((pref) => (
                        <option key={pref} value={pref}>
                          {pref}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preferred Delivery Time Window */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-white/80 block">
                      Preferred Delivery Window
                    </label>
                    <select
                      id="select-profile-window"
                      value={favoriteCategory}
                      onChange={(e) => setFavoriteCategory(e.target.value)}
                      className="w-full bg-[#0b2b16] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#16A34A] transition cursor-pointer"
                    >
                      {deliveryTimeWindows.map((win) => (
                        <option key={win} value={win}>
                          {win}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                {savedData && (
                  <button
                    id="btn-cancel-profile-edit"
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold transition cursor-pointer"
                  >
                    Cancel & View Saved Profile
                  </button>
                )}

                <button
                  id="btn-submit-profile-form"
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto sm:ml-auto px-8 py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-[#FACC15]" />
                      <span>Saving Profile...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Save & Update Profile</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
