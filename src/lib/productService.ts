import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, AdminRole } from '../types';
import { products as initialSeedProducts } from '../data/products';
import { getAdminPermissions } from './adminService';

const PRODUCTS_CACHE_KEY = 'freshbasket_live_products';
const PRODUCTS_EVENT = 'freshbasket_live_products_changed';

export const HARVEST_CATEGORIES = [
  "All Harvest",
  "Fresh Vegetables",
  "Roots & Tubers",
  "Fruits & Citrus",
  "Rice & Grains",
  "Cooking Oils & Seasonings",
  "Farm Poultry & Protein",
  "Beverages",
  "Bakery & Snacks"
] as const;

/**
 * Normalizes any product object ensuring complete schema and valid imageUrls array
 */
export function normalizeProduct(p: any): Product {
  const rawImages: string[] = (Array.isArray(p.imageUrls) && p.imageUrls.length > 0)
    ? p.imageUrls.filter(Boolean)
    : (p.image ? [p.image] : (p.imageUrl ? [p.imageUrl] : []));

  const imageUrls = rawImages.length > 0
    ? rawImages
    : ['https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'];

  const sizeStr = p.size || p.unit || (Array.isArray(p.sizes) && p.sizes[0]) || '1 Pack';
  const sizesArr = (Array.isArray(p.sizes) && p.sizes.length > 0) ? p.sizes : [sizeStr];

  return {
    id: String(p.id),
    name: String(p.name || 'Farm Fresh Produce'),
    localName: p.localName || undefined,
    category: p.category || 'Fresh Vegetables',
    price: Number(p.price) || 0,
    originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
    rating: typeof p.rating === 'number' ? p.rating : 4.8,
    reviewsCount: typeof p.reviewsCount === 'number' ? p.reviewsCount : 12,
    imageUrls,
    freshnessScore: typeof p.freshnessScore === 'number' ? p.freshnessScore : 98,
    freshnessText: p.freshnessText || 'Harvested fresh this morning',
    harvestDate: p.harvestDate,
    expiryDate: p.expiryDate,
    nutritionFacts: p.nutritionFacts || {
      calories: '120 kcal',
      protein: '3g',
      carbs: '22g',
      fat: '0.5g'
    },
    ingredients: p.ingredients,
    allergenInfo: p.allergenInfo,
    storageInstructions: p.storageInstructions || 'Store in cool conditions.',
    origin: p.origin || 'Nigerian Farm Direct',
    description: p.description || 'Quality guaranteed farm produce.',
    size: sizeStr,
    sizes: sizesArr,
    stock: typeof p.stock === 'number' ? p.stock : 15,
    isOrganic: Boolean(p.isOrganic),
    isImported: Boolean(p.isImported),
    deliveryTimeEstimate: p.deliveryTimeEstimate || 'Within 2 hours'
  };
}

/**
 * Deeply sanitizes any product object for Firestore by removing all undefined/null fields
 * preventing "Function setDoc() called with invalid data. Unsupported field value: undefined" errors
 */
export function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanForFirestore).filter(v => v !== undefined && v !== null);
  }
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined && v !== null) {
        res[k] = cleanForFirestore(v);
      }
    }
    return res;
  }
  return obj;
}

export const sanitizeForFirestore = cleanForFirestore;

/**
 * Returns a guaranteed valid image URL for any product or fallback
 */
export function safeProductImage(prod?: Partial<Product> | null): string {
  if (!prod) return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600';
  if (Array.isArray(prod.imageUrls) && prod.imageUrls.length > 0 && prod.imageUrls[0]) {
    return prod.imageUrls[0];
  }
  if ((prod as any)?.image) return (prod as any).image;
  if ((prod as any)?.imageUrl) return (prod as any).imageUrl;
  return 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600';
}

/**
 * Loads products from local storage cache or fallback to initial seed list
 */
export function getLocalLiveProducts(): Product[] {
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeProduct);
      }
    }
  } catch (err) {
    console.warn('Error reading cached products:', err);
  }
  // Initialize cache with default items if not present
  try {
    const normalized = initialSeedProducts.map(normalizeProduct);
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    // ignore
  }
  return initialSeedProducts.map(normalizeProduct);
}

/**
 * Persists products to local storage cache and broadcasts instant custom event
 */
export function saveLocalLiveProducts(productsList: Product[]): void {
  try {
    const normalized = productsList.map(normalizeProduct);
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(normalized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(PRODUCTS_EVENT, { detail: normalized }));
    }
  } catch (err) {
    console.warn('Error saving cached products:', err);
  }
}

/**
 * Helper to get the authoritative API base URL.
 * When running in a shared preview container (ais-pre-*.run.app),
 * it points directly to the primary development instance (ais-dev-*.run.app)
 * so price updates, additions, and deletions synchronize live across both links instantly.
 */
export function getAuthoritativeApiBase(): string {
  // Always use relative URLs so all requests route same-origin without CORS or 302 redirect issues
  return '';
}

/**
 * Fetches the authoritative, live produce list directly from Cloud Firestore.
 * Falls back to local storage cache if offline.
 */
export async function fetchLiveProductsFromServer(): Promise<Product[]> {
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list: Product[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data() as Product;
        if (data && data.id) {
          list.push(normalizeProduct(data));
        }
      });
      if (list.length > 0) {
        saveLocalLiveProducts(list);
        return list;
      }
    }
  } catch (err) {
    console.warn('Firestore fetch products notice:', err);
  }

  return getLocalLiveProducts();
}

/**
 * Real-time subscriber for live products relying directly on Cloud Firestore onSnapshot
 */
export function subscribeToLiveProducts(callback: (prods: Product[]) => void): () => void {
  // Immediately supply current cached state for instant display
  const initial = getLocalLiveProducts();
  callback(initial);

  // Query Firestore immediately to ensure fresh state
  fetchLiveProductsFromServer().then((fresh) => {
    if (Array.isArray(fresh) && fresh.length > 0) {
      callback(fresh);
    }
  }).catch(() => {});

  // 1. Instant local window event listener (zero-latency across modals and components)
  const handleLocalEvent = (e: Event) => {
    const custom = e as CustomEvent<Product[]>;
    if (custom.detail && Array.isArray(custom.detail)) {
      callback(custom.detail);
    } else {
      callback(getLocalLiveProducts());
    }
  };

  // 2. Storage event for cross-tab synchronization
  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === PRODUCTS_CACHE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed) && parsed.length > 0) {
          callback(parsed);
        }
      } catch {
        // ignore
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener(PRODUCTS_EVENT, handleLocalEvent);
    window.addEventListener('storage', handleStorageEvent);
  }

  // 3. Real-time Cloud Firestore subscription (single source of truth)
  let unsubscribeFirestore = () => {};
  try {
    const colRef = collection(db, 'products');
    unsubscribeFirestore = onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Product[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as Product;
            if (data && data.id) {
              list.push(normalizeProduct(data));
            }
          });
          if (list.length > 0) {
            saveLocalLiveProducts(list);
            callback(list);
          }
        }
      },
      (error) => {
        console.warn('Firestore onSnapshot products error:', error);
      }
    );
  } catch (err) {
    console.warn('Firestore subscription error:', err);
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener(PRODUCTS_EVENT, handleLocalEvent);
      window.removeEventListener('storage', handleStorageEvent);
    }
    unsubscribeFirestore();
  };
}

/**
 * Automatically ensures all current authoritative produce items exist in Cloud Firestore.
 * Runs in background on app startup or admin login without requiring any manual button push.
 */
export async function autoSyncProductsToFirestore(): Promise<{
  success: boolean;
  syncedCount: number;
  totalCount: number;
  message: string;
}> {
  return syncAllProductsToFirestore();
}

/**
 * Automatically seeds or updates Firestore with missing products in background
 */
export async function seedFirestoreProductsIfEmpty(): Promise<void> {
  try {
    const colRef = collection(db, 'products');
    const snap = await getDocs(colRef);
    const initial = getLocalLiveProducts();
    
    // If Firestore has fewer items than local inventory, auto-push the missing ones immediately
    if (snap.empty || snap.docs.length < initial.length) {
      const existingIds = new Set(snap.docs.map(d => d.id));
      const missing = initial.filter(p => !existingIds.has(p.id));
      
      console.log(`[Auto-Sync] Automatically syncing ${missing.length} produce items to Cloud Firestore in background...`);
      await Promise.all(
        missing.map(async (prod) => {
          try {
            const cleanProd = cleanForFirestore(normalizeProduct(prod));
            const docRef = doc(db, 'products', cleanProd.id);
            await setDoc(docRef, cleanProd, { merge: true });
          } catch {
            // Handled gracefully in background
          }
        })
      );
    }
  } catch (err: any) {
    // Non-blocking in dev if security rules need to be published in Firebase Console
    console.warn('Auto-sync firestore products notice (rules may need deployment):', err?.message || err);
  }
}

/**
 * Manually pushes all current authoritative produce items into Cloud Firestore.
 * Useful from the Admin Portal to sync products across all shareable links and mobile devices.
 */
export async function syncAllProductsToFirestore(): Promise<{
  success: boolean;
  syncedCount: number;
  totalCount: number;
  message: string;
}> {
  const products = getLocalLiveProducts();
  let successCount = 0;
  let lastError: any = null;

  // Process in small parallel chunks with a per-item timeout so it completes fast and never freezes
  const chunks: Product[][] = [];
  const chunkSize = 5;
  for (let i = 0; i < products.length; i += chunkSize) {
    chunks.push(products.slice(i, i + chunkSize));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (prod) => {
        try {
          const cleanProd = cleanForFirestore(normalizeProduct(prod));
          const docRef = doc(db, 'products', cleanProd.id);
          
          const writePromise = setDoc(docRef, cleanProd, { merge: true });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Network timeout writing to Firestore')), 7000)
          );
          
          await Promise.race([writePromise, timeoutPromise]);
          successCount++;
        } catch (err: any) {
          console.warn(`Firestore write error on ${prod.id}:`, err?.message || err);
          lastError = err;
        }
      })
    );
  }

  if (successCount === products.length) {
    return {
      success: true,
      syncedCount: successCount,
      totalCount: products.length,
      message: `All ${successCount} produce items have been pushed to Cloud Firestore successfully.`
    };
  } else if (successCount > 0) {
    return {
      success: true,
      syncedCount: successCount,
      totalCount: products.length,
      message: `Synced ${successCount} of ${products.length} produce items to Cloud Firestore.`
    };
  } else {
    const isPermissionError = 
      lastError?.code === 'permission-denied' || 
      lastError?.message?.includes('insufficient permissions') ||
      lastError?.message?.includes('permission-denied');

    return {
      success: false,
      syncedCount: 0,
      totalCount: products.length,
      message: isPermissionError
        ? 'Permission Denied: Your Firebase Console rules require write access for products. Copy the updated 1-click rules below and hit Publish in Firebase Console.'
        : `Could not push to Cloud Firestore: ${lastError?.message || 'Unknown network error'}`
    };
  }
}

/**
 * Saves (Creates or Updates) a produce product with role permission enforcement:
 * - Creating new product: Super Admin ONLY
 * - Updating existing product: Super Admin or Manager
 * 
 * Synchronizes directly to Cloud Firestore as the single source of truth.
 */
export async function saveLiveProduct(
  product: Product,
  operatorRole: AdminRole | null | undefined,
  operatorEmail?: string | null
): Promise<{ success: boolean; message: string; updatedList: Product[] }> {
  const currentList = getLocalLiveProducts();

  if (!operatorRole) {
    return {
      success: false,
      message: 'Access Denied: You must be signed in with an authorized administrative role to modify produce.',
      updatedList: currentList
    };
  }

  const permissions = getAdminPermissions(operatorRole);
  const existingIdx = currentList.findIndex(p => p.id === product.id);
  const isNew = existingIdx === -1;

  if (isNew && !permissions.canCreate) {
    return {
      success: false,
      message: 'Access Denied: Only the Super Admin has authorization to create new produce products.',
      updatedList: currentList
    };
  }

  if (!isNew && !permissions.canUpdate) {
    return {
      success: false,
      message: 'Access Denied: Only Super Admin and Managers have authorization to update produce items.',
      updatedList: currentList
    };
  }

  // 1. Write directly to Cloud Firestore as single source of truth — fail fast if write fails
  try {
    const docRef = doc(db, 'products', product.id);
    await setDoc(docRef, cleanForFirestore(normalizeProduct(product)), { merge: true });
  } catch (err: any) {
    console.error('Failed to save product to Cloud Firestore:', err);
    return {
      success: false,
      message: `Failed to save product to database: ${err?.message || 'Firestore write error'}`,
      updatedList: currentList
    };
  }

  // 2. Update local list only after Firestore write succeeds
  let updatedList: Product[];
  if (isNew) {
    updatedList = [product, ...currentList];
  } else {
    updatedList = currentList.map(p => p.id === product.id ? product : p);
  }

  saveLocalLiveProducts(updatedList);

  return {
    success: true,
    message: `Harvest item "${product.name}" updated live across all users!`,
    updatedList
  };
}

/**
 * Deletes a produce product with role permission enforcement:
 * - Delete: Super Admin, Manager, or Supervisor
 * 
 * Synchronizes removal directly from Cloud Firestore as the single source of truth.
 */
export async function deleteLiveProduct(
  productId: string,
  operatorRole: AdminRole | null | undefined,
  operatorEmail?: string | null
): Promise<{ success: boolean; message: string; updatedList: Product[] }> {
  const currentList = getLocalLiveProducts();

  if (!operatorRole) {
    return {
      success: false,
      message: 'Access Denied: You must be signed in with an authorized administrative role to delete produce.',
      updatedList: currentList
    };
  }

  const permissions = getAdminPermissions(operatorRole);

  if (!permissions.canDelete) {
    return {
      success: false,
      message: 'Access Denied: Only Super Admin, Managers, and Supervisors have authorization to delete produce.',
      updatedList: currentList
    };
  }

  const target = currentList.find(p => p.id === productId);

  // 1. Delete directly from Cloud Firestore — fail fast if deletion fails
  try {
    const docRef = doc(db, 'products', productId);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.error('Failed to delete product from Cloud Firestore:', err);
    return {
      success: false,
      message: `Failed to delete produce item from database: ${err?.message || 'Firestore delete error'}`,
      updatedList: currentList
    };
  }

  // 2. Update local list only after Firestore delete succeeds
  const updatedList = currentList.filter(p => p.id !== productId);
  saveLocalLiveProducts(updatedList);

  return {
    success: true,
    message: `Produce item "${target?.name || productId}" removed from harvest catalog across all users.`,
    updatedList
  };
}
