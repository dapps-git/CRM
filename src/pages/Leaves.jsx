import React, { useState, useEffect } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';

const Leaves = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('All Partners');
  const [summaryData, setSummaryData] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mark Leave Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [formMemberId, setFormMemberId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState('Present');
  const [formReason, setFormReason] = useState('');

  const [year, monthNum] = selectedMonth.split('-').map(Number);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[monthNum - 1] + ', ' + year;

  // Fetch all necessary data
  const fetchData = async () => {
    setLoading(true);
    try {
      const summaryRes = await api.get('/leave/summary', { params: { month: selectedMonth } });
      setSummaryData(summaryRes.data?.summary || []);
      setLeavesList(summaryRes.data?.leaves || []);
      const membersRes = await api.get('/member');
      setMembers(membersRes.data || []);
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Open modal for add
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormMemberId(members[0]?._id || '');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormStatus('Present');
    setFormReason('');
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleOpenEditModal = (leave) => {
    setModalMode('edit');
    setEditingId(leave._id);
    setFormMemberId(leave.memberId);
    setFormDate(leave.date);
    setFormStatus(leave.status);
    setFormReason(leave.reason);
    setIsModalOpen(true);
  };

  // Submit Leave Mark
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formMemberId || !formDate || !formStatus) {
      return toast.error('Please fill in all required fields');
    }

    try {
      await api.post('/leave', {
        memberId: formMemberId,
        date: formDate,
        status: formStatus,
        reason: formReason
      });

      toast.success(modalMode === 'add' ? 'Leave marked successfully' : 'Leave record updated');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save leave record');
    }
  };

  // Delete Leave Record
  const handleDeleteLeave = async (id) => {
    if (!window.confirm('Delete this leave record?')) return;
    try {
      await api.delete(`/leave/${id}`);
      toast.success('Leave record deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete leave record');
    }
  };

  // Filter leaves table based on dropdown
  const filteredLeaves = leavesList.filter(l => {
    if (selectedPartnerFilter === 'All Partners') return true;
    return l.memberId === selectedPartnerFilter;
  });

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
      
      {/* --- Page Header --- */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Leave Management</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            {leavesList.length} total records logged.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, boxShadow: '0 3px 12px var(--primary-glow)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
        >
          <FiPlus size={12} />
          <span>Mark Leave</span>
        </button>
      </div>

      {/* --- Filter Bar --- */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month Picker wrapper */}
        <div className="flex items-center space-x-1 bg-white border border-neutral-200 rounded px-2 py-1 relative">
          <button 
            onClick={() => {
              const d = new Date(year, monthNum - 2, 1);
              setSelectedMonth(d.toISOString().slice(0, 7));
            }}
            className="p-1 hover:bg-neutral-50 rounded text-brand-600"
          >
            <FiChevronLeft size={13} />
          </button>
          
          <span className="text-[10px] font-bold px-1 text-neutral-700 uppercase tracking-widest">
            {currentMonthName}
          </span>

          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-4 bg-transparent border-none text-transparent outline-none cursor-pointer p-0 select-none opacity-0 absolute"
          />
          
          <button 
            onClick={() => {
              const d = new Date(year, monthNum, 1);
              setSelectedMonth(d.toISOString().slice(0, 7));
            }}
            className="p-1 hover:bg-neutral-50 rounded text-brand-600"
          >
            <FiChevronRight size={13} />
          </button>
        </div>

        {/* Partners Filter Dropdown */}
        <select
          value={selectedPartnerFilter}
          onChange={(e) => setSelectedPartnerFilter(e.target.value)}
          style={{ ...INPUT, width: 'auto', padding: '6px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <option value="All Partners">All Partners</option>
          {members.map(m => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* --- Stats Cards Grid --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-2xs text-neutral-500">Loading leave data...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryData.map(({ member, stats }) => (
              <div 
                key={member._id}
                className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Header card info */}
                <div className="flex items-center space-x-2 text-brand-600 font-bold text-2xs uppercase tracking-wider border-b border-neutral-50 pb-2 mb-3">
                  <FiCalendar size={13} className="text-brand-500" />
                  <span>{member.name}</span>
                </div>

                {/* Subgrid of values */}
                <div className="grid grid-cols-2 gap-y-2 text-2xs text-neutral-600 font-semibold">
                  <div>
                    Present: <span className="text-emerald-600 font-extrabold font-mono">{stats.present}</span>
                  </div>
                  <div>
                    Absent: <span className="text-rose-600 font-extrabold font-mono">{stats.absent}</span>
                  </div>
                  <div>
                    Sick: <span className="text-amber-600 font-extrabold font-mono">{stats.sick}</span>
                  </div>
                  <div>
                    Casual: <span className="text-blue-600 font-extrabold font-mono">{stats.casual}</span>
                  </div>
                  <div>
                    Half Day: <span className="text-yellow-600 font-extrabold font-mono">{stats.halfDay}</span>
                  </div>
                  <div className="border-l border-neutral-100 pl-3">
                    Total Leave: <span className="text-brand-600 font-extrabold font-mono">{stats.totalLeave}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* --- Leave Logs List Table --- */}
          <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden mt-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-2xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-100 bg-brand-50/20 text-brand-600 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Partner</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredLeaves.length > 0 ? (
                    filteredLeaves.map((item) => (
                      <tr 
                        key={item._id}
                        className="hover:bg-neutral-50/30 text-neutral-700 font-medium transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-neutral-500">{item.date}</td>
                        <td className="py-3 px-4 text-neutral-800 font-semibold">{item.memberName}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase border ${
                            item.status === 'Present' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                            item.status === 'Absent' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                            item.status === 'Casual Leave' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                            item.status === 'Sick Leave' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                            'bg-yellow-50 border-yellow-200 text-yellow-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px] truncate text-neutral-500 font-mono italic">
                          {item.reason || '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center space-x-2">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="text-brand-500 hover:text-brand-600 transition-colors p-1"
                              title="Edit Record"
                            >
                              <FiEdit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteLeave(item._id)}
                              className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
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
                      <td colSpan="5" className="text-center py-8 text-neutral-400 font-medium italic">
                        No leave records found for the selected options.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- Mark / Modify Leave Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-sm bg-white border border-neutral-100 rounded-xl p-6 shadow-2xl relative"
            style={{ animation: 'fadeIn 0.2s ease' }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={15} />
            </button>

            <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">
              {modalMode === 'add' ? 'Mark attendance / leave' : 'Modify leave record'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-2xs font-semibold">
              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  Team Member
                </label>
                <select
                  required
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  disabled={modalMode === 'edit'}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="" disabled>Select Partner</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={modalMode === 'edit'}
                  style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  Attendance Status
                </label>
                <select
                  required
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Casual Leave">Casual Leave</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. medical appointment, vacation, etc."
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  style={INPUT}
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
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Leaves;
