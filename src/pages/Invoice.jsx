import React, { useState, useEffect, useRef } from 'react';
import { 
  FiFileText, FiPlus, FiTrash2, FiEdit, FiDownload, 
  FiSearch, FiX, FiCheck, FiPrinter, FiEdit3, FiPhone, FiMail, FiGlobe, FiMapPin, FiHeart, FiUser 
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import invoiceLogo from '../assets/invoicelogo.webp';
import ConfirmModal from '../components/ConfirmModal';
import html2pdf from 'html2pdf.js';

const Invoice = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'editor'
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Delete modal state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Edit Company Details modal
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [companyDetails, setCompanyDetails] = useState({
    name: 'Crevion ads',
    phone: '+91 81139 08262',
    email: 'crevionads@gmail.com',
    website: 'Crevionads.com',
    address: 'K.P.M Arcade, Kerala, Valanchery, India'
  });

  const DEFAULT_SERVICES = [
    { title: 'Meta Ads', description: 'Professional Meta Ads campaign setup, audience targeting, campaign management, optimization, and performance monitoring for Facebook and Instagram advertising.' },
    { title: 'Poster', description: 'Professional poster design services with creative layouts, premium visuals, and brand-focused design.' },
    { title: 'Video', description: 'Professional video editing with visual effects, sound optimization, subtitles, branding elements, and production-ready delivery.' },
    { title: 'GMB Creation', description: 'Google My Business (GMB) profile creation, business information setup, and optimization for improved local online visibility.' },
    { title: 'GMB SEO', description: 'Google Business Profile (GMB) SEO optimization to improve local search rankings, visibility, and customer engagement.' },
    { title: 'Static Website', description: 'Professional static website development including custom design, navigation, contact form, and SEO-friendly structure.' },
    { title: 'Dynamic Website', description: 'Professional dynamic website development featuring an admin panel, database integration, responsive UI, and scalable functionality.' },
    { title: 'Ecommerce', description: 'E-commerce website design and development with product catalog, shopping cart, secure checkout, payment gateway integration, and responsive design.' },
    { title: 'AI Videos', description: 'AI-generated video creation with custom visuals, animations, voiceover integration, and professional editing.' },
    { title: 'Branding', description: 'Professional branding services including brand strategy, visual identity, logo usage, color palette, and brand guidelines.' },
    { title: 'Letter Head', description: 'Professional letterhead design with a custom branded layout, corporate identity, and print-ready format.' },
    { title: 'Visiting Card', description: 'Professional visiting card design with custom branding, premium layout, and print-ready artwork.' },
    { title: 'NFC Card', description: 'Custom NFC business card setup and configuration with digital contact sharing and brand customization.' }
  ];

  // Reusable Description Suggestions
  const [suggestions, setSuggestions] = useState(DEFAULT_SERVICES);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(null);

  // Current Invoice Form state
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: 'INV-0001',
    clientName: '',
    clientPhone: '',
    clientAddress: '',
    clientEmail: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    terms: 'Due on receipt',
    dueDate: new Date().toISOString().split('T')[0],
    items: [
      { title: 'Website Development', description: 'Custom responsive web application design & deployment', quantity: 1, rate: 15000, amount: 15000 }
    ],
    totalAmount: 15000,
    receivedAmount: 0,
    balanceDue: 15000
  });

  const pdfRef = useRef(null);

  // Load Invoices, Company Details & Suggestions
  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, configRes, sugRes] = await Promise.all([
        api.get('/invoice', { params: { search } }),
        api.get('/invoice/config'),
        api.get('/invoice/suggestions')
      ]);
      setInvoices(invRes.data?.invoices || []);
      if (configRes.data) setCompanyDetails(configRes.data);
      if (sugRes.data && Array.isArray(sugRes.data)) {
        const merged = [...DEFAULT_SERVICES];
        sugRes.data.forEach(item => {
          if (item && item.title && !merged.some(m => m.title.toLowerCase() === item.title.toLowerCase())) {
            merged.push(item);
          }
        });
        setSuggestions(merged);
      }
      
      // Auto-generate invoice number if new
      if (!editingInvoiceId) {
        const nextNum = (invRes.data?.total || 0) + 1;
        setInvoiceForm(prev => ({
          ...prev,
          invoiceNumber: `INV-${String(nextNum).padStart(4, '0')}`
        }));
      }
    } catch {
      toast.error('Failed to load invoice records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  // Recalculate invoice totals when items or receivedAmount change
  useEffect(() => {
    const total = invoiceForm.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const received = Number(invoiceForm.receivedAmount) || 0;
    const balance = total - received;

    setInvoiceForm(prev => ({
      ...prev,
      totalAmount: total,
      balanceDue: balance >= 0 ? balance : 0
    }));
  }, [invoiceForm.items, invoiceForm.receivedAmount]);

  // Handle Item Row Changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index][field] = value;

    if (field === 'quantity' || field === 'rate') {
      const q = Number(updatedItems[index].quantity) || 0;
      const r = Number(updatedItems[index].rate) || 0;
      updatedItems[index].amount = q * r;
    }

    setInvoiceForm({ ...invoiceForm, items: updatedItems });
  };

  const addItemRow = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { title: '', description: '', quantity: 1, rate: 0, amount: 0 }
      ]
    });
  };

  const removeItemRow = (index) => {
    if (invoiceForm.items.length === 1) {
      return toast.error('Invoice must have at least one item');
    }
    const updated = invoiceForm.items.filter((_, i) => i !== index);
    setInvoiceForm({ ...invoiceForm, items: updated });
  };

  // Select a suggestion for an item
  const applySuggestion = (index, sug) => {
    const updatedItems = [...invoiceForm.items];
    updatedItems[index].title = sug.title;
    if (sug.description) {
      updatedItems[index].description = sug.description;
    }
    setInvoiceForm({ ...invoiceForm, items: updatedItems });
    setActiveSuggestionIndex(null);
  };

  // Save / Update Company Config
  const handleSaveCompanyConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/invoice/config', companyDetails);
      setCompanyDetails(res.data);
      toast.success('Company address & contact details updated');
      setIsCompanyModalOpen(false);
    } catch {
      toast.error('Failed to update company details');
    }
  };

  const [saving, setSaving] = useState(false);

  // Save Invoice Record in DB
  const saveInvoiceRecord = async () => {
    if (!invoiceForm.clientName.trim()) {
      toast.error('Client name is required');
      return null;
    }

    setSaving(true);
    try {
      const payload = {
        ...invoiceForm,
        _id: editingInvoiceId,
        companyDetails
      };
      const res = await api.post('/invoice', payload);
      toast.success(editingInvoiceId ? 'Invoice updated successfully' : 'Invoice saved successfully');
      setEditingInvoiceId(res.data._id);
      fetchData();
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save invoice');
      return null;
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF & Save Invoice
  const handleGeneratePDF = async () => {
    const saved = await saveInvoiceRecord();
    if (!saved) return;

    const element = pdfRef.current;
    if (!element) return;

    toast.loading('Generating invoice PDF...', { id: 'pdf-gen' });

    const opt = {
      margin: 0,
      filename: `${saved.invoiceNumber}_${saved.clientName.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: 'avoid-all' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      toast.success('Invoice PDF downloaded!', { id: 'pdf-gen' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF file', { id: 'pdf-gen' });
    }
  };

  // Edit Existing Invoice
  const openEditInvoice = (inv) => {
    setEditingInvoiceId(inv._id);
    setInvoiceForm({
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName || '',
      clientPhone: inv.clientPhone || '',
      clientAddress: inv.clientAddress || '',
      clientEmail: inv.clientEmail || '',
      invoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      terms: inv.terms || 'Due on receipt',
      dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      items: inv.items && inv.items.length > 0 ? inv.items : [{ title: '', description: '', quantity: 1, rate: 0, amount: 0 }],
      totalAmount: inv.totalAmount || 0,
      receivedAmount: inv.receivedAmount || 0,
      balanceDue: inv.balanceDue || 0
    });
    if (inv.companyDetails) setCompanyDetails(inv.companyDetails);
    setActiveTab('editor');
  };

  // Create New Invoice
  const startNewInvoice = () => {
    setEditingInvoiceId(null);
    const nextNum = `INV-${String(invoices.length + 1).padStart(4, '0')}`;
    setInvoiceForm({
      invoiceNumber: nextNum,
      clientName: '',
      clientPhone: '',
      clientAddress: '',
      clientEmail: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      terms: 'Due on receipt',
      dueDate: new Date().toISOString().split('T')[0],
      items: [
        { title: 'Website Development', description: 'Custom responsive web application design & deployment', quantity: 1, rate: 15000, amount: 15000 }
      ],
      totalAmount: 15000,
      receivedAmount: 0,
      balanceDue: 15000
    });
    setActiveTab('editor');
  };

  const confirmDelete = (id) => setDeleteId(id);

  const handleDeleteInvoice = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/invoice/${deleteId}`);
      toast.success('Invoice deleted');
      setDeleteId(null);
      fetchData();
    } catch {
      toast.error('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
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
      
      {/* ── Page Header & Tabs Bar ── */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Invoice Generator</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            Create professional invoices, manage client billing & download PDFs matching reference design.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-white border border-neutral-200 p-0.5 rounded-md flex space-x-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                activeTab === 'list' ? 'bg-[#8a32c6] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              All Clients & Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors ${
                activeTab === 'editor' ? 'bg-[#8a32c6] text-white shadow-xs' : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {editingInvoiceId ? 'Edit Invoice' : 'Create Invoice'}
            </button>
          </div>

          <button
            onClick={startNewInvoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#8a32c6] hover:bg-[#7828b0] text-white text-[11px] font-bold shadow-xs transition-colors"
          >
            <FiPlus size={13} /> + New Client Invoice
          </button>
        </div>
      </div>

      {/* ── TAB 1: ALL CLIENT INVOICES LIST ── */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="relative w-full max-w-xs">
            <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a32c6]" size={12} />
            <input
              type="text"
              placeholder="Search by client or INV number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...INPUT, paddingLeft: 28 }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
          </div>

          <div className="bg-white border border-neutral-200/60 rounded-lg overflow-hidden shadow-xs">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="w-8 h-8 border-2 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
                <p className="text-2xs text-neutral-500">Loading invoices database...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Inv No</th>
                      <th className="py-2.5 px-3">Client Name</th>
                      <th className="py-2.5 px-3">Contact</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Total Amount</th>
                      <th className="py-2.5 px-3">Balance Due</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv._id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-[#8a32c6]">{inv.invoiceNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-neutral-800">{inv.clientName}</td>
                          <td className="py-2.5 px-3 font-mono text-neutral-500">{inv.clientPhone || inv.clientEmail || '—'}</td>
                          <td className="py-2.5 px-3 font-mono text-neutral-500">
                            {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : ''}
                          </td>
                          <td className="py-2.5 px-3 font-bold font-mono text-neutral-800">₹{inv.totalAmount?.toLocaleString()}</td>
                          <td className="py-2.5 px-3 font-bold font-mono text-rose-600">₹{inv.balanceDue?.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center space-x-2">
                              <button
                                onClick={() => openEditInvoice(inv)}
                                className="text-[#8a32c6] hover:text-[#7828b0] p-1 font-semibold flex items-center space-x-1"
                                title="Edit Invoice"
                              >
                                <FiEdit size={13} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => confirmDelete(inv._id)}
                                className="text-neutral-400 hover:text-rose-600 p-1"
                                title="Delete Invoice"
                              >
                                <FiTrash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-10 text-neutral-400 italic">
                          No client invoices created yet. Click "+ New Client Invoice" above to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: INVOICE BUILDER & PREVIEW ── */}
      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Input Form Controls (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-neutral-200/60 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
              <h2 className="text-2xs font-extrabold text-[#8a32c6] uppercase tracking-wider">
                {editingInvoiceId ? 'Edit Saved Client Invoice' : 'New Client Invoice Form'}
              </h2>
              <button
                onClick={() => setIsCompanyModalOpen(true)}
                className="text-[10px] text-[#8a32c6] hover:text-[#7828b0] font-bold flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200"
              >
                <FiEdit3 size={11} /> Edit Company Address
              </button>
            </div>

            {/* Header info */}
            <div className="grid grid-cols-2 gap-3 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Invoice Number*</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Invoice Date*</label>
                <input
                  type="date"
                  value={invoiceForm.invoiceDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Terms</label>
                <input
                  type="text"
                  placeholder="Due on receipt"
                  value={invoiceForm.terms}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Client Info */}
            <div className="border-t border-neutral-100 pt-3 space-y-2 text-2xs font-semibold">
              <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Bill To (Client Information)</h3>
              
              <div>
                <label className="block text-neutral-500 mb-1">Client Name*</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Technologies"
                  value={invoiceForm.clientName}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-neutral-500 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={invoiceForm.clientPhone}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientPhone: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="client@acme.com"
                    value={invoiceForm.clientEmail}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, clientEmail: e.target.value })}
                    style={INPUT}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="City, State, Country"
                  value={invoiceForm.clientAddress}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientAddress: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
            </div>

            {/* Items section */}
            <div className="border-t border-neutral-100 pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Invoice Line Items</h3>
                <button
                  type="button"
                  onClick={addItemRow}
                  className="text-[10px] font-bold text-[#8a32c6] hover:text-[#7828b0] flex items-center gap-1"
                >
                  <FiPlus size={11} /> + Add Item
                </button>
              </div>

              {invoiceForm.items.map((item, idx) => (
                <div key={idx} className="p-3 border border-neutral-200 rounded-md bg-neutral-50/60 space-y-2 text-2xs relative">
                  {invoiceForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="absolute right-2 top-2 text-neutral-400 hover:text-rose-600 p-1"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  )}

                  {/* Title field with Autocomplete Suggestions */}
                  <div className="relative">
                    <label className="block text-neutral-600 font-bold mb-1">Bold Title*</label>
                    <input
                      type="text"
                      placeholder="e.g. Website Development"
                      value={item.title}
                      onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                      onFocus={() => setActiveSuggestionIndex(idx)}
                      style={{ ...INPUT, fontWeight: 'bold' }}
                    />

                    {/* Autocomplete Dropdown */}
                    {activeSuggestionIndex === idx && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-purple-200 rounded-md shadow-xl z-30 max-h-56 overflow-y-auto">
                        <div className="p-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 px-2 flex justify-between items-center bg-purple-50/50">
                          <span>Select Service Suggestion ({suggestions.filter(s => !item.title || s.title.toLowerCase().includes(item.title.toLowerCase())).length}):</span>
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setActiveSuggestionIndex(null); }}
                            className="text-neutral-400 hover:text-neutral-600 font-bold px-1"
                          >
                            ✕
                          </button>
                        </div>
                        {suggestions.filter(s => !item.title || s.title.toLowerCase().includes(item.title.toLowerCase())).length > 0 ? (
                          suggestions
                            .filter(s => !item.title || s.title.toLowerCase().includes(item.title.toLowerCase()))
                            .map((sug, sIdx) => (
                              <div
                                key={sIdx}
                                onMouseDown={(e) => { e.preventDefault(); applySuggestion(idx, sug); }}
                                className="px-3 py-2 hover:bg-purple-50 cursor-pointer transition-colors border-b border-neutral-50 last:border-none"
                              >
                                <div className="font-bold text-[#8a32c6] text-[11px] flex items-center justify-between">
                                  <span>{sug.title}</span>
                                  <span className="text-[9px] font-semibold text-purple-400 bg-purple-50 px-1.5 py-0.5 rounded">Click to apply</span>
                                </div>
                                {sug.description && (
                                  <div className="text-[9.5px] text-neutral-600 font-medium mt-0.5 line-clamp-2">{sug.description}</div>
                                )}
                              </div>
                            ))
                        ) : (
                          <div className="p-3 text-center text-[10px] text-neutral-400 italic">
                            No matching default service found. Type your custom title!
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-neutral-600 font-semibold mb-1">Detailed Description (Below Title)</label>
                    <textarea
                      rows="2"
                      placeholder="Full description details..."
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      style={{ ...INPUT, resize: 'none' }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-neutral-500 mb-1">Qty</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-500 mb-1">Rate (₹)</label>
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                        style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-500 mb-1">Amount (₹)</label>
                      <input
                        type="number"
                        readOnly
                        value={item.amount}
                        style={{ ...INPUT, background: '#f5f4f0', fontFamily: 'JetBrains Mono, monospace', fontWeight: 'bold' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary */}
            <div className="border-t border-neutral-100 pt-3 space-y-2 text-2xs font-semibold">
              <div className="flex justify-between items-center">
                <span>Total Amount:</span>
                <span className="font-mono text-sm font-extrabold text-neutral-800">₹{invoiceForm.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Received Amount:</span>
                <input
                  type="number"
                  value={invoiceForm.receivedAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, receivedAmount: e.target.value })}
                  style={{ ...INPUT, width: 120, textAlign: 'right', fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>
              <div className="flex justify-between items-center border-t border-neutral-100 pt-2 text-[#8a32c6]">
                <span className="font-bold">Balance Due:</span>
                <span className="font-mono text-sm font-extrabold">₹{invoiceForm.balanceDue.toLocaleString()}</span>
              </div>
            </div>

            {/* Submit / Action buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={saveInvoiceRecord}
                disabled={saving}
                className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-[10px] uppercase rounded-md transition-colors"
              >
                {saving ? 'Saving...' : 'Save Record'}
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#8a32c6] hover:bg-[#7828b0] text-white font-bold text-[10px] uppercase rounded-md shadow-xs transition-colors flex items-center justify-center space-x-1.5"
              >
                <FiDownload size={13} />
                <span>Save & Download PDF</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live PDF Document Preview (7 cols) matching invoice.png reference design */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                PDF Preview (Matches Reference Design)
              </span>
              <button
                onClick={handleGeneratePDF}
                className="text-[10px] font-bold text-[#8a32c6] hover:text-[#7828b0] flex items-center space-x-1"
              >
                <FiPrinter size={12} />
                <span>Print / Download PDF</span>
              </button>
            </div>

            {/* Outer container for PDF snapshot */}
            <div className="bg-neutral-200 p-3 rounded-lg overflow-x-auto">
              <div
                ref={pdfRef}
                style={{
                  width: '790px',
                  minHeight: '940px',
                  background: '#ffffff',
                  color: '#2b1c40',
                  fontFamily: 'Montserrat, sans-serif',
                  padding: '32px 36px',
                  position: 'relative',
                  boxSizing: 'border-box',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* ── Top Header Section ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* Top Left: Logo + Permanent Company Address Box */}
                    <div>
                      <img 
                        src={invoiceLogo} 
                        alt="Crevion Ads" 
                        style={{ height: '56px', objectFit: 'contain', marginBottom: '10px' }}
                      />
                      
                      {/* Crevion Ads Permanent Address Details Box */}
                      <div style={{
                        border: '1.5px solid #d4c8e3',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        width: '250px',
                        fontSize: '10px',
                        color: '#4a3b60',
                        lineHeight: '1.5'
                      }}>
                        <div style={{ fontWeight: '800', fontSize: '12px', color: '#2c1947', marginBottom: '3px' }}>
                          {companyDetails.name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <FiPhone size={10} style={{ color: '#3c2269' }} />
                          <span>{companyDetails.phone}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <FiMail size={10} style={{ color: '#3c2269' }} />
                          <span>{companyDetails.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <FiGlobe size={10} style={{ color: '#3c2269' }} />
                          <span>{companyDetails.website}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                          <FiMapPin size={10} style={{ color: '#3c2269', marginTop: '2px' }} />
                          <span>{companyDetails.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Right: INVOICE title + Gold pill + Dates */}
                    <div style={{ textAlign: 'right' }}>
                      <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#3c2269', letterSpacing: '0.06em', margin: '0 0 4px 0', lineHeight: 1.1 }}>
                        INVOICE
                      </h1>
                      <div style={{ 
                        display: 'inline-block', 
                        background: '#f4ce41', 
                        color: '#2c1947', 
                        fontWeight: '800', 
                        fontSize: '12px', 
                        padding: '3px 12px', 
                        borderRadius: '5px',
                        marginBottom: '12px'
                      }}>
                        {invoiceForm.invoiceNumber}
                      </div>

                      <div style={{ fontSize: '10.5px', color: '#685980', lineHeight: '1.7' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                          <span style={{ color: '#685980', fontWeight: '600' }}>Invoice Date</span>
                          <span style={{ fontWeight: '700', color: '#2c1947', width: '85px' }}>: {invoiceForm.invoiceDate}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                          <span style={{ color: '#685980', fontWeight: '600' }}>Terms</span>
                          <span style={{ fontWeight: '700', color: '#2c1947', width: '85px' }}>: {invoiceForm.terms}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
                          <span style={{ color: '#685980', fontWeight: '600' }}>Due Date</span>
                          <span style={{ fontWeight: '700', color: '#2c1947', width: '85px' }}>: {invoiceForm.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Bill To Section ── */}
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '800', color: '#3c2269', marginBottom: '6px' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#3c2269', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FiUser size={11} />
                      </div>
                      <span>Bill TO :</span>
                    </div>
                    <div style={{ paddingLeft: '24px', fontSize: '11.5px', color: '#33234d', fontWeight: '600', lineHeight: '1.4' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '800', color: '#2c1947' }}>{invoiceForm.clientName || 'Client Name'}</div>
                      {invoiceForm.clientPhone && <div>{invoiceForm.clientPhone}</div>}
                      {invoiceForm.clientEmail && <div>{invoiceForm.clientEmail}</div>}
                      {invoiceForm.clientAddress && <div>{invoiceForm.clientAddress}</div>}
                    </div>
                  </div>

                  {/* ── Line Items Table matching reference design ── */}
                  <div style={{
                    border: '1.5px solid #c9bddb',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    marginBottom: '18px'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10.5px' }}>
                      <thead>
                        <tr style={{ background: '#3c2269', color: '#ffffff' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'center', width: '36px', fontWeight: '800' }}>#</th>
                          <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: '800' }}>Description</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', width: '75px', fontWeight: '800' }}>Quantity</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', width: '85px', fontWeight: '800' }}>Rate</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', width: '95px', fontWeight: '800' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < invoiceForm.items.length - 1 ? '1px solid #e0d8eb' : 'none' }}>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#685980', verticalAlign: 'top' }}>
                              {idx + 1}
                            </td>
                            <td style={{ padding: '8px 12px', verticalAlign: 'top' }}>
                              {/* Bold Title */}
                              <div style={{ fontWeight: '800', color: '#2c1947', fontSize: '11.5px', marginBottom: '2px' }}>
                                {item.title || 'Service Title'}
                              </div>
                              {/* Description below title */}
                              {item.description && (
                                <div style={{ fontSize: '9.5px', color: '#685980', fontWeight: '500', lineHeight: '1.3' }}>
                                  {item.description}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: '700', color: '#2c1947', verticalAlign: 'top' }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#2c1947', verticalAlign: 'top' }}>
                              ₹{Number(item.rate).toLocaleString()}
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '800', fontFamily: 'JetBrains Mono, monospace', color: '#3c2269', verticalAlign: 'top' }}>
                              ₹{Number(item.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* ── Summary Totals Box Bottom Right ── */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
                    <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      
                      {/* TOTAL AMOUNT */}
                      <div style={{ display: 'flex', border: '1px solid #c9bddb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ flex: 1, background: '#3c2269', color: '#ffffff', padding: '5px 10px', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          TOTAL AMOUNT
                        </div>
                        <div style={{ padding: '5px 12px', background: '#ffffff', fontWeight: '800', fontSize: '11.5px', color: '#2c1947', fontFamily: 'JetBrains Mono, monospace', minWidth: '90px', textAlign: 'right' }}>
                          ₹{invoiceForm.totalAmount.toLocaleString()}
                        </div>
                      </div>

                      {/* RECEIVED AMOUNT */}
                      <div style={{ display: 'flex', border: '1px solid #c9bddb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ flex: 1, background: '#3c2269', color: '#ffffff', padding: '5px 10px', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          RECEIVED AMOUNT
                        </div>
                        <div style={{ padding: '5px 12px', background: '#ffffff', fontWeight: '800', fontSize: '11.5px', color: '#2c1947', fontFamily: 'JetBrains Mono, monospace', minWidth: '90px', textAlign: 'right' }}>
                          ₹{(Number(invoiceForm.receivedAmount) || 0).toLocaleString()}
                        </div>
                      </div>

                      {/* BALANCE DUE */}
                      <div style={{ display: 'flex', border: '1px solid #c9bddb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ flex: 1, background: '#3c2269', color: '#ffffff', padding: '5px 10px', fontWeight: '800', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          BALANCE DUE
                        </div>
                        <div style={{ padding: '5px 12px', background: '#ffffff', fontWeight: '800', fontSize: '11.5px', color: '#ef4444', fontFamily: 'JetBrains Mono, monospace', minWidth: '90px', textAlign: 'right' }}>
                          ₹{invoiceForm.balanceDue.toLocaleString()}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* ── Bottom Thank You Footer Box matching reference design ── */}
                <div style={{
                  border: '1.5px solid #d4c8e3',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: '#ffffff',
                  marginTop: 'auto',
                  marginBottom: '10px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#3c2269',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FiHeart size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '900', color: '#3c2269', lineHeight: '1.2' }}>
                      Thank You!
                    </div>
                    <div style={{ fontSize: '10.5px', fontWeight: '600', color: '#685980' }}>
                      For Your Business
                    </div>
                  </div>
                </div>

                {/* Solid Purple Decorative Accent Footer Curve */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '12px',
                  background: '#3c2269',
                  borderBottomLeftRadius: '4px',
                  borderBottomRightRadius: '4px'
                }} />

              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── Edit Permanent Company Details Modal ── */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative">
            <button
              onClick={() => setIsCompanyModalOpen(false)}
              className="absolute right-3 top-3 p-1 text-neutral-400 hover:text-neutral-600"
            >
              <FiX size={16} />
            </button>
            <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-widest mb-4">Edit Crevion Ads Company Details</h3>

            <form onSubmit={handleSaveCompanyConfig} className="space-y-3 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 mb-1">Company Name</label>
                <input
                  type="text"
                  value={companyDetails.name}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, name: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={companyDetails.phone}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, phone: e.target.value })}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Email Address</label>
                <input
                  type="email"
                  value={companyDetails.email}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, email: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Website URL</label>
                <input
                  type="text"
                  value={companyDetails.website}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, website: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 mb-1">Permanent Address</label>
                <textarea
                  rows="2"
                  value={companyDetails.address}
                  onChange={(e) => setCompanyDetails({ ...companyDetails, address: e.target.value })}
                  style={{ ...INPUT, resize: 'none' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-100 text-neutral-700 font-bold uppercase rounded-md text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#8a32c6] text-white font-bold uppercase rounded-md text-[10px]"
                >
                  Save Address
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
        onConfirm={handleDeleteInvoice}
        title="Delete Client Invoice"
        message="Are you sure you want to remove this client invoice record? This action cannot be undone."
        confirmText="Remove Invoice"
        loading={deleting}
      />

    </div>
  );
};

export default Invoice;
