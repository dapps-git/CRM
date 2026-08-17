import React, { useState, useEffect, useRef } from 'react';
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiEye,
  FiX,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
  FiPhone,
  FiMail,
  FiCalendar,
  FiRefreshCw,
  FiHeart
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import invoiceLogo from '../assets/invoicelogo.webp';
import { playSuccessSound } from '../utils/soundEffects';

// Helper to format date to DD/MM/YYYY
const formatDateDMY = (dateInput) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-');
      return `${day}/${month}/${year}`;
    }
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) return trimmed;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// Crisp SVG Data URI generators for html2canvas
const generateInvoiceBadgeSVG = (invNum) => {
  const text = invNum || 'INV-0001';
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="24" viewBox="0 0 96 24"><defs><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@800&amp;display=swap'); text { font-family: 'Montserrat', sans-serif; }</style></defs><rect width="96" height="24" rx="5" fill="%23f4ce41"/><text x="48" y="16.5" font-family="Montserrat, sans-serif" font-weight="800" font-size="11" fill="%232b1947" text-anchor="middle">${text}</text></svg>`;
};

const generateBalanceDueBadgeSVG = (amount) => {
  const formatted = (Number(amount) || 0).toLocaleString();
  const svgWidth = Math.max(150, 125 + formatted.length * 8);
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="26" viewBox="0 0 ${svgWidth} 26" style="overflow:hidden;"><defs><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&amp;display=swap'); text { font-family: 'Montserrat', sans-serif; }</style></defs><rect width="${svgWidth}" height="26" rx="6" fill="%23fef2f2" stroke="%23ef4444" stroke-width="1.5"/><text y="17.5" font-family="Montserrat, sans-serif"><tspan x="8" font-size="11.5" font-weight="700" fill="%23000000">Balance Due</tspan><tspan x="78" font-size="11.5" font-weight="700" fill="%23000000"> : </tspan><tspan x="88" font-size="13.5" font-weight="800" fill="%23dc2626">₹${formatted}</tspan></text></svg>`;
};

const generateAddressLineSVG = (iconType, text) => {
  if (!text) return '';
  let iconPath = '';
  if (iconType === 'phone') {
    iconPath = `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`;
  } else if (iconType === 'email') {
    iconPath = `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>`;
  } else if (iconType === 'website') {
    iconPath = `<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10z"/>`;
  } else if (iconType === 'address') {
    iconPath = `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`;
  }

  const encodedText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="22" viewBox="0 0 240 22"><defs><style>@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&amp;display=swap'); text { font-family: 'Montserrat', sans-serif; }</style></defs><g transform="translate(0, 2) scale(0.65)" fill="none" stroke="%232b1947" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</g><text x="24" y="15" font-family="Montserrat, sans-serif" font-weight="400" font-size="10.5" fill="%232b1947">${encodedText}</text></svg>`;
};

const PDFStore = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const pdfRef = useRef(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoice/pdfs', { params: { search } });
      setInvoices(res.data?.pdfs || []);
    } catch {
      toast.error('Failed to load PDF records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search]);

  // Download PDF file
  const handleDownloadPDF = async (inv) => {
    setPreviewInvoice(inv);
    setDownloadingId(inv._id);

    setTimeout(async () => {
      if (!pdfRef.current) {
        setDownloadingId(null);
        return toast.error('Failed to generate PDF document');
      }

      const element = pdfRef.current;
      const actualHeight = Math.max(1040, element.scrollHeight);
      const clientNameForFile = (inv.clientName || 'CLIENT').toUpperCase().replace(/\s+/g, ' ').trim();
      const fileName = `${clientNameForFile} INVOICE.pdf`;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 790,
          width: 790,
          height: actualHeight,
          backgroundColor: '#2b1947'
        },
        jsPDF: { unit: 'px', format: [790, actualHeight], orientation: 'portrait' }
      };

      try {
        await html2pdf().set(opt).from(element).save();
        playSuccessSound();
        toast.success(`Downloaded ${opt.filename}`);
      } catch (err) {
        toast.error('Failed to download PDF');
      } finally {
        setDownloadingId(null);
      }
    }, 300);
  };

  // Print PDF document directly
  const handlePrintPDF = (inv) => {
    setPreviewInvoice(inv);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Share Exact PDF Document File to WhatsApp (Only Send PDF File, No Text Body & No White Bottom Margin)
  const handleShareWhatsApp = async (inv) => {
    setPreviewInvoice(inv);
    const toastId = toast.loading('Generating PDF file for WhatsApp share...');

    setTimeout(async () => {
      if (!pdfRef.current) {
        toast.dismiss(toastId);
        return toast.error('Failed to generate PDF document');
      }

      const element = pdfRef.current;
      const actualHeight = Math.max(1040, element.scrollHeight);
      const clientNameForFile = (inv.clientName || 'CLIENT').toUpperCase().replace(/\s+/g, ' ').trim();
      const fileName = `${clientNameForFile} INVOICE.pdf`;

      const opt = {
        margin: 0,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 790,
          width: 790,
          height: actualHeight,
          backgroundColor: '#2b1947'
        },
        jsPDF: { unit: 'px', format: [790, actualHeight], orientation: 'portrait' }
      };

      try {
        const pdfWorker = html2pdf().set(opt).from(element);
        const pdfBlob = await pdfWorker.output('blob');
        const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

        toast.dismiss(toastId);

        // Check native Web Share API with file attachment support (Only PDF File)
        if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
          await navigator.share({
            files: [pdfFile],
            title: `Invoice ${inv.invoiceNumber}`
          });
          playSuccessSound();
          toast.success('PDF document shared to WhatsApp!');
        } else {
          // Download PDF file directly & open WhatsApp web
          const link = document.createElement('a');
          link.href = URL.createObjectURL(pdfBlob);
          link.download = fileName;
          link.click();

          window.open('https://api.whatsapp.com/send', '_blank');
          playSuccessSound();
          toast.success(`Downloaded ${fileName}! Drop file into WhatsApp to send.`);
        }
      } catch (err) {
        toast.dismiss(toastId);
        window.open('https://api.whatsapp.com/send', '_blank');
      }
    }, 400);
  };

  return (
    <div className="space-y-4 font-sans text-neutral-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* ── Page Header ── */}
      <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-none border border-purple-200/70 shadow-xs">
        <div>
          <h1 className="text-xs font-extrabold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <div className="w-7 h-7 rounded-none bg-gradient-to-br from-[#8a32c6] to-[#6b21a8] text-white flex items-center justify-center shadow-xs">
              <FiFileText size={15} />
            </div>
            PDF Store & Document Archives
          </h1>
          <p className="text-[10px] text-purple-700 font-semibold mt-0.5">
            Central repository for all generated invoice PDFs, client receipts, payment records & download history.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchInvoices}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-purple-50 text-[#8a32c6] hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all cursor-pointer"
        >
          <FiRefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white border border-purple-200/70 rounded-none p-3.5 shadow-xs">
        <div className="relative max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600" size={14} />
          <input
            type="text"
            placeholder="Search PDF by invoice #, client name, phone number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-purple-50/30 border border-purple-200/80 rounded-none text-xs outline-none focus:border-[#8a32c6] focus:bg-white focus:ring-2 focus:ring-[#8a32c6]/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* ── PDF Documents Table ── */}
      <div className="bg-white border border-purple-200/80 rounded-none overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="w-7 h-7 border-3 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500 font-semibold">Loading PDF documents...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-200/80 bg-gradient-to-r from-[#8a32c6]/10 to-[#f4ce41]/10 text-[#8a32c6] font-extrabold uppercase tracking-wider text-[10.5px]">
                  <th className="py-3 px-3.5 align-middle">Invoice #</th>
                  <th className="py-3 px-3.5 align-middle">Client Details</th>
                  <th className="py-3 px-3.5 align-middle">Invoice Date & Due</th>
                  <th className="py-3 px-3.5 align-middle">Total Amount</th>
                  <th className="py-3 px-3.5 align-middle">Status & Balance</th>
                  <th className="py-3 px-3.5 text-right align-middle">Download & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/70 font-medium text-neutral-800">
                {invoices.length > 0 ? (
                  invoices.map((inv) => {
                    const isFullyPaid = (inv.balanceDue || 0) === 0;

                    return (
                      <tr key={inv._id} className="hover:bg-purple-50/40 transition-colors">
                        {/* Invoice # Badge */}
                        {/* Invoice # & Version Tag */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center px-2 py-0.5 bg-[#f4ce41] text-[#2b1947] text-[11px] font-extrabold rounded-none shadow-2xs">
                              {inv.invoiceNumber || 'INV-0001'}
                            </span>
                            {inv.version && (
                              <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 border border-purple-200 text-[#8a32c6] text-[10px] font-extrabold rounded-none">
                                v{inv.version}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Client Details */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="font-extrabold text-neutral-900 text-xs flex items-center gap-1.5">
                            <FiUser size={12} className="text-[#8a32c6]" />
                            <span>{inv.clientName}</span>
                          </div>
                          {inv.clientPhone && (
                            <div className="text-[10.5px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                              <FiPhone size={10} className="text-purple-600" />
                              <span>{inv.clientPhone}</span>
                            </div>
                          )}
                          {inv.clientEmail && (
                            <div className="text-[10.5px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1">
                              <FiMail size={10} className="text-purple-600" />
                              <span>{inv.clientEmail}</span>
                            </div>
                          )}
                        </td>

                        {/* Invoice Date & Due Date */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="text-[11px] text-neutral-800 font-bold flex items-center gap-1">
                            <FiCalendar size={11} className="text-[#8a32c6]" />
                            <span>Date: {formatDateDMY(inv.invoiceDate)}</span>
                          </div>
                          {inv.dueDate && (
                            <div className="text-[10.5px] text-neutral-500 font-semibold mt-0.5">
                              Due: {formatDateDMY(inv.dueDate)}
                            </div>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td className="py-3 px-3.5 align-middle font-mono">
                          <span className="font-extrabold text-neutral-900 text-xs">
                            ₹{(Number(inv.totalAmount) || 0).toLocaleString()}
                          </span>
                        </td>

                        {/* Status & Balance Due */}
                        <td className="py-3 px-3.5 align-middle">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold rounded-none">
                              <FiCheckCircle size={10} /> Fully Paid
                            </span>
                          ) : (
                            <div className="flex flex-col space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold rounded-none w-fit">
                                <FiClock size={10} /> Unpaid Balance
                              </span>
                              <span className="text-[11px] font-extrabold text-rose-600 font-mono">
                                ₹{(Number(inv.balanceDue) || 0).toLocaleString()} due
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Actions: Download PDF, WhatsApp, Preview & Print (Bare Icons - No Square Background Box) */}
                        <td className="py-3 px-3.5 text-right align-middle">
                          <div className="inline-flex items-center space-x-3 justify-end">
                            <button
                              type="button"
                              onClick={() => handleDownloadPDF(inv)}
                              disabled={downloadingId === inv._id}
                              className="p-1 text-[#8a32c6] hover:text-[#6b21a8] transition-transform hover:scale-115 cursor-pointer disabled:opacity-50"
                              title="Download PDF Document"
                            >
                              {downloadingId === inv._id ? (
                                <div className="w-4 h-4 border-2 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <FiDownload size={16} />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleShareWhatsApp(inv)}
                              className="p-1 text-[#25D366] hover:text-[#128C7E] transition-transform hover:scale-115 cursor-pointer"
                              title="Share PDF Document on WhatsApp"
                            >
                              <FaWhatsapp size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setPreviewInvoice(inv)}
                              className="p-1 text-purple-800 hover:text-purple-950 transition-transform hover:scale-115 cursor-pointer"
                              title="Preview PDF Document"
                            >
                              <FiEye size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePrintPDF(inv)}
                              className="p-1 text-neutral-600 hover:text-neutral-900 transition-transform hover:scale-115 cursor-pointer"
                              title="Print Document"
                            >
                              <FiPrinter size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-neutral-400 italic font-semibold">
                      No saved PDF documents found. Create or generate an invoice in the Invoice Module to populate your PDF store!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PDF PREVIEW & PRINT MODAL ── */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white border border-neutral-300 rounded-none p-5 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3 mb-4">
              <h2 className="text-xs font-bold text-[#8a32c6] uppercase tracking-wider flex items-center gap-1.5">
                <FiFileText size={15} /> Document Preview: {previewInvoice.invoiceNumber}
              </h2>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(previewInvoice)}
                  className="p-1 text-[#8a32c6] hover:text-[#6b21a8] transition-transform hover:scale-115 cursor-pointer"
                  title="Download PDF Document"
                >
                  <FiDownload size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(previewInvoice)}
                  className="p-1 text-[#25D366] hover:text-[#128C7E] transition-transform hover:scale-115 cursor-pointer"
                  title="Share PDF Document on WhatsApp"
                >
                  <FaWhatsapp size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintPDF(previewInvoice)}
                  className="p-1 text-neutral-600 hover:text-neutral-900 transition-transform hover:scale-115 cursor-pointer"
                  title="Print Document"
                >
                  <FiPrinter size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoice(null)}
                  className="text-neutral-400 hover:text-neutral-800 p-1"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* ── Exact Pixel-Perfect Invoice Template Container ── */}
            <div className="overflow-x-auto p-4 bg-neutral-100/60 border border-neutral-200 flex justify-center">
              <div
                ref={pdfRef}
                style={{
                  width: '790px',
                  minHeight: '1040px',
                  background: '#2b1947',
                  color: '#2b1c40',
                  fontFamily: 'Montserrat, sans-serif',
                  position: 'relative',
                  boxSizing: 'border-box',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  paddingBottom: '24px'
                }}
              >
                {/* ── TOP SECTION (White Background) ── */}
                <div style={{ background: '#ffffff', padding: '28px 36px 16px 36px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    {/* Top Left: Logo + Address Details Box */}
                    <div>
                      <img
                        src={invoiceLogo}
                        alt="Crevion Ads"
                        style={{ height: '92px', objectFit: 'contain', marginBottom: '10px', display: 'block' }}
                      />

                      <div style={{
                        border: '1.5px solid #d4c8e3',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        width: '265px',
                        background: '#ffffff'
                      }}>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: '#2b1947', marginBottom: '8px', letterSpacing: '-0.01em' }}>
                          {previewInvoice.companyDetails?.name || 'Crevion ads'}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          <img src={generateAddressLineSVG('phone', previewInvoice.companyDetails?.phone || '+91 81139 08262')} alt="" style={{ height: '22px', display: 'block' }} />
                          <img src={generateAddressLineSVG('email', previewInvoice.companyDetails?.email || 'crevionads@gmail.com')} alt="" style={{ height: '22px', display: 'block' }} />
                          <img src={generateAddressLineSVG('website', previewInvoice.companyDetails?.website || 'Crevionads.com')} alt="" style={{ height: '22px', display: 'block' }} />
                          <img src={generateAddressLineSVG('address', previewInvoice.companyDetails?.address || 'K.P.M Arcade, Kerala, Valanchery, India')} alt="" style={{ height: '22px', display: 'block' }} />
                        </div>
                      </div>
                    </div>

                    {/* Top Right: INVOICE title + Gold badge + Dates + Balance Due */}
                    <div style={{ paddingTop: '40px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '17px', fontWeight: '600', color: '#2b1947', letterSpacing: '0.08em', lineHeight: '1.2', marginBottom: '4px' }}>
                          INVOICE
                        </div>
                        <div style={{ marginBottom: '8px', textAlign: 'right' }}>
                          <img
                            src={generateInvoiceBadgeSVG(previewInvoice.invoiceNumber)}
                            alt={previewInvoice.invoiceNumber}
                            style={{ height: '20px', display: 'inline-block' }}
                          />
                        </div>
                        <table style={{ borderCollapse: 'collapse', marginLeft: 'auto', fontSize: '11.5px', color: '#685980', lineHeight: '1.5' }}>
                          <tbody>
                            <tr>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'left', paddingRight: '4px', paddingBottom: '4px', fontSize: '11.5px' }}>Invoice Date</td>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'center', width: '14px', paddingBottom: '4px', fontSize: '11.5px' }}>:</td>
                              <td style={{ fontWeight: '500', color: '#2c1947', textAlign: 'left', paddingLeft: '4px', paddingBottom: '4px', width: '100px', fontSize: '11.5px' }}>{formatDateDMY(previewInvoice.invoiceDate)}</td>
                            </tr>
                            <tr>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'left', paddingRight: '4px', paddingBottom: '4px', fontSize: '11.5px' }}>Terms</td>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'center', width: '14px', paddingBottom: '4px', fontSize: '11.5px' }}>:</td>
                              <td style={{ fontWeight: '500', color: '#2c1947', textAlign: 'left', paddingLeft: '4px', paddingBottom: '4px', width: '100px', whiteSpace: 'nowrap', fontSize: '11.5px' }}>{previewInvoice.terms || 'Due on receipt'}</td>
                            </tr>
                            <tr>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'left', paddingRight: '4px', paddingBottom: '10px', fontSize: '11.5px' }}>Due Date</td>
                              <td style={{ color: '#685980', fontWeight: '500', textAlign: 'center', width: '14px', paddingBottom: '10px', fontSize: '11.5px' }}>:</td>
                              <td style={{ fontWeight: '500', color: '#2c1947', textAlign: 'left', paddingLeft: '4px', paddingBottom: '10px', width: '100px', fontSize: '11.5px' }}>{formatDateDMY(previewInvoice.dueDate)}</td>
                            </tr>
                            <tr>
                              <td colSpan="3" style={{ paddingTop: '6px', textAlign: 'left' }}>
                                <img
                                  src={generateBalanceDueBadgeSVG(previewInvoice.balanceDue)}
                                  alt="Balance Due"
                                  style={{ height: '26px', display: 'inline-block', overflow: 'hidden' }}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Bill To Section */}
                  <div style={{ marginBottom: '6px', fontSize: '12px', color: '#2c1947' }}>
                    <span style={{ fontWeight: '800', color: '#2b1947', marginRight: '8px' }}>
                      Bill TO :
                    </span>
                    <span style={{ fontWeight: '800', color: '#2b1947' }}>
                      {previewInvoice.clientName || 'Client Name'}
                    </span>
                    {[previewInvoice.clientPhone, previewInvoice.clientEmail, previewInvoice.clientAddress].filter(Boolean).length > 0 && (
                      <span style={{ fontWeight: '400', color: '#4a3f6b' }}>
                        {', ' + [previewInvoice.clientPhone, previewInvoice.clientEmail, previewInvoice.clientAddress].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Top Curved Wave Transition to Dark Purple Section */}
                <div style={{ marginTop: '-1px', marginBottom: '-1px', overflow: 'hidden', lineHeight: 0, background: '#ffffff', border: 'none' }}>
                  <svg viewBox="0 0 790 50" style={{ width: '790px', height: '50px', display: 'block', border: 'none' }}>
                    <path d="M 0,0 Q 395,70 790,0 L 790,50 L 0,50 Z" fill="#2b1947" stroke="#2b1947" strokeWidth="1" />
                  </svg>
                </div>

                {/* ── LOWER SECTION: Dark Purple (#2b1947) Background Wrapper ── */}
                <div style={{
                  background: '#2b1947',
                  padding: '0 36px 40px 36px',
                  minHeight: '670px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-start',
                  gap: '16px',
                  position: 'relative',
                  boxSizing: 'border-box'
                }}>

                  {/* Large White Table Card Container */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '16px 16px 14px 16px',
                    marginBottom: '16px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    border: '1.5px solid #d8cced',
                    overflow: 'hidden'
                  }}>
                    <div style={{ borderRadius: '12px', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '10.5px' }}>
                        <thead>
                          <tr style={{ color: '#ffffff' }}>
                            <th style={{ background: '#2b1947', padding: '9px 6px', textAlign: 'center', width: '32px', fontWeight: '800', borderRight: '1px solid rgba(255,255,255,0.15)', borderTopLeftRadius: '10px' }}>#</th>
                            <th style={{ background: '#2b1947', padding: '9px 10px', textAlign: 'left', fontWeight: '800', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Description</th>
                            <th style={{ background: '#2b1947', padding: '9px 6px', textAlign: 'center', width: '75px', fontWeight: '800', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Quantity</th>
                            <th style={{ background: '#2b1947', padding: '9px 6px', textAlign: 'center', width: '85px', fontWeight: '800', borderRight: '1px solid rgba(255,255,255,0.15)' }}>Rate</th>
                            <th style={{ background: '#2b1947', padding: '9px 10px', textAlign: 'center', width: '95px', fontWeight: '800', borderTopRightRadius: '10px' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(previewInvoice.items || []).map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: (previewInvoice.items || []).length >= 5 ? '8px 6px' : '12px 6px 14px 6px', textAlign: 'center', fontWeight: '700', color: '#685980', verticalAlign: 'top', borderRight: '1px solid #e2d9f0', borderBottom: '1px solid #c9b8e0' }}>
                                {idx + 1}
                              </td>
                              <td style={{ padding: (previewInvoice.items || []).length >= 5 ? '8px 10px' : '12px 10px 14px 10px', verticalAlign: 'top', borderRight: '1px solid #e2d9f0', borderBottom: '1px solid #c9b8e0' }}>
                                <div style={{ fontWeight: '800', color: '#2c1947', fontSize: '11px', marginBottom: '2px' }}>
                                  {item.title || 'Service Title'}
                                </div>
                                {item.description && (
                                  <div style={{ fontSize: '9px', color: '#685980', fontWeight: '500', lineHeight: '1.35', marginBottom: '2px' }}>
                                    {item.description}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: (previewInvoice.items || []).length >= 5 ? '8px 6px' : '12px 6px 14px 6px', textAlign: 'center', fontWeight: '700', fontFamily: 'Montserrat, sans-serif', fontSize: '10.5px', color: '#2c1947', verticalAlign: 'top', borderRight: '1px solid #e2d9f0', borderBottom: '1px solid #c9b8e0' }}>
                                {item.quantity}
                              </td>
                              <td style={{ padding: (previewInvoice.items || []).length >= 5 ? '8px 6px' : '12px 6px 14px 6px', textAlign: 'center', fontWeight: '700', fontFamily: 'Montserrat, sans-serif', fontSize: '10.5px', color: '#2c1947', verticalAlign: 'top', borderRight: '1px solid #e2d9f0', borderBottom: '1px solid #c9b8e0' }}>
                                ₹{Number(item.rate).toLocaleString()}
                              </td>
                              <td style={{ padding: (previewInvoice.items || []).length >= 5 ? '8px 10px' : '12px 10px 14px 10px', textAlign: 'center', fontWeight: '700', fontFamily: 'Montserrat, sans-serif', fontSize: '10.5px', color: '#2c1947', verticalAlign: 'top', borderBottom: '1px solid #c9b8e0' }}>
                                ₹{Number(item.amount).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Totals Box inside Table Card Bottom Right */}
                    <div style={{ marginTop: '14px', paddingBottom: '0px' }}>
                      <table style={{ width: '310px', marginLeft: 'auto', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                        <tbody>
                          {/* TOTAL AMOUNT */}
                          <tr>
                            <td style={{ background: '#2b1947', color: '#f4ce41', padding: '0 14px', fontWeight: '800', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', textAlign: 'left', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>TOTAL AMOUNT</div>
                            </td>
                            <td style={{ width: '100px', background: '#ffffff', border: '1px solid #c9bddb', borderLeft: 'none', fontWeight: '800', fontSize: '12px', color: '#2c1947', fontFamily: 'Montserrat, sans-serif', textAlign: 'center', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>₹{(Number(previewInvoice.totalAmount) || 0).toLocaleString()}</div>
                            </td>
                          </tr>

                          {/* RECEIVED AMOUNT */}
                          <tr>
                            <td style={{ background: '#2b1947', color: '#f4ce41', padding: '0 14px', fontWeight: '800', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', textAlign: 'left', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>RECEIVED AMOUNT</div>
                            </td>
                            <td style={{ width: '100px', background: '#ffffff', border: '1px solid #c9bddb', borderLeft: 'none', fontWeight: '800', fontSize: '12px', color: '#2c1947', fontFamily: 'Montserrat, sans-serif', textAlign: 'center', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>₹{(Number(previewInvoice.receivedAmount) || 0).toLocaleString()}</div>
                            </td>
                          </tr>

                          {/* BALANCE DUE */}
                          <tr>
                            <td style={{ background: '#2b1947', color: '#f4ce41', padding: '0 14px', fontWeight: '800', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.05em', borderTopLeftRadius: '6px', borderBottomLeftRadius: '6px', textAlign: 'left', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>BALANCE DUE</div>
                            </td>
                            <td style={{ width: '100px', background: '#ffffff', border: '1px solid #c9bddb', borderLeft: 'none', fontWeight: '800', fontSize: '12px', color: '#2c1947', fontFamily: 'Montserrat, sans-serif', textAlign: 'center', borderTopRightRadius: '6px', borderBottomRightRadius: '6px', verticalAlign: 'middle', height: '30px' }}>
                              <div style={{ lineHeight: '1', marginTop: '-9px' }}>₹{(Number(previewInvoice.balanceDue) || 0).toLocaleString()}</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Bottom Thank You Card Container */}
                  <div style={{
                    background: '#ffffff',
                    borderRadius: '18px',
                    padding: '14px 20px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                    border: '1.5px solid #d8cced',
                    overflow: 'hidden'
                  }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '42px', verticalAlign: 'top', paddingTop: '2px' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '50%',
                              background: '#2b1947',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              overflow: 'hidden'
                            }}>
                              <FiHeart size={20} />
                            </div>
                          </td>
                          <td style={{ paddingLeft: '14px', verticalAlign: 'middle', paddingTop: '0px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: '#2b1947', lineHeight: '1.1', marginBottom: '2px', marginTop: '-6px' }}>
                              Thank You!
                            </div>
                            <div style={{ fontSize: '11px', fontWeight: '600', color: '#685980', lineHeight: '1.1', marginTop: '-1px' }}>
                              For Your Business
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFStore;
