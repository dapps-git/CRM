import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { isLettersOnly, isExactly10Digits } from '../utils/validation';
import ConfirmModal from '../components/ConfirmModal';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    phoneNumber: ''
  });

  const [touched, setTouched] = useState({});

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/member', { params: { search } });
      setMembers(res.data || []);
    } catch {
      toast.error('Failed to load members list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Validations
  const isNameValid = form.name.trim() !== '' && isLettersOnly(form.name);
  const isPhoneValid = isExactly10Digits(form.phoneNumber);
  const isFormValid = isNameValid && isPhoneValid;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!isNameValid) {
      toast.error('Member name must contain letters and spaces only');
      return;
    }
    if (!isPhoneValid) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/member/${editId}`, form);
        toast.success('Member details updated successfully');
      } else {
        await api.post('/member', form);
        toast.success('Member added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/member/${deleteId}`);
      toast.success('Member removed');
      setDeleteId(null);
      fetchMembers();
    } catch {
      toast.error('Failed to remove member');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (item) => {
    setEditId(item._id);
    setForm({
      name: item.name || '',
      phoneNumber: item.phoneNumber || ''
    });
    setTouched({});
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: '', phoneNumber: '' });
    setTouched({});
  };

  /* ─── Shared Inputs ─── */
  const INPUT = {
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.2)',
    borderRadius: '6px',
    color: '#2c2438',
    fontSize: '11px',
    fontFamily: 'Montserrat, sans-serif',
    outline: 'none',
    width: '100%',
    padding: '7px 10px',
    transition: 'all 0.15s ease-in-out',
  };
  const onFocus = e => { e.target.style.borderColor = '#8a32c6'; e.target.style.boxShadow = '0 0 0 2px rgba(138,50,198,0.12)'; };
  const onBlur  = e => { e.target.style.borderColor = 'rgba(138,50,198,0.2)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="space-y-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Members Directory</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">Manage team partners and staff contact records.</p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: '#8a32c6', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(138,50,198,0.25)', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = '#7828b0'}
          onMouseLeave={e => e.currentTarget.style.background = '#8a32c6'}
        >
          <FiPlus size={12} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative w-full max-w-xs">
        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a32c6]" size={12} />
        <input
          type="text"
          placeholder="Search members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...INPUT, paddingLeft: 28 }}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      {/* Main Members Grid list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
          <p className="text-2xs text-neutral-500">Loading directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.length > 0 ? (
            members.map((item) => (
              <div 
                key={item._id} 
                className="bg-white border border-neutral-200/60 p-4 rounded-lg flex items-center justify-between shadow-xs hover:shadow-sm transition-shadow relative group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#8a32c6]/10 text-[#8a32c6] flex items-center justify-center font-bold text-2xs border border-[#8a32c6]/20">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-800 text-2xs uppercase tracking-wider">{item.name}</h3>
                    <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{item.phoneNumber}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openEditModal(item)}
                    className="text-[#8a32c6] hover:text-[#7828b0] transition-colors p-1"
                    title="Edit Member"
                  >
                    <FiEdit size={13} />
                  </button>
                  <button
                    onClick={() => confirmDelete(item._id)}
                    className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                    title="Delete Member"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-neutral-400 font-semibold italic text-2xs">
              No team members registered yet. Click Add Member to begin.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Member Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={16} />
            </button>

            <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-widest mb-4">
              {editId ? 'Edit Team Member' : 'Register New Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Full Name (Letters Only) *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ ...INPUT, borderColor: (touched.name && !isNameValid) ? '#ef4444' : INPUT.border }}
                  onFocus={onFocus}
                />
                {touched.name && !isNameValid && (
                  <span className="text-[9px] text-rose-500 block font-normal mt-0.5">Letters and spaces only</span>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Phone Number (10 Digits) *</label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  placeholder="e.g. 9876543210"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', borderColor: (touched.phoneNumber && !isPhoneValid) ? '#ef4444' : INPUT.border }}
                  onFocus={onFocus}
                />
                {touched.phoneNumber && !isPhoneValid && (
                  <span className="text-[9px] text-rose-500 block font-normal mt-0.5">Exactly 10 digits required</span>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 font-bold uppercase transition-colors text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || submitting}
                  style={{
                    background: isFormValid ? '#8a32c6' : '#cccccc',
                    cursor: (isFormValid && !submitting) ? 'pointer' : 'not-allowed'
                  }}
                  className="flex-1 py-2 text-white font-bold uppercase transition-colors rounded-md text-[10px] flex items-center justify-center space-x-1"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Member</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Team Member"
        message="Are you sure you want to remove this member? This action cannot be undone."
        confirmText="Remove Member"
        loading={deleting}
      />

    </div>
  );
};

export default Members;
