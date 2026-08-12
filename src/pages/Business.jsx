import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit, FiTrash2, FiDownload,
  FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import { isLettersOnly, isExactly10Digits } from '../utils/validation';
import ConfirmModal from '../components/ConfirmModal';

const Business = () => {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  // Confirm delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    agentName: '',
    role: '',
    contactNumber: '',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [touched, setTouched] = useState({});

  const [selectedRequirements, setSelectedRequirements] = useState(['Website Development']);

  const requirementsList = [
    'Website Development', 'Digital Marketing', 'SEO',
    'Application Development', 'CRM Development', 'ERP Development',
    'E-Commerce', 'Video Editing', 'Photography', 'Branding', 'Other'
  ];

  const toggleRequirement = (req) => {
    if (selectedRequirements.includes(req)) {
      if (selectedRequirements.length === 1) {
        toast.error('Please select at least one requirement');
        return;
      }
      setSelectedRequirements(selectedRequirements.filter(r => r !== req));
    } else {
      setSelectedRequirements([...selectedRequirements, req]);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/business', { params: { search, sortBy, order, page } });
      setBusinesses(res.data.businesses || []);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error('Failed to load businesses list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBusinesses(); }, [search, sortBy, order, page]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  // Validations
  const isBusinessNameValid = form.businessName.trim() !== '' && isLettersOnly(form.businessName);
  const isAgentNameValid = form.agentName.trim() !== '' && isLettersOnly(form.agentName);
  const isRoleValid = form.role.trim() !== '' && isLettersOnly(form.role);
  const isContactValid = isExactly10Digits(form.contactNumber);
  const isLocationValid = form.location.trim() !== '';
  const isDescriptionValid = form.description.trim() !== '';

  const isFormValid = isBusinessNameValid && isAgentNameValid && isRoleValid && isContactValid && isLocationValid && isDescriptionValid;

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.description.trim()) {
      toast.error('Description is required. Please provide details before submitting.');
      return;
    }

    if (!isFormValid) {
      toast.error('Please fix the validation errors in the form.');
      return;
    }

    setSubmitting(true);
    const payload = {
      ...form,
      requirement: selectedRequirements
    };
    try {
      if (editId) {
        await api.put(`/business/${editId}`, payload);
        toast.success('Business lead updated successfully');
      } else {
        await api.post('/business', payload);
        toast.success('Business lead added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchBusinesses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit lead');
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
      await api.delete(`/business/${deleteId}`);
      toast.success('Lead removed successfully');
      setDeleteId(null);
      fetchBusinesses();
    } catch {
      toast.error('Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (item) => {
    setEditId(item._id);
    setForm({
      businessName: item.businessName || '',
      agentName: item.agentName || '',
      role: item.role || '',
      contactNumber: item.contactNumber || '',
      location: item.location || '',
      description: item.description || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setTouched({});
    let parsedReqs = ['Website Development'];
    if (Array.isArray(item.requirement) && item.requirement.length > 0) {
      parsedReqs = item.requirement;
    } else if (typeof item.requirement === 'string' && item.requirement) {
      parsedReqs = item.requirement.split(',').map(s => s.trim()).filter(Boolean);
    }
    setSelectedRequirements(parsedReqs);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      businessName: '', agentName: '', role: '', contactNumber: '',
      location: '', description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setTouched({});
    setSelectedRequirements(['Website Development']);
  };

  const handleExportExcel = async () => {
    try {
      const res = await api.get('/business/export/excel', { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = 'crevionads_leads.xlsx';
      link.click();
      toast.success('Excel report downloaded');
    } catch { toast.error('Excel export failed'); }
  };

  const handleExportPDF = async () => {
    try {
      const res = await api.get('/business/export/pdf', { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = 'crevionads_leads.pdf';
      link.click();
      toast.success('PDF report downloaded');
    } catch { toast.error('PDF export failed'); }
  };

  const handleSort = (field) => {
    if (sortBy === field) setOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
  };

  /* ─── Modern Input Style (Cleaner Sharp Corners) ─── */
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
    <div className="space-y-5" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Business Numbers</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            Register, view, and track leads for Crevionads.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-xs transition-colors text-[11px] font-bold"
          >
            <FiDownload size={11} /> Export Excel
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 shadow-xs transition-colors text-[11px] font-bold"
          >
            <FiDownload size={11} /> Export PDF
          </button>
          <button
            type="button"
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: '#8a32c6', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(138,50,198,0.25)', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#7828b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#8a32c6'}
          >
            <FiPlus size={11} /> Add Lead
          </button>
        </div>
      </div>

      {/* ── Search + Sort ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', minWidth: 220 }}>
          <FiSearch size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#8a32c6', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...INPUT, paddingLeft: 28 }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', fontWeight: 700, color: '#76726a' }}>
          <span>Sort:</span>
          {[['businessName', 'Name'], ['date', 'Date']].map(([field, label]) => (
            <button
              type="button"
              key={field}
              onClick={() => handleSort(field)}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                background: sortBy === field ? 'rgba(138,50,198,0.1)' : '#ffffff',
                border: sortBy === field ? '1px solid rgba(138,50,198,0.4)' : '1px solid #e5e3de',
                color: sortBy === field ? '#8a32c6' : '#76726a',
              }}
            >
              {label} {sortBy === field && (order === 'asc' ? '▲' : '▼')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(138,50,198,0.12)', borderRadius: 6, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
            <div style={{ width: 28, height: 28, border: '2px solid #8a32c6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 10, color: '#76726a' }}>Loading leads data...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(138,50,198,0.15)', background: 'rgba(138,50,198,0.06)' }}>
                  {['Business Name','Agent Name','Role','Contact','Location','Requirement','Date','Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 12px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#8a32c6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.length > 0 ? businesses.map((item) => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: '1px solid rgba(138,50,198,0.06)', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,50,198,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#2c2438' }}>{item.businessName}</td>
                    <td style={{ padding: '9px 12px', color: '#57544e' }}>{item.agentName}</td>
                    <td style={{ padding: '9px 12px', color: '#76726a' }}>{item.role}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#57544e' }}>{item.contactNumber}</td>
                    <td style={{ padding: '9px 12px', color: '#57544e' }}>{item.location}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                        {(Array.isArray(item.requirement) ? item.requirement : (item.requirement ? item.requirement.split(', ') : [])).map((req, i) => (
                          <span key={i} style={{ padding: '2px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(138,50,198,0.08)', border: '1px solid rgba(138,50,198,0.2)', color: '#8a32c6', whiteSpace: 'nowrap' }}>
                            {req}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#888', fontSize: 10 }}>
                      {item.date ? new Date(item.date).toLocaleDateString() : ''}
                    </td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button type="button" onClick={() => openEditModal(item)} title="Edit" style={{ color: '#8a32c6', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#7828b0'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8a32c6'}
                        >
                          <FiEdit size={13} />
                        </button>
                        <button type="button" onClick={() => confirmDelete(item._id)} title="Delete" style={{ color: '#a5a198', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#a5a198'}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#a5a198', fontSize: 11, fontStyle: 'italic' }}>
                      No business leads found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {!loading && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#ffffff', border: '1px solid rgba(138,50,198,0.12)', borderRadius: 6, fontSize: 10, color: '#76726a' }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ padding: 6, borderRadius: 4, background: '#fff', border: '1px solid #e5e3de', color: '#57544e', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
            >
              <FiChevronLeft size={13} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              style={{ padding: 6, borderRadius: 4, background: '#fff', border: '1px solid #e5e3de', color: '#57544e', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
            >
              <FiChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', border: '1px solid rgba(138,50,198,0.2)', borderRadius: 8, padding: '22px 20px', boxShadow: '0 16px 40px rgba(0,0,0,0.12)', position: 'relative' }}>

            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#a5a198', cursor: 'pointer', padding: 4 }}
              onMouseEnter={e => e.currentTarget.style.color = '#2c2438'}
              onMouseLeave={e => e.currentTarget.style.color = '#a5a198'}
            >
              <FiX size={16} />
            </button>

            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#8a32c6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>
              {editId ? 'Edit Business Lead' : 'Add New Lead'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Business Name *
                  </label>
                  <input 
                    type="text" 
                    name="businessName" 
                    required 
                    value={form.businessName} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Western Bakery"
                    style={{ ...INPUT, borderColor: (touched.businessName && !isBusinessNameValid) ? '#ef4444' : INPUT.border }} 
                    onFocus={onFocus} 
                  />
                  {touched.businessName && !isBusinessNameValid && (
                    <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Letters and spaces only</span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Agent Name *
                  </label>
                  <input 
                    type="text" 
                    name="agentName" 
                    required 
                    value={form.agentName} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Salam"
                    style={{ ...INPUT, borderColor: (touched.agentName && !isAgentNameValid) ? '#ef4444' : INPUT.border }} 
                    onFocus={onFocus} 
                  />
                  {touched.agentName && !isAgentNameValid && (
                    <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Letters and spaces only</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Designation *
                  </label>
                  <input 
                    type="text" 
                    name="role" 
                    required 
                    value={form.role} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Developer"
                    style={{ ...INPUT, borderColor: (touched.role && !isRoleValid) ? '#ef4444' : INPUT.border }} 
                    onFocus={onFocus} 
                  />
                  {touched.role && !isRoleValid && (
                    <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Letters and spaces only</span>
                  )}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Contact (10 Digits) *
                  </label>
                  <input 
                    type="text" 
                    name="contactNumber" 
                    required 
                    value={form.contactNumber} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="9745307450"
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', borderColor: (touched.contactNumber && !isContactValid) ? '#ef4444' : INPUT.border }} 
                    onFocus={onFocus} 
                  />
                  {touched.contactNumber && !isContactValid && (
                    <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Exactly 10 digits required</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Location *
                  </label>
                  <input 
                    type="text" 
                    name="location" 
                    required 
                    value={form.location} 
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Malappuram"
                    style={INPUT} 
                    onFocus={onFocus} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                    Date Added *
                  </label>
                  <input 
                    type="date" 
                    name="date" 
                    required 
                    value={form.date} 
                    onChange={handleChange}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }} 
                    onFocus={onFocus} 
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5 }}>
                  Requirements ({selectedRequirements.length} selected) *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 120, overflowY: 'auto', padding: '8px 10px', border: '1px solid rgba(138,50,198,0.18)', borderRadius: 6, background: '#fafaf9' }}>
                  {requirementsList.map(r => {
                    const isChecked = selectedRequirements.includes(r);
                    return (
                      <label 
                        key={r} 
                        style={{ 
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, fontWeight: isChecked ? 700 : 500, color: isChecked ? '#8a32c6' : '#57544e',
                          padding: '3px 6px', borderRadius: 4, background: isChecked ? 'rgba(138,50,198,0.08)' : 'transparent', transition: 'all 0.15s'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRequirement(r)}
                          style={{ accentColor: '#8a32c6', width: 13, height: 13, cursor: 'pointer' }}
                        />
                        <span style={{ lineHeight: 1.2 }}>{r}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 4 }}>
                  Description *
                </label>
                <textarea 
                  name="description" 
                  rows="2" 
                  required
                  placeholder="Enter lead details or notes..."
                  value={form.description} 
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{ ...INPUT, resize: 'none', borderColor: (touched.description && !isDescriptionValid) ? '#ef4444' : INPUT.border }} 
                  onFocus={onFocus} 
                />
                {touched.description && !isDescriptionValid && (
                  <span style={{ fontSize: 9, color: '#ef4444', fontWeight: 600 }}>Description is required</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 6 }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '9px 0', background: '#fafaf9', border: '1px solid #e5e3de', borderRadius: 6, color: '#57544e', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!isFormValid || submitting}
                  style={{ 
                    flex: 1, 
                    padding: '9px 0', 
                    background: isFormValid ? '#8a32c6' : '#cccccc', 
                    border: 'none', 
                    borderRadius: 6, 
                    color: '#fff', 
                    fontWeight: 800, 
                    fontSize: 11, 
                    letterSpacing: '0.06em', 
                    textTransform: 'uppercase', 
                    cursor: (isFormValid && !submitting) ? 'pointer' : 'not-allowed', 
                    opacity: submitting ? 0.6 : 1, 
                    boxShadow: isFormValid ? '0 3px 12px rgba(138,50,198,0.25)' : 'none',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: 6 
                  }}
                >
                  {submitting ? 'Saving...' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Custom Delete Confirmation Modal ── */}
      <ConfirmModal
        isOpen={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Business Lead"
        message="Are you sure you want to remove this lead record? This action cannot be undone."
        confirmText="Remove Lead"
        loading={deleting}
      />

    </div>
  );
};

export default Business;
