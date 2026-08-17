import React, { useState, useEffect, useMemo } from 'react';
import {
  FiGlobe,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiCheckCircle,
  FiAlertTriangle,
  FiXCircle,
  FiCopy,
  FiCheck,
  FiServer,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX,
  FiDollarSign
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { playAddSound, playDeleteSound, playSuccessSound } from '../utils/soundEffects';

// Helper to format date to DD/MM/YYYY
const formatDateDMY = (dateInput) => {
  if (!dateInput) return '—';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year}`;
    }
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const Domains = () => {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [metrics, setMetrics] = useState({
    totalDomains: 0,
    activeDomains: 0,
    expiringSoon: 0,
    expiredDomains: 0,
    totalRenewalCost: 0
  });

  // Table selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Copy indicator state
  const [copiedDomain, setCopiedDomain] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    domainName: '',
    projectName: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    platform: 'Hostinger',
    accountHolder: '',
    ownerEmail: '',
    renewalCost: 0,
    notes: ''
  });

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Domain Records
  const fetchDomains = async () => {
    setLoading(true);
    try {
      const res = await api.get('/domain', {
        params: {
          search,
          status: statusFilter !== 'All' ? statusFilter : undefined
        }
      });
      if (res.data) {
        setDomains(res.data.domains || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      toast.error('Failed to load domain records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, [search, statusFilter]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Handle Copy Domain Name
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(text);
    toast.success(`Copied ${text} to clipboard`);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingDomain(null);
    setForm({
      domainName: '',
      projectName: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      platform: 'Hostinger',
      accountHolder: '',
      ownerEmail: '',
      renewalCost: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (domain) => {
    setEditingDomain(domain);
    setForm({
      domainName: domain.domainName || '',
      projectName: domain.projectName || '',
      purchaseDate: domain.purchaseDate ? new Date(domain.purchaseDate).toISOString().split('T')[0] : '',
      expirationDate: domain.expirationDate ? new Date(domain.expirationDate).toISOString().split('T')[0] : '',
      platform: domain.platform || 'Hostinger',
      accountHolder: domain.accountHolder || '',
      ownerEmail: domain.ownerEmail || '',
      renewalCost: domain.renewalCost || 0,
      notes: domain.notes || ''
    });
    setIsModalOpen(true);
  };

  // Save / Update Domain Record
  const handleSaveDomain = async (e) => {
    e.preventDefault();
    if (!form.domainName.trim()) {
      return toast.error('Please enter a domain name');
    }
    if (!form.expirationDate) {
      return toast.error('Please enter an expiration date');
    }

    setSaving(true);
    try {
      if (editingDomain) {
        await api.put(`/domain/${editingDomain._id}`, form);
        playSuccessSound();
        toast.success('Domain record updated');
      } else {
        await api.post('/domain', form);
        playAddSound();
        toast.success('New domain added successfully');
      }
      setIsModalOpen(false);
      fetchDomains();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save domain record');
    } finally {
      setSaving(false);
    }
  };

  // Confirm & Delete Domain
  const confirmDelete = (id) => setDeleteId(id);

  const handleDeleteDomain = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/domain/${deleteId}`);
      playDeleteSound();
      toast.success('Domain record deleted');
      setDeleteId(null);
      fetchDomains();
    } catch (err) {
      toast.error('Failed to delete domain record');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered & Paginated Domains
  const filteredDomains = useMemo(() => {
    return domains.filter(d => {
      if (statusFilter === 'All') return true;
      return d.status === statusFilter;
    });
  }, [domains, statusFilter]);

  const totalPages = Math.ceil(filteredDomains.length / pageSize) || 1;
  const paginatedDomains = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDomains.slice(start, start + pageSize);
  }, [filteredDomains, currentPage, pageSize]);

  // Handle Select All Checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedDomains.map(d => d._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Status Badge Component (Square Corners - rounded-none)
  const renderStatusBadge = (status) => {
    if (status === 'Active') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <span className="w-2 h-2 bg-emerald-500 animate-pulse" />
          <span>Active</span>
        </span>
      );
    }
    if (status === 'Expiring Soon') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300 shadow-2xs">
          <FiAlertTriangle className="text-rose-600" size={11} />
          <span>Expiring Soon</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        <FiXCircle className="text-rose-700" size={11} />
        <span>Expired</span>
      </span>
    );
  };

  return (
    <div className="space-y-4 font-sans text-neutral-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* ── Page Header (Square Corners - rounded-none) ── */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-none border border-purple-200/70 shadow-xs">
        <div>
          <h1 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-gradient-to-br from-[#8a32c6] to-[#6b21a8] text-white flex items-center justify-center shadow-xs">
              <FiGlobe size={15} />
            </div>
            Domain Purchasing & Renewal Management
          </h1>
          <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
            Track domain purchases, expiration dates (DD/MM/YYYY), Hostinger accounts & automatic email alert notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-none bg-gradient-to-r from-[#8a32c6] to-[#7828b0] hover:from-[#7828b0] hover:to-[#631f96] text-white text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer"
        >
          <FiPlus size={14} /> Add New Domain
        </button>
      </div>

      {/* ── Metric Cards Overview (Square Corners - rounded-none) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Total Domains</p>
            <h3 className="text-xl font-extrabold text-neutral-900 mt-0.5">{metrics.totalDomains}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-purple-50 text-[#8a32c6] flex items-center justify-center border border-purple-100">
            <FiGlobe size={18} />
          </div>
        </div>

        <div className="bg-white border border-emerald-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Active Domains</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-0.5">{metrics.activeDomains}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <FiCheckCircle size={18} />
          </div>
        </div>

        <div className="bg-white border border-rose-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Expiring (&lt; 2 Months)</p>
            <h3 className="text-xl font-extrabold text-rose-600 mt-0.5">{metrics.expiringSoon}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
            <FiAlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white border border-amber-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Est. Renewal Cost</p>
            <h3 className="text-xl font-extrabold text-[#8a32c6] mt-0.5">₹{metrics.totalRenewalCost?.toLocaleString()}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-amber-50 text-[#8a32c6] flex items-center justify-center border border-amber-100">
            <FiDollarSign size={18} />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls (Square Corners - rounded-none) ── */}
      <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs flex flex-wrap justify-between items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" size={14} />
          <input
            type="text"
            placeholder="Search domain name, project, platform, holder, email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 bg-purple-50/30 border border-purple-200/80 rounded-none text-xs outline-none focus:border-[#8a32c6] focus:bg-white focus:ring-2 focus:ring-[#8a32c6]/10 transition-all font-medium"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Filter Status:</span>
          <div className="inline-flex bg-purple-50/60 p-0.5 rounded-none border border-purple-200/80">
            {['All', 'Active', 'Expiring Soon', 'Expired'].map(st => (
              <button
                key={st}
                type="button"
                onClick={() => { setStatusFilter(st); setCurrentPage(1); }}
                className={`px-3 py-1 text-xs font-bold rounded-none transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#f4ce41] text-[#2c2438] shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Domain Table (Square Corners - rounded-none) ── */}
      <div className="bg-white border border-purple-200/80 rounded-none overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="w-7 h-7 border-3 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-semibold">Loading domain records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-200/80 bg-gradient-to-r from-[#8a32c6]/10 to-[#f4ce41]/10 text-[#8a32c6] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedDomains.length > 0 && selectedIds.length === paginatedDomains.length}
                      className="rounded-none border-purple-300 text-[#8a32c6] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Domain Name</th>
                  <th className="py-2.5 px-3">Project Name</th>
                  <th className="py-2.5 px-3">Platform & Holder</th>
                  <th className="py-2.5 px-3">Purchased Date</th>
                  <th className="py-2.5 px-3">Expiration Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70 font-medium text-neutral-800">
                {paginatedDomains.length > 0 ? (
                  paginatedDomains.map((item) => (
                    <tr key={item._id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item._id)}
                          onChange={() => handleSelectRow(item._id)}
                          className="rounded-none border-purple-300 text-[#8a32c6] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-extrabold text-neutral-900 text-xs">
                            {item.domainName}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.domainName)}
                            className="text-neutral-400 hover:text-[#8a32c6] transition-colors p-0.5"
                            title="Copy Domain Name"
                          >
                            {copiedDomain === item.domainName ? (
                              <FiCheck size={11} className="text-emerald-600" />
                            ) : (
                              <FiCopy size={11} />
                            )}
                          </button>
                        </div>
                        {item.renewalCost > 0 && (
                          <div className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                            Est. Cost: ₹{item.renewalCost.toLocaleString()}/yr
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-neutral-800">
                        {item.projectName || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col space-y-0.5">
                          <span className="font-bold text-[#8a32c6] flex items-center gap-1 text-[11px]">
                            <FiServer size={10} className="text-[#8a32c6]" /> {item.platform || 'Hostinger'}
                          </span>
                          {item.accountHolder && (
                            <span className="text-[10px] text-neutral-500 truncate max-w-[140px]" title={item.accountHolder}>
                              Account: <strong className="text-neutral-700">{item.accountHolder}</strong>
                            </span>
                          )}
                          {item.ownerEmail && (
                            <span className="text-[10px] text-purple-700 font-semibold truncate max-w-[150px]" title={item.ownerEmail}>
                              Mail: {item.ownerEmail}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-600 font-semibold">
                        {formatDateDMY(item.purchaseDate)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">
                        {formatDateDMY(item.expirationDate)}
                      </td>
                      <td className="py-2.5 px-3">
                        {renderStatusBadge(item.status)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#8a32c6] border border-purple-200 text-xs font-bold rounded-none transition-all cursor-pointer"
                            title="Manage Domain Details"
                          >
                            Manage
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmDelete(item._id)}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                            title="Delete Record"
                          >
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-neutral-400 italic font-semibold">
                      No domain records found matching your filters. Click "+ Add New Domain" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer Bar (Square Corners - rounded-none) ── */}
        <div className="px-3.5 py-2 bg-purple-50/30 border-t border-purple-100 flex flex-wrap justify-between items-center gap-3 text-xs font-semibold text-neutral-600">
          <div className="flex items-center space-x-2">
            <span>Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-purple-200 rounded-none px-2 py-0.5 outline-none text-xs font-bold focus:border-[#8a32c6]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-neutral-400 ml-2">
              {filteredDomains.length > 0
                ? `${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, filteredDomains.length)} of ${filteredDomains.length}`
                : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1 rounded-none hover:bg-purple-100 text-[#8a32c6] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronsLeft size={15} />
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded-none hover:bg-purple-100 text-[#8a32c6] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronLeft size={15} />
            </button>
            <span className="px-2 font-bold text-neutral-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 rounded-none hover:bg-purple-100 text-[#8a32c6] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronRight size={15} />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1 rounded-none hover:bg-purple-100 text-[#8a32c6] disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CREATE / EDIT DOMAIN MODAL (Square Corners - rounded-none) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-purple-200 rounded-none p-5 shadow-2xl relative my-6">
            <div className="flex justify-between items-center border-b border-purple-100 pb-2.5 mb-3">
              <h2 className="text-xs font-bold text-[#8a32c6] uppercase tracking-wider flex items-center gap-1.5">
                <FiGlobe size={15} /> {editingDomain ? 'Edit Domain Details' : 'Add New Purchased Domain'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1 rounded-none hover:bg-neutral-100 transition-colors"
              >
                <FiX size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-3 text-xs font-semibold">
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Domain Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. aladhwastudio.com"
                  value={form.domainName}
                  onChange={(e) => setForm({ ...form, domainName: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Project / Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Aladhwa Studio"
                  value={form.projectName}
                  onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Buyed / Purchase Date</label>
                  <input
                    type="date"
                    value={form.purchaseDate}
                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Expiration Date *</label>
                  <input
                    type="date"
                    required
                    value={form.expirationDate}
                    onChange={(e) => setForm({ ...form, expirationDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Platform (Registrar)</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm({ ...form, platform: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] font-semibold text-xs bg-white"
                  >
                    <option value="Hostinger">Hostinger</option>
                    <option value="GoDaddy">GoDaddy</option>
                    <option value="Namecheap">Namecheap</option>
                    <option value="Google Domains">Google Domains</option>
                    <option value="Cloudflare">Cloudflare</option>
                    <option value="BigRock">BigRock</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Annual Renewal Cost (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="899"
                    value={form.renewalCost}
                    onChange={(e) => setForm({ ...form, renewalCost: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Hostinger Account Holder</label>
                <input
                  type="text"
                  placeholder="e.g. AIFA"
                  value={form.accountHolder}
                  onChange={(e) => setForm({ ...form, accountHolder: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Domain Owner Email</label>
                <input
                  type="email"
                  placeholder="e.g. client@aladhwastudio.com"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] text-xs"
                />
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  Warning email automatically sent 2 weeks before expiry to crevionads@gmail.com & saleelvt57@gmail.com
                </span>
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Notes / DNS Info (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional notes, nameservers or instructions..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-purple-200 rounded-none outline-none focus:border-[#8a32c6] text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold uppercase rounded-none transition-colors text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#8a32c6] to-[#7828b0] hover:from-[#7828b0] hover:to-[#631f96] text-white py-2 rounded-none font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 text-[10px] uppercase cursor-pointer"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingDomain ? 'Update Domain' : 'Save Domain'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteDomain}
        title="Delete Domain Record"
        message="Are you sure you want to remove this domain record from CRM tracking?"
        loading={deleting}
      />
    </div>
  );
};

export default Domains;
