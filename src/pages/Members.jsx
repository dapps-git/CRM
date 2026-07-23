import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Members = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    phoneNumber: ''
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/member', { params: { search } });
      setMembers(res.data || []);
    } catch (err) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phoneNumber) {
      return toast.error('Please enter name and phone number');
    }

    try {
      if (editId) {
        await api.put(`/member/${editId}`, form);
        toast.success('Member details updated');
      } else {
        await api.post('/member', form);
        toast.success('Member added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member? This will affect their leave history.')) return;
    try {
      await api.delete(`/member/${id}`);
      toast.success('Member removed');
      fetchMembers();
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const openEditModal = (item) => {
    setEditId(item._id);
    setForm({
      name: item.name,
      phoneNumber: item.phoneNumber
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ name: '', phoneNumber: '' });
  };

  /* ─── Shared Inputs ─── */
  const INPUT = {
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.18)',
    borderRadius: '0.5rem',
    color: 'var(--text-primary)',
    fontSize: '12px',
    fontFamily: 'Montserrat, sans-serif',
    outline: 'none',
    width: '100%',
    padding: '7px 10px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = e => { e.target.style.borderColor = '#8a32c6'; e.target.style.boxShadow = '0 0 0 3px rgba(138,50,198,0.15)'; };
  const onBlur  = e => { e.target.style.borderColor = 'rgba(138,50,198,0.18)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Title Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Members Directory</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">Manage team partners and staff contact records.</p>
        </div>

        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, boxShadow: '0 3px 12px var(--primary-glow)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <FiPlus size={12} />
          <span>Add Member</span>
        </button>
      </div>

      {/* Search Input bar */}
      <div className="relative w-full max-w-xs">
        <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-500" size={12} />
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
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-2xs text-neutral-500">Loading directory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.length > 0 ? (
            members.map((item) => (
              <div 
                key={item._id} 
                className="bg-white border border-neutral-100 p-4 rounded-xl flex items-center justify-between shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50/20 text-brand-600 flex items-center justify-center font-bold text-2xs border border-brand-100">
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
                    className="text-brand-500 hover:text-brand-600 transition-colors p-1"
                    title="Edit Member"
                  >
                    <FiEdit size={12} />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                    title="Delete Member"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-neutral-450 font-semibold italic text-2xs">
              No team members registered yet. Click Add Member to begin.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Member Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-sm bg-white border border-neutral-100 rounded-xl p-6 shadow-2xl relative animate-fade-in"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={15} />
            </button>

            <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">
              {editId ? 'Edit Team Member' : 'Register New Member'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={handleChange}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  placeholder="e.g. +91 9876543210"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600 font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold uppercase transition-colors rounded shadow shadow-brand-500/20"
                >
                  Save Member
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Members;
