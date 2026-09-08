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
  ExternalLink,
  Share2,
  FileText,
  CheckCheck,
  TrendingUp,
  Calendar,
  Send
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
  isSimulatingRole?: boolean;
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
  isSimulatingRole,
  onSelectRoleForPreview,
  onRefreshProducts,
  onSaveProduct,
  onDeleteProduct,
  onNavigateToAuth
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'supervisor_hub' | 'sales_hub' | 'staff' | 'roleswitcher'>('inventory');
  const [adminStaffList, setAdminStaffList] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Harvest');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteStaffConfirmEmail, setDeleteStaffConfirmEmail] = useState<string | null>(null);
  const [isDeletingStaffEmail, setIsDeletingStaffEmail] = useState<string | null>(null);

  // Supervisor Quality Hub State
  const [supervisorFilter, setSupervisorFilter] = useState<'all' | 'spoilage_risk' | 'low_stock' | 'organic'>('all');
  const [approvedBatches, setApprovedBatches] = useState<Record<string, boolean>>({});

  // Sales Rep Hub State
  const [selectedQuoteProductIds, setSelectedQuoteProductIds] = useState<string[]>([]);
  const [copiedQuoteMessage, setCopiedQuoteMessage] = useState(false);
  const [wholesaleClientName, setWholesaleClientName] = useState('');

  // New admin form state (Super Admin only)
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('manager');
  const [staffActionStatus, setStaffActionStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [lastAppointedStaff, setLastAppointedStaff] = useState<{ email: string; name: string; role: AdminRole } | null>(null);

  const permissions = getAdminPermissions(currentRole);

  // Guard activeTab: ONLY super admin can access staff directory or role switcher
  useEffect(() => {
    if (currentRole !== 'super_admin') {
      if (activeTab === 'staff' || activeTab === 'roleswitcher') {
        setActiveTab('inventory');
      }
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
      setStaffActionStatus({ type: 'error', text: "Access Denied: Only the Super Admin can create new produce items." });
      return;
    }
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleEditProduce = (prod: Product) => {
    if (!permissions.canUpdate) {
      setStaffActionStatus({ type: 'error', text: `Access Denied: Your role (${currentRole}) cannot update produce items.` });
      return;
    }
    setEditingProduct(prod);
    setIsEditorOpen(true);
  };

  const handleDeleteProduce = async (prodId: string) => {
    if (!permissions.canDelete) {
      setStaffActionStatus({ type: 'error', text: `Access Denied: Your role (${currentRole}) cannot delete produce.` });
      return;
    }
    try {
      await onDeleteProduct(prodId);
      setDeleteConfirmId(null);
      onRefreshProducts();
    } catch (err: any) {
      console.error('Delete produce error:', err);
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
    const cleanEmail = email.trim().toLowerCase();
    const isCallerSuperAdmin = currentRole === 'super_admin' || isImmutableSuperAdmin(currentEmail);
    if (!isCallerSuperAdmin) {
      setStaffActionStatus({ type: 'error', text: 'Access Denied: Only the Super Admin can manage admin staff.' });
      return;
    }

    if (isImmutableSuperAdmin(cleanEmail)) {
      setStaffActionStatus({ type: 'error', text: `Access Denied: ${cleanEmail} is an immutable Root Super Admin and cannot be removed.` });
      return;
    }

    setIsDeletingStaffEmail(cleanEmail);
    setDeleteStaffConfirmEmail(null);

    // Optimistically update list so the UI responds immediately
    const prevList = [...adminStaffList];
    setAdminStaffList(prev => prev.filter(s => s.email.trim().toLowerCase() !== cleanEmail));

    try {
      const res = await deleteAdminStaff(cleanEmail, currentEmail || SUPER_ADMIN_EMAIL);
      if (res.success) {
        setStaffActionStatus({ type: 'success', text: res.message });
        const updated = await fetchAdminStaff();
        if (updated && updated.length > 0) {
          setAdminStaffList(updated);
        }
      } else {
        setStaffActionStatus({ type: 'error', text: res.message });
        setAdminStaffList(prevList);
      }
    } catch (err: any) {
      console.error('Delete staff error:', err);
      setStaffActionStatus({ type: 'error', text: err?.message || 'Failed to revoke admin position' });
      setAdminStaffList(prevList);
    } finally {
      setIsDeletingStaffEmail(null);
    }
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

        {/* Live Simulation / Role Preview Alert Strip (ONLY shown when Super Admin is previewing another role) */}
        {isSimulatingRole && onSelectRoleForPreview && (
          <div className="bg-gradient-to-r from-purple-950/80 via-stone-900 to-purple-950/80 border-b border-purple-500/30 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <ShieldCheck className="h-4 w-4 text-purple-400 shrink-0" />
              <span>
                Operating in <b className="text-white uppercase font-black px-1.5 py-0.5 rounded bg-purple-500/30 border border-purple-400/40">{(currentRole || '').replace('_', ' ')}</b> preview mode.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectRoleForPreview('super_admin', SUPER_ADMIN_EMAIL)}
                className="text-xs bg-amber-500 hover:bg-amber-400 text-black font-bold px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow"
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Exit Preview (Back to Super Admin)</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 bg-black/40 px-6 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-emerald-500 text-emerald-400 bg-white/5'
                : 'border-transparent text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Farm Produce Catalog ({products.length})</span>
          </button>

          {/* Quality & Freshness Supervision Hub */}
          {(currentRole === 'supervisor' || currentRole === 'manager' || currentRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('supervisor_hub')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'supervisor_hub'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-purple-300/70 hover:text-purple-200 hover:bg-purple-500/5'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-purple-400" />
              <span>Quality Supervision Hub</span>
            </button>
          )}

          {/* Sales & Wholesale Pricing Hub */}
          {(currentRole === 'sales_rep' || currentRole === 'manager' || currentRole === 'super_admin') && (
            <button
              onClick={() => setActiveTab('sales_hub')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'sales_hub'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-500/5'
              }`}
            >
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Sales & Wholesale Hub</span>
            </button>
          )}

          {/* Admin Staff Directory: Strictly Super Admin Only */}
          {currentRole === 'super_admin' && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'staff'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
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
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'roleswitcher'
                  ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                  : 'border-transparent text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/5'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Role Switcher</span>
            </button>
          )}
        </div>

        {/* Tab 1: Produce Inventory */}
        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4">
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

        {/* Tab: Quality & Freshness Supervision Hub */}
        {activeTab === 'supervisor_hub' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
            {/* Header Description */}
            <div className="bg-gradient-to-r from-purple-950/70 via-stone-900 to-purple-950/70 border border-purple-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 flex-shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Harvest Quality Control & Spoilage Purge Hub</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 font-black uppercase px-2 py-0.5 rounded border border-purple-500/30">
                        Supervisor Tier
                      </span>
                    </h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      Monitor live produce freshness scores, track harvest shelf-life expiration dates, and discard spoiled or damaged inventory before customer delivery.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onRefreshProducts}
                  className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto border border-white/10"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-purple-400" />
                  <span>Refresh Batches</span>
                </button>
              </div>

              {/* Supervision KPI Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-white/50 font-medium">Monitored Items</p>
                  <p className="text-lg font-black text-white">{products.length}</p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-xl p-3">
                  <p className="text-[11px] text-emerald-400 font-medium">Prime Freshness (≥95%)</p>
                  <p className="text-lg font-black text-emerald-300">
                    {products.filter(p => (p.freshnessScore || 95) >= 95).length}
                  </p>
                </div>
                <div className="bg-black/30 border border-amber-500/20 rounded-xl p-3">
                  <p className="text-[11px] text-amber-400 font-medium">Attention Needed (&lt;95%)</p>
                  <p className="text-lg font-black text-amber-300">
                    {products.filter(p => (p.freshnessScore || 95) < 95).length}
                  </p>
                </div>
                <div className="bg-black/30 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[11px] text-red-400 font-medium">Low Stock Batches (≤5)</p>
                  <p className="text-lg font-black text-red-300">
                    {products.filter(p => p.stock <= 5).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSupervisorFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  supervisorFilter === 'all'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
                }`}
              >
                All Produce ({products.length})
              </button>
              <button
                onClick={() => setSupervisorFilter('spoilage_risk')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  supervisorFilter === 'spoilage_risk'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Freshness Alert (&lt;95%)</span>
              </button>
              <button
                onClick={() => setSupervisorFilter('low_stock')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  supervisorFilter === 'low_stock'
                    ? 'bg-red-600 text-white shadow'
                    : 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30'
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Critical Stock (≤5)</span>
              </button>
              <button
                onClick={() => setSupervisorFilter('organic')}
                className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  supervisorFilter === 'organic'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Certified Organic</span>
              </button>
            </div>

            {/* Produce Quality Inspection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products
                .filter(p => {
                  if (supervisorFilter === 'spoilage_risk') return (p.freshnessScore || 95) < 95;
                  if (supervisorFilter === 'low_stock') return p.stock <= 5;
                  if (supervisorFilter === 'organic') return Boolean(p.isOrganic);
                  return true;
                })
                .map(prod => {
                  const freshness = prod.freshnessScore || 95;
                  const isApproved = approvedBatches[prod.id];
                  const isCritical = prod.stock <= 5;

                  return (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                        freshness < 90
                          ? 'bg-red-950/20 border-red-500/40'
                          : freshness < 95
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-14 h-14 rounded-xl object-cover bg-stone-900 border border-white/10"
                          />
                          <div>
                            <span className="text-[10px] text-white/50 uppercase font-mono">{prod.category}</span>
                            <h4 className="text-sm font-bold text-white line-clamp-1">{prod.name}</h4>
                            <p className="text-xs text-emerald-400 font-mono font-bold">₦{prod.price.toLocaleString()} / {prod.unit}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border inline-block ${
                            isCritical ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-white/10 text-white/80 border-white/15'
                          }`}>
                            {prod.stock} in stock
                          </span>
                          {prod.isOrganic && (
                            <span className="block text-[9px] text-emerald-300 font-bold mt-1">🌱 100% Organic</span>
                          )}
                        </div>
                      </div>

                      {/* Freshness Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60 font-medium flex items-center gap-1">
                            Freshness Index:
                          </span>
                          <span className={`font-black font-mono ${
                            freshness >= 95 ? 'text-emerald-400' : freshness >= 90 ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {freshness}% {freshness >= 95 ? '(Grade A Fresh)' : freshness >= 90 ? '(Fair)' : '(Inspect)'}
                          </span>
                        </div>
                        <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              freshness >= 95 ? 'bg-emerald-500' : freshness >= 90 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${freshness}%` }}
                          />
                        </div>
                      </div>

                      {/* Dates & Supervision Tags */}
                      <div className="text-[11px] text-white/60 flex items-center justify-between border-t border-white/10 pt-2 font-mono">
                        <span>Harvest: {prod.harvestDate || 'Fresh Today'}</span>
                        <span>Expires: {prod.expiryDate || '5 Days Remaining'}</span>
                      </div>

                      {/* Supervisor Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => setApprovedBatches(prev => ({ ...prev, [prod.id]: !prev[prod.id] }))}
                          className={`text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            isApproved
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-white/10 hover:bg-white/20 text-white/90 border border-white/15'
                          }`}
                        >
                          <Check className="h-3.5 w-3.5 text-emerald-300" />
                          <span>{isApproved ? 'Quality Certified ✓' : 'Approve Batch'}</span>
                        </button>

                        {/* Purge / Discard Produce (Supervisor is authorized to delete) */}
                        {deleteConfirmId === prod.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteProduce(prod.id)}
                              className="bg-red-600 hover:bg-red-500 text-white px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Confirm Discard
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
                            title="Discard / Purge Spoiled Batch"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Discard Spoiled</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Tab: Sales Operations & Wholesale Pricing Hub */}
        {activeTab === 'sales_hub' && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-6">
            {/* Sales Rep Top Banner */}
            <div className="bg-gradient-to-r from-emerald-950/70 via-stone-900 to-emerald-950/70 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Sales Operations & Wholesale Quotation Hub</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-black uppercase px-2 py-0.5 rounded border border-emerald-500/30">
                        Sales Rep Tier
                      </span>
                    </h3>
                    <p className="text-xs text-white/70 mt-0.5">
                      Instant visibility into warehouse stock levels, wholesale bulk pricing matrices, and 1-click quotation generation for commercial buyers.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-900/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs text-emerald-300 font-bold self-start sm:self-auto">
                  Standard Wholesale Discount: 15% OFF
                </div>
              </div>

              {/* Wholesale Quotation Builder Bar */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] text-white/60 mb-1 font-medium">Customer / Business Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Lagos Continental Hotel or Chef Amaka"
                      value={wholesaleClientName}
                      onChange={e => setWholesaleClientName(e.target.value)}
                      className="w-full bg-stone-800 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => {
                        const selectedItems = products.filter(p => selectedQuoteProductIds.includes(p.id));
                        if (selectedItems.length === 0) {
                          alert('Please select at least one produce item using the checkboxes below.');
                          return;
                        }

                        const client = wholesaleClientName.trim() || 'Valued Buyer';
                        let msg = `🛒 *FRESHBASKET NIGERIA — OFFICIAL WHOLESALE QUOTATION*\n`;
                        msg += `Client: ${client}\n`;
                        msg += `Date: ${new Date().toLocaleDateString('en-GB')}\n`;
                        msg += `Status: Available in Cold-Chain Warehouse\n\n`;
                        msg += `*Selected Produce Items:*\n`;

                        let totalRetail = 0;
                        selectedItems.forEach((item, idx) => {
                          const wholesalePrice = Math.round(item.price * 0.85);
                          totalRetail += item.price;
                          msg += `${idx + 1}. ${item.name} (${item.unit})\n`;
                          msg += `   - Retail: ₦${item.price.toLocaleString()}\n`;
                          msg += `   - Wholesale Rate (15% Bulk): ₦${wholesalePrice.toLocaleString()}\n`;
                          msg += `   - Available Stock: ${item.stock} ${item.unit}\n`;
                        });

                        const totalWholesale = Math.round(totalRetail * 0.85);
                        msg += `\n*Financial Summary:*\n`;
                        msg += `Total Catalog Price: ₦${totalRetail.toLocaleString()}\n`;
                        msg += `Wholesale Savings: ₦${(totalRetail - totalWholesale).toLocaleString()}\n`;
                        msg += `*Final Invoice Total: ₦${totalWholesale.toLocaleString()}*\n\n`;
                        msg += `Direct farm delivery available within 2-4 hours across Lagos.\nTo confirm dispatch, reply to this message.`;

                        navigator.clipboard.writeText(msg);
                        setCopiedQuoteMessage(true);
                        setTimeout(() => setCopiedQuoteMessage(false), 3500);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow"
                    >
                      {copiedQuoteMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                      <span>{copiedQuoteMessage ? 'Quotation Copied!' : 'Copy WhatsApp / Email Quote'}</span>
                    </button>

                    {selectedQuoteProductIds.length > 0 && (
                      <button
                        onClick={() => setSelectedQuoteProductIds([])}
                        className="text-xs text-white/60 hover:text-white px-2 py-2"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-white/70 border-t border-white/10 pt-2">
                  <span>Selected Produce: <b>{selectedQuoteProductIds.length} items</b></span>
                  <span>
                    Wholesale Total:{' '}
                    <b className="text-emerald-300 font-mono text-sm">
                      ₦{Math.round(
                        products
                          .filter(p => selectedQuoteProductIds.includes(p.id))
                          .reduce((sum, p) => sum + p.price, 0) * 0.85
                      ).toLocaleString()}
                    </b>
                  </span>
                </div>
              </div>
            </div>

            {/* Produce Price & Availability Matrix */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live Produce Inventory & Wholesale Rate Matrix ({products.length})
                </h4>
                <span className="text-[11px] text-white/50">Check boxes to add items to customer quote</span>
              </div>

              <div className="divide-y divide-white/10">
                {products.map(prod => {
                  const wholesalePrice = Math.round(prod.price * 0.85);
                  const isSelected = selectedQuoteProductIds.includes(prod.id);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedQuoteProductIds(prev =>
                          isSelected ? prev.filter(id => id !== prod.id) : [...prev, prod.id]
                        );
                      }}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition ${
                        isSelected ? 'bg-emerald-950/40' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-white/20 bg-stone-800"
                        />
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover bg-stone-900 border border-white/10"
                        />
                        <div>
                          <p className="text-sm font-bold text-white">{prod.name}</p>
                          <p className="text-[11px] text-white/50">{prod.category} • {prod.unit}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 sm:gap-8 text-right">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase">Retail Price</p>
                          <p className="text-xs font-bold text-white/80 font-mono">₦{prod.price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-emerald-400 uppercase font-bold">Wholesale (-15%)</p>
                          <p className="text-xs font-black text-emerald-300 font-mono">₦{wholesalePrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border inline-block ${
                            prod.stock > 10 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                            prod.stock > 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                            'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}>
                            {prod.stock > 0 ? `${prod.stock} In Stock` : 'Sold Out'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Staff Directory (Strictly Super Admin Only) */}
        {currentRole === 'super_admin' && activeTab === 'staff' && (
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
                              <span className="text-[10px] text-amber-400/80 font-bold bg-amber-950/40 px-2.5 py-1 rounded border border-amber-500/30 inline-block">
                                Permanent Root
                              </span>
                            ) : (permissions.canManageAdmins || currentRole === 'super_admin' || isImmutableSuperAdmin(currentEmail)) ? (
                              deleteStaffConfirmEmail === staff.email ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleDeleteStaff(staff.email)}
                                    disabled={isDeletingStaffEmail === staff.email}
                                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow"
                                    title="Confirm Revocation"
                                  >
                                    {isDeletingStaffEmail === staff.email ? (
                                      <>
                                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        <span>Revoking...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="h-3.5 w-3.5" />
                                        <span>Confirm Revoke</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setDeleteStaffConfirmEmail(null)}
                                    disabled={isDeletingStaffEmail === staff.email}
                                    className="text-white/60 hover:text-white px-2 py-1 text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteStaffConfirmEmail(staff.email)}
                                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20 px-3 py-1.5 rounded-xl transition cursor-pointer border border-red-500/30 hover:border-red-500/60 flex items-center gap-1.5 text-xs font-semibold ml-auto"
                                  title="Revoke admin position"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Revoke</span>
                                </button>
                              )
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

        {/* Tab 3: Interactive Role Switcher / Demo Mode (Strictly Super Admin Only) */}
        {currentRole === 'super_admin' && onSelectRoleForPreview && activeTab === 'roleswitcher' && (
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
