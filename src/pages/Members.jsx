import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiFileText, FiEye, FiPaperclip, FiImage } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { isLettersOnly, isExactly10Digits } from '../utils/validation';
import ConfirmModal from '../components/ConfirmModal';
import { playAddSound, playDeleteSound } from '../utils/soundEffects';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Lightbox Preview Modal for ID Photo
  const [previewIdPhoto, setPreviewIdPhoto] = useState(null); // { idName, idPhoto }

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    phoneNumber: '',
    idProofs: [{ idName: '', idPhoto: '' }]
  });

  const [touched, setTouched] = useState({});

  // Image compression helper
  const compressImageToDataUri = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1000;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.85));
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

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

  // ID Proof Slot Handlers
  const addIdProofSlot = () => {
    if (form.idProofs.length >= 3) {
      toast.error('Maximum 3 ID proofs allowed');
      return;
    }
    setForm(prev => ({
      ...prev,
      idProofs: [...prev.idProofs, { idName: '', idPhoto: '' }]
    }));
  };

  const removeIdProofSlot = (index) => {
    if (form.idProofs.length <= 1) {
      toast.error('At least 1 ID proof is mandatory');
      return;
    }
    setForm(prev => ({
      ...prev,
      idProofs: prev.idProofs.filter((_, i) => i !== index)
    }));
  };

  const handleIdNameChange = (index, value) => {
    const updated = [...form.idProofs];
    updated[index].idName = value;
    setForm({ ...form, idProofs: updated });
  };

  const handleIdPhotoFile = async (index, file) => {
    if (!file) return;
    try {
      toast.loading('Compressing & attaching ID photo...', { id: 'photo-upload' });
      const dataUri = await compressImageToDataUri(file);
      const updated = [...form.idProofs];
      updated[index].idPhoto = dataUri;
      setForm({ ...form, idProofs: updated });
      toast.success('ID photo attached', { id: 'photo-upload' });
    } catch {
      toast.error('Failed to process image file', { id: 'photo-upload' });
    }
  };

  // Validations
  const isNameValid = form.name.trim() !== '' && isLettersOnly(form.name);
  const isPhoneValid = isExactly10Digits(form.phoneNumber);
  const hasValidIdProof = form.idProofs.some(p => p.idName?.trim() !== '' && p.idPhoto?.trim() !== '');
  const isFormValid = isNameValid && isPhoneValid && hasValidIdProof;

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
    if (!hasValidIdProof) {
      toast.error('At least 1 mandatory ID proof is required (ID Name & ID Photo)');
      return;
    }

    setSubmitting(true);
    try {
      const cleanIdProofs = form.idProofs.filter(p => p.idName?.trim() && p.idPhoto?.trim());
      const payload = { ...form, idProofs: cleanIdProofs };

      if (editId) {
        await api.put(`/member/${editId}`, payload);
        playAddSound();
        toast.success('Member details updated successfully');
      } else {
        await api.post('/member', payload);
        playAddSound();
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
      playDeleteSound();
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
      phoneNumber: item.phoneNumber || '',
      idProofs: (item.idProofs && item.idProofs.length > 0)
        ? item.idProofs
        : [{ idName: '', idPhoto: '' }]
    });
    setTouched({});
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      name: '',
      phoneNumber: '',
      idProofs: [{ idName: '', idPhoto: '' }]
    });
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
          type="button"
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
                className="bg-white border border-neutral-200/60 p-4 rounded-lg flex flex-col justify-between shadow-xs hover:shadow-sm transition-shadow relative group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-full bg-[#8a32c6]/10 text-[#8a32c6] flex items-center justify-center font-bold text-xs border border-[#8a32c6]/20">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-800 text-2xs uppercase tracking-wider">{item.name}</h3>
                      <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{item.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="text-[#8a32c6] hover:text-[#7828b0] transition-colors p-1"
                      title="Edit Member"
                    >
                      <FiEdit size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(item._id)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete Member"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ID Proofs Badges on Member Card */}
                {item.idProofs && item.idProofs.length > 0 ? (
                  <div className="mt-3 pt-2.5 border-t border-purple-100/80 flex flex-wrap gap-1.5">
                    {item.idProofs.map((idItem, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewIdPhoto(idItem)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-50/80 hover:bg-purple-100 text-[#8a32c6] border border-purple-200 text-[9.5px] font-bold rounded transition-colors"
                        title="Click to view ID Photo"
                      >
                        <FiFileText size={10} />
                        <span>{idItem.idName}</span>
                        {idItem.idPhoto && (
                          <img src={idItem.idPhoto} alt="" className="w-4 h-4 rounded object-cover border border-purple-300 ml-0.5" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 pt-2 border-t border-neutral-100 text-[9.5px] text-neutral-400 italic">
                    No ID Proof attached
                  </div>
                )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute right-3 top-3 p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={16} />
            </button>

            <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-widest mb-4">
              {editId ? 'Edit Team Member' : 'Register New Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-2xs font-semibold">
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

              {/* ── ID PROOFS SECTION (1 Mandatory, Max 3) ── */}
              <div className="border-t border-purple-100 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[#8a32c6] uppercase tracking-wider font-bold text-[10px]">
                    ID Proof Documents (1 Mandatory, Max 3) *
                  </label>
                  {form.idProofs.length < 3 && (
                    <button
                      type="button"
                      onClick={addIdProofSlot}
                      className="text-[10px] font-bold text-[#8a32c6] hover:text-[#7828b0] flex items-center gap-1"
                    >
                      <FiPlus size={12} /> + Add ID ({form.idProofs.length}/3)
                    </button>
                  )}
                </div>

                {form.idProofs.map((idSlot, idx) => (
                  <div key={idx} className="p-3 bg-purple-50/50 border border-purple-200/80 rounded-md space-y-2 relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-neutral-700 uppercase tracking-wider">
                        ID Proof #{idx + 1} {idx === 0 ? '(Mandatory)' : '(Optional)'}
                      </span>
                      {form.idProofs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIdProofSlot(idx)}
                          className="text-neutral-400 hover:text-rose-600 p-0.5"
                          title="Remove this ID slot"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      )}
                    </div>

                    {/* ID Name Input + Quick Pills */}
                    <div>
                      <input
                        type="text"
                        placeholder="e.g. Aadhaar Card, Passport, Driving License, Emirates ID"
                        value={idSlot.idName}
                        onChange={(e) => handleIdNameChange(idx, e.target.value)}
                        style={INPUT}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {['Aadhaar Card', 'Passport', 'Driving License', 'Voter ID', 'Emirates ID'].map(suggest => (
                          <button
                            key={suggest}
                            type="button"
                            onClick={() => handleIdNameChange(idx, suggest)}
                            className="px-1.5 py-0.5 bg-white border border-purple-200 text-[#8a32c6] text-[9px] font-semibold rounded hover:bg-purple-100 transition-colors"
                          >
                            + {suggest}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ID Photo File Picker & Preview */}
                    <div className="flex items-center gap-3 pt-1">
                      <input
                        type="file"
                        id={`id-photo-file-${idx}`}
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleIdPhotoFile(idx, e.target.files[0]);
                          }
                        }}
                      />
                      <label
                        htmlFor={`id-photo-file-${idx}`}
                        className="flex-1 cursor-pointer py-2 px-3 bg-white border border-dashed border-purple-300 hover:border-[#8a32c6] rounded flex items-center justify-center space-x-1.5 text-[#8a32c6] text-[10px] font-bold transition-colors"
                      >
                        <FiPaperclip size={12} />
                        <span>{idSlot.idPhoto ? 'Change ID Photo' : 'Upload ID Photo *'}</span>
                      </label>

                      {idSlot.idPhoto && (
                        <div className="relative flex-shrink-0 group">
                          <img
                            src={idSlot.idPhoto}
                            alt="ID Preview"
                            className="w-10 h-10 object-cover rounded border-2 border-[#8a32c6] shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewIdPhoto(idSlot)}
                            className="absolute inset-0 bg-black/40 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Preview ID"
                          >
                            <FiEye size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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

      {/* ── LIGHTBOX ID PHOTO PREVIEW MODAL ── */}
      {previewIdPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-neutral-200 rounded-lg p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPreviewIdPhoto(null)}
              className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <FiFileText size={16} className="text-[#8a32c6]" />
              <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-wider">
                ID Document: {previewIdPhoto.idName || 'ID Photo'}
              </h3>
            </div>

            <div className="bg-neutral-900 rounded-lg p-2 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={previewIdPhoto.idPhoto}
                alt={previewIdPhoto.idName}
                className="max-h-[65vh] w-auto max-w-full object-contain rounded"
              />
            </div>
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
