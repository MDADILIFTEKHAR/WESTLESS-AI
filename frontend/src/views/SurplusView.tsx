import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
  AlertCircle,
  FileCheck,
  Phone,
  X,
  Trash2,
  ArrowRight,
  Info,
} from 'lucide-react';
import {
  fetchSurplusListings,
  createSurplusListing,
  updateSurplusStatus,
  deleteSurplusListing,
} from '../services/api';
import type { SurplusListing } from '../types';

interface SurplusViewProps {
  onSuccessToast?: (msg: string) => void;
}

export const SurplusView: React.FC<SurplusViewProps> = ({ onSuccessToast }) => {
  const [listings, setListings] = useState<SurplusListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<SurplusListing | null>(null);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formCat, setFormCat] = useState('Grains');
  const [formQty, setFormQty] = useState<number | ''>('');
  const [formServings, setFormServings] = useState<number | ''>('');
  const [formPrepTime, setFormPrepTime] = useState(
    `${new Date().toISOString().split('T')[0]} 13:00`
  );
  const [formDeadline, setFormDeadline] = useState(
    `${new Date().toISOString().split('T')[0]} 17:30`
  );
  const [formAllergens, setFormAllergens] = useState('None');
  const [formDietary, setFormDietary] = useState('Vegetarian');
  const [formStorage, setFormStorage] = useState('Hot holding cabinet (>65°C)');

  // Claim form state
  const [recipName, setRecipName] = useState('');
  const [recipContact, setRecipContact] = useState('');
  const [recipOrg, setRecipOrg] = useState('');

  // Collect form state
  const [verifyNotes, setVerifyNotes] = useState('');

  // Staff approve state
  const [staffName, setStaffName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadListings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchSurplusListings(statusFilter);
      setListings(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || formQty === '' || formServings === '') return;

    setIsSubmitting(true);
    try {
      await createSurplusListing({
        title: formTitle,
        food_category: formCat,
        quantity_kg: Number(formQty),
        servings_estimate: Number(formServings),
        prepared_time: formPrepTime,
        collection_deadline: formDeadline,
        allergens: formAllergens,
        dietary_info: formDietary,
        storage_condition: formStorage,
        review_status: 'pending_review',
      });

      setIsCreateOpen(false);
      resetCreateForm();
      if (onSuccessToast) onSuccessToast('Surplus food listing submitted for staff review.');
      loadListings();
    } catch (err: any) {
      alert(`Error creating listing: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStaffApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !staffName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateSurplusStatus(selectedListing.id, {
        status: 'available',
        review_status: 'approved',
        approval_staff_name: staffName,
      });

      setIsApproveOpen(false);
      setStaffName('');
      if (onSuccessToast) onSuccessToast('Surplus listing approved and published as available.');
      loadListings();
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !recipName.trim()) return;

    setIsSubmitting(true);
    try {
      await updateSurplusStatus(selectedListing.id, {
        status: 'claimed',
        recipient_name: recipName,
        recipient_contact: recipContact,
        recipient_organization: recipOrg,
      });

      setIsClaimOpen(false);
      setRecipName('');
      setRecipContact('');
      setRecipOrg('');
      if (onSuccessToast) onSuccessToast('Surplus food claimed for pickup.');
      loadListings();
    } catch (err: any) {
      alert(`Claim error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing) return;

    setIsSubmitting(true);
    try {
      await updateSurplusStatus(selectedListing.id, {
        status: 'collected',
        verification_notes: verifyNotes || 'Pickup verified by duty supervisor.',
      });

      setIsCollectOpen(false);
      setVerifyNotes('');
      if (onSuccessToast) onSuccessToast('Food rescue pickup verified and recorded.');
      loadListings();
    } catch (err: any) {
      alert(`Collection error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this surplus rescue listing?')) return;
    try {
      await deleteSurplusListing(id);
      setListings(listings.filter((l) => l.id !== id));
      if (onSuccessToast) onSuccessToast('Listing removed.');
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const resetCreateForm = () => {
    setFormTitle('');
    setFormQty('');
    setFormServings('');
  };

  return (
    <div className="space-y-6">
      {/* Demonstration & Safety Protocol Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-xs text-blue-900 shadow-xs">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-blue-950">Local Demonstration & Food Safety Protocol:</strong>{' '}
          In accordance with food safety regulations, surplus prepared meals require kitchen staff inspection & approval before being published as available.
          This local workflow demonstrates verified recipient claims and physical collection auditing without external API reliance.
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-charcoal-200 card-shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-charcoal-700">Filter Status:</span>
          <div className="flex flex-wrap gap-1.5">
            {['All', 'pending_review', 'available', 'claimed', 'collected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors ${
                  statusFilter === st
                    ? 'bg-forest-600 text-white'
                    : 'bg-warm-50 hover:bg-charcoal-100 text-charcoal-700'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold rounded-lg transition-all shadow-xs active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>List Surplus Food</span>
        </button>
      </div>

      {/* Listings Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-charcoal-500">Loading surplus listings...</div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-charcoal-200 border-dashed p-12 text-center text-xs text-charcoal-400">
          No surplus food listings found. Click "List Surplus Food" to initiate a redistribution entry.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((item) => {
            const isPending = item.status === 'pending_review';
            const isAvail = item.status === 'available';
            const isClaimed = item.status === 'claimed';
            const isCollected = item.status === 'collected';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-charcoal-200 p-5 card-shadow space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-forest-700 uppercase tracking-wider block">
                      {item.food_category}
                    </span>
                    <h4 className="font-bold text-charcoal-900 text-base mt-0.5">{item.title}</h4>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      isCollected
                        ? 'bg-emerald-100 text-emerald-800'
                        : isClaimed
                        ? 'bg-blue-100 text-blue-800'
                        : isAvail
                        ? 'bg-forest-100 text-forest-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-warm-50 p-3 rounded-lg border border-charcoal-150">
                  <div>
                    <span className="text-charcoal-500 block">Quantity</span>
                    <strong className="text-charcoal-900 font-semibold">
                      {item.quantity_kg} kg (~{item.servings_estimate} meals)
                    </strong>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block">Collection Deadline</span>
                    <strong className="text-charcoal-900 font-semibold">
                      {item.collection_deadline}
                    </strong>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block">Storage State</span>
                    <span className="text-charcoal-700">{item.storage_condition || 'Standard'}</span>
                  </div>
                  <div>
                    <span className="text-charcoal-500 block">Dietary & Allergens</span>
                    <span className="text-charcoal-700">
                      {item.dietary_info || 'Standard'} • {item.allergens || 'None'}
                    </span>
                  </div>
                </div>

                {/* Audit & Staff/Recipient Info */}
                <div className="text-[11px] space-y-1 text-charcoal-600 border-t border-charcoal-100 pt-2.5">
                  {item.approval_staff_name && (
                    <div className="flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
                      <span>Approved by: <strong>{item.approval_staff_name}</strong></span>
                    </div>
                  )}

                  {item.recipient_name && (
                    <div className="flex items-center space-x-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      <span>
                        Recipient: <strong>{item.recipient_name}</strong>{' '}
                        {item.recipient_organization && `(${item.recipient_organization})`}
                      </span>
                    </div>
                  )}

                  {item.verification_notes && (
                    <div className="flex items-center space-x-1.5 text-emerald-800">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{item.verification_notes}</span>
                    </div>
                  )}
                </div>

                {/* Status-specific Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-charcoal-100">
                  <span className="text-[10px] text-charcoal-400 font-mono">
                    ID #{item.id} • Local Demo
                  </span>

                  <div className="flex items-center space-x-2">
                    {isPending && (
                      <button
                        onClick={() => {
                          setSelectedListing(item);
                          setIsApproveOpen(true);
                        }}
                        className="px-3 py-1.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Approve for Rescue
                      </button>
                    )}

                    {isAvail && (
                      <button
                        onClick={() => {
                          setSelectedListing(item);
                          setIsClaimOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Claim for Pickup
                      </button>
                    )}

                    {isClaimed && (
                      <button
                        onClick={() => {
                          setSelectedListing(item);
                          setIsCollectOpen(true);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition-colors shadow-xs"
                      >
                        Verify & Complete Pickup
                      </button>
                    )}

                    {isCollected && (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Delivered
                      </span>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 hover:bg-rose-50 text-charcoal-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove Listing"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Surplus Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-charcoal-100">
              <div className="flex items-center space-x-2">
                <HeartHandshake className="w-5 h-5 text-forest-600" />
                <h3 className="font-bold text-charcoal-900 text-base">List Edible Surplus Food</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 text-charcoal-400 hover:text-charcoal-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Food Description / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Steamed Rice & Mixed Dal Curry"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Category</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs bg-white"
                  >
                    <option value="Grains">Grains</option>
                    <option value="Meat">Meat</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Vegetables</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Quantity (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="15"
                    value={formQty}
                    onChange={(e) => setFormQty(parseFloat(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Est. Servings</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="40"
                    value={formServings}
                    onChange={(e) => setFormServings(parseInt(e.target.value) || '')}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Prepared Time</label>
                  <input
                    type="text"
                    value={formPrepTime}
                    onChange={(e) => setFormPrepTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">
                    Pickup Deadline
                  </label>
                  <input
                    type="text"
                    value={formDeadline}
                    onChange={(e) => setFormDeadline(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Dietary Tag</label>
                  <input
                    type="text"
                    value={formDietary}
                    onChange={(e) => setFormDietary(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-charcoal-700 mb-1">Allergens</label>
                  <input
                    type="text"
                    value={formAllergens}
                    onChange={(e) => setFormAllergens(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Storage Condition</label>
                <input
                  type="text"
                  value={formStorage}
                  onChange={(e) => setFormStorage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-charcoal-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg text-xs shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit for Staff Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Approval Modal */}
      {isApproveOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-charcoal-900 text-base">Staff Food Safety Approval</h3>
            <p className="text-xs text-charcoal-600">
              Confirm sensory quality, temperature holding status, and food hygiene before releasing listing:
              <strong className="block text-charcoal-800 mt-1">{selectedListing.title} ({selectedListing.quantity_kg} kg)</strong>
            </p>
            <form onSubmit={handleStaffApprove} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Inspecting Staff / Chef Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chef Ramesh"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApproveOpen(false)}
                  className="px-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !staffName.trim()}
                  className="px-4 py-1.5 bg-forest-600 hover:bg-forest-700 text-white font-semibold rounded-lg text-xs shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Approving...' : 'Sign & Publish as Available'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-charcoal-900 text-base">Assign Recipient Claim</h3>
            <p className="text-xs text-charcoal-600">
              Record verified community recipient or charity partner claiming:{' '}
              <strong>{selectedListing.title}</strong>
            </p>
            <form onSubmit={handleClaim} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kavita Rao (Volunteer Lead)"
                  value={recipName}
                  onChange={(e) => setRecipName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  placeholder="+91 98451 12233"
                  value={recipContact}
                  onChange={(e) => setRecipContact(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Recipient Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. City Food Bank / Robin Hood Army"
                  value={recipOrg}
                  onChange={(e) => setRecipOrg(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimOpen(false)}
                  className="px-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !recipName.trim()}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Claiming...' : 'Confirm Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verify Collection Modal */}
      {isCollectOpen && selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-charcoal-200 card-shadow max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-charcoal-900 text-base">Verify Physical Pickup</h3>
            <p className="text-xs text-charcoal-600">
              Confirm that <strong>{selectedListing.quantity_kg} kg</strong> of{' '}
              <strong>{selectedListing.title}</strong> has been transferred to{' '}
              <strong>{selectedListing.recipient_name}</strong>.
            </p>
            <form onSubmit={handleCollect} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-charcoal-700 mb-1">
                  Verification Notes / Receipt #
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspected container seals, signed dispatch log in mess register."
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-charcoal-300 text-xs"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCollectOpen(false)}
                  className="px-3 py-1.5 text-charcoal-600 hover:bg-charcoal-100 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Record Verified Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
