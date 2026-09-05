import { motion } from 'motion/react';
import { User, ShieldCheck, ArrowLeft, ShoppingBag, Sparkles, Lock } from 'lucide-react';
import UserProfileForm from '../components/UserProfileForm';
import { UserProfileData } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { isProfileComplete } from '../lib/userProfileService';

interface ProfileViewProps {
  currentUser: FirebaseUser | null;
  userProfile: UserProfileData | null;
  onSaveProfile: (profile: UserProfileData) => Promise<{ success: boolean; backendSaved: boolean; error?: string } | void> | void;
  onNavigate: (view: string) => void;
  onRefreshProfile?: () => Promise<boolean>;
}

export default function ProfileView({
  currentUser,
  userProfile,
  onSaveProfile,
  onNavigate,
  onRefreshProfile
}: ProfileViewProps) {
  // Ensure profile strictly belongs to current authenticated user
  const isMatchingProfile = Boolean(currentUser && userProfile && userProfile.userId === currentUser.uid);
  const activeProfile = isMatchingProfile ? userProfile : null;
  const userId = currentUser?.uid || activeProfile?.userId || '';
  const userEmail = currentUser?.email || activeProfile?.email || '';
  const userName = activeProfile?.fullName || currentUser?.displayName || currentUser?.email?.split('@')[0] || '';
  const hasCompletedProfile = isProfileComplete(activeProfile);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-8 py-10 font-sans text-white">
      {/* Top Breadcrumb navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {hasCompletedProfile ? (
          <button
            id="btn-back-to-dashboard"
            onClick={() => onNavigate('dashboard')}
            className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Dashboard</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-200 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-400/20">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span>Step 1: Fill Form to Unlock Dashboard</span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="hidden sm:inline">
            {hasCompletedProfile ? 'Verified Member Profile' : 'Required Member Setup'}
          </span>
        </div>
      </div>

      {/* Mandatory Profile Setup Callout for new users */}
      {!hasCompletedProfile && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 to-[#0b2b16]/90 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-[#FACC15] shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Welcome to FreshBasket, {userName}!
              </h3>
              <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed max-w-xl">
                Please complete your delivery details below to activate your account. Once submitted, your personalized dashboard with live delivery tracking, customized bundles, and rewards will unlock immediately.
              </p>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 rounded-full bg-emerald-500/30 border border-emerald-400/30 text-[11px] font-bold text-emerald-200">
            Required Step
          </span>
        </motion.div>
      )}

      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 border border-white/15 rounded-3xl p-6 mb-8 backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        <div className="flex items-center gap-4 text-center sm:text-left">
          <div className="h-14 w-14 rounded-2xl bg-[#16A34A]/20 border border-[#16A34A] flex items-center justify-center text-[#FACC15] shrink-0">
            <User className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {hasCompletedProfile ? 'Your Customer Profile & Delivery Details' : 'Complete Your Member Profile'}
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Your contact details and delivery preferences are safely saved for faster checkout and fresh harvest deliveries.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('shop')}
          className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-bold text-[#FACC15] flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <ShoppingBag className="h-4 w-4 text-[#16A34A]" />
          <span>Browse Groceries</span>
        </button>
      </motion.div>

      {/* The Profile Form / Result Component */}
      <UserProfileForm
        initialData={activeProfile}
        userId={userId}
        userEmail={userEmail}
        userName={userName}
        onSave={async (newProf) => {
          const res = await onSaveProfile(newProf);
          // If this was new user setup, automatically redirect to their freshly unlocked dashboard
          if (!hasCompletedProfile) {
            setTimeout(() => {
              onNavigate('dashboard');
            }, 800);
          }
          return res;
        }}
        onNavigate={onNavigate}
        showResultDirectlyIfSaved={true}
        onRefreshFromBackend={onRefreshProfile}
      />
    </div>
  );
}

