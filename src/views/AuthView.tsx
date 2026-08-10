import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  User 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { sendVerificationEmailToCurrentUser, triggerPasswordResetEmail, signOutCurrentUser } from '../lib/authService';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, KeyRound, LogOut, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Send, RefreshCw, ShieldAlert } from 'lucide-react';

interface AuthViewProps {
  currentUser: User | null;
  onNavigate: (view: string) => void;
}

export default function AuthView({ currentUser, onNavigate }: AuthViewProps) {
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 30-second countdown timer for verification email resends
  const [resendCountdown, setResendCountdown] = useState<number>(0);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const resetState = () => {
    setError(null);
    setSuccess(null);
  };

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Reload user profile to ensure fresh emailVerified state
      await userCredential.user.reload();

      if (!userCredential.user.emailVerified) {
        // Sign out immediately so unverified user cannot access protected views
        await signOutCurrentUser();
        setError(`Email Verification Required: Please check your inbox (${email}) and click the verification link before logging in.`);
        setLoading(false);
        return;
      }

      setSuccess('Successfully signed in!');
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('Auth Error:', err);
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
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

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName.trim() && userCredential.user) {
        await updateProfile(userCredential.user, { displayName: displayName.trim() });
      }

      // Automatically trigger email verification for new accounts
      const verificationResult = await sendVerificationEmailToCurrentUser(userCredential.user);

      // Start 30s countdown timer for resends
      setResendCountdown(30);

      // Sign out new user until they click verification link
      await signOutCurrentUser();

      if (verificationResult.success) {
        setSuccess(`Account created! A verification link has been sent to ${email}. Please check your inbox and verify your email before logging in.`);
      } else {
        setSuccess('Account created successfully! Please check your email inbox to verify your account.');
      }

      // Switch to sign in view
      setTimeout(() => {
        setMode('signin');
      }, 2000);
    } catch (err: any) {
      console.error('Auth Sign Up Error:', err);
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();

    setLoading(true);
    const result = await triggerPasswordResetEmail(email);
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
    const result = await sendVerificationEmailToCurrentUser(currentUser);
    if (result.success) {
      setSuccess(result.message);
      setResendCountdown(30); // trigger 30s countdown
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleCheckVerificationStatus = async () => {
    if (!currentUser) return;
    setCheckingVerification(true);
    resetState();
    try {
      await currentUser.reload();
      if (auth.currentUser?.emailVerified) {
        setSuccess('🎉 Your email address is verified! Redirecting to your dashboard...');
        setTimeout(() => {
          onNavigate('dashboard');
        }, 1200);
      } else {
        setError('Your email is not verified yet. Please check your inbox (and spam folder) and click the link.');
      }
    } catch (err: any) {
      setError('Failed to check verification status. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleSignOut = async () => {
    resetState();
    setLoading(true);
    const result = await signOutCurrentUser();
    if (result.success) {
      setSuccess(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  // If user is currently signed in but NOT verified
  if (currentUser && !currentUser.emailVerified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 font-sans text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center space-y-6"
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400">
            <ShieldAlert className="h-10 w-10 text-amber-400" />
          </div>

          <div>
            <span className="text-[10px] font-black uppercase text-amber-300 tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              Email Verification Required
            </span>
            <h2 className="text-2xl font-black text-white mt-3">Verify Your Email Address</h2>
            <p className="text-xs text-white/70 mt-2 max-w-md mx-auto leading-relaxed">
              We sent a verification email to <strong className="text-emerald-300 font-mono">{currentUser.email}</strong>.
              You must verify your email address before gaining access to your dashboard.
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left text-xs space-y-2">
            <div className="flex items-start gap-2.5 text-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Please check your email inbox and click the verification link. If you don't see it, check your spam or junk folder.
              </span>
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

          {/* Verification Action Buttons - NO DASHBOARD REDIRECT BUTTON PER SPEC */}
          <div className="space-y-3 pt-2">
            <button
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
              onClick={handleSignOut}
              className="w-full py-2.5 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // If user is currently signed in AND verified
  if (currentUser && currentUser.emailVerified) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 font-sans text-white">
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

          {success && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex-1 py-3 px-5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition cursor-pointer"
            >
              Go to Account Dashboard
            </button>
            <button
              onClick={handleSignOut}
              className="py-3 px-5 rounded-2xl bg-red-600/80 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
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
    <div className="max-w-md mx-auto px-4 py-12 lg:py-16 font-sans text-white">
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
            {mode === 'signin' && 'Sign in using your registered email address and password.'}
            {mode === 'signup' && 'Sign up with your email and password for express grocery ordering.'}
            {mode === 'forgot' && 'We will send a password reset link to your email.'}
          </p>
        </div>

        {/* Tab Navigation for Sign In / Sign Up */}
        {mode !== 'forgot' && (
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
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

              {/* Show resend button directly on error card if verification is required */}
              {error.includes('Verification Required') && (
                <div className="pt-2 border-t border-red-500/30 flex justify-end">
                  <button
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

        {/* Password Sign In Form */}
        {mode === 'signin' && (
          <form onSubmit={handleSignInWithPassword} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-white/80 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
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
                  type="button"
                  onClick={() => { setMode('forgot'); resetState(); }}
                  className="text-[11px] text-[#FACC15] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-12 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[10px] text-white/60 hover:text-white font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-[#16A34A] hover:bg-[#15803d] text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
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
              <label className="text-xs font-bold text-white/80 block">Password (At least 6 characters)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-2.5 pl-10 pr-12 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#16A34A] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-2.5 text-[10px] text-white/60 hover:text-white font-bold"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
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
    </div>
  );
}
