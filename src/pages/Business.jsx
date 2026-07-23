import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiEdit, FiTrash2, FiDownload,
  FiChevronLeft, FiChevronRight, FiX
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

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

  const [form, setForm] = useState({
    businessName: '',
    agentName: '',
    role: '',
    contactNumber: '',
    location: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

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

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      requirement: selectedRequirements.join(', ')
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
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this lead?')) return;
    try {
      await api.delete(`/business/${id}`);
      toast.success('Lead deleted');
      fetchBusinesses();
    } catch {
      toast.error('Failed to delete lead');
    }
  };

  const openEditModal = (item) => {
    setEditId(item._id);
    setForm({
      businessName: item.businessName,
      agentName: item.agentName,
      role: item.role,
      contactNumber: item.contactNumber,
      location: item.location,
      description: item.description,
      date: new Date(item.date).toISOString().split('T')[0]
    });
    const parsedReqs = item.requirement 
      ? item.requirement.split(',').map(s => s.trim()).filter(Boolean) 
      : ['Website Development'];
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

  /* ─── Light theme shared input style ─── */
  const INPUT = {
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.18)',
    borderRadius: '0.5rem',
    color: '#2c2438',
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
    <div className="space-y-5" style={{ fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Business Numbers</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            Register, view, and track leads for Crevionads.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 shadow-sm transition-colors text-[11px] font-bold"
          >
            <FiDownload size={11} /> Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 shadow-sm transition-colors text-[11px] font-bold"
          >
            <FiDownload size={11} /> Export PDF
          </button>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: '#8a32c6', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, boxShadow: '0 3px 12px rgba(138,50,198,0.28)', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#a35ad6'}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '10px', fontWeight: 700, color: '#76726a', fontFamily: 'Montserrat, sans-serif' }}>
          <span>Sort:</span>
          {[['businessName', 'Name'], ['date', 'Date']].map(([field, label]) => (
            <button
              key={field}
              onClick={() => handleSort(field)}
              style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 10, fontWeight: 700,
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
      <div style={{ background: '#ffffff', border: '1px solid rgba(138,50,198,0.1)', borderRadius: 10, overflow: 'hidden', boxShadow: '0 2px 12px rgba(138,50,198,0.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12 }}>
            <div style={{ width: 28, height: 28, border: '2px solid #8a32c6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            <p style={{ fontSize: 10, color: '#76726a', fontFamily: 'Montserrat, sans-serif' }}>Loading leads data...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: 'Montserrat, sans-serif' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(138,50,198,0.1)', background: 'rgba(138,50,198,0.04)' }}>
                  {['Business Name','Agent Name','Role','Contact','Location','Requirement','Date','Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8a32c6', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {businesses.length > 0 ? businesses.map((item) => (
                  <tr
                    key={item._id}
                    style={{ borderBottom: '1px solid rgba(138,50,198,0.06)', transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,50,198,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#2c2438' }}>{item.businessName}</td>
                    <td style={{ padding: '9px 12px', color: '#57544e' }}>{item.agentName}</td>
                    <td style={{ padding: '9px 12px', color: '#76726a' }}>{item.role}</td>
                    <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#57544e' }}>{item.contactNumber}</td>
                    <td style={{ padding: '9px 12px', color: '#57544e' }}>{item.location}</td>
                    <td style={{ padding: '9px 12px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 220 }}>
                        {(item.requirement ? item.requirement.split(', ') : []).map((req, i) => (
                          <span key={i} style={{ padding: '2px 7px', borderRadius: 99, fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', background: 'rgba(138,50,198,0.08)', border: '1px solid rgba(138,50,198,0.2)', color: '#8a32c6', whiteSpace: 'nowrap' }}>
                            {req}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '9px 12px', fontFamily: 'JetBrains Mono, monospace', color: '#a5a198', fontSize: 10 }}>{item.date}</td>
                    <td style={{ padding: '9px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => openEditModal(item)} title="Edit" style={{ color: '#8a32c6', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#a35ad6'}
                          onMouseLeave={e => e.currentTarget.style.color = '#8a32c6'}
                        >
                          <FiEdit size={12} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} title="Delete" style={{ color: '#a5a198', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = '#a5a198'}
                        >
                          <FiTrash2 size={12} />
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#ffffff', border: '1px solid rgba(138,50,198,0.1)', borderRadius: 8, fontSize: 10, fontFamily: 'Montserrat, sans-serif', color: '#76726a' }}>
          <span>Page {page} of {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPage(p => Math.max(p - 1, 1))}
              disabled={page === 1}
              style={{ padding: 6, borderRadius: 6, background: '#fff', border: '1px solid #e5e3de', color: '#57544e', cursor: 'pointer', opacity: page === 1 ? 0.4 : 1 }}
            >
              <FiChevronLeft size={13} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(p + 1, totalPages))}
              disabled={page === totalPages}
              style={{ padding: 6, borderRadius: 6, background: '#fff', border: '1px solid #e5e3de', color: '#57544e', cursor: 'pointer', opacity: page === totalPages ? 0.4 : 1 }}
            >
              <FiChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', itemsCenter: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '1px solid rgba(138,50,198,0.15)', borderRadius: 12, padding: '24px 22px', boxShadow: '0 20px 50px rgba(0,0,0,0.12)', position: 'relative', animation: 'fadeIn 0.2s ease' }}>

            <button
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', right: 14, top: 14, background: 'none', border: 'none', color: '#a5a198', cursor: 'pointer', padding: 4, borderRadius: 6 }}
              onMouseEnter={e => e.currentTarget.style.color = '#2c2438'}
              onMouseLeave={e => e.currentTarget.style.color = '#a5a198'}
            >
              <FiX size={15} />
            </button>

            {/* Yellow top accent line */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #f4ce41, transparent)', borderRadius: '12px 12px 0 0' }} />

            <h3 style={{ fontSize: 11, fontWeight: 800, color: '#8a32c6', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 18, fontFamily: 'Montserrat, sans-serif' }}>
              {editId ? 'Edit Business Lead' : 'Add New Lead'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Business Name</label>
                  <input type="text" name="businessName" required value={form.businessName} onChange={handleChange} style={INPUT} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Agent Name</label>
                  <input type="text" name="agentName" required value={form.agentName} onChange={handleChange} style={INPUT} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Designation</label>
                  <input type="text" name="role" required value={form.role} onChange={handleChange} style={INPUT} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Contact</label>
                  <input type="text" name="contactNumber" required value={form.contactNumber} onChange={handleChange} style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Location</label>
                  <input type="text" name="location" required value={form.location} onChange={handleChange} style={INPUT} onFocus={onFocus} onBlur={onBlur} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Date Added</label>
                  <input type="date" name="date" required value={form.date} onChange={handleChange} style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 6, fontFamily: 'Montserrat, sans-serif' }}>
                  Requirements (Tick all that apply — {selectedRequirements.length} selected)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 130, overflowY: 'auto', padding: '8px 10px', border: '1px solid rgba(138,50,198,0.18)', borderRadius: 8, background: '#fafaf9' }}>
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
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Date Added</label>
                <input type="date" name="date" required value={form.date} onChange={handleChange} style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#76726a', marginBottom: 5, fontFamily: 'Montserrat, sans-serif' }}>Description</label>
                <textarea name="description" rows="2" value={form.description} onChange={handleChange} style={{ ...INPUT, resize: 'none' }} onFocus={onFocus} onBlur={onBlur} />
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setIsModalOpen(false)}
                  style={{ flex: 1, padding: '9px 0', background: '#fafaf9', border: '1px solid #e5e3de', borderRadius: 7, color: '#57544e', fontWeight: 700, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '9px 0', background: '#8a32c6', border: 'none', borderRadius: 7, color: '#fff', fontWeight: 800, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 16px rgba(138,50,198,0.3)', fontFamily: 'Montserrat, sans-serif' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#a35ad6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#8a32c6'}
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Business;
