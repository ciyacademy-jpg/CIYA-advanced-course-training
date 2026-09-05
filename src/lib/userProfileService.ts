import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, auth, checkFirestoreHealth } from './firebase';
import { UserProfileData } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('[UserProfileService] Firestore sync notice:', errInfo.error);
  throw new Error(errInfo.error);
}

/**
 * Helper to race a promise with a timeout to prevent UI hangs
 */
function promiseWithTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallbackValue);
      }
    }, ms);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallbackValue);
        }
      });
  });
}

/**
 * Saves or updates a user profile in Firestore at /users/{userId}
 * Also synchronizes local cache for offline resiliency.
 */
export async function saveUserProfileToFirestore(
  profile: UserProfileData
): Promise<{ success: boolean; error?: string; errorCode?: string; backendSaved: boolean; health?: any }> {
  // If the user is currently signed in, always use their authenticated UID for strict rule compliance
  const targetUserId = auth.currentUser ? auth.currentUser.uid : (profile.userId || 'local_user');

  const path = `users/${targetUserId}`;
  const nowIso = new Date().toISOString();

  // Clean payload conforming to schema
  const payload: UserProfileData = {
    userId: targetUserId,
    fullName: profile.fullName.trim(),
    email: profile.email.trim(),
    phoneNumber: profile.phoneNumber.trim(),
    streetAddress: profile.streetAddress.trim(),
    cityArea: profile.cityArea.trim(),
    state: profile.state.trim(),
    deliveryNotes: profile.deliveryNotes?.trim() || '',
    dietaryPreference: profile.dietaryPreference || 'Farm-Fresh Organic & Zero Preservatives',
    favoriteCategory: profile.favoriteCategory || 'Morning Priority (8:00 AM - 12:00 PM)',
    completedAt: profile.completedAt || new Date().toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    updatedAt: nowIso,
  };

  // Always update local cache strictly scoped to this user
  try {
    localStorage.setItem(`freshbasket_profile_${targetUserId}`, JSON.stringify(payload));
    // Clean up any stale unkeyed cache to prevent profile pollution across accounts
    localStorage.removeItem('freshbasket_current_user_profile');
  } catch {
    // ignore local storage quota exceptions
  }

  // Quick Firestore availability probe
  const health = await checkFirestoreHealth();

  // If user is authenticated in Firebase and database is active
  if (auth.currentUser) {
    if (!health.available && health.code === 'NOT_FOUND') {
      return {
        success: true,
        backendSaved: false,
        health,
        errorCode: 'NOT_FOUND',
        error: `Database '${health.databaseId}' was not found in project 'ciya-advanced-course-training'.`
      };
    }

    try {
      const userDocRef = doc(db, 'users', targetUserId);
      let capturedError: any = null;

      // Initiate setDoc with Firestore
      const writePromise = setDoc(userDocRef, payload, { merge: true })
        .then(() => true)
        .catch((err) => {
          console.warn('Firestore setDoc returned error:', err);
          capturedError = err;
          return false;
        });

      // 2.5-second timeout so the UI finishes quickly
      const synced = await promiseWithTimeout(writePromise, 2500, false);

      if (synced) {
        return { 
          success: true, 
          backendSaved: true,
          health,
          error: undefined
        };
      }

      if (capturedError) {
        if (capturedError.code === 'permission-denied') {
          return {
            success: true,
            backendSaved: false,
            health,
            errorCode: 'permission-denied',
            error: 'Permission denied: Cloud Firestore security rules blocked the write. Please check the "Security" tab in your Firebase Console for database "default".'
          };
        }
        return {
          success: true,
          backendSaved: false,
          health,
          errorCode: capturedError.code,
          error: capturedError.message || 'Saved locally; backend cloud write pending.'
        };
      }

      return { 
        success: true, 
        backendSaved: false,
        health,
        error: 'Saved locally. Background cloud synchronization in progress.'
      };
    } catch (error: any) {
      console.warn('Backend save to Firestore encountered an issue:', error);
      return { 
        success: true, 
        backendSaved: false, 
        health,
        errorCode: error?.code,
        error: error?.message || 'Saved to local secure store.' 
      };
    }
  }

  // If not signed into Firebase Auth yet (e.g. guest or local session), safely saved locally
  return { 
    success: true, 
    backendSaved: false, 
    health,
    errorCode: 'UNAUTHENTICATED',
    error: 'Signed in locally. Please sign in with your account to upload directly to Cloud Firestore.' 
  };
}

/**
 * Retrieves a user profile from Firestore at /users/{userId}
 * Falls back to local storage if document doesn't exist yet or if offline.
 */
export async function fetchUserProfileFromFirestore(
  userId: string
): Promise<UserProfileData | null> {
  if (!userId) return null;

  const path = `users/${userId}`;

  // Try fetching from Firestore first if user is logged into Firebase
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const userDocRef = doc(db, 'users', userId);
      // Race with 3.5 second timeout to prevent backend connection delays
      const docSnapPromise = getDoc(userDocRef);
      const docSnap = await promiseWithTimeout(docSnapPromise, 3500, null);
      if (docSnap && docSnap.exists()) {
        const data = docSnap.data() as UserProfileData;
        // Update local cache strictly for this user
        try {
          localStorage.setItem(`freshbasket_profile_${userId}`, JSON.stringify(data));
          localStorage.removeItem('freshbasket_current_user_profile');
        } catch {
          // ignore
        }
        return data;
      }
    } catch (error: any) {
      console.warn('Firestore fetch profile note:', error?.message);
    }
  }

  // Fallback to local storage cache strictly scoped to this userId
  try {
    const cached = localStorage.getItem(`freshbasket_profile_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.userId === userId) return parsed;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Real-time listener for user profile updates
 */
export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfileData | null) => void
): () => void {
  if (!userId || !auth.currentUser || auth.currentUser.uid !== userId) {
    // Offline / unauthenticated subscriber
    return () => {};
  }

  const path = `users/${userId}`;
  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as UserProfileData;
        try {
          localStorage.setItem(`freshbasket_profile_${userId}`, JSON.stringify(data));
          localStorage.removeItem('freshbasket_current_user_profile');
        } catch {
          // ignore
        }
        onUpdate(data);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        console.warn('Profile listener notice:', e);
      }
    }
  );

  return unsubscribe;
}

/**
 * Checks whether a user profile is completed with all required fields
 */
export function isProfileComplete(profile: UserProfileData | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.fullName &&
    profile.fullName.trim().length > 0 &&
    profile.phoneNumber &&
    profile.phoneNumber.trim().length > 0 &&
    profile.streetAddress &&
    profile.streetAddress.trim().length > 0 &&
    profile.cityArea &&
    profile.cityArea.trim().length > 0 &&
    profile.state &&
    profile.state.trim().length > 0
  );
}
