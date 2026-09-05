import { 
  sendEmailVerification, 
  sendPasswordResetEmail, 
  signOut,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User, 
  AuthError 
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Result structure returned by auth service functions.
 */
export interface AuthActionResult {
  success: boolean;
  message: string;
  code?: string;
  user?: User | null;
}

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Initiates Google sign-in using popup with automatic redirect fallback if popup fails or is blocked.
 */
export async function signInWithGoogle(): Promise<AuthActionResult> {
  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    return {
      success: true,
      message: 'Successfully signed in with Google!',
      user: result.user,
    };
  } catch (popupError: any) {
    console.warn('Google popup sign-in encountered an issue, attempting redirect fallback:', popupError);
    // If popup is blocked, cancelled, or fails in certain environments, fallback to redirect
    try {
      await signInWithRedirect(auth, googleAuthProvider);
      return {
        success: true,
        message: 'Redirecting to Google sign in...',
        user: null,
      };
    } catch (redirectError: any) {
      console.warn('Google redirect sign-in notice:', redirectError?.code || redirectError);
      return handleAuthError(redirectError, 'Failed to sign in with Google. Please try again.');
    }
  }
}

/**
 * Checks for and handles redirect result after a redirect-based Google sign in.
 */
export async function handleGoogleRedirectResult(): Promise<AuthActionResult> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      return {
        success: true,
        message: 'Successfully signed in with Google!',
        user: result.user,
      };
    }
    return {
      success: true,
      message: '',
      user: null,
    };
  } catch (error: unknown) {
    console.warn('getRedirectResult notice:', error);
    return handleAuthError(error, 'Google authentication redirect failed. Please try again.');
  }
}

/**
 * Sends an email verification link to the currently signed-in user.
 * 
 * @param currentUser - Optional User instance (defaults to auth.currentUser if omitted).
 * @returns Promise<AuthActionResult> indicating success or a friendly error message.
 * 
 * @example
 * ```ts
 * const result = await sendVerificationEmailToCurrentUser();
 * if (result.success) {
 *   console.log(result.message);
 * } else {
 *   console.error(result.message);
 * }
 * ```
 */
export async function sendVerificationEmailToCurrentUser(currentUser?: User | null): Promise<AuthActionResult> {
  const user = currentUser ?? auth.currentUser;

  // 1. Guard against no logged-in user
  if (!user) {
    return {
      success: false,
      message: 'No user is currently signed in. Please log in or sign up first before requesting email verification.',
      code: 'auth/no-current-user',
    };
  }

  // 2. Guard against already verified user
  if (user.emailVerified) {
    return {
      success: true,
      message: `Your email address (${user.email}) is already verified!`,
      code: 'auth/already-verified',
    };
  }

  // 3. Send verification email
  try {
    await sendEmailVerification(user);
    return {
      success: true,
      message: `Verification email sent to ${user.email}. Please check your inbox and click the link to verify your account.`,
    };
  } catch (error: unknown) {
    console.warn('sendEmailVerification notice:', error);
    return handleAuthError(error, 'Failed to send verification email.');
  }
}

/**
 * Triggers a password reset email for the given email address.
 * 
 * @param email - The user's registered email address.
 * @returns Promise<AuthActionResult> indicating success or a friendly error message.
 * 
 * @example
 * ```ts
 * const result = await triggerPasswordResetEmail('user@example.com');
 * if (result.success) {
 *   alert(result.message);
 * }
 * ```
 */
export async function triggerPasswordResetEmail(email: string): Promise<AuthActionResult> {
  const trimmedEmail = email.trim();

  // 1. Guard against empty email input
  if (!trimmedEmail) {
    return {
      success: false,
      message: 'Please enter your registered email address.',
      code: 'auth/missing-email',
    };
  }

  // 2. Simple email syntax validation check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return {
      success: false,
      message: 'Please enter a valid email address (e.g. name@example.com).',
      code: 'auth/invalid-email',
    };
  }

  // 3. Send password reset email
  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
    return {
      success: true,
      message: `Password reset link sent to ${trimmedEmail}. Check your inbox and spam folder.`,
    };
  } catch (error: unknown) {
    console.warn('sendPasswordResetEmail notice:', error);
    return handleAuthError(error, 'Could not send password reset email.');
  }
}

/**
 * Helper to translate raw Auth errors into clean, human-readable messages.
 */
function handleAuthError(error: unknown, fallbackMessage: string): AuthActionResult {
  const authErr = error as AuthError;
  const code = authErr?.code || 'auth/unknown';
  let message = fallbackMessage;

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      message = 'Invalid email or password. Please check your credentials and try again.';
      break;
    case 'auth/invalid-email':
      message = 'Please provide a valid email address.';
      break;
    case 'auth/too-many-requests':
      message = 'Access temporarily blocked due to unusually high traffic or failed attempts. Please try again later.';
      break;
    case 'auth/quota-exceeded':
      message = 'Email service daily limit reached. Please try again tomorrow or contact support.';
      break;
    case 'auth/unauthorized-domain':
      message = 'This domain is not authorized for Google sign-in. Please sign in using your email and password.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in window was closed before completing authentication. Please try again.';
      break;
    case 'auth/unauthorized-continue-uri':
      message = 'The current web domain is not authorized in authentication settings.';
      break;
    case 'auth/requires-recent-login':
      message = 'This operation requires recent authentication. Please log out and sign back in.';
      break;
    default:
      if (authErr?.message) {
        message = authErr.message;
      }
      break;
  }

  return {
    success: false,
    message,
    code,
  };
}

/**
 * Signs out the currently authenticated user from Firebase Auth.
 * 
 * @returns Promise<AuthActionResult> indicating success or failure message.
 */
export async function signOutCurrentUser(): Promise<AuthActionResult> {
  try {
    try {
      localStorage.removeItem('freshbasket_current_user_profile');
    } catch {
      // ignore
    }
    await signOut(auth);
    return {
      success: true,
      message: 'You have been signed out successfully.',
    };
  } catch (error: unknown) {
    console.warn('signOut notice:', error);
    return handleAuthError(error, 'Failed to sign out. Please try again.');
  }
}
