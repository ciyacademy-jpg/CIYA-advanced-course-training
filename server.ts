import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { products as initialProducts } from './src/data/products';
import { DEFAULT_ADMINS, SUPER_ADMIN_EMAIL } from './src/lib/adminService';
import { Product, AdminUser } from './src/types';

const app = express();
const PORT = 3000;

// Enable CORS so the shareable preview container and all client environments can sync in real-time
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cache-Control, Pragma');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Enable JSON body parsing
app.use(express.json({ limit: '10mb' }));

// Ensure server data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const PRODUCTS_FILE = path.join(DATA_DIR, 'products-live.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins-live.json');

// Helper to ensure every product has valid imageUrls and complete schema fields
function normalizeProduct(p: any): Product {
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
    name: String(p.name),
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

// Convert native JavaScript fields to Cloud Firestore REST format
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue).filter(Boolean) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined && v !== null) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Automatically mirror product writes to Cloud Firestore in background without manual push
async function autoSyncToCloudFirestore(product: Product): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.projectId || !config.apiKey) return;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(product)) {
      if (v !== undefined && v !== null) {
        fields[k] = toFirestoreValue(v);
      }
    }

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/default/documents/products/${product.id}?key=${config.apiKey}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    if (res.ok) {
      console.log(`[Auto-Sync Server] Automatically mirrored "${product.name}" (${product.id}) to Cloud Firestore.`);
    }
  } catch (err: any) {
    // Non-blocking background sync
    console.warn('[Auto-Sync Server] Cloud write notice:', err?.message);
  }
}

// Automatically mirror product deletion in Cloud Firestore
async function autoDeleteFromCloudFirestore(productId: string): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.projectId || !config.apiKey) return;

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/default/documents/products/${productId}?key=${config.apiKey}`;
    await fetch(url, { method: 'DELETE' });
    console.log(`[Auto-Sync Server] Automatically removed "${productId}" from Cloud Firestore.`);
  } catch (err: any) {
    console.warn('[Auto-Sync Server] Cloud delete notice:', err?.message);
  }
}

async function autoSyncAdminToCloudFirestore(admin: AdminUser): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.projectId || !config.apiKey) return;

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(admin)) {
      if (v !== undefined && v !== null) {
        fields[k] = toFirestoreValue(v);
      }
    }

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/default/documents/admins/${admin.id}?key=${config.apiKey}`;
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    console.log(`[Auto-Sync Server] Automatically mirrored admin "${admin.email}" to Cloud Firestore.`);
  } catch (err: any) {
    console.warn('[Auto-Sync Server] Admin Cloud write notice:', err?.message);
  }
}

async function autoDeleteAdminFromCloudFirestore(adminId: string): Promise<void> {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) return;
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.projectId || !config.apiKey) return;

    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/default/documents/admins/${adminId}?key=${config.apiKey}`;
    await fetch(url, { method: 'DELETE' });
    console.log(`[Auto-Sync Server] Automatically removed admin "${adminId}" from Cloud Firestore.`);
  } catch (err: any) {
    console.warn('[Auto-Sync Server] Admin Cloud delete notice:', err?.message);
  }
}

// --- In-Memory & File Storage for Products ---
let liveProducts: Product[] = [];

function loadProductsFromFile(): Product[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed.map(normalizeProduct);
        saveProductsToFile(normalized);
        return normalized;
      }
    }
  } catch (err) {
    console.error('Error loading products from file, using initial:', err);
  }
  // Initialize with initial products
  const normalizedInitial = initialProducts.map(normalizeProduct);
  saveProductsToFile(normalizedInitial);
  return normalizedInitial;
}

function saveProductsToFile(list: Product[]): void {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving products to file:', err);
  }
}

liveProducts = loadProductsFromFile();

// --- In-Memory & File Storage for Admins ---
let liveAdmins: AdminUser[] = [];

function isPlaceholderEmail(email: string | undefined): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return (
    clean.includes('freshbasket@gmail.com') ||
    clean === 'manager.freshbasket@gmail.com' ||
    clean === 'supervisor.freshbasket@gmail.com' ||
    clean === 'salesrep.freshbasket@gmail.com'
  );
}

function loadAdminsFromFile(): AdminUser[] {
  try {
    if (fs.existsSync(ADMINS_FILE)) {
      const raw = fs.readFileSync(ADMINS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge placeholder admin accounts
        const cleaned = parsed.filter(a => a && a.email && !isPlaceholderEmail(a.email));
        if (!cleaned.some(a => a.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase())) {
          cleaned.unshift(DEFAULT_ADMINS[0]);
        }
        saveAdminsToFile(cleaned);
        return cleaned;
      }
    }
  } catch (err) {
    console.error('Error loading admins from file, using defaults:', err);
  }
  saveAdminsToFile(DEFAULT_ADMINS);
  return DEFAULT_ADMINS;
}

function saveAdminsToFile(list: AdminUser[]): void {
  try {
    const cleaned = list.filter(a => a && a.email && !isPlaceholderEmail(a.email));
    fs.writeFileSync(ADMINS_FILE, JSON.stringify(cleaned, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving admins to file:', err);
  }
}

liveAdmins = loadAdminsFromFile();

// Background cleanup of demo placeholder admins in Cloud Firestore
setTimeout(async () => {
  try {
    await autoDeleteAdminFromCloudFirestore('manager_freshbasket_gmail_com');
    await autoDeleteAdminFromCloudFirestore('supervisor_freshbasket_gmail_com');
    await autoDeleteAdminFromCloudFirestore('salesrep_freshbasket_gmail_com');
  } catch {
    // ignore
  }
}, 3000);

// --- Server-Sent Events (SSE) for Real-Time Synchronization Across All Devices ---
const productSSEClients = new Set<Response>();
const adminSSEClients = new Set<Response>();

function broadcastProducts(products: Product[]) {
  const payload = JSON.stringify(products);
  for (const client of productSSEClients) {
    try {
      client.write(`event: products_updated\ndata: ${payload}\n\n`);
    } catch {
      productSSEClients.delete(client);
    }
  }
}

function broadcastAdmins(admins: AdminUser[]) {
  const payload = JSON.stringify(admins);
  for (const client of adminSSEClients) {
    try {
      client.write(`event: admins_updated\ndata: ${payload}\n\n`);
    } catch {
      adminSSEClients.delete(client);
    }
  }
}

// Keep SSE connections active with periodic heartbeat
setInterval(() => {
  for (const client of productSSEClients) {
    try {
      client.write(': keep-alive\n\n');
    } catch {
      productSSEClients.delete(client);
    }
  }
  for (const client of adminSSEClients) {
    try {
      client.write(': keep-alive\n\n');
    } catch {
      adminSSEClients.delete(client);
    }
  }
}, 20000);

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    productsCount: liveProducts.length,
    adminsCount: liveAdmins.length,
    connectedClients: productSSEClients.size,
    timestamp: new Date().toISOString() 
  });
});

// GET /api/products: Fetch all live products (guaranteed fresh, no caching)
app.get('/api/products', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    success: true,
    products: liveProducts,
    count: liveProducts.length,
    updatedAt: new Date().toISOString()
  });
});

// GET /api/products/stream: SSE real-time stream
app.get('/api/products/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current state immediately
  res.write(`event: products_updated\ndata: ${JSON.stringify(liveProducts)}\n\n`);

  productSSEClients.add(res);

  req.on('close', () => {
    productSSEClients.delete(res);
  });
});

// POST /api/products: Create or update produce item
app.post('/api/products', (req: Request, res: Response) => {
  try {
    const { product, role, email } = req.body;

    if (!product || !product.id || !product.name) {
      res.status(400).json({ success: false, message: 'Invalid produce payload: id and name are required.' });
      return;
    }

    const cleanProduct = normalizeProduct(product);
    const existingIdx = liveProducts.findIndex(p => p.id === cleanProduct.id);
    const isNew = existingIdx === -1;

    if (isNew) {
      liveProducts = [cleanProduct, ...liveProducts];
    } else {
      liveProducts = liveProducts.map(p => p.id === cleanProduct.id ? cleanProduct : p);
    }

    // Persist to disk
    saveProductsToFile(liveProducts);

    // Broadcast immediately to all connected browsers (zero-latency multi-user sync)
    broadcastProducts(liveProducts);

    // Automatically synchronize with Cloud Firestore in background (No manual push required)
    autoSyncToCloudFirestore(cleanProduct);

    console.log(`[Produce API] Product "${cleanProduct.name}" (${cleanProduct.id}) ${isNew ? 'created' : 'updated'} by ${email || 'admin'}`);

    res.json({
      success: true,
      message: `Produce item "${cleanProduct.name}" saved live across all users.`,
      product: cleanProduct,
      totalCount: liveProducts.length
    });
  } catch (err: any) {
    console.error('Error saving produce:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error saving produce.' });
  }
});

// DELETE /api/products/:id: Delete produce item
app.delete('/api/products/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = liveProducts.find(p => p.id === id);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Produce item not found.' });
      return;
    }

    liveProducts = liveProducts.filter(p => p.id !== id);
    saveProductsToFile(liveProducts);

    // Broadcast deletion to all users
    broadcastProducts(liveProducts);

    // Automatically remove from Cloud Firestore in background
    autoDeleteFromCloudFirestore(id);

    console.log(`[Produce API] Product "${existing.name}" (${id}) deleted from catalog.`);

    res.json({
      success: true,
      message: `Produce item "${existing.name}" removed from catalog across all users.`,
      totalCount: liveProducts.length
    });
  } catch (err: any) {
    console.error('Error deleting produce:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error deleting produce.' });
  }
});

// --- Admins API ---
app.get('/api/admins', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    success: true,
    admins: liveAdmins,
    count: liveAdmins.length
  });
});

app.get('/api/admins/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(`event: admins_updated\ndata: ${JSON.stringify(liveAdmins)}\n\n`);

  adminSSEClients.add(res);

  req.on('close', () => {
    adminSSEClients.delete(res);
  });
});

app.post('/api/admins', (req: Request, res: Response) => {
  try {
    const { email, name, role, addedBy } = req.body;
    if (!email || !role) {
      res.status(400).json({ success: false, message: 'Email and role are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const id = cleanEmail.replace(/[^a-z0-9]/g, '_');
    const existingIdx = liveAdmins.findIndex(a => a.email.toLowerCase() === cleanEmail);

    const adminEntry: AdminUser = {
      id,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      role,
      addedBy: addedBy || SUPER_ADMIN_EMAIL,
      addedAt: existingIdx >= 0 ? liveAdmins[existingIdx].addedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isImmutable: cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase()
    };

    if (existingIdx >= 0) {
      if (cleanEmail === SUPER_ADMIN_EMAIL.toLowerCase() && role !== 'super_admin') {
        res.status(403).json({ success: false, message: 'Root Super Admin cannot be downgraded.' });
        return;
      }
      liveAdmins[existingIdx] = adminEntry;
    } else {
      liveAdmins.push(adminEntry);
    }

    saveAdminsToFile(liveAdmins);
    broadcastAdmins(liveAdmins);

    // Automatically synchronize new/updated admin to Cloud Firestore
    autoSyncAdminToCloudFirestore(adminEntry).catch(() => {});

    res.json({
      success: true,
      message: `Staff member ${cleanEmail} configured as ${role}.`,
      admin: adminEntry
    });
  } catch (err: any) {
    console.error('Error saving admin staff:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error updating admin staff.' });
  }
});

app.delete('/api/admins/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const target = liveAdmins.find(a => a.id === id || a.email.toLowerCase() === id.toLowerCase());

    if (!target) {
      res.status(404).json({ success: false, message: 'Admin not found.' });
      return;
    }

    if (target.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() || target.isImmutable) {
      res.status(403).json({ success: false, message: 'Root Super Admin cannot be deleted.' });
      return;
    }

    liveAdmins = liveAdmins.filter(a => a.id !== target.id && a.email.toLowerCase() !== target.email.toLowerCase());
    saveAdminsToFile(liveAdmins);
    broadcastAdmins(liveAdmins);

    // Automatically remove admin from Cloud Firestore
    autoDeleteAdminFromCloudFirestore(target.id).catch(() => {});

    res.json({
      success: true,
      message: `Admin access for ${target.email} has been revoked across all systems.`
    });
  } catch (err: any) {
    console.error('Error removing admin staff:', err);
    res.status(500).json({ success: false, message: err?.message || 'Server error deleting admin staff.' });
  }
});

// ==========================================
// VITE OR STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FreshBasket Server] Running on http://0.0.0.0:${PORT} with live produce sync and SSE enabled.`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
