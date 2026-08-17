import React, { useState, useEffect, useMemo } from 'react';
import {
  FiServer,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit3,
  FiCopy,
  FiCheck,
  FiEye,
  FiEyeOff,
  FiExternalLink,
  FiDatabase,
  FiLock,
  FiUser,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
  FiX,
  FiGlobe
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import { playAddSound, playDeleteSound, playSuccessSound } from '../utils/soundEffects';

const FRONTEND_PRESETS = ['Vercel', 'Namecheap', 'Render', 'Hostinger', 'Netlify', 'AWS', 'Firebase', 'Cloudflare', 'cPanel', 'Other'];
const BACKEND_PRESETS = ['Render', 'Vercel', 'Hostinger', 'Namecheap', 'AWS', 'Railway', 'Heroku', 'cPanel', 'DigitalOcean', 'Other'];
const ADMIN_PRESETS = ['cPanel', 'Hostinger', 'WordPress', 'Vercel', 'Netlify', 'Custom Admin', 'Other'];

const Servers = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState({
    totalServers: 0,
    vercelProjects: 0,
    renderProjects: 0,
    databaseTracked: 0
  });

  // Table selection & pagination state
  const [selectedIds, setSelectedIds] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Copy and Password Visibility States
  const [copiedKey, setCopiedKey] = useState(null);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    projectName: '',
    accountName: '',
    websiteUrl: '',
    frontendServer: 'Vercel',
    backendServer: 'Render',
    adminServer: 'cPanel',
    adminPanelUrl: '',
    adminEmail: '',
    adminPassword: '',
    databaseUrl: '',
    databasePassword: '',
    notes: ''
  });

  // Delete Modal State
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Server Config Records
  const fetchServers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/server-config', {
        params: { search }
      });
      if (res.data) {
        setServers(res.data.servers || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      toast.error('Failed to load server records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [search]);

  // Handle Search Change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Toggle Password Visibility
  const togglePasswordVisibility = (id, field) => {
    const key = `${id}_${field}`;
    setVisiblePasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Copy to Clipboard
  const copyToClipboard = (text, label, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingServer(null);
    setForm({
      projectName: '',
      accountName: '',
      websiteUrl: '',
      frontendServer: 'Vercel',
      backendServer: 'Render',
      adminServer: 'cPanel',
      adminPanelUrl: '',
      adminEmail: '',
      adminPassword: '',
      databaseUrl: '',
      databasePassword: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (server) => {
    setEditingServer(server);
    setForm({
      projectName: server.projectName || '',
      accountName: server.accountName || '',
      websiteUrl: server.websiteUrl || '',
      frontendServer: server.frontendServer || 'Vercel',
      backendServer: server.backendServer || 'Render',
      adminServer: server.adminServer || 'cPanel',
      adminPanelUrl: server.adminPanelUrl || '',
      adminEmail: server.adminEmail || '',
      adminPassword: server.adminPassword || '',
      databaseUrl: server.databaseUrl || '',
      databasePassword: server.databasePassword || '',
      notes: server.notes || ''
    });
    setIsModalOpen(true);
  };

  // Save / Update Server Record
  const handleSaveServer = async (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) {
      return toast.error('Please enter a project name');
    }

    setSaving(true);
    try {
      if (editingServer) {
        await api.put(`/server-config/${editingServer._id}`, form);
        playSuccessSound();
        toast.success('Server record updated');
      } else {
        await api.post('/server-config', form);
        playAddSound();
        toast.success('New server record created');
      }
      setIsModalOpen(false);
      fetchServers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save server record');
    } finally {
      setSaving(false);
    }
  };

  // Confirm Delete
  const confirmDelete = (id) => setDeleteId(id);

  const handleDeleteServer = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/server-config/${deleteId}`);
      playDeleteSound();
      toast.success('Server record deleted');
      setDeleteId(null);
      fetchServers();
    } catch (err) {
      toast.error('Failed to delete server record');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination Math
  const totalPages = Math.ceil(servers.length / pageSize) || 1;
  const paginatedServers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return servers.slice(start, start + pageSize);
  }, [servers, currentPage, pageSize]);

  // Select All Checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedServers.map(s => s._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 font-sans text-neutral-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-none border border-purple-200/70 shadow-xs">
        <div>
          <h1 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-gradient-to-br from-[#8a32c6] to-[#6b21a8] text-white flex items-center justify-center shadow-xs">
              <FiServer size={15} />
            </div>
            Server & Hosting Management
          </h1>
          <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
            Store Vercel, Render, Hostinger & Namecheap server hosts, live website links, admin panel logins & MongoDB database credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-3.5 py-2 rounded-none bg-gradient-to-r from-[#8a32c6] to-[#7828b0] hover:from-[#7828b0] hover:to-[#631f96] text-white text-xs font-bold transition-all duration-150 shadow-xs hover:shadow-md cursor-pointer"
        >
          <FiPlus size={14} /> Add New Server Record
        </button>
      </div>

      {/* ── Metric Cards Overview ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Total Servers</p>
            <h3 className="text-xl font-extrabold text-neutral-900 mt-0.5">{metrics.totalServers}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-purple-50 text-[#8a32c6] flex items-center justify-center border border-purple-100">
            <FiServer size={18} />
          </div>
        </div>

        <div className="bg-white border border-neutral-300/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Vercel Frontends</p>
            <h3 className="text-xl font-extrabold text-neutral-900 mt-0.5">{metrics.vercelProjects}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-neutral-900 text-white flex items-center justify-center">
            ▲
          </div>
        </div>

        <div className="bg-white border border-cyan-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">Render Backends</p>
            <h3 className="text-xl font-extrabold text-cyan-700 mt-0.5">{metrics.renderProjects}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-cyan-50 text-cyan-700 flex items-center justify-center border border-cyan-100">
            <FiGlobe size={18} />
          </div>
        </div>

        <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs flex items-center justify-between group">
          <div>
            <p className="text-[9.5px] font-bold text-neutral-400 uppercase tracking-wider">DB Credentials</p>
            <h3 className="text-xl font-extrabold text-[#8a32c6] mt-0.5">{metrics.databaseTracked}</h3>
          </div>
          <div className="w-10 h-10 rounded-none bg-purple-50 text-[#8a32c6] flex items-center justify-center border border-purple-100">
            <FiDatabase size={18} />
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" size={14} />
          <input
            type="text"
            placeholder="Search project name, website, account, server host, admin mail, database..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 bg-purple-50/30 border border-purple-200/80 rounded-none text-xs outline-none focus:border-[#8a32c6] focus:bg-white focus:ring-2 focus:ring-[#8a32c6]/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* ── Server Table ── */}
      <div className="bg-white border border-purple-200/80 rounded-none overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="w-7 h-7 border-3 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-semibold">Loading server records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-200/80 bg-gradient-to-r from-[#8a32c6]/10 to-[#f4ce41]/10 text-[#8a32c6] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3.5 w-8 text-center align-middle">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedServers.length > 0 && selectedIds.length === paginatedServers.length}
                      className="rounded-none border-purple-300 text-[#8a32c6] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3.5 align-middle">Project & Website Link</th>
                  <th className="py-3 px-3.5 align-middle">Frontend Host</th>
                  <th className="py-3 px-3.5 align-middle">Backend Host</th>
                  <th className="py-3 px-3.5 align-middle">Admin Panel Credentials</th>
                  <th className="py-3 px-3.5 align-middle">Database Details</th>
                  <th className="py-3 px-3.5 text-right align-middle">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70 font-medium text-neutral-800">
                {paginatedServers.length > 0 ? (
                  paginatedServers.map((item) => {
                    const adminPassKey = `${item._id}_adminPass`;
                    const dbPassKey = `${item._id}_dbPass`;
                    const isAdminPassVisible = !!visiblePasswords[adminPassKey];
                    const isDbPassVisible = !!visiblePasswords[dbPassKey];

                    return (
                      <tr key={item._id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="py-3 px-3.5 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item._id)}
                            onChange={() => handleSelectRow(item._id)}
                            className="rounded-none border-purple-300 text-[#8a32c6] focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3.5 align-middle">
                          <div className="font-extrabold text-neutral-900 text-xs">
                            {item.projectName}
                          </div>
                          {item.websiteUrl && (
                            <a
                              href={item.websiteUrl.startsWith('http') ? item.websiteUrl : `https://${item.websiteUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <FiGlobe size={11} />
                              <span>{item.websiteUrl.replace(/^https?:\/\//, '')}</span>
                              <FiExternalLink size={10} />
                            </a>
                          )}
                          {item.accountName && (
                            <div className="text-[10px] text-purple-700 font-semibold mt-0.5">
                              Account: {item.accountName}
                            </div>
                          )}
                        </td>

                        {/* Frontend Host (Clean Text without colored box) */}
                        <td className="py-3 px-3.5 align-middle">
                          <span className="font-bold text-neutral-800 text-[11px] flex items-center gap-1">
                            <FiServer size={11} className="text-[#8a32c6]" /> {item.frontendServer || '—'}
                          </span>
                        </td>

                        {/* Backend Host (Clean Text without colored box) */}
                        <td className="py-3 px-3.5 align-middle">
                          <span className="font-bold text-neutral-800 text-[11px] flex items-center gap-1">
                            <FiGlobe size={11} className="text-cyan-700" /> {item.backendServer || '—'}
                          </span>
                        </td>

                        {/* Admin Panel Credentials (Clean Text without colored boxes) */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-purple-900 text-[11px] flex items-center gap-1">
                                <FiServer size={11} className="text-[#8a32c6]" /> {item.adminServer || 'cPanel'}
                              </span>
                              {item.adminPanelUrl && (
                                <a
                                  href={item.adminPanelUrl.startsWith('http') ? item.adminPanelUrl : `https://${item.adminPanelUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-bold text-[#8a32c6] hover:underline inline-flex items-center gap-0.5 text-[10.5px]"
                                  title={item.adminPanelUrl}
                                >
                                  <span>Panel Link</span>
                                  <FiExternalLink size={10} />
                                </a>
                              )}
                            </div>
                            {item.adminEmail && (
                              <div className="text-[10.5px] text-neutral-600 font-mono flex items-center gap-1.5">
                                <span className="font-bold text-neutral-400">Mail:</span>
                                <span>{item.adminEmail}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.adminEmail, 'Admin Email', `${item._id}_adminEmail`)}
                                  className="text-neutral-400 hover:text-[#8a32c6] p-0.5"
                                  title="Copy Email"
                                >
                                  {copiedKey === `${item._id}_adminEmail` ? <FiCheck size={11} className="text-emerald-600" /> : <FiCopy size={11} />}
                                </button>
                              </div>
                            )}
                            {item.adminPassword && (
                              <div className="text-[10.5px] text-neutral-700 font-mono flex items-center gap-1.5">
                                <span className="font-bold text-neutral-400">Pass:</span>
                                <span className="bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-none font-semibold text-purple-950">
                                  {isAdminPassVisible ? item.adminPassword : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(item._id, 'adminPass')}
                                  className="text-neutral-400 hover:text-neutral-800 p-0.5"
                                  title={isAdminPassVisible ? 'Hide Password' : 'Show Password'}
                                >
                                  {isAdminPassVisible ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.adminPassword, 'Admin Password', adminPassKey)}
                                  className="text-neutral-400 hover:text-[#8a32c6] p-0.5"
                                  title="Copy Password"
                                >
                                  {copiedKey === adminPassKey ? <FiCheck size={11} className="text-emerald-600" /> : <FiCopy size={11} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 align-middle">
                          <div className="flex flex-col space-y-1">
                            {item.databaseUrl ? (
                              <div className="text-[10.5px] font-mono text-emerald-800 truncate max-w-[180px] flex items-center gap-1.5" title={item.databaseUrl}>
                                <FiDatabase size={11} className="text-emerald-600 flex-shrink-0" />
                                <span className="truncate font-semibold">{item.databaseUrl}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.databaseUrl, 'DB URL', `${item._id}_dbUrl`)}
                                  className="text-neutral-400 hover:text-[#8a32c6] p-0.5 flex-shrink-0"
                                  title="Copy DB Connection URI"
                                >
                                  {copiedKey === `${item._id}_dbUrl` ? <FiCheck size={11} className="text-emerald-600" /> : <FiCopy size={11} />}
                                </button>
                              </div>
                            ) : (
                              <span className="text-neutral-400 italic text-[10.5px]">No DB specified</span>
                            )}
                            {item.databasePassword && (
                              <div className="text-[10.5px] text-neutral-700 font-mono flex items-center gap-1.5">
                                <span className="font-bold text-neutral-400">Pass:</span>
                                <span className="bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-none font-semibold text-emerald-950">
                                  {isDbPassVisible ? item.databasePassword : '••••••••'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(item._id, 'dbPass')}
                                  className="text-neutral-400 hover:text-neutral-800 p-0.5"
                                  title={isDbPassVisible ? 'Hide Password' : 'Show Password'}
                                >
                                  {isDbPassVisible ? <FiEyeOff size={12} /> : <FiEye size={12} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(item.databasePassword, 'DB Password', dbPassKey)}
                                  className="text-neutral-400 hover:text-[#8a32c6] p-0.5"
                                  title="Copy DB Password"
                                >
                                  {copiedKey === dbPassKey ? <FiCheck size={11} className="text-emerald-600" /> : <FiCopy size={11} />}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-right align-middle">
                          <div className="inline-flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 text-[10.5px] font-bold rounded-none transition-all cursor-pointer"
                              title="Manage Server Details"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDelete(item._id)}
                              className="p-1 text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-neutral-400 italic font-semibold">
                      No server config records found matching your search. Click "+ Add New Server Record" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer Bar ── */}
        <div className="px-3.5 py-2 bg-[#fffdf0] border-t border-neutral-200 flex flex-wrap justify-between items-center gap-3 text-[11px] font-medium text-neutral-600">
          <div className="flex items-center space-x-2">
            <span>Page size:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-white border border-neutral-300 rounded-none px-2 py-0.5 outline-none text-[11px] font-semibold focus:border-[#8a32c6]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-neutral-400 ml-2">
              {servers.length > 0
                ? `${(currentPage - 1) * pageSize + 1} to ${Math.min(currentPage * pageSize, servers.length)} of ${servers.length}`
                : '0 of 0'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-1 rounded-none hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronsLeft size={14} />
            </button>
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1 rounded-none hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronLeft size={14} />
            </button>
            <span className="px-2 font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1 rounded-none hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronRight size={14} />
            </button>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="p-1 rounded-none hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <FiChevronsRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CREATE / EDIT SERVER MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-neutral-300 rounded-none p-5 shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2.5 mb-3">
              <h2 className="text-[11px] font-bold text-[#8a32c6] uppercase tracking-wider flex items-center gap-1.5">
                <FiServer size={14} /> {editingServer ? 'Edit Server Configuration' : 'Add New Server Configuration'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-800 p-1"
              >
                <FiX size={15} />
              </button>
            </div>

            <form onSubmit={handleSaveServer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Project Name*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aladhwa Studio"
                    value={form.projectName}
                    onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-neutral-600 font-bold mb-1">Account Holder / Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Crevionads / AIFA Account"
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Live Website Link (URL)</label>
                <input
                  type="text"
                  placeholder="e.g. https://aladhwastudio.com"
                  value={form.websiteUrl}
                  onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-mono text-xs"
                />
              </div>

              {/* Frontend Server Host */}
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Frontend Server Host</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={FRONTEND_PRESETS.includes(form.frontendServer) ? form.frontendServer : 'Other'}
                    onChange={(e) => {
                      if (e.target.value !== 'Other') {
                        setForm({ ...form, frontendServer: e.target.value });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-semibold text-xs bg-white"
                  >
                    {FRONTEND_PRESETS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom host..."
                    value={form.frontendServer}
                    onChange={(e) => setForm({ ...form, frontendServer: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6]"
                  />
                </div>
              </div>

              {/* Backend Server Host */}
              <div>
                <label className="block text-neutral-600 font-bold mb-1">Backend Server Host</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={BACKEND_PRESETS.includes(form.backendServer) ? form.backendServer : 'Other'}
                    onChange={(e) => {
                      if (e.target.value !== 'Other') {
                        setForm({ ...form, backendServer: e.target.value });
                      }
                    }}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-semibold text-xs bg-white"
                  >
                    {BACKEND_PRESETS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or type custom host..."
                    value={form.backendServer}
                    onChange={(e) => setForm({ ...form, backendServer: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6]"
                  />
                </div>
              </div>

              {/* Admin Panel Details */}
              <div className="p-3 bg-purple-50/40 border border-purple-100 rounded-none space-y-2">
                <span className="font-bold text-purple-900 uppercase text-[10px] tracking-wider block">
                  Admin Panel Server & Credentials
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={ADMIN_PRESETS.includes(form.adminServer) ? form.adminServer : 'Other'}
                    onChange={(e) => {
                      if (e.target.value !== 'Other') {
                        setForm({ ...form, adminServer: e.target.value });
                      }
                    }}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-semibold text-xs bg-white"
                  >
                    {ADMIN_PRESETS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Or custom admin platform..."
                    value={form.adminServer}
                    onChange={(e) => setForm({ ...form, adminServer: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] text-[11px]"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Admin Panel URL (e.g. https://crm.aladhwastudio.com)"
                    value={form.adminPanelUrl}
                    onChange={(e) => setForm({ ...form, adminPanelUrl: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-mono text-[11px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Admin Email / Username"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] text-[11px]"
                  />
                  <input
                    type="password"
                    placeholder="Admin Password"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] text-[11px]"
                  />
                </div>
              </div>

              {/* Database Credentials */}
              <div className="p-3 bg-emerald-50/40 border border-emerald-100 rounded-none space-y-2">
                <span className="font-bold text-emerald-900 uppercase text-[10px] tracking-wider block">
                  Database Details (MongoDB / SQL)
                </span>
                <div>
                  <input
                    type="text"
                    placeholder="Database Connection URI / Host (e.g. mongodb+srv://...)"
                    value={form.databaseUrl}
                    onChange={(e) => setForm({ ...form, databaseUrl: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-mono text-[11px]"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    placeholder="Database Password"
                    value={form.databasePassword}
                    onChange={(e) => setForm({ ...form, databasePassword: e.target.value })}
                    className="w-full px-2.5 py-1 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-600 font-bold mb-1">Notes / Extra Environment Config (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Additional notes, API keys or deployment info..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-neutral-300 rounded-none outline-none focus:border-[#8a32c6] text-xs"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#8a32c6] hover:bg-[#7828b0] text-white py-1.5 rounded-none font-bold shadow-2xs transition-colors flex items-center justify-center gap-1.5 text-xs cursor-pointer"
                >
                  {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>{editingServer ? 'Update Server' : 'Save Server'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 border border-neutral-300 rounded-none text-neutral-600 font-bold hover:bg-neutral-50 text-xs cursor-pointer"
                >
                  Cancel
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
        onConfirm={handleDeleteServer}
        title="Delete Server Configuration"
        message="Are you sure you want to remove this server record from CRM tracking?"
        loading={deleting}
      />
    </div>
  );
};

export default Servers;
