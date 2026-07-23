import React, { useState } from 'react';
import { FiDownload, FiFileText, FiDatabase, FiTrendingUp, FiTrendingDown, FiUsers, FiCalendar } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const reportTypes = [
  {
    id: 'business',
    name: 'Business Leads',
    desc: 'Client leads, requirements, and agent records.',
    icon: FiDatabase,
    iconColor: '#8a32c6',
    iconBg: 'rgba(138,50,198,0.08)',
    border: 'rgba(138,50,198,0.15)',
    accentLine: '#8a32c6',
    hasPDF: true,
  },
  {
    id: 'income',
    name: 'Income Logs',
    desc: 'Revenue entries, commissions, and receipts.',
    icon: FiTrendingUp,
    iconColor: '#10b981',
    iconBg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.18)',
    accentLine: '#f4ce41',
    hasPDF: false,
  },
  {
    id: 'expense',
    name: 'Expense Logs',
    desc: 'Outward expenditure and partner payment records.',
    icon: FiTrendingDown,
    iconColor: '#ef4444',
    iconBg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.15)',
    accentLine: '#ef4444',
    hasPDF: false,
  },
  {
    id: 'members',
    name: 'Members Directory',
    desc: 'Registered team members and contact details.',
    icon: FiUsers,
    iconColor: '#8a32c6',
    iconBg: 'rgba(138,50,198,0.08)',
    border: 'rgba(138,50,198,0.15)',
    accentLine: '#8a32c6',
    hasPDF: false,
  },
  {
    id: 'leave',
    name: 'Leaves & Attendance',
    desc: 'Monthly attendance matrix and aggregated leave stats.',
    icon: FiCalendar,
    iconColor: '#b08d02',
    iconBg: 'rgba(244,206,65,0.12)',
    border: 'rgba(244,206,65,0.25)',
    accentLine: '#f4ce41',
    hasPDF: false,
  },
];

const Reports = () => {
  const [downloading, setDownloading] = useState(false);

  const handleExportCSV = async (type) => {
    setDownloading(true);
    try {
      if (type === 'business') {
        const res = await api.get('/business/export/excel', { responseType: 'blob' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(new Blob([res.data]));
        link.download = 'crevionads_leads.xlsx';
        link.click();
        toast.success('Excel report downloaded');
        return;
      }

      let res, headers = [], rows = [];
      const filename = `crevionads_${type}_report.csv`;

      if (type === 'income') {
        res = await api.get('/income', { params: { limit: 1000 } });
        headers = ['Date','Amount','Source','Receiver','BusinessName','CommissionEnabled','CommissionAgent','CommissionAmount'];
        rows = (res.data.incomes || []).map(i => {
          const d = new Date(i.date);
          const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
          return {
            Date: dateStr, Amount: i.amount, Source: i.source,
            Receiver: i.receiver, BusinessName: i.businessName || '',
            CommissionEnabled: i.commissionEnabled ? 'YES' : 'NO',
            CommissionAgent: i.commissionAgent || '', CommissionAmount: i.commissionAmount || 0,
          };
        });
      } else if (type === 'expense') {
        res = await api.get('/expense', { params: { limit: 1000 } });
        headers = ['Date','Amount','Category','Reason','Description','Partner'];
        rows = (res.data.expenses || []).map(i => {
          const d = new Date(i.date);
          const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`;
          return {
            Date: dateStr, Amount: i.amount, Category: i.category,
            Reason: i.reason, Description: i.description || '', Partner: i.partner,
          };
        });
      } else if (type === 'members') {
        res = await api.get('/member');
        headers = ['Name','PhoneNumber'];
        rows = (res.data || []).map(i => ({ Name: i.name, PhoneNumber: i.phoneNumber }));
      } else if (type === 'leave') {
        const monthStr = new Date().toISOString().slice(0, 7);
        res = await api.get('/leave/summary', { params: { month: monthStr } });
        headers = ['MemberName','PresentDays','AbsentDays','CasualLeaves','SickLeaves','HalfDays','TotalLeaves'];
        rows = (res.data || []).map(({ member, stats }) => ({
          MemberName: member.name, PresentDays: stats.present, AbsentDays: stats.absent,
          CasualLeaves: stats.casual, SickLeaves: stats.sick, HalfDays: stats.halfDay, TotalLeaves: stats.totalLeave,
        }));
      }

      if (rows.length === 0) { toast.error('No records available to export'); return; }

      const csvRows = [headers.join(',')];
      rows.forEach(row => {
        csvRows.push(headers.map(h => `"${String(row[h]).replace(/"/g, '""')}"`).join(','));
      });

      const link = document.createElement('a');
      link.setAttribute('href', URL.createObjectURL(new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })));
      link.setAttribute('download', filename);
      link.click();
      toast.success(`${type.toUpperCase()} report generated`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setDownloading(false);
    }
  };

  const handleExportPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/business/export/pdf', { responseType: 'blob' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(new Blob([res.data]));
      link.download = 'crevionads_leads.pdf';
      link.click();
      toast.success('PDF report downloaded');
    } catch { toast.error('PDF export failed'); }
    finally { setDownloading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: 'Montserrat, sans-serif' }}>

      {/* ── Header ── */}
      <div>
        <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Reports & Exports</h1>
        <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
          Download data sheets and financial summaries as Excel, CSV or PDF.
        </p>
      </div>

      {/* ── Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {reportTypes.map(report => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              style={{
                background: '#ffffff',
                border: `1px solid ${report.border}`,
                borderRadius: 12,
                padding: '20px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'box-shadow 0.2s, transform 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(138,50,198,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Accent top line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${report.accentLine}, transparent)`,
              }} />

              {/* Icon + info */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  padding: 10, borderRadius: 10, background: report.iconBg,
                  border: `1px solid ${report.border}`, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={18} style={{ color: report.iconColor }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#2c2438', letterSpacing: '0.03em', marginBottom: 4 }}>
                    {report.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#76726a', lineHeight: 1.6, fontWeight: 500 }}>
                    {report.desc}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  disabled={downloading}
                  onClick={() => handleExportCSV(report.id)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 7, border: 'none',
                    background: '#8a32c6', color: '#fff',
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                    textTransform: 'uppercase', cursor: downloading ? 'not-allowed' : 'pointer',
                    opacity: downloading ? 0.5 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    boxShadow: '0 3px 12px rgba(138,50,198,0.25)',
                    fontFamily: 'Montserrat, sans-serif',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = '#a35ad6'; }}
                  onMouseLeave={e => e.currentTarget.style.background = '#8a32c6'}
                >
                  <FiDownload size={11} />
                  {report.id === 'business' ? 'Excel Sheet' : 'Download CSV'}
                </button>

                {report.hasPDF && (
                  <button
                    disabled={downloading}
                    onClick={handleExportPDF}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 7,
                      background: 'rgba(244,206,65,0.1)',
                      border: '1px solid rgba(244,206,65,0.3)',
                      color: '#b08d02',
                      fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                      textTransform: 'uppercase', cursor: downloading ? 'not-allowed' : 'pointer',
                      opacity: downloading ? 0.5 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                      fontFamily: 'Montserrat, sans-serif',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!downloading) e.currentTarget.style.background = 'rgba(244,206,65,0.18)'; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(244,206,65,0.1)'}
                  >
                    <FiFileText size={11} />
                    PDF Doc
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Reports;
