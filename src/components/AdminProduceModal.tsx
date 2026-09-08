import React, { useState, useEffect } from 'react';
import { X, Save, Sparkles, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Product, AdminRole } from '../types';
import { HARVEST_CATEGORIES } from '../lib/productService';
import { getAdminPermissions, SUPER_ADMIN_EMAIL } from '../lib/adminService';

interface AdminProduceModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null; // null if creating new
  operatorRole: AdminRole | null;
  operatorEmail: string | null;
  onSave: (savedProduct: Product) => Promise<boolean | void> | boolean | void;
}

export const AdminProduceModal: React.FC<AdminProduceModalProps> = ({
  isOpen,
  onClose,
  product,
  operatorRole,
  operatorEmail,
  onSave
}) => {
  const isNew = !product;
  const effectiveRole = operatorRole || 'super_admin';
  const permissions = getAdminPermissions(effectiveRole);
  const canEdit = isNew ? permissions.canCreate : permissions.canUpdate;

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    localName: '',
    category: 'Fresh Vegetables',
    price: 3000,
    originalPrice: 3500,
    size: '1 Basket',
    sizes: ['1 Basket', 'Half Basket', 'Bulk Pack'],
    stock: 50,
    freshnessScore: 98,
    freshnessText: 'Harvested fresh this morning',
    origin: 'Jos, Plateau State, Nigeria',
    description: '',
    imageUrls: ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800'],
    isOrganic: true,
    isImported: false,
    deliveryTimeEstimate: 'Within 2 hours'
  });

  const [sizesInput, setSizesInput] = useState('1 Basket, Half Basket, Bulk Pack');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
      setSizesInput(product.sizes?.join(', ') || product.size || '');
      setImageUrlInput(product.imageUrls?.[0] || '');
    } else {
      const newId = `prod-custom-${Date.now()}`;
      setFormData({
        id: newId,
        name: '',
        localName: '',
        category: 'Fresh Vegetables',
        price: 2500,
        originalPrice: 3000,
        size: '1 Paint Bucket',
        sizes: ['1 Paint Bucket', 'Half Bucket'],
        stock: 50,
        rating: 4.9,
        reviewsCount: 1,
        freshnessScore: 100,
        freshnessText: 'Harvested at dawn from local partner farm',
        origin: 'Oyo State Organic Farm, Nigeria',
        description: 'Freshly harvested, hand-selected grade-A produce, washed and sorted for same-day delivery.',
        imageUrls: ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800'],
        isOrganic: true,
        isImported: false,
        deliveryTimeEstimate: 'Within 2 hours',
        nutritionFacts: {
          calories: '35 kcal',
          protein: '1.2g',
          carbs: '7.5g',
          fat: '0.2g'
        },
        storageInstructions: 'Keep in a cool dry basket or refrigerate.'
      });
      setSizesInput('1 Paint Bucket, Half Bucket');
      setImageUrlInput('https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800');
    }
    setStatusMessage(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      setStatusMessage({
        type: 'error',
        text: `Access Denied: Your current role (${operatorRole?.replace('_', ' ')}) does not have permission to ${isNew ? 'create' : 'update'} produce.`
      });
      return;
    }

    if (!formData.name?.trim()) {
      setStatusMessage({ type: 'error', text: 'Produce name is required.' });
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setStatusMessage({ type: 'error', text: 'Price must be greater than 0.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const parsedSizes = sizesInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const effectiveSizes = parsedSizes.length > 0 
        ? parsedSizes 
        : (formData.size ? [formData.size] : ['1 Pack']);

      const rawImageVal = imageUrlInput.trim();
      const effectiveImages = rawImageVal 
        ? [rawImageVal] 
        : (Array.isArray(formData.imageUrls) && formData.imageUrls.length > 0 && formData.imageUrls[0]
            ? formData.imageUrls.filter(Boolean)
            : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800']);

      const finalProduct: Product = {
        id: formData.id || product?.id || `prod-${Date.now()}`,
        name: formData.name.trim(),
        localName: formData.localName?.trim() || undefined,
        category: formData.category || 'Fresh Vegetables',
        price: Number(formData.price),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
        rating: formData.rating || product?.rating || 4.9,
        reviewsCount: formData.reviewsCount || product?.reviewsCount || 12,
        imageUrls: effectiveImages.length > 0 ? effectiveImages : ['https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=800'],
        freshnessScore: Number(formData.freshnessScore) || 98,
        freshnessText: formData.freshnessText || 'Harvested fresh this morning',
        origin: formData.origin || 'Plateau State, Nigeria',
        description: formData.description || 'Premium farm produce, carefully sorted.',
        size: formData.size || effectiveSizes[0] || '1 Pack',
        sizes: effectiveSizes,
        stock: Number(formData.stock) || 10,
        isOrganic: Boolean(formData.isOrganic),
        isImported: Boolean(formData.isImported),
        deliveryTimeEstimate: formData.deliveryTimeEstimate || 'Within 2 hours',
        nutritionFacts: formData.nutritionFacts || product?.nutritionFacts || {
          calories: '45 kcal',
          protein: '1.5g',
          carbs: '8g',
          fat: '0.2g'
        },
        storageInstructions: formData.storageInstructions || product?.storageInstructions || 'Store in cool conditions.'
      };

      await onSave(finalProduct);
      setStatusMessage({ type: 'success', text: 'Saved to Cloud Firestore & live catalog automatically!' });
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update produce.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-stone-900 border border-emerald-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8 text-white flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-stone-950/80">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                operatorRole === 'super_admin' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                operatorRole === 'manager' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              }`}>
                {operatorRole ? operatorRole.replace('_', ' ').toUpperCase() : 'ADMIN'} MODE
              </span>
              {operatorEmail === SUPER_ADMIN_EMAIL && (
                <span className="text-[10px] text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  ⭐ Immutable Root Admin
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mt-1">
              {isNew ? 'Add New Farm Fresh Produce' : `Edit Produce: ${product?.name}`}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Banner */}
        {statusMessage && (
          <div className={`px-5 py-3 text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success' ? 'bg-emerald-950/90 text-emerald-300 border-b border-emerald-800' : 'bg-red-950/90 text-red-300 border-b border-red-800'
          }`}>
            {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {!canEdit && (
            <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>
                Read-only mode: Your current role (<b>{operatorRole || 'User'}</b>) is not authorized to {isNew ? 'create' : 'modify'} produce. Super Admin and Managers can modify; Super Admin can create.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Produce Name *</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Fresh Red Roma Tomatoes"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                required
              />
            </div>

            {/* Local Market Name */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Local Market Designation</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.localName || ''}
                onChange={e => setFormData({ ...formData, localName: e.target.value })}
                placeholder="e.g. Jos Big Tomatoes / Agbagba Plantain"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Category *</label>
              <select
                disabled={!canEdit}
                value={formData.category || 'Fresh Vegetables'}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              >
                {HARVEST_CATEGORIES.filter(c => c !== 'All Harvest').map(cat => (
                  <option key={cat} value={cat} className="bg-stone-800 text-white">{cat}</option>
                ))}
              </select>
            </div>

            {/* Price (₦) */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Selling Price (₦) *</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.price || ''}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
                required
              />
            </div>

            {/* Original Price (₦) */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Original Price (₦) <span className="text-white/40">(Optional)</span></label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.originalPrice || ''}
                onChange={e => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
                placeholder="Discount reference"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Packaging Size */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Standard Packaging Size</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.size || ''}
                onChange={e => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 1 Paint Bucket"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            {/* Available Sizes Options */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Sizes List (comma-separated)</label>
              <input
                type="text"
                disabled={!canEdit}
                value={sizesInput}
                onChange={e => setSizesInput(e.target.value)}
                placeholder="e.g. 5kg, 10kg, 25kg"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            {/* Stock Count */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Units in Stock</label>
              <input
                type="number"
                disabled={!canEdit}
                value={formData.stock ?? 50}
                onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Freshness Score */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-white/70">Freshness Score ({formData.freshnessScore || 98}%)</label>
                <span className="text-[10px] text-emerald-400 font-bold">Grade A Quality</span>
              </div>
              <input
                type="range"
                min="70"
                max="100"
                disabled={!canEdit}
                value={formData.freshnessScore || 98}
                onChange={e => setFormData({ ...formData, freshnessScore: Number(e.target.value) })}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Freshness text */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Freshness Status Badge</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.freshnessText || ''}
                onChange={e => setFormData({ ...formData, freshnessText: e.target.value })}
                placeholder="e.g. Harvested yesterday morning"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Origin */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Farm Origin & Region</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.origin || ''}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                placeholder="e.g. Jos, Plateau State, Nigeria"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>

            {/* Delivery estimate */}
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Delivery Time Estimate</label>
              <input
                type="text"
                disabled={!canEdit}
                value={formData.deliveryTimeEstimate || ''}
                onChange={e => setFormData({ ...formData, deliveryTimeEstimate: e.target.value })}
                placeholder="e.g. Within 2 hours / Same day"
                className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Image URL with live preview */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Image URL</label>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <input
                  type="url"
                  disabled={!canEdit}
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-stone-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 border border-white/10 flex-shrink-0 flex items-center justify-center">
                {imageUrlInput ? (
                  <img src={imageUrlInput} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-white/40" />
                )}
              </div>
            </div>
          </div>

          {/* Organic toggle */}
          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={Boolean(formData.isOrganic)}
                onChange={e => setFormData({ ...formData, isOrganic: e.target.checked })}
                className="rounded accent-emerald-500 h-4 w-4"
              />
              <span className="text-xs font-semibold text-white/80">🌿 100% Organically Farmed (No synthetic chemical residues)</span>
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-1">Description & Culinary Details</label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Flavor profile, best cooking pairing (Jollof, Soups, Salads), texture..."
              className="w-full bg-stone-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white/70 hover:text-white rounded-xl hover:bg-white/5 transition cursor-pointer"
            >
              Cancel
            </button>

            {canEdit ? (
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Syncing to Cloud...' : isNew ? 'Publish to Cloud & Catalog' : 'Save & Sync to Cloud'}
              </button>
            ) : (
              <span className="text-xs text-white/40 italic">Editing locked for role: {operatorRole}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
