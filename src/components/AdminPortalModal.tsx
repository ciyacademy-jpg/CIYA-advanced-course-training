import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Edit3, 
  Plus, 
  Check, 
  AlertTriangle, 
  Lock, 
  Crown, 
  Search, 
  RefreshCw, 
  Sparkles,
  Users,
  Package,
  Layers,
  CheckCircle2,
  Sliders,
  AlertCircle,
  Cloud,
  Database,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Product, AdminRole, AdminUser } from '../types';
import { 
  SUPER_ADMIN_EMAIL, 
  getAdminPermissions, 
  fetchAdminStaff, 
  addOrUpdateAdminStaff, 
  deleteAdminStaff, 
  isImmutableSuperAdmin,
  subscribeToAdminStaff
} from '../lib/adminService';
import { HARVEST_CATEGORIES, deleteLiveProduct, syncAllProductsToFirestore } from '../lib/productService';
import { AdminProduceModal } from './AdminProduceModal';
import { auth } from '../lib/firebase';
import { signInAnonymously } from 'firebase/auth';

interface AdminPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  currentRole: AdminRole | null;
  currentEmail: string | null;
  onSelectRoleForPreview?: (role: AdminRole | null, simulatedEmail?: string) => void;
  onRefreshProducts: () => void;
  onSaveProduct: (p: Product) => Promise<boolean | void> | boolean | void;
  onDeleteProduct: (id: string) => Promise<void>;
  onNavigateToAuth?: () => void;
}

export const AdminPortalModal: React.FC<AdminPortalModalProps> = ({
  isOpen,
  onClose,
  products,
  currentRole,
  currentEmail,
  onSelectRoleForPreview,
  onRefreshProducts,
  onSaveProduct,
  onDeleteProduct,
  onNavigateToAuth
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'staff' | 'roleswitcher'>('inventory');
  const [adminStaffList, setAdminStaffList] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Harvest');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New admin form state (Super Admin only)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('manager');
  const [staffActionStatus, setStaffActionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [lastAppointedStaff, setLastAppointedStaff] = useState<{ email: string; name: string; role: AdminRole } | null>(null);

  // Cloud Firestore manual sync & rules modal state
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [firestoreSyncStatus, setFirestoreSyncStatus] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showRulesHelper, setShowRulesHelper] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const permissions = getAdminPermissions(currentRole);

  // Guard activeTab: non-super-admins can only access inventory
  useEffect(() => {
    if (currentRole !== 'super_admin' && activeTab !== 'inventory') {
      setActiveTab('inventory');
    }
  }, [currentRole, activeTab]);

  useEffect(() => {
    if (isOpen) {
      const unsub = subscribeToAdminStaff((staff) => {
        setAdminStaffList(staff);
      });
      return () => unsub();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Access Restricted Screen for non-admin visitors / customers
  if (!currentRole) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
        <div className="bg-[#0f1712] border border-amber-500/40 w-full max-w-2xl rounded-3xl shadow-2xl p-6 sm:p-8 text-white space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Administrative Access Restricted</h2>
                <p className="text-xs text-amber-300/80">Role-Based Access Control (RBAC) Active</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            The FreshBasket Administration Center is not accessible to standard visitors or customers. Each operational position is strictly defined and permissions are cryptographically verified.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <Crown className="h-4 w-4" />
                <span>Super Administrator</span>
              </div>
              <p className="text-white/60">Full system & produce authority (Create, Read, Update, Delete) + Staff governance.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-blue-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Operations Manager</span>
              </div>
              <p className="text-white/60">Produce stock updates, price adjustments, and catalog maintenance. Cannot create root products or manage staff.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-purple-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Quality Supervisor</span>
              </div>
              <p className="text-white/60">Quality inspection & removal of expired/damaged harvest items. Read & delete only.</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                <span>Sales Representative</span>
              </div>
              <p className="text-white/60">Real-time inventory stock and live pricing view only. Cannot edit, create, or delete items.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {onNavigateToAuth && (
              <button
                onClick={onNavigateToAuth}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl text-center text-xs transition cursor-pointer"
              >
                Sign In with Admin Account
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.localName && p.localName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Harvest' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddNewProduce = () => {
    if (!permissions.canCreate) {
      alert("Access Denied: Only the Super Admin (comwebdot@gmail.com) can create new produce items.");
      return;
    }
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleEditProduce = (prod: Product) => {
    if (!permissions.canUpdate) {
      alert(`Access Denied: Your role (${currentRole}) cannot update produce items. Super Admin and Managers only.`);
      return;
    }
    setEditingProduct(prod);
    setIsEditorOpen(true);
  };

  const handleDeleteProduce = async (prodId: string) => {
    if (!permissions.canDelete) {
      alert(`Access Denied: Your role (${currentRole}) cannot delete produce. Requires Super Admin, Manager, or Supervisor.`);
      return;
    }
    try {
      await onDeleteProduct(prodId);
      setDeleteConfirmId(null);
      onRefreshProducts();
    } catch (err: any) {
      alert(err?.message || "Failed to delete produce");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions.canManageAdmins) {
      setStaffActionStatus({
        type: 'error',
        text: 'Access Denied: Only the Super Admin can provision or update administrator accounts.'
      });
      return;
    }

    if (!newAdminEmail.trim()) {
      setStaffActionStatus({ type: 'error', text: 'Please enter a Gmail account.' });
      return;
    }

    setIsAddingStaff(true);
    setStaffActionStatus(null);

    const res = await addOrUpdateAdminStaff(
      newAdminEmail,
      newAdminName,
      newAdminRole,
      currentEmail || SUPER_ADMIN_EMAIL
    );

    setIsAddingStaff(false);
    if (res.success) {
      setStaffActionStatus({ type: 'success', text: res.message });
      setLastAppointedStaff({
        email: res.admin?.email || newAdminEmail.trim().toLowerCase(),
        name: res.admin?.name || newAdminName.trim(),
        role: res.admin?.role || newAdminRole
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminRole('manager');
      const updated = await fetchAdminStaff();
      setAdminStaffList(updated);
    } else {
      setStaffActionStatus({ type: 'error', text: res.message });
    }
  };

  const handleDeleteStaff = async (email: string) => {
    if (!permissions.canManageAdmins) {
      alert("Access Denied: Only the Super Admin can manage admin staff.");
      return;
    }

    if (isImmutableSuperAdmin(email)) {
      alert(`Access Denied: ${SUPER_ADMIN_EMAIL} is the immutable Root Super Admin and cannot be removed.`);
      return;
    }

    if (confirm(`Are you sure you want to revoke admin access for ${email}?`)) {
      const res = await deleteAdminStaff(email, currentEmail || SUPER_ADMIN_EMAIL);
      if (res.success) {
        setStaffActionStatus({ type: 'success', text: res.message });
        const updated = await fetchAdminStaff();
        setAdminStaffList(updated);
      } else {
        setStaffActionStatus({ type: 'error', text: res.message });
      }
    }
  };

  const handleSyncToFirestore = async () => {
    setIsSyncingFirestore(true);
    setFirestoreSyncStatus({ type: 'info', text: 'Pushing produce catalog to Cloud Firestore...' });
    try {
      const res = await syncAllProductsToFirestore();
      if (res.success) {
        setFirestoreSyncStatus({ type: 'success', text: res.message });
      } else {
        setFirestoreSyncStatus({ type: 'error', text: res.message });
        setShowRulesHelper(true);
      }
    } catch (err: any) {
      setFirestoreSyncStatus({ type: 'error', text: err?.message || 'Failed to sync to Firestore' });
      setShowRulesHelper(true);
    } finally {
      setIsSyncingFirestore(false);
    }
  };

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Default locked
    match /{document=**} {
      allow read, write: if false;
    }

    // Test ping
    match /test/{testId} {
      allow get: if true;
    }

    // Farm Fresh Produce Catalog: Open read & write for live inventory sync across share links
    match /products/{productId} {
      allow read, write: if true;
    }

    // Admins registry: readable and writable for store management
    match /admins/{adminId} {
      allow read, write: if true;
    }

    // User Profiles: private to the owner
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0f1712] border border-emerald-500/30 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden my-4 text-white flex flex-col h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-gradient-to-r from-[#0a2315] to-[#122e1d] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-inner">
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                  Farm Produce Administration Center
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Live RBAC Engine
                </span>
              </div>
              <p className="text-xs text-emerald-200/70 mt-0.5">
                Role-Based Produce Management & Harvest Inventory Synchronization
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer self-end sm:self-auto"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Identity & Live Role Permissions Strip */}
        <div className="bg-stone-900/90 border-b border-white/10 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-white/50 font-medium">Active Session:</span>
            <span className="font-mono font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              {currentEmail || 'Not Authenticated'}
            </span>
            {currentEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ? (
              <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold">
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                Root Super Admin (Immutable)
              </span>
            ) : currentRole ? (
              <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg border ${
                currentRole === 'manager' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                currentRole === 'supervisor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {currentRole.replace('_', ' ').toUpperCase()}
              </span>
            ) : (
              <span className="bg-white/10 text-white/70 px-2 py-0.5 rounded text-[11px]">Customer / Guest</span>
            )}
          </div>

          {/* Granular Permissions Indicator */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-white/40 font-sans mr-1">CRUD Matrix:</span>
            <span className={`px-2 py-0.5 rounded ${permissions.canCreate ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-white/5 text-white/30'}`}>
              Create {permissions.canCreate ? '✓' : '✗'}
            </span>
            <span className={`px-2 py-0.5 rounded ${permissions.canRead ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-white/5 text-white/30'}`}>
              Read {permissions.canRead ? '✓' : '✗'}
            </span>
            <span className={`px-2 py-0.5 rounded ${permissions.canUpdate ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-white/5 text-white/30'}`}>
              Update {permissions.canUpdate ? '✓' : '✗'}
            </span>
            <span className={`px-2 py-0.5 rounded ${permissions.canDelete ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' : 'bg-white/5 text-white/30'}`}>
              Delete {permissions.canDelete ? '✓' : '✗'}
            </span>
            <span className={`px-2 py-0.5 rounded ${permissions.canManageAdmins ? 'bg-amber-950 text-amber-300 border border-amber-700' : 'bg-white/5 text-white/30'}`}>
              Admins {permissions.canManageAdmins ? '✓' : '✗'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'border-emerald-500 text-emerald-400 bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Farm Produce Catalog ({products.length})</span>
          </button>

          {/* Admin Staff Directory: Strictly Super Admin Only */}
          {permissions.canManageAdmins && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer ${
                activeTab === 'staff'
                  ? 'border-emerald-500 text-emerald-400 bg-white/5'
                  : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Admin Staff Directory ({adminStaffList.length})</span>
            </button>
          )}

          {/* Role Switcher: Strictly Super Admin Only */}
          {currentRole === 'super_admin' && onSelectRoleForPreview && (
            <button
              onClick={() => setActiveTab('roleswitcher')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer ${
                activeTab === 'roleswitcher'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/5'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Role Switcher (Super Admin Preview)</span>
            </button>
          )}
        </div>

        {/* Tab 1: Produce Inventory */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
            {/* Cloud Firestore Live Synchronization Card */}
            <div className="bg-gradient-to-r from-emerald-950/60 to-stone-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 relative">
                    <Cloud className="h-5 w-5 text-emerald-400" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Automated Cloud Sync Active</h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Real-Time
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-200/80 mt-0.5">
                      All changes to produce prices, stock, or descriptions automatically push to Cloud Firestore in real time. No manual button click is required.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setShowRulesHelper(!showRulesHelper)}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
                    <span>{showRulesHelper ? 'Hide Rules Guide' : 'Firestore Rules Guide'}</span>
                  </button>

                  <button
                    onClick={handleSyncToFirestore}
                    disabled={isSyncingFirestore}
                    title="All updates are already automatic. Click only if you want to force a full re-verification of all 25 items."
                    className="px-3 py-2 bg-emerald-800/60 hover:bg-emerald-700/80 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
                    <span>{isSyncingFirestore ? 'Syncing...' : 'Force Full Resync'}</span>
                  </button>
                </div>
              </div>

              {/* Status Message */}
              {firestoreSyncStatus && (
                <div className={`text-xs px-3.5 py-2.5 rounded-xl border flex items-start justify-between gap-2 ${
                  firestoreSyncStatus.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border-emerald-600/40' :
                  firestoreSyncStatus.type === 'error' ? 'bg-rose-950/80 text-rose-200 border-rose-600/40' :
                  'bg-blue-950/80 text-blue-200 border-blue-600/40'
                }`}>
                  <div className="flex items-center gap-2">
                    {firestoreSyncStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" /> :
                     firestoreSyncStatus.type === 'error' ? <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" /> :
                     <RefreshCw className="h-4 w-4 text-blue-400 animate-spin flex-shrink-0" />}
                    <span>{firestoreSyncStatus.text}</span>
                  </div>
                  {firestoreSyncStatus.type === 'error' && (
                    <button
                      onClick={() => setShowRulesHelper(true)}
                      className="underline text-[11px] font-bold text-amber-300 hover:text-white flex-shrink-0 cursor-pointer"
                    >
                      View Fix
                    </button>
                  )}
                </div>
              )}

              {/* Rules Guide Panel */}
              {showRulesHelper && (
                <div className="bg-black/60 border border-amber-500/30 rounded-xl p-4 text-xs space-y-3 mt-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-amber-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-400" />
                      1-Minute Fix: Deploy Rules in Firebase Console
                    </span>
                    <button
                      onClick={handleCopyRules}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      {copiedRules ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedRules ? 'Copied to Clipboard!' : 'Copy 1-Click Rules'}</span>
                    </button>
                  </div>

                  <p className="text-white/80 text-[11px] leading-relaxed">
                    By default, new Firebase projects reject writes until rules are published. To allow the Admin Portal to push produce to your live database:
                  </p>

                  <ol className="list-decimal list-inside space-y-2 text-white/90 text-[11px]">
                    <li>
                      Open your Firebase Console:{' '}
                      <a
                        href="https://console.firebase.google.com/project/ciya-advanced-course-training/firestore/rules"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 font-bold underline inline-flex items-center gap-1 ml-1"
                      >
                        Firestore Database &gt; Rules <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </li>
                    <li>Click the <strong>Copy 1-Click Rules</strong> button above.</li>
                    <li>Paste into the Firebase editor (replacing everything) and click <strong>Publish</strong>.</li>
                    <li>Come back here and click <strong>Push to Cloud Firestore</strong>!</li>
                  </ol>

                  <div className="bg-stone-950/90 border border-white/10 rounded-lg p-2.5 font-mono text-[10px] text-emerald-300 select-all overflow-x-auto">
                    <pre>{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} { allow read, write: if false; }
    match /products/{productId} { allow read, write: if true; }
    match /admins/{adminId} { allow read, write: if true; }
    match /users/{userId} { allow read, write: if request.auth != null && request.auth.uid == userId; }
  }
}`}</pre>
                  </div>
                </div>
              )}
            </div>

            {/* Search & Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="flex-1 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search 20+ produce items..."
                    className="w-full bg-stone-800/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Category Select */}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="bg-stone-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {HARVEST_CATEGORIES.map(c => (
                    <option key={c} value={c} className="bg-stone-800 text-white">{c}</option>
                  ))}
                </select>
              </div>

              {/* Add Produce Button */}
              {permissions.canCreate ? (
                <button
                  onClick={handleAddNewProduce}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shadow transition cursor-pointer flex-shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Farm Produce</span>
                </button>
              ) : (
                <div className="text-[11px] text-white/50 bg-white/5 px-3 py-2 rounded-xl border border-white/10 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-400" />
                  <span>New produce creation is restricted to Super Admin</span>
                </div>
              )}
            </div>

            {/* Produce Grid / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(prod => {
                return (
                  <div
                    key={prod.id}
                    className="bg-white/5 rounded-2xl border border-white/10 hover:border-emerald-500/40 transition p-4 flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                        <img src={prod.imageUrls?.[0] || 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600'} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400">
                            {prod.category}
                          </span>
                          <span className="text-[10px] text-white/50 font-mono">
                            Stock: {prod.stock}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white truncate mt-0.5">
                          {prod.name}
                        </h4>
                        {prod.localName && (
                          <p className="text-[11px] text-yellow-400/90 truncate italic">
                            "{prod.localName}"
                          </p>
                        )}
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            ₦{prod.price.toLocaleString()}
                          </span>
                          {prod.originalPrice && (
                            <span className="text-[10px] text-white/40 line-through font-mono">
                              ₦{prod.originalPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-[10px] text-white/60 ml-auto">
                            {prod.size}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Freshness & Origin info */}
                    <div className="text-[10px] text-white/60 bg-black/30 p-2 rounded-xl border border-white/5 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Quality Freshness:</span>
                        <span className="text-emerald-400 font-bold">{prod.freshnessScore}% Fresh</span>
                      </div>
                      <div className="truncate">
                        <span className="text-white/40">Origin: </span>
                        <span>{prod.origin}</span>
                      </div>
                    </div>

                    {/* Actions bar for this produce */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                      {/* Update Button (Super Admin & Manager) */}
                      {permissions.canUpdate && (
                        <button
                          onClick={() => handleEditProduce(prod)}
                          className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* Delete Button (Super Admin, Manager & Quality Supervisor) */}
                      {permissions.canDelete && (
                        deleteConfirmId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteProduce(prod.id)}
                              className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="text-white/60 hover:text-white px-2 py-1 text-xs cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(prod.id)}
                            className="bg-red-500/15 hover:bg-red-500/30 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Delete</span>
                          </button>
                        )
                      )}

                      {/* Sales Rep / Read-only state */}
                      {!permissions.canUpdate && !permissions.canDelete && (
                        <span className="text-[10px] text-white/50 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                          Read Only
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Admin Staff Directory */}
        {activeTab === 'staff' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
            {/* Status notification */}
            {staffActionStatus && (
              <div className={`p-4 rounded-2xl text-xs font-semibold space-y-2 ${
                staffActionStatus.type === 'success' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-red-950/80 text-red-300 border border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {staffActionStatus.type === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  <span>{staffActionStatus.text}</span>
                </div>

                {staffActionStatus.type === 'success' && lastAppointedStaff && (
                  <div className="pt-2 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-emerald-200/80 font-normal">
                      Send quick login instructions to <b className="text-white">{lastAppointedStaff.email}</b>:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const origin = typeof window !== 'undefined' ? window.location.origin : '';
                        const msg = `Hi ${lastAppointedStaff.name || 'there'}! You have been granted ${lastAppointedStaff.role.replace('_', ' ').toUpperCase()} admin privileges on FreshBasket NG. To access your portal, visit ${origin} and click 'Sign In with Google' using ${lastAppointedStaff.email}. Your Admin Center and produce controls will activate automatically!`;
                        navigator.clipboard.writeText(msg);
                        setCopiedInvite(true);
                        setTimeout(() => setCopiedInvite(false), 3000);
                      }}
                      className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow"
                    >
                      {copiedInvite ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedInvite ? 'Copied to Clipboard!' : 'Copy Onboarding Message'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Provision New Admin Staff Form (Super Admin only) */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-emerald-400" />
                    <span>Appoint New Admin Position</span>
                  </h3>
                  <p className="text-xs text-white/60 mt-0.5">
                    Authorize a manager, supervisor, or sales representative using their Gmail account.
                  </p>
                </div>
                {permissions.canManageAdmins ? (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full">
                    Authorized Super Admin Action
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-white/50 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Lock className="h-3 w-3 text-amber-400" /> Super Admin Only
                  </span>
                )}
              </div>

              {permissions.canManageAdmins ? (
                <form onSubmit={handleAddStaff} className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">Staff Gmail Account *</label>
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={e => setNewAdminEmail(e.target.value)}
                      placeholder="e.g. manager.lekki@gmail.com"
                      className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">Staff Full Name</label>
                    <input
                      type="text"
                      value={newAdminName}
                      onChange={e => setNewAdminName(e.target.value)}
                      placeholder="e.g. Babatunde Adeyemi"
                      className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">Assign Position *</label>
                    <select
                      value={newAdminRole}
                      onChange={e => setNewAdminRole(e.target.value as AdminRole)}
                      className="w-full bg-stone-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="manager">Manager (Update, Delete, Read)</option>
                      <option value="supervisor">Supervisor (Delete, Read)</option>
                      <option value="sales_rep">Sales Rep (Read Only)</option>
                      <option value="super_admin">Co-Super Admin (Full CRUD & Staff Mgmt)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-12 flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isAddingStaff}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center gap-2 shadow cursor-pointer transition disabled:opacity-50"
                    >
                      <UserPlus className="h-4 w-4" />
                      <span>{isAddingStaff ? 'Authorizing...' : 'Grant Admin Authorization'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-white/60">
                  Staff appointment and privilege configuration are exclusively accessible to the immutable Super Admin ({SUPER_ADMIN_EMAIL}).
                </div>
              )}
            </div>

            {/* Current Staff Registry Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Active Administrator Registry ({adminStaffList.length})</span>
              </h3>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs text-white">
                  <thead className="bg-black/50 text-white/60 border-b border-white/10 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-4">Administrator / Email</th>
                      <th className="p-4">Assigned Position</th>
                      <th className="p-4">Permissions Scope</th>
                      <th className="p-4">Provisioned By</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adminStaffList.map(staff => {
                      const isRoot = isImmutableSuperAdmin(staff.email);
                      const staffPerms = getAdminPermissions(staff.role);

                      return (
                        <tr key={staff.email} className={`hover:bg-white/5 transition ${isRoot ? 'bg-amber-500/5' : ''}`}>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isRoot ? 'bg-amber-500 text-black' : 'bg-emerald-800 text-white'
                              }`}>
                                {staff.name ? staff.name.charAt(0).toUpperCase() : staff.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{staff.name}</span>
                                  {isRoot && (
                                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold border border-amber-500/40">
                                      ⭐ ROOT IMMUTABLE
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-white/60 font-mono">
                                  {staff.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              staff.role === 'super_admin' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                              staff.role === 'manager' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                              staff.role === 'supervisor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                              'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            }`}>
                              {staff.role.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="p-4 font-mono text-[10px] text-white/70">
                            {staff.role === 'super_admin' && 'Full CRUD + Staff Mgmt'}
                            {staff.role === 'manager' && 'Update, Delete, Read Produce'}
                            {staff.role === 'supervisor' && 'Delete, Read Produce Only'}
                            {staff.role === 'sales_rep' && 'Read Produce Only'}
                          </td>

                          <td className="p-4 text-[11px] text-white/60">
                            {staff.addedBy}
                          </td>

                          <td className="p-4 text-right">
                            {isRoot ? (
                              <span className="text-[10px] text-amber-400/80 font-bold bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                                Permanent Root
                              </span>
                            ) : permissions.canManageAdmins ? (
                              <button
                                onClick={() => handleDeleteStaff(staff.email)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1.5 rounded-lg transition cursor-pointer"
                                title="Revoke position"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-white/30 italic">Protected</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Interactive Role Switcher / Demo Mode */}
        {activeTab === 'roleswitcher' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-5">
            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl text-xs space-y-2 text-amber-200">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Sparkles className="h-4 w-4" />
                <span>Role-Based Access Control (RBAC) Testing Station</span>
              </div>
              <p className="text-white/80">
                Click any role card below to instantly simulate that specific authorization tier in this session.
                Verify live how produce buttons (Add, Edit, Delete) adapt strictly to each position's granted privileges.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Super Admin */}
              <div 
                onClick={() => onSelectRoleForPreview && onSelectRoleForPreview('super_admin', SUPER_ADMIN_EMAIL)}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  currentRole === 'super_admin'
                    ? 'bg-amber-950/40 border-amber-400 shadow-xl ring-2 ring-amber-400/20'
                    : 'bg-white/5 border-white/10 hover:border-amber-400/50 hover:bg-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-400" />
                      Super Admin
                    </span>
                    <span className="text-[10px] text-amber-400 font-bold">IMMUTABLE ROOT</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">{SUPER_ADMIN_EMAIL}</h4>
                  <p className="text-xs text-white/70">
                    Highest authority level with full CRUD rights. Exclusive capability to create new produce and appoint or revoke admin staff accounts.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> <span>Produce: Create, Read, Update, Delete</span>
                  </div>
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> <span>Staff Management: Appoint & Revoke Admins</span>
                  </div>
                </div>

                <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2 rounded-xl transition cursor-pointer">
                  {currentRole === 'super_admin' ? 'Currently Active' : 'Switch to Super Admin'}
                </button>
              </div>

              {/* Manager */}
              <div 
                onClick={() => onSelectRoleForPreview && onSelectRoleForPreview('manager', currentEmail || 'manager-mode')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  currentRole === 'manager'
                    ? 'bg-blue-950/40 border-blue-400 shadow-xl ring-2 ring-blue-400/20'
                    : 'bg-white/5 border-white/10 hover:border-blue-400/50 hover:bg-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/40">
                      Produce Manager
                    </span>
                    <span className="text-[10px] text-blue-400 font-bold">OPERATIONS TIER</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Manager Permissions Mode</h4>
                  <p className="text-xs text-white/70">
                    Granted the power to update, delete, and read produce items live. Cannot create brand-new produce or manage admin staff.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> <span>Produce: Update, Delete, Read</span>
                  </div>
                  <div className="text-red-400 flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" /> <span>Produce: Cannot Create</span>
                  </div>
                  <div className="text-red-400 flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" /> <span>Staff: Cannot Manage Admins</span>
                  </div>
                </div>

                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer">
                  {currentRole === 'manager' ? 'Currently Active' : 'Switch to Manager'}
                </button>
              </div>

              {/* Supervisor */}
              <div 
                onClick={() => onSelectRoleForPreview && onSelectRoleForPreview('supervisor', currentEmail || 'supervisor-mode')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  currentRole === 'supervisor'
                    ? 'bg-purple-950/40 border-purple-400 shadow-xl ring-2 ring-purple-400/20'
                    : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-full border border-purple-500/40">
                      Quality Supervisor
                    </span>
                    <span className="text-[10px] text-purple-400 font-bold">SUPERVISION TIER</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Supervisor Permissions Mode</h4>
                  <p className="text-xs text-white/70">
                    Granted the power to delete and read only. Authorized to purge spoiled or outdated produce, but cannot edit details or create items.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> <span>Produce: Delete, Read Only</span>
                  </div>
                  <div className="text-red-400 flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" /> <span>Produce: Cannot Update or Create</span>
                  </div>
                </div>

                <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer">
                  {currentRole === 'supervisor' ? 'Currently Active' : 'Switch to Supervisor'}
                </button>
              </div>

              {/* Sales Rep */}
              <div 
                onClick={() => onSelectRoleForPreview && onSelectRoleForPreview('sales_rep', currentEmail || 'salesrep-mode')}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 ${
                  currentRole === 'sales_rep'
                    ? 'bg-emerald-950/40 border-emerald-400 shadow-xl ring-2 ring-emerald-400/20'
                    : 'bg-white/5 border-white/10 hover:border-emerald-400/50 hover:bg-white/10'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                      Sales Representative
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">CLIENT DISPATCH TIER</span>
                  </div>
                  <h4 className="text-sm font-bold text-white font-mono">Sales Rep Permissions Mode</h4>
                  <p className="text-xs text-white/70">
                    Granted the power to read only. Full access to inventory, warehouse stock levels, and wholesale metrics without mutation rights.
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-white/10 text-xs font-mono">
                  <div className="text-emerald-400 flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5" /> <span>Produce: Read Only</span>
                  </div>
                  <div className="text-red-400 flex items-center gap-1.5">
                    <X className="h-3.5 w-3.5" /> <span>Produce: Cannot Create, Update, or Delete</span>
                  </div>
                </div>

                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer">
                  {currentRole === 'sales_rep' ? 'Currently Active' : 'Switch to Sales Rep'}
                </button>
              </div>
            </div>

            {/* If any custom staff members have been added by the Super Admin, display them */}
            {adminStaffList.filter(s => !isImmutableSuperAdmin(s.email)).length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-white/80 uppercase tracking-wider">
                  Or Simulate Appointed Staff Members ({adminStaffList.filter(s => !isImmutableSuperAdmin(s.email)).length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {adminStaffList.filter(s => !isImmutableSuperAdmin(s.email)).map(staff => (
                    <div
                      key={staff.email}
                      onClick={() => onSelectRoleForPreview && onSelectRoleForPreview(staff.role, staff.email)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                        currentEmail === staff.email
                          ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-400/20'
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-white truncate">{staff.name}</p>
                        <p className="text-[11px] text-white/60 truncate font-mono">{staff.email}</p>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-black bg-white/10 text-emerald-300 mt-1 inline-block">
                          {staff.role.replace('_', ' ')}
                        </span>
                      </div>
                      <button className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 rounded-lg font-bold">
                        {currentEmail === staff.email ? 'Active' : 'Test'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Produce Edit Modal */}
      {isEditorOpen && (
        <AdminProduceModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingProduct(null);
          }}
          product={editingProduct}
          operatorRole={currentRole}
          operatorEmail={currentEmail}
          onSave={async (saved) => {
            await onSaveProduct(saved);
            setIsEditorOpen(false);
            setEditingProduct(null);
            onRefreshProducts();
          }}
        />
      )}
    </div>
  );
};
