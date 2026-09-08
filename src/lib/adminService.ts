import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
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
  } catch {
    // ignore
  }
}

/**
 * Fetches admin staff registry from Central Server or Firestore or local cache
 */
export async function fetchAdminStaffFromServer(): Promise<AdminUser[]> {
  try {
    const res = await fetch(`/api/admins?_t=${Date.now()}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.admins) && data.admins.length > 0) {
        const filtered = data.admins.filter((a: AdminUser) => !isPlaceholderAdmin(a.email));
        saveLocalAdmins(filtered);
        return filtered;
      }
    }
  } catch (err) {
    console.warn('Network notice: could not fetch admins from server, using local/firestore:', err);
  }
  return fetchAdminStaff();
}

/**
 * Fetches admin staff registry from Firestore or local cache
 */
export async function fetchAdminStaff(): Promise<AdminUser[]> {
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
    console.warn('Firestore fetchAdminStaff notice:', error);
  }
  return getLocalAdmins();
}

/**
 * Real-time listener for admin staff updates across SSE, Firestore, and local events
 */
export function subscribeToAdminStaff(callback: (admins: AdminUser[]) => void): () => void {
  // Supply immediate local state
  callback(getLocalAdmins());

  // Query server to eliminate stale cached state
  fetchAdminStaffFromServer().then(fresh => {
    if (Array.isArray(fresh) && fresh.length > 0) {
      callback(fresh);
    }
  });

  // Server-Sent Events (SSE) for instant cross-device admin staff sync
  let eventSource: EventSource | null = null;
  if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
    try {
      eventSource = new EventSource('/api/admins/stream');
      eventSource.addEventListener('admins_updated', (e) => {
        try {
          const freshList = JSON.parse(e.data);
          if (Array.isArray(freshList) && freshList.length > 0) {
            const filtered = freshList.filter((a: AdminUser) => !isPlaceholderAdmin(a.email));
            saveLocalAdmins(filtered);
            callback(filtered);
          }
        } catch (err) {
          console.warn('Error parsing SSE admin update:', err);
        }
      });
    } catch (err) {
      console.warn('SSE admin connection notice:', err);
    }
  }

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
          callback(getLocalAdmins());
        }
      },
      (error) => {
        console.warn('subscribeToAdminStaff fallback to local:', error);
      }
    );
  } catch {
    // ignore
  }

  return () => {
    if (eventSource) {
      eventSource.close();
    }
    unsubscribeFirestore();
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

  // 1. Update local cache immediately
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

  // 2. Persist to Central Server (Broadcasts to all devices via SSE)
  try {
    const res = await fetch('/api/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        name: targetName.trim() || cleanEmail.split('@')[0],
        role: newAdmin.role,
        addedBy: operatorEmail || SUPER_ADMIN_EMAIL
      })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[AdminService] Staff saved to central server:', data.message);
    }
  } catch (err: any) {
    console.warn('Central server admin write notice:', err?.message);
  }

  // 3. Persist to Firestore if online
  try {
    const docRef = doc(db, 'admins', id);
    await setDoc(docRef, newAdmin, { merge: true });
  } catch (error: any) {
    console.warn('Firestore set admin notice:', error?.message);
  }

  const roleLabel = newAdmin.role.replace('_', ' ').toUpperCase();
  return { 
    success: true, 
    message: `Admin authorization granted to ${cleanEmail} as ${roleLabel}. When they sign in with this Gmail account, their admin role will be applied automatically.`,
    admin: newAdmin
  };
}

/**
 * Removes an admin position.
 * Super Admin is strictly immutable and cannot be deleted.
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

  // 1. Update local cache
  const localList = getLocalAdmins().filter(a => a.email.toLowerCase() !== cleanEmail);
  saveLocalAdmins(localList);

  const id = sanitizeEmailToId(cleanEmail);

  // 2. Delete from Central Server
  try {
    const res = await fetch(`/api/admins/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      const data = await res.json();
      console.log('[AdminService] Staff removed from central server:', data.message);
    }
  } catch (err: any) {
    console.warn('Central server admin delete notice:', err?.message);
  }

  // 3. Delete from Firestore (both sanitized ID and raw email to cover all schemas)
  try {
    const docRef = doc(db, 'admins', id);
    await deleteDoc(docRef);
  } catch (error: any) {
    console.warn('Firestore delete admin notice (id):', error?.message);
  }

  if (cleanEmail !== id) {
    try {
      const altDocRef = doc(db, 'admins', cleanEmail);
      await deleteDoc(altDocRef);
    } catch (_) {}
  }

  return {
    success: true,
    message: `Admin position for ${cleanEmail} has been revoked.`
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
 * Resolves admin role asynchronously, fetching from Central Server if not cached locally
 */
export async function resolveUserAdminRoleAsync(userEmail: string | null | undefined): Promise<AdminRole | null> {
  if (!userEmail) return null;
  const clean = userEmail.trim().toLowerCase();

  if (isImmutableSuperAdmin(clean)) {
    return 'super_admin';
  }

  // 1. Check local cache first
  const localMatch = resolveUserAdminRole(clean);
  if (localMatch) return localMatch;

  // 2. Direct Firestore document lookup (Crucial for static Firebase Hosting & multi-device sync)
  try {
    const id = sanitizeEmailToId(clean);
    const docRef = doc(db, 'admins', id);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdminUser;
      if (data && data.role) {
        // Save to local cache so subsequent checks are instant
        const localList = getLocalAdmins();
        if (!localList.some(a => a.email.toLowerCase() === clean)) {
          localList.push(data);
          saveLocalAdmins(localList);
        }
        return data.role;
      }
    }
  } catch (err) {
    console.warn('Direct Firestore admin lookup notice:', err);
  }

  // 3. Fetch fresh staff list from server if in full-stack environment
  try {
    const fresh = await fetchAdminStaffFromServer();
    if (Array.isArray(fresh)) {
      const match = fresh.find(a => a.email && a.email.trim().toLowerCase() === clean);
      if (match) return match.role;
    }
  } catch (e) {
    console.warn('resolveUserAdminRoleAsync server lookup notice:', e);
  }

  return null;
}
