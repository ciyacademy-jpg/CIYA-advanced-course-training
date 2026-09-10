import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { AdminRole, AdminUser, AdminRolePermissions } from '../types';

export const SUPER_ADMIN_EMAIL = 'ciyacademy@gmail.com';
export const ROOT_SUPER_ADMIN_EMAILS = ['ciyacademy@gmail.com', 'comwebdot@gmail.com'];

export const DEFAULT_ADMINS: AdminUser[] = [
  {
    id: 'ciyacademy_gmail_com',
    email: 'ciyacademy@gmail.com',
    name: 'Super Administrator',
    role: 'super_admin',
    addedBy: 'Root Authorization',
    addedAt: '2026-01-01T00:00:00.000Z',
    isImmutable: true
  }
];

export function sanitizeEmailToId(email: string): string {
  return email.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
}

export function isPlaceholderAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean.includes('freshbasket@gmail.com') ||
    clean === 'manager.freshbasket@gmail.com' ||
    clean === 'supervisor.freshbasket@gmail.com' ||
    clean === 'salesrep.freshbasket@gmail.com'
  );
}

export function isImmutableSuperAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === 'ciyacademy@gmail.com' || clean === 'comwebdot@gmail.com';
}

/**
 * Returns exact CRUD & staff management permissions for any role
 */
export function getAdminPermissions(role: AdminRole | null | undefined): AdminRolePermissions {
  switch (role) {
    case 'super_admin':
      return {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canManageAdmins: true
      };
    case 'manager':
      return {
        canCreate: false,
        canRead: true,
        canUpdate: true,
        canDelete: true,
        canManageAdmins: false
      };
    case 'supervisor':
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: true,
        canManageAdmins: false
      };
    case 'sales_rep':
      return {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canManageAdmins: false
      };
    default:
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canManageAdmins: false
      };
  }
}

/**
 * Loads cached admins from localStorage or defaults
 */
export function getLocalAdmins(): AdminUser[] {
  try {
    const raw = localStorage.getItem('freshbasket_admin_staff');
    if (raw) {
      const list: AdminUser[] = JSON.parse(raw);
      // Filter out any placeholder demo accounts
      const cleaned = list.filter(a => a && a.email && !isPlaceholderAdmin(a.email));
      const hasSuper = cleaned.some(a => isImmutableSuperAdmin(a.email));
      if (!hasSuper) {
        cleaned.unshift(DEFAULT_ADMINS[0]);
      }
      return cleaned;
    }
  } catch {
    // ignore
  }
  return DEFAULT_ADMINS;
}

export function saveLocalAdmins(admins: AdminUser[]): void {
  try {
    // Filter out placeholder admins and normalize Super Admin
    const cleaned = admins
      .filter(a => a && a.email && !isPlaceholderAdmin(a.email))
      .map(a => {
        if (isImmutableSuperAdmin(a.email)) {
          return { ...a, role: 'super_admin' as AdminRole, isImmutable: true };
        }
        return a;
      });
    if (!cleaned.some(a => isImmutableSuperAdmin(a.email))) {
      cleaned.unshift(DEFAULT_ADMINS[0]);
    }
    localStorage.setItem('freshbasket_admin_staff', JSON.stringify(cleaned));
    localStorage.setItem('freshbasket_admin_staff_ts', Date.now().toString());
  } catch {
    // ignore
  }
}

const STAFF_SESSION_KEY = 'freshbasket_staff_session_email';

export function getStaffSessionEmail(): string | null {
  try {
    return localStorage.getItem(STAFF_SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStaffSessionEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(STAFF_SESSION_KEY, email.trim().toLowerCase());
    } else {
      localStorage.removeItem(STAFF_SESSION_KEY);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('staff_session_changed', { detail: { email } }));
    }
  } catch {
    // ignore
  }
}

export async function checkStaffStatusFromServer(email: string): Promise<{ isStaff: boolean; admin?: AdminUser; message?: string }> {
  const clean = (email || '').trim().toLowerCase();
  if (!clean) return { isStaff: false, message: 'Invalid email' };
  
  if (isImmutableSuperAdmin(clean)) {
    return {
      isStaff: true,
      admin: {
        id: 'ciyacademy_gmail_com',
        email: SUPER_ADMIN_EMAIL,
        name: 'Super Administrator',
        role: 'super_admin',
        addedBy: 'Root',
        addedAt: '2026-01-01T00:00:00.000Z',
        isImmutable: true
      }
    };
  }

  // Direct Firestore query (single source of truth)
  try {
    const id = sanitizeEmailToId(clean);
    const docRef = doc(db, 'admins', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdminUser;
      if (data && data.email && !isPlaceholderAdmin(data.email)) {
        return { isStaff: true, admin: data };
      }
    }

    const colRef = collection(db, 'admins');
    const q = query(colRef, where('email', '==', clean));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const data = querySnap.docs[0].data() as AdminUser;
      if (data && data.email && !isPlaceholderAdmin(data.email)) {
        return { isStaff: true, admin: data };
      }
    }
  } catch (err) {
    console.warn('checkStaffStatusFromServer Firestore notice:', err);
  }

  // Fallback to local staff list cache only if Firestore is offline
  const localList = getLocalAdmins();
  const match = localList.find(a => a.email.toLowerCase() === clean);
  if (match) {
    return { isStaff: true, admin: match };
  }

  return { isStaff: false, message: 'Email not found in authorized admin directory' };
}

/**
 * Fetches admin staff registry directly from Cloud Firestore (single source of truth)
 */
export async function fetchAdminStaffFromServer(): Promise<AdminUser[]> {
  try {
    const colRef = collection(db, 'admins');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const firestoreAdmins: AdminUser[] = [];
      for (const d of snap.docs) {
        const data = d.data() as AdminUser;
        if (data && data.email && !isPlaceholderAdmin(data.email)) {
          firestoreAdmins.push(data);
        } else {
          // Permanently purge placeholder admin docs from Firestore
          deleteDoc(d.ref).catch(() => {});
        }
      }
      if (!firestoreAdmins.some(a => isImmutableSuperAdmin(a.email))) {
        firestoreAdmins.unshift(DEFAULT_ADMINS[0]);
      }
      saveLocalAdmins(firestoreAdmins);
      return firestoreAdmins;
    }
  } catch (error) {
    console.warn('fetchAdminStaffFromServer Firestore error:', error);
  }
  return getLocalAdmins();
}

/**
 * Fetches admin staff registry (delegates directly to Firestore)
 */
export async function fetchAdminStaff(): Promise<AdminUser[]> {
  return fetchAdminStaffFromServer();
}

/**
 * Real-time listener for admin staff updates relying directly on Cloud Firestore onSnapshot
 */
export function subscribeToAdminStaff(callback: (admins: AdminUser[]) => void): () => void {
  // Supply immediate local cache state for instant UI display
  callback(getLocalAdmins());

  // Direct Cloud Firestore onSnapshot listener for real-time synchronization
  let unsubscribeFirestore = () => {};
  try {
    const colRef = collection(db, 'admins');
    unsubscribeFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: AdminUser[] = [];
          snapshot.forEach(d => {
            const data = d.data() as AdminUser;
            if (data && data.email && !isPlaceholderAdmin(data.email)) {
              list.push(data);
            }
          });
          if (!list.some(a => isImmutableSuperAdmin(a.email))) {
            list.unshift(DEFAULT_ADMINS[0]);
          }
          saveLocalAdmins(list);
          callback(list);
        } else {
          const defaultList = [DEFAULT_ADMINS[0]];
          saveLocalAdmins(defaultList);
          callback(defaultList);
        }
      },
      (error) => {
        console.warn('subscribeToAdminStaff Firestore onSnapshot error:', error);
        callback(getLocalAdmins());
      }
    );
  } catch (err) {
    console.warn('subscribeToAdminStaff Firestore initialization notice:', err);
  }

  // Instant sync when user focuses or returns to tab
  const handleFocusOrVisible = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      fetchAdminStaffFromServer().then(fresh => {
        if (Array.isArray(fresh)) {
          callback(fresh);
        }
      }).catch(() => {});
    }
  };

  // Same-window local synchronization
  const handleLocalChange = () => {
    callback(getLocalAdmins());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('admin_staff_change', handleLocalChange);
    window.addEventListener('storage', handleLocalChange);
    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
  }

  return () => {
    unsubscribeFirestore();
    if (typeof window !== 'undefined') {
      window.removeEventListener('admin_staff_change', handleLocalChange);
      window.removeEventListener('storage', handleLocalChange);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    }
  };
}

/**
 * Adds or updates an admin staff position.
 * Strictly requires operator to have canManageAdmins (super_admin).
 * comwebdot@gmail.com is immutable and cannot be demoted.
 */
export async function addOrUpdateAdminStaff(
  targetEmail: string,
  targetName: string,
  targetRole: AdminRole,
  operatorEmail: string
): Promise<{ success: boolean; message: string; admin?: AdminUser }> {
  const cleanEmail = targetEmail.trim().toLowerCase();
  
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, message: 'Please provide a valid email address.' };
  }

  // Strictly enforce Gmail check if requested
  if (!cleanEmail.endsWith('@gmail.com') && !cleanEmail.endsWith('.ng') && !cleanEmail.includes('.')) {
    return { success: false, message: 'Please provide a valid Gmail address for admin authentication.' };
  }

  // Prevent demotion of root super admin
  if (isImmutableSuperAdmin(cleanEmail) && targetRole !== 'super_admin') {
    return { success: false, message: `${cleanEmail} is the immutable Super Admin and cannot be demoted.` };
  }

  const id = sanitizeEmailToId(cleanEmail);
  const now = new Date().toISOString();
  const isImmutable = isImmutableSuperAdmin(cleanEmail);

  const newAdmin: AdminUser = {
    id,
    email: cleanEmail,
    name: targetName.trim() || cleanEmail.split('@')[0],
    role: isImmutable ? 'super_admin' : targetRole,
    addedBy: operatorEmail || SUPER_ADMIN_EMAIL,
    addedAt: now,
    updatedAt: now,
    isImmutable
  };

  // 1. Write directly to Cloud Firestore as the single source of truth — fail fast if write fails
  try {
    const docRef = doc(db, 'admins', id);
    await setDoc(docRef, newAdmin, { merge: true });
  } catch (error: any) {
    console.error('Failed to save admin to Cloud Firestore:', error);
    return {
      success: false,
      message: `Failed to save admin to database: ${error?.message || 'Firestore write error'}`
    };
  }

  // 2. Update local cache only after successful Firestore write
  const localList = getLocalAdmins();
  const existingIdx = localList.findIndex(a => a.email.toLowerCase() === cleanEmail);
  if (existingIdx >= 0) {
    localList[existingIdx] = {
      ...localList[existingIdx],
      ...newAdmin,
      addedAt: localList[existingIdx].addedAt
    };
  } else {
    localList.push(newAdmin);
  }
  saveLocalAdmins(localList);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin_staff_change', { 
      detail: { type: 'upsert', admin: newAdmin, list: localList } 
    }));
  }

  const roleLabel = newAdmin.role === 'super_admin' ? 'Super Administrator' :
                    newAdmin.role === 'manager' ? 'Produce Manager' :
                    newAdmin.role === 'supervisor' ? 'Quality Supervisor' : 'Sales Representative';

  return { 
    success: true, 
    message: `Admin authorization granted to ${cleanEmail} as ${roleLabel}. Admin privileges have been applied immediately.`,
    admin: newAdmin
  };
}

/**
 * Removes an admin position.
 * Super Admin is strictly immutable and cannot be deleted.
 * Directly writes deletion to Cloud Firestore as single source of truth.
 */
export async function deleteAdminStaff(
  targetEmail: string,
  operatorEmail: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = targetEmail.trim().toLowerCase();

  // Root Super Admin is immutable
  if (isImmutableSuperAdmin(cleanEmail)) {
    return { 
      success: false, 
      message: `Access Denied: ${cleanEmail} is the immutable Super Admin and cannot be removed.` 
    };
  }

  const id = sanitizeEmailToId(cleanEmail);

  // 1. Delete from Cloud Firestore — fail fast if deletion fails
  try {
    const docRef = doc(db, 'admins', id);
    await deleteDoc(docRef);

    if (cleanEmail !== id) {
      try {
        const altDocRef = doc(db, 'admins', cleanEmail);
        await deleteDoc(altDocRef);
      } catch (_) {}
    }

    try {
      const colRef = collection(db, 'admins');
      const q = query(colRef, where('email', '==', cleanEmail));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
    } catch (_) {}
  } catch (error: any) {
    console.error('Failed to revoke admin in Cloud Firestore:', error);
    return {
      success: false,
      message: `Failed to revoke admin in database: ${error?.message || 'Firestore delete error'}`
    };
  }

  // 2. Update local cache only after successful Firestore delete
  const localList = getLocalAdmins().filter(a => a.email.toLowerCase() !== cleanEmail);
  saveLocalAdmins(localList);

  // If the deleted admin was active in this session, clear it immediately
  if (getStaffSessionEmail()?.toLowerCase() === cleanEmail) {
    setStaffSessionEmail(null);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin_staff_change', { 
      detail: { type: 'delete', email: cleanEmail, list: localList } 
    }));
  }

  return {
    success: true,
    message: `Admin position for ${cleanEmail} has been revoked across all systems.`
  };
}

/**
 * Resolves the admin role for an authenticated user synchronously from local state or supplied list
 */
export function resolveUserAdminRole(
  userEmail: string | null | undefined, 
  staffList?: AdminUser[]
): AdminRole | null {
  if (!userEmail) return null;
  const clean = userEmail.trim().toLowerCase();

  // Super Admins always have full rights
  if (isImmutableSuperAdmin(clean)) {
    return 'super_admin';
  }

  const list = staffList || getLocalAdmins();
  const match = list.find(a => a.email && a.email.trim().toLowerCase() === clean);
  return match ? match.role : null;
}

/**
 * Resolves admin role asynchronously with Cloud Firestore as the authoritative live source
 */
export async function resolveUserAdminRoleAsync(userEmail: string | null | undefined): Promise<AdminRole | null> {
  if (!userEmail) return null;
  const clean = userEmail.trim().toLowerCase();

  if (isImmutableSuperAdmin(clean)) {
    return 'super_admin';
  }

  // 1. Direct Cloud Firestore lookup (authoritative live database across all sessions)
  try {
    const id = sanitizeEmailToId(clean);
    const docRef = doc(db, 'admins', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdminUser;
      if (data && data.role) {
        return data.role;
      }
    }

    const colRef = collection(db, 'admins');
    const q = query(colRef, where('email', '==', clean));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      const data = querySnap.docs[0].data() as AdminUser;
      if (data && data.role) {
        return data.role;
      }
    }

    // Found no admin record in Firestore
    return null;
  } catch (err) {
    console.warn('Direct Firestore admin lookup notice:', err);
  }

  // 2. Fallback: Local cache check only if Firestore is offline
  const localMatch = resolveUserAdminRole(clean);
  if (localMatch) return localMatch;

  return null;
}
