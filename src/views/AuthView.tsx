import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { 
  sendVerificationEmailToCurrentUser, 
  triggerPasswordResetEmail, 
  signOutCurrentUser,
  signInWithGoogle,
  handleGoogleRedirectResult
} from '../lib/authService';
import { isProfileComplete, fetchUserProfileFromFirestore } from '../lib/userProfileService';
import { 
  checkStaffStatusFromServer, 
  setStaffSessionEmail, 
  resolveUserAdminRole,
  isImmutableSuperAdmin,
  SUPER_ADMIN_EMAIL 
} from '../lib/adminService';
import { UserProfileData } from '../types';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  LogIn, 
  UserPlus, 
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ShieldCheck, 
  Send, 
  RefreshCw, 
  ShieldAlert,
  UserCheck,
  Crown 
} from 'lucide-react';

interface AuthViewProps {
  currentUser: User | null;
  userProfile?: UserProfileData | null;
  onNavigate: (view: string) => void;
}

export default function AuthView({ currentUser, userProfile, onNavigate }: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'verify-pending'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Appointed Staff Portal Access State
  const [staffEmailInput, setStaffEmailInput] = useState('');
  const [staffLoginLoading, setStaffLoginLoading] = useState(false);
  const [staffLoginError, setStaffLoginError] = useState<string | null>(null);
  const [staffLoginSuccess, setStaffLoginSuccess] = useState<string | null>(null);

  // 30-second countdown timer for verification email resends
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Check for redirect result from Google OAuth redirect flow
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const result = await handleGoogleRedirectResult();
        if (!isMounted) return;
        if (result.success && result.user) {
          let profileData: UserProfileData | null = null;
          try {
            profileData = await fetchUserProfileFromFirestore(result.user.uid);
          } catch {
            const stored = localStorage.getItem(`freshbasket_profile_${result.user.uid}`);
            if (stored) {
              try { profileData = JSON.parse(stored); } catch {}
            }
          }

          const isComplete = isProfileComplete(profileData);
          if (!isComplete) {
            setSuccess('Successfully signed in with Google! Notice: Please complete your mandatory delivery profile to access your dashboard.');
            setTimeout(() => {
              if (isMounted) onNavigate('profile');
            }, 800);
          } else {
            setSuccess('Successfully signed in with Google! Opening dashboard...');
            setTimeout(() => {
              if (isMounted) onNavigate('dashboard');
            }, 800);
          }
        } else if (!result.success && result.message) {
          setError(result.message);
        }
      } catch (err) {
        console.warn('Redirect result check notice:', err);
      }
    };
    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, [onNavigate]);

  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  const handleVerificationConfirmed = async (verifiedUser: User) => {
    setSuccess('🎉 Your email address has been confirmed! Checking profile status...');
    setMode('signin');
    setPendingEmail('');

    let profileData: UserProfileData | null = null;
    try {
      profileData = await fetchUserProfileFromFirestore(verifiedUser.uid);
    } catch {
      const stored = localStorage.getItem(`freshbasket_profile_${verifiedUser.uid}`);
      if (stored) {
        try { profileData = JSON.parse(stored); } catch {}
      }
    }

    const isComplete = isProfileComplete(profileData);
    if (!isComplete) {
      // Existing or new user who has not filled their profile form! Mandated to do so!
      setSuccess('🎉 Email confirmed! Notice: As a member, you must complete your delivery profile before accessing your dashboard.');
      setTimeout(() => {
        onNavigate('profile');
      }, 900);
    } else {
      setSuccess('🎉 Email confirmed! Welcome back. Loading your dashboard...');
      setTimeout(() => {
        onNavigate('dashboard');
      }, 900);
    }
  };

  // Automatic background poller to detect email verification without rerouting or requiring page refreshes
  useEffect(() => {
    const isPending = mode === 'verify-pending' || (currentUser && !currentUser.emailVerified);
    if (!isPending) return;

    const interval = setInterval(async () => {
      if (auth.currentUser) {
        try {
          await auth.currentUser.reload();
          if (auth.currentUser.emailVerified) {
            clearInterval(interval);
            await handleVerificationConfirmed(auth.currentUser);
          }
        } catch {
          // ignore transient poll errors
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [mode, currentUser]);

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Root Super Admin instant verification for preview link operations
    if (isImmutableSuperAdmin(cleanEmail)) {
      setStaffSessionEmail(cleanEmail);
      setSuccess('Root Super Administrator verified! Opening store & Admin Center...');
      setTimeout(() => {
        onNavigate('home');
      }, 600);
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      
      // Reload user profile to ensure fresh emailVerified state
      await userCredential.user.reload();

      if (!userCredential.user.emailVerified) {
        // Do NOT sign out or reroute! Keep user on dedicated verification screen awaiting confirmation
        setPendingEmail(cleanEmail);
        setMode('verify-pending');
        setError(`Email Verification Required: Please check your inbox (${cleanEmail}) and click the verification link before logging in.`);
        setLoading(false);
        return;
      }

      // Check if existing user has completed their profile
      let profileData: UserProfileData | null = null;
      try {
        profileData = await fetchUserProfileFromFirestore(userCredential.user.uid);
      } catch {
        const stored = localStorage.getItem(`freshbasket_profile_${userCredential.user.uid}`);
        if (stored) {
          try {
            profileData = JSON.parse(stored);
          } catch {}
        }
      }

      const isComplete = isProfileComplete(profileData);

      if (isComplete) {
        setSuccess('Successfully signed in! Opening your dashboard...');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 800);
      } else {
        // Existing user who has NOT filled their profile form is mandated to do so
        setSuccess('Successfully signed in! Notice: As an existing member, you must complete your delivery profile before accessing your dashboard.');
        setTimeout(() => {
          onNavigate('profile');
        }, 800);
      }
    } catch (err: any) {
      console.warn('Sign-in notice:', err?.code || err);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password. Please verify your credentials or click Sign Up below if you do not have an account yet.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily disabled due to multiple failed attempts. Reset your password or try again later.';
      } else if (err.code === 'auth/quota-exceeded') {
        msg = 'Email service daily quota exceeded. Please try again later.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password.length > 12) {
      setError('For account security, password must not exceed 12 characters.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      if (displayName.trim() && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      }

      // Automatically trigger email verification for new accounts
      const verificationResult = await sendVerificationEmailToCurrentUser(userCredential.user);

      // Start 30s countdown timer for resends
      setResendCountdown(30);

      // Keep user in verify-pending mode on dedicated screen awaiting email confirmation
      setPendingEmail(cleanEmail);
      setMode('verify-pending');

      if (verificationResult.success) {
        setSuccess(`Account created! A verification link has been sent to ${cleanEmail}. Please check your inbox and verify your email to activate your account.`);
      } else {
        setSuccess('Account created successfully! Please check your email inbox to verify your account.');
      }

      // CRITICAL: NEVER automatically reroute to sign in until the email has been confirmed!
      // The user stays on this screen until the email link is clicked.
    } catch (err: any) {
      console.warn('Sign-up notice:', err?.code || err);
      let msg = 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'This email address is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    resetState();
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        if (result.user) {
          let profileData: UserProfileData | null = null;
          try {
            profileData = await fetchUserProfileFromFirestore(result.user.uid);
          } catch {
            const stored = localStorage.getItem(`freshbasket_profile_${result.user.uid}`);
            if (stored) {
              try { profileData = JSON.parse(stored); } catch {}
            }
          }

          const isComplete = isProfileComplete(profileData);
          if (isComplete) {
            setSuccess('Successfully signed in with Google! Opening dashboard...');
            setTimeout(() => {
              onNavigate('dashboard');
            }, 800);
          } else {
            // Existing user who has NOT filled their profile form is mandated to do so
            setSuccess('Successfully signed in with Google! Notice: Please complete your mandatory delivery profile to access your dashboard.');
            setTimeout(() => {
              onNavigate('profile');
            }, 800);
          }
        } else {
          setSuccess('Redirecting to Google sign in...');
        }
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      console.warn('Google Sign-In notice:', err?.code || err);
      setError('An error occurred during Google sign in. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address to receive password reset instructions.');
      return;
    }

    setLoading(true);
    const result = await triggerPasswordResetEmail(cleanEmail);
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (resendCountdown > 0) return;
    resetState();
    setLoading(true);
    const userToVerify = auth.currentUser || currentUser;
    const result = await sendVerificationEmailToCurrentUser(userToVerify);
    if (result.success) {
      setSuccess(result.message);
      setResendCountdown(30); // trigger 30s countdown
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleCheckVerificationStatus = async () => {
    const userToCheck = auth.currentUser || currentUser;
    if (!userToCheck) {
      setError('No active session found. Please sign in with your email and password to verify your link.');
      return;
    }
    setCheckingVerification(true);
    resetState();
    try {
      await userToCheck.reload();
      if (userToCheck.emailVerified) {
        await handleVerificationConfirmed(userToCheck);
      } else {
        setError('Your email is not verified yet. Please check your inbox (and spam folder) and click the confirmation link.');
      }
    } catch (err: any) {
      setError('Failed to check verification status. Please verify your internet connection and try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    resetState();
    setLoading(true);
    setMode('signin');
    setPendingEmail('');
    const result = await signOutCurrentUser();
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleStaffAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = staffEmailInput.trim().toLowerCase();
    if (!clean) return;

    setStaffLoginLoading(true);
    setStaffLoginError(null);
    setStaffLoginSuccess(null);

    try {
      const res = await checkStaffStatusFromServer(clean);
      if (res.isStaff && res.admin) {
        setStaffSessionEmail(clean);
        setStaffLoginSuccess(`✅ Authorized! Welcome ${res.admin.name || clean} (${res.admin.role.replace('_', ' ').toUpperCase()}). Activating your Admin Center...`);
        setTimeout(() => {
          onNavigate('home');
        }, 1200);
      } else {
        setStaffLoginError(`⚠️ "${clean}" is not currently in the authorized staff registry. Please ensure the Super Administrator (ciyacademy@gmail.com) has added this email.`);
      }
    } catch (err: any) {
      setStaffLoginError(`Connection error: ${err.message || 'Could not verify admin status.'}`);
    } finally {
      setStaffLoginLoading(false);
    }
  };

  const isCurrentAdmin = Boolean(
    resolveUserAdminRole(currentUser?.email || '')
  );

  // If user is currently unverified OR in verify-pending mode (and NOT an appointed admin):
  // Strictly display the verification notification and NEVER reroute to sign in until verified!
  if (!isCurrentAdmin && ((currentUser && !currentUser.emailVerified) || mode === 'verify-pending')) {
    const targetEmail = pendingEmail || currentUser?.email || email || 'your registered email';
    return (
      <div id="unverified-state-container" className="max-w-xl mx-auto px-4 py-16 font-sans text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 border border-amber-500/40 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-10 w-10 text-amber-400" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              Email Confirmation Required
            </span>
            <h2 className="text-2xl font-black text-white mt-3">Verify Your Email Address</h2>
            <p className="text-xs text-white/70 mt-2 max-w-md mx-auto leading-relaxed">
              We sent a verification link to <strong className="text-emerald-300 font-mono">{targetEmail}</strong>.
              You must confirm your email address via this link before gaining access to your dashboard.
            </p>
          </div>

          {/* Persistent security notification notice */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs space-y-2">
            <div className="flex items-start gap-2.5 text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-300">Confirmation Link Active</p>
                <p className="text-[11px] text-amber-100/80 leading-relaxed">
                  Please open your email inbox and click the verification link. If you do not see it, check your spam or promotions folder. This screen will automatically update and proceed once your confirmation is verified.
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-center justify-center gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Action Buttons - Strictly no direct dashboard bypass */}
          <div className="space-y-3 pt-2">
            <button
              id="btn-check-verification"
              onClick={handleCheckVerificationStatus}
              disabled={checkingVerification}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {checkingVerification ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 text-[#FACC15]" />
                  <span>I've Verified My Email (Check Status)</span>
                </>
              )}
            </button>

            <button
              id="btn-resend-verification"
              onClick={handleResendVerification}
              disabled={loading || resendCountdown > 0}
              className="w-full py-3 px-5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4 text-amber-400" />
              <span>
                {resendCountdown > 0 
                  ? `Resend Link in ${resendCountdown}s` 
                  : 'Resend Verification Link'}
              </span>
            </button>

            <button
              id="btn-signout-unverified"
              onClick={handleSignOut}
              className="w-full py-2.5 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Cancel & Use Different Account</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If user is currently signed in AND verified (or appointed admin)
  if (currentUser && (currentUser.emailVerified || isCurrentAdmin)) {
    return (
      <div id="verified-state-container" className="max-w-xl mx-auto px-4 py-16 font-sans text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 border border-white/15 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-[#16A34A]/20 border-2 border-[#16A34A] flex items-center justify-center text-[#FACC15]">
            <ShieldCheck className="h-10 w-10 text-[#16A34A]" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-[#FACC15] tracking-widest bg-[#16A34A]/20 px-3 py-1 rounded-full border border-white/10">
              Authenticated & Verified Session
            </span>
            <h2 className="text-2xl font-black text-white mt-3">Welcome Back!</h2>
            <p className="text-xs text-white/70 mt-1">You are currently signed in to your verified account.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-white/60">Display Name:</span>
              <span className="font-bold text-white">{currentUser.displayName || 'FreshBasket Member'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-white/60">Email Address:</span>
              <span className="font-mono text-emerald-300">{currentUser.email}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-white/60">Email Status:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Verified</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/60">Account Reference:</span>
              <span className="font-mono text-[10px] text-white/50">{currentUser.uid}</span>
            </div>
          </div>

          {/* Staff Badge for Appointed Admins */}
          {isCurrentAdmin && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Active FreshBasket Staff Member</span>
              </div>
              <p className="text-[11px] text-emerald-100/80 leading-relaxed">
                Your account is provisioned with administrative privileges. The Admin Center header button is active on your screen.
              </p>
            </div>
          )}

          {/* Profile Completion Callout for Incomplete Regular Customers */}
          {!isCurrentAdmin && !isProfileComplete(userProfile) && (
            <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-left text-xs space-y-2">
              <div className="flex items-start gap-2.5 text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-300">Mandatory Profile Completion Required</p>
                  <p className="text-[11px] text-amber-100/80 leading-relaxed">
                    As an existing member, you must complete your delivery address and contact details form before your personalized dashboard can be unlocked.
                  </p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              id="btn-goto-profile"
              onClick={() => onNavigate('profile')}
              className="flex-1 py-3 px-5 rounded-2xl bg-[#FACC15] hover:bg-yellow-400 text-black font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="h-4 w-4 text-black" />
              <span>{isProfileComplete(userProfile) ? 'View / Edit Profile' : 'Complete Profile'}</span>
            </button>
            <button
              id="btn-goto-dashboard"
              onClick={() => {
                if (!isCurrentAdmin && !isProfileComplete(userProfile)) {
                  onNavigate('profile');
                } else {
                  onNavigate('dashboard');
                }
              }}
              className={`flex-1 py-3 px-5 rounded-2xl font-bold text-xs shadow-lg transition cursor-pointer ${
                (isCurrentAdmin || isProfileComplete(userProfile))
                  ? 'bg-[#16A34A] hover:bg-[#15803d] text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 border border-white/10'
              }`}
            >
              {(isCurrentAdmin || isProfileComplete(userProfile)) ? 'Go to Dashboard' : 'Dashboard Locked (Fill Form)'}
            </button>
            <button
              id="btn-signout-verified"
              onClick={handleSignOut}
              className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-red-500/30 text-white/80 hover:text-white font-bold text-xs border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Primary Login / Register Form
  return (
    <div id="auth-portal-card" className="max-w-md mx-auto px-4 py-10 lg:py-14 font-sans text-white">
      {/* 1-Click Super Admin Access for Preview Link testing */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 bg-gradient-to-r from-amber-950/80 via-black/80 to-amber-950/80 border-2 border-amber-500/60 rounded-3xl p-4.5 backdrop-blur-xl shadow-2xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded font-mono border border-amber-500/40">
                  Super Admin Quick Login
                </span>
              </div>
              <h3 className="text-xs font-bold text-white mt-0.5">ciyacademy@gmail.com</h3>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-white/70 leading-relaxed">
          Log in with 1 click on this preview link to access the Admin Center, manage administrators, and test live real-time authorization sync.
        </p>

        <button
          id="btn-quick-login-superadmin"
          type="button"
          onClick={() => {
            setStaffSessionEmail(SUPER_ADMIN_EMAIL);
            setSuccess('Super Administrator verified! Loading fresh admin state...');
            setTimeout(() => {
              onNavigate('home');
            }, 400);
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer transform hover:scale-[1.01] active:scale-98"
        >
          <Crown className="h-4 w-4 text-stone-950" />
          <span>Instant Super Admin Login (ciyacademy@gmail.com)</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 border border-white/15 rounded-3xl p-6 lg:p-8 backdrop-blur-xl shadow-2xl space-y-6"
      >
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16A34A]/20 border border-[#16A34A]/30 text-[#FACC15] text-[11px] font-extrabold tracking-wide">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Secure Account Portal</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {mode === 'signin' && 'Account Sign In'}
            {mode === 'signup' && 'Create Your Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-white/60">
            {mode === 'signin' && 'Sign in with your Google account or email and password.'}
            {mode === 'signup' && 'Sign up with Google or your email to get started.'}
            {mode === 'forgot' && 'We will send a password reset link to your email.'}
          </p>
        </div>

        {/* Tab Navigation for Sign In / Sign Up */}
        {mode !== 'forgot' && (
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              id="tab-signin"
              onClick={() => { setMode('signin'); resetState(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signin'
                  ? 'bg-[#16A34A] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
            <button
              id="tab-signup"
              onClick={() => { setMode('signup'); resetState(); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                mode === 'signup'
                  ? 'bg-[#16A34A] text-white shadow'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Sign Up</span>
            </button>
          </div>
        )}

        {/* Feedback Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-2xl text-red-200 text-xs space-y-2"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>

              {/* Show switch to sign up / reset password buttons directly on error card */}
              {(error.includes('Invalid email or password') || error.includes('credentials')) && mode === 'signin' && (
                <div className="pt-2 border-t border-red-500/30 flex flex-wrap items-center justify-end gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); resetState(); }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="h-3 w-3" />
                    <span>Create New Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); resetState(); }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span>Forgot Password?</span>
                  </button>
                </div>
              )}

              {/* Show resend button directly on error card if verification is required */}
              {error.includes('Verification Required') && (
                <div className="pt-2 border-t border-red-500/30 flex justify-end">
                  <button
                    id="btn-error-resend-verification"
                    type="button"
                    onClick={handleResendVerification}
                    disabled={loading || resendCountdown > 0}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition"
                  >
                    <Send className="h-3 w-3 text-amber-300" />
                    <span>
                      {resendCountdown > 0 
                        ? `Resend in ${resendCountdown}s` 
                        : 'Resend Verification Link'}
                    </span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs flex items-start gap-2.5"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{success}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Sign In Button (Available on Sign In and Sign Up) */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <button
              id="btn-google-auth"
              type="button"
              onClick={handleGoogleAuth}
              disabled={googleLoading || loading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-bold text-xs shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 border border-zinc-200"
            >
              {googleLoading ? (
                <div className="h-4 w-4 border-2 border-zinc-400 border-t-zinc-900 rounded-full animate-spin" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>
                {mode === 'signin' ? 'Continue with Google' : 'Sign up with Google'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">
                or with email
              </span>
              <div className="flex-1 h-px bg-white/15" />
            </div>
          </div>
        )}

        {/* Password Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInWithPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white/80 block">Password</label>
                <button
                  id="btn-forgot-password-link"
                  type="button"
                  onClick={() => { setMode('forgot'); resetState(); }}
                  className="text-[11px] text-[#FACC15] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-signin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-12 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
                <button
                  id="btn-toggle-signin-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[10px] text-white/60 hover:text-white font-bold cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-signin"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In with Email</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Sign Up Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Full Name (Optional)</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-signup-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Yinka Olamide"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-signup-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-white/80 block">Password (6 – 12 characters)</label>
                <span className="text-[10px] text-white/40">Max 12 chars</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-signup-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  maxLength={12}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password (6-12 chars)"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-12 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
                <button
                  id="btn-toggle-signup-password"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[10px] text-white/60 hover:text-white font-bold cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              id="btn-submit-signup"
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Forgot Password Form */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Registered Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  id="input-forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
              </div>
            </div>

            <button
              id="btn-submit-forgot"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  <span>Send Password Reset Email</span>
                </>
              )}
            </button>

            <button
              id="btn-back-to-signin"
              type="button"
              onClick={() => { setMode('signin'); resetState(); }}
              className="w-full py-2 text-xs text-white/60 hover:text-white transition flex items-center justify-center gap-1 font-bold cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-white/10 space-y-1">
          <p className="text-[11px] text-white/50 font-medium">
            FreshBasket Secure Authentication • Encrypted Email & Password Protection
          </p>
        </div>
      </motion.div>

      {/* Dedicated Appointed Staff & Admin Portal Access Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-6 bg-gradient-to-br from-emerald-950/70 via-stone-900/80 to-black/80 border border-emerald-500/40 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Appointed Staff & Admin Access</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono border border-emerald-500/40 font-bold">
                Staff Only
              </span>
            </h3>
            <p className="text-[11px] text-white/70 leading-relaxed mt-0.5">
              Appointed by the Super Admin as a Manager, Supervisor, or Sales Rep? Enter your staff email below to activate your Admin Center instantly on this device.
            </p>
          </div>
        </div>

        <form onSubmit={handleStaffAccess} className="space-y-3">
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-emerald-400/60" />
            <input
              id="input-staff-portal-email"
              type="email"
              required
              value={staffEmailInput}
              onChange={(e) => {
                setStaffEmailInput(e.target.value);
                setStaffLoginError(null);
                setStaffLoginSuccess(null);
              }}
              placeholder="e.g. your appointed staff email"
              className="w-full bg-black/40 border border-emerald-500/30 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 font-mono transition"
            />
          </div>

          <AnimatePresence mode="wait">
            {staffLoginError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2"
              >
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{staffLoginError}</span>
              </motion.div>
            )}

            {staffLoginSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-start gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{staffLoginSuccess}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            id="btn-staff-portal-submit"
            type="submit"
            disabled={staffLoginLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {staffLoginLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-[#FACC15]" />
                <span>Verify Staff Role & Open Admin Center</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
