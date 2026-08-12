import React, { useState, useEffect } from 'react';
import { 
  FiCalendar, FiChevronLeft, FiChevronRight, FiPlus, 
  FiEdit2, FiTrash2, FiX, FiUser, FiGrid, FiList, FiCheckCircle
} from 'react-icons/fi';
import api from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

const Leaves = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedPartnerFilter, setSelectedPartnerFilter] = useState('All Partners');
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' | 'cards' | 'logs'
  
  const [summaryData, setSummaryData] = useState([]);
  const [leavesList, setLeavesList] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Individual Member Calendar Modal state
  const [calendarMember, setCalendarMember] = useState(null); // Member object when viewing member's calendar

  // Mark / Edit Leave Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [formMemberId, setFormMemberId] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState('Present');
  const [formReason, setFormReason] = useState('');

  const [year, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[monthNum - 1] + ' ' + year;

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

  // Open modal to mark attendance for a specific member & date
  const openMarkModalForMemberDate = (memberId, dayNum) => {
    const dayStr = String(dayNum).padStart(2, '0');
    const monthStr = String(monthNum).padStart(2, '0');
    const targetDate = `${year}-${monthStr}-${dayStr}`;

    // Check if leave record already exists for this member and date
    const existing = leavesList.find(l => {
      const lMemId = typeof l.memberId === 'object' ? l.memberId._id : l.memberId;
      return lMemId === memberId && l.date === targetDate;
    });

    if (existing) {
      setModalMode('edit');
      setEditingId(existing._id);
      setFormMemberId(memberId);
      setFormDate(targetDate);
      setFormStatus(existing.status);
      setFormReason(existing.reason || '');
    } else {
      setModalMode('add');
      setEditingId(null);
      setFormMemberId(memberId);
      setFormDate(targetDate);
      setFormStatus('Present');
      setFormReason('');
    }
    setIsModalOpen(true);
  };

  // Open generic add modal
  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormMemberId(members[0]?._id || '');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormStatus('Present');
    setFormReason('');
    setIsModalOpen(true);
  };

  // Open Company Holiday bulk modal
  const handleOpenHolidayModal = () => {
    setModalMode('add');
    setEditingId(null);
    setFormMemberId('ALL');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormStatus('Company Holiday');
    setFormReason('Company Holiday');
    setIsModalOpen(true);
  };

  // Open modal for editing an existing record
  const handleOpenEditModal = (leave) => {
    setModalMode('edit');
    setEditingId(leave._id);
    setFormMemberId(leave.memberId);
    setFormDate(leave.date);
    setFormStatus(leave.status);
    setFormReason(leave.reason || '');
    setIsModalOpen(true);
  };

  const [submitting, setSubmitting] = useState(false);

  // Submit Leave Mark
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    const isHoliday = formStatus === 'Company Holiday';
    const targetMemberId = isHoliday ? 'ALL' : formMemberId;

    if ((!isHoliday && !targetMemberId) || !formDate || !formStatus) {
      return toast.error('Please fill in all required fields');
    }

    setSubmitting(true);
    try {
      const payload = {
        memberId: targetMemberId,
        date: formDate,
        status: formStatus,
        reason: formReason || (isHoliday ? 'Company Holiday' : '')
      };

      if (isHoliday && members.length > 0) {
        payload.memberIds = members.map(m => m._id);
      }

      await api.post('/leave', payload);

      toast.success(isHoliday ? 'Company Holiday marked for all members!' : (modalMode === 'add' ? 'Attendance marked successfully' : 'Record updated'));
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save attendance record');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Leave Record
  const [deleteLeaveId, setDeleteLeaveId] = useState(null);
  const [deletingLeave, setDeletingLeave] = useState(false);

  const confirmDeleteLeave = (id) => {
    setDeleteLeaveId(id);
  };

  const handleDeleteLeave = async () => {
    if (!deleteLeaveId) return;
    setDeletingLeave(true);
    try {
      await api.delete(`/leave/${deleteLeaveId}`);
      toast.success('Attendance record deleted');
      setDeleteLeaveId(null);
      fetchData();
    } catch (err) {
      toast.error('Failed to delete attendance record');
    } finally {
      setDeletingLeave(false);
    }
  };

  const getDayAbbr = (year, monthNum, dayNum) => {
    const d = new Date(year, monthNum - 1, dayNum);
    const dayIndex = d.getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
    const abbrs = ['SU', 'MN', 'TU', 'WE', 'TH', 'FR', 'SA'];
    return abbrs[dayIndex];
  };

  // Helper for Status Badge & Colors
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present':
        return { label: 'P', bg: '#10b981', color: '#ffffff', fullLabel: 'Present', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'Absent':
        return { label: 'A', bg: '#ef4444', color: '#ffffff', fullLabel: 'Absent', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'Half Day':
        return { label: 'HD', bg: '#f59e0b', color: '#ffffff', fullLabel: 'Half Day', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'Company Holiday':
      case 'Holiday':
        return { label: 'O', bg: '#2563eb', color: '#ffffff', fullLabel: 'Holiday', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return null;
    }
  };

  // Filter leaves table
  const filteredLeaves = leavesList.filter(l => {
    if (selectedPartnerFilter === 'All Partners') return true;
    return l.memberId === selectedPartnerFilter;
  });

  const filteredSummary = summaryData.filter(s => {
    if (selectedPartnerFilter === 'All Partners') return true;
    return s.member._id === selectedPartnerFilter;
  });

  /* ─── Shared Inputs ─── */
  const INPUT = {
    background: '#ffffff',
    border: '1px solid rgba(138,50,198,0.25)',
    borderRadius: '0px',
    color: '#2c2438',
    fontSize: '14px',
    fontWeight: '500',
    fontFamily: 'Montserrat, sans-serif',
    outline: 'none',
    width: '100%',
    padding: '9px 13px',
    transition: 'all 0.15s ease-in-out',
  };
  const onFocus = e => { e.target.style.borderColor = '#8a32c6'; e.target.style.boxShadow = '0 0 0 3px rgba(138,50,198,0.15)'; };
  const onBlur  = e => { e.target.style.borderColor = 'rgba(138,50,198,0.25)'; e.target.style.boxShadow = 'none'; };

  return (
    <div className="space-y-2 text-neutral-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      
      {/* ── Page Header / Action Bar ── */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        {/* Segmented Tab Switcher */}
        <div className="bg-purple-100/60 p-0.5 rounded-lg flex space-x-1 border border-purple-200/50">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'matrix' 
                ? 'bg-white text-[#8a32c6] shadow-xs' 
                : 'text-neutral-600 hover:text-[#8a32c6] hover:bg-white/50'
            }`}
          >
            <FiGrid size={13} />
            <span>Monthly Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center space-x-1.5 ${
              activeTab === 'cards' 
                ? 'bg-white text-[#8a32c6] shadow-xs' 
                : 'text-neutral-600 hover:text-[#8a32c6] hover:bg-white/50'
            }`}
          >
            <FiCalendar size={13} />
            <span>Member Cards</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleOpenHolidayModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all hover:shadow-xs"
          >
            <FiCalendar size={13} /> Mark Company Holiday
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8a32c6] hover:bg-[#7828b0] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all hover:shadow-xs"
          >
            <FiPlus size={13} /> Mark Attendance
          </button>
        </div>
      </div>

      {/* ── Filter Bar & Color Legend — single unified row ── */}
      <div className="bg-white border border-purple-100/80 rounded-xl px-4 py-2 shadow-xs flex flex-wrap items-center gap-3">

        {/* Month Picker */}
        <div className="flex items-center gap-1 bg-purple-50/80 border border-purple-200/80 rounded-lg px-2 py-1 relative shadow-2xs">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const d = new Date(year, monthNum - 2, 1);
              setSelectedMonth(d.toISOString().slice(0, 7));
            }}
            className="p-1 hover:bg-purple-200/80 rounded text-[#8a32c6] transition-colors relative z-20 cursor-pointer"
            title="Previous Month"
          >
            <FiChevronLeft size={16} />
          </button>

          <div className="relative flex items-center justify-center px-1">
            <span className="text-2xs font-extrabold text-[#2c2438] px-1.5 min-w-[100px] text-center tracking-tight uppercase cursor-pointer">
              {currentMonthName}
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-transparent outline-none cursor-pointer p-0 opacity-0 absolute inset-0 z-10"
              title="Select Month"
            />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const d = new Date(year, monthNum, 1);
              setSelectedMonth(d.toISOString().slice(0, 7));
            }}
            className="p-1 hover:bg-purple-200/80 rounded text-[#8a32c6] transition-colors relative z-20 cursor-pointer"
            title="Next Month"
          >
            <FiChevronRight size={16} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-purple-200/60 hidden sm:block" />

        {/* Legend badges — inline */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label: 'P', text: 'Present',  bg: '#10b981', color: 'white', pillBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80' },
            { label: 'A', text: 'Absent',   bg: '#ef4444', color: 'white', pillBg: 'bg-rose-50 text-rose-800 border-rose-200/80' },
            { label: 'HD',text: 'Half Day', bg: '#f59e0b', color: 'white', pillBg: 'bg-amber-50 text-amber-900 border-amber-200/80' },
            { label: 'O', text: 'Holiday',  bg: '#2563eb', color: 'white', pillBg: 'bg-blue-50 text-blue-900 border-blue-200/80' },
          ].map(({ label, text, bg, color, pillBg }) => (
            <div key={label} className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${pillBg} text-2xs font-semibold shadow-2xs`}>
              <span
                className="w-3.5 h-3.5 rounded flex items-center justify-center font-bold text-[8.5px] flex-shrink-0"
                style={{ background: bg, color }}
              >
                {label}
              </span>
              <span className="text-[10.5px] font-bold">{text}</span>
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Member Filter Dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Filter:</span>
          <select
            value={selectedPartnerFilter}
            onChange={(e) => setSelectedPartnerFilter(e.target.value)}
            style={{ ...INPUT, width: 'auto', padding: '4px 10px', fontSize: '11px', fontWeight: '700', borderRadius: '8px' }}
            onFocus={onFocus}
            onBlur={onBlur}
          >
            <option value="All Partners">All Partners ({members.length})</option>
            {members.map(m => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="w-8 h-8 border-2 border-[#8a32c6] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Loading monthly attendance matrix...</p>
        </div>
      ) : (
        <>
          {/* ── TAB 1: MONTHLY ATTENDANCE MATRIX SHEET FOR ALL MEMBERS ── */}
          {activeTab === 'matrix' && (
            <div className="bg-white border border-purple-100 rounded-2xl overflow-hidden shadow-xs">
              <div className="px-6 py-3.5 bg-gradient-to-r from-purple-50/80 via-purple-50/40 to-white border-b border-purple-100 flex justify-between items-center">
                <h3 className="text-xs font-extrabold text-[#8a32c6] uppercase tracking-wider flex items-center gap-2">
                  <span>Monthly Attendance Sheet</span>
                  <span className="text-neutral-400 font-medium">—</span>
                  <span className="text-neutral-700 font-bold">{currentMonthName}</span>
                </h3>
                <span className="text-2xs font-semibold text-neutral-400 italic hidden sm:block">
                  Click any day box to mark or update attendance for that partner
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#7c2db5] via-[#8a32c6] to-[#6d25a3] text-white font-semibold text-xs">
                      <th className="py-3 px-3.5 border-r border-purple-600/50 min-w-[180px] sticky left-0 bg-[#7c2db5] z-10 font-bold tracking-wide">
                        Member Name
                      </th>
                      {daysArray.map(dayNum => {
                        const cellDate = new Date(year, monthNum - 1, dayNum);
                        const today = new Date(); today.setHours(0,0,0,0);
                        const isToday = cellDate.getTime() === today.getTime();
                        return (
                          <th key={dayNum} className={`py-1.5 px-0.5 text-center w-7 border-r border-purple-600/40 font-medium text-xs ${isToday ? 'bg-amber-400/30' : ''}`}>
                            <div className="text-[8px] uppercase tracking-tighter opacity-80 text-purple-200 font-bold leading-tight">
                              {getDayAbbr(year, monthNum, dayNum)}
                            </div>
                            <div className={`font-bold text-xs ${isToday ? 'text-yellow-300 underline underline-offset-2' : ''}`}>{dayNum}</div>
                          </th>
                        );
                      })}
                      <th className="py-2.5 px-2 text-center min-w-[38px] bg-emerald-700/90 border-r border-purple-600/40 font-bold">P</th>
                      <th className="py-2.5 px-2 text-center min-w-[38px] bg-rose-700/90 border-r border-purple-600/40 font-bold">A</th>
                      <th className="py-2.5 px-2 text-center min-w-[38px] bg-amber-600/90 border-r border-purple-600/40 font-bold">HD</th>
                      <th className="py-2.5 px-2 text-center min-w-[38px] bg-blue-700/90 border-r border-purple-600/40 font-bold">O</th>
                      <th className="py-2.5 px-3 text-center min-w-[65px] bg-purple-900/90 font-extrabold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/70 font-medium">
                    {filteredSummary.length > 0 ? (
                      filteredSummary.map(({ member, stats, dailyStatus }) => (
                        <tr key={member._id} className="hover:bg-purple-50/40 transition-colors">
                          
                          {/* Member Name column */}
                          <td className="py-2.5 px-3 border-r border-purple-100 font-semibold text-neutral-900 sticky left-0 bg-white z-10 shadow-xs min-w-[180px]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 truncate">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#8a32c6] to-[#6d25a3] text-white font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 shadow-2xs">
                                  {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
                                </div>
                                <span className="truncate font-bold text-xs text-neutral-900">{member.name}</span>
                              </div>
                              <button
                                onClick={() => setCalendarMember(member)}
                                className="p-1 rounded-lg hover:bg-purple-100 text-[#8a32c6] transition-colors flex-shrink-0"
                                title={`View ${member.name}'s Calendar`}
                              >
                                <FiCalendar size={13} />
                              </button>
                            </div>
                          </td>

                          {/* Day Columns 1 to 31 */}
                          {daysArray.map(dayNum => {
                            const dayStr = String(dayNum).padStart(2, '0');
                            const monthStr = String(monthNum).padStart(2, '0');
                            const dateKey = `${year}-${monthStr}-${dayStr}`;
                            const status = dailyStatus[dateKey];
                            const cellDate = new Date(year, monthNum - 1, dayNum);
                            const today = new Date(); today.setHours(0,0,0,0);
                            const isPastOrToday = cellDate <= today;
                            const effectiveStatus = status || (isPastOrToday ? 'Present' : null);
                            const badge = effectiveStatus ? getStatusBadge(effectiveStatus) : null;
                            const hasRecord = !!status;

                            return (
                              <td 
                                key={dayNum} 
                                onClick={() => openMarkModalForMemberDate(member._id, dayNum)}
                                className="py-1.5 px-0.5 text-center border-r border-purple-100/60 cursor-pointer hover:bg-purple-100/60 transition-colors"
                                title={`${member.name} — Day ${dayNum} (${getDayAbbr(year, monthNum, dayNum)})${effectiveStatus ? ': ' + effectiveStatus : ''}`}
                              >
                                {badge ? (
                                  <span 
                                    className="w-6 h-6 mx-auto rounded-md flex items-center justify-center font-bold text-[11px] shadow-2xs"
                                    style={{ background: badge.bg, color: badge.color, opacity: 1 }}
                                  >
                                    {badge.label}
                                  </span>
                                ) : (
                                  <span className="w-6 h-6 mx-auto flex items-center justify-center text-neutral-300 text-[11px]">
                                    –
                                  </span>
                                )}
                              </td>
                            );
                          })}

                          {/* Summary totals columns */}
                          <td className="py-2.5 px-1.5 text-center font-bold text-emerald-700 bg-emerald-50/50 border-r border-purple-100 text-xs min-w-[38px]">
                            {(() => {
                              const today = new Date(); today.setHours(0,0,0,0);
                              const pastDays = daysArray.filter(d => new Date(year, monthNum - 1, d) <= today).length;
                              const nonPresent = Object.values(dailyStatus).filter(s => s !== 'Present').length;
                              return Math.max(0, pastDays - nonPresent);
                            })()}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-rose-700 bg-rose-50/50 border-r border-purple-100 text-xs min-w-[38px]">
                            {stats.absent}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-amber-700 bg-amber-50/50 border-r border-purple-100 text-xs min-w-[38px]">
                            {stats.halfDay}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-bold text-blue-700 bg-blue-50/50 border-r border-purple-100 text-xs min-w-[38px]">
                            {stats.holiday || 0}
                          </td>
                          <td className="py-2.5 px-2 text-center font-extrabold text-[#8a32c6] bg-purple-50/60 text-xs min-w-[65px]">
                            {stats.totalLeave}
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={daysInMonth + 6} className="text-center py-10 text-neutral-400 italic">
                          No partner records found for the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {/* ── TAB 2: MEMBER CARDS GRID & INDIVIDUAL CALENDAR BUTTONS ── */}
          {activeTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSummary.map(({ member, stats }) => (
                <div 
                  key={member._id}
                  className="bg-white border border-purple-100/80 rounded-2xl p-4.5 shadow-xs space-y-4 hover:border-purple-300 transition-colors relative"
                >
                  <div className="flex justify-between items-center border-b border-purple-100/60 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-full bg-purple-100 text-[#8a32c6] flex items-center justify-center font-semibold text-sm">
                        <FiUser size={17} />
                      </div>
                      <div>
                        <div className="text-base font-semibold text-neutral-900">{member.name}</div>
                        <div className="text-xs text-neutral-500 font-normal">{member.phoneNumber || 'No Contact'}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCalendarMember(member)}
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 text-xs font-semibold text-[#8a32c6] flex items-center space-x-1.5 transition-colors"
                    >
                      <FiCalendar size={14} />
                      <span>Calendar</span>
                    </button>
                  </div>

                  {/* Summary badges */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-center">
                    <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/60">
                      <div className="text-[10px] text-emerald-800 uppercase tracking-wider font-semibold">Present (P)</div>
                      <div className="text-lg font-semibold text-emerald-700 mt-0.5">{stats.present}</div>
                    </div>
                    <div className="p-2.5 bg-rose-50/70 border border-rose-200/60">
                      <div className="text-[10px] text-rose-800 uppercase tracking-wider font-semibold">Absent (A)</div>
                      <div className="text-lg font-semibold text-rose-700 mt-0.5">{stats.absent}</div>
                    </div>
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60">
                      <div className="text-[10px] text-amber-800 uppercase tracking-wider font-semibold">Half Day (HD)</div>
                      <div className="text-lg font-semibold text-amber-700 mt-0.5">{stats.halfDay}</div>
                    </div>
                    <div className="p-2.5 bg-blue-50/70 border border-blue-200/60">
                      <div className="text-[10px] text-blue-900 uppercase tracking-wider font-semibold">Holiday (O)</div>
                      <div className="text-lg font-semibold text-blue-800 mt-0.5">{stats.holiday || 0}</div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </>
      )}

      {/* ── INDIVIDUAL MEMBER CALENDAR MODAL ── */}
      {calendarMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white border border-purple-200 rounded-2xl p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setCalendarMember(null)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={18} />
            </button>

            <div className="flex items-center space-x-3 border-b border-purple-100 pb-3.5">
              <div className="w-10 h-10 rounded-full bg-purple-100 text-[#8a32c6] flex items-center justify-center font-semibold">
                <FiCalendar size={19} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#8a32c6] tracking-tight">
                  {calendarMember.name}'s Attendance Sheet
                </h3>
                <p className="text-xs text-neutral-500 font-medium">
                  {currentMonthName}
                </p>
              </div>
            </div>

            {/* Calendar Grid (Days 1 to 31) */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-purple-900 bg-purple-50 p-2 rounded-xl">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {/* Empty offset days for start of month */}
                {Array.from({ length: new Date(year, monthNum - 1, 1).getDay() }).map((_, i) => (
                  <div key={`offset-${i}`} className="h-12 bg-neutral-50 rounded-xl border border-neutral-100 opacity-30" />
                ))}

                {daysArray.map(dayNum => {
                  const dayStr = String(dayNum).padStart(2, '0');
                  const monthStr = String(monthNum).padStart(2, '0');
                  const targetDate = `${year}-${monthStr}-${dayStr}`;
                  
                  // Find leave status for this day
                  const mSummary = summaryData.find(s => s.member._id === calendarMember._id);
                  const status = mSummary?.dailyStatus?.[targetDate];
                  const badge = getStatusBadge(status);

                  return (
                    <button
                      key={dayNum}
                      onClick={() => {
                        openMarkModalForMemberDate(calendarMember._id, dayNum);
                      }}
                      className="h-12 rounded-xl border p-1.5 flex flex-col justify-between items-center transition-all hover:scale-105 shadow-2xs text-left"
                      style={{
                        borderColor: badge ? badge.bg : 'rgba(138,50,198,0.15)',
                        background: badge ? `${badge.bg}15` : '#ffffff'
                      }}
                    >
                      <span className="text-xs font-semibold text-neutral-700 self-start">
                        {dayNum}
                      </span>
                      {badge ? (
                        <span 
                          className="w-5 h-5 rounded-md flex items-center justify-center font-semibold text-[10px] shadow-2xs"
                          style={{ background: badge.bg, color: badge.color }}
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-neutral-300">+</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-purple-100 pt-3.5">
              <span className="text-xs text-neutral-500 font-medium">Click any date box to edit status</span>
              <button
                onClick={() => setCalendarMember(null)}
                className="px-4 py-2 bg-[#8a32c6] hover:bg-[#7828b0] text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Close Sheet
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── MARK / MODIFY ATTENDANCE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white border border-purple-200 rounded-2xl p-6 shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={18} />
            </button>

            <h3 className="text-base font-semibold text-[#8a32c6]">
              {modalMode === 'add' ? 'Mark Attendance / Leave' : 'Modify Attendance Record'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              {formStatus !== 'Company Holiday' && (
                <div>
                  <label className="block text-neutral-600 font-semibold mb-1.5">
                    Team Member*
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
              )}

              <div>
                <label className="block text-neutral-600 font-semibold mb-1.5">
                  Date*
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  disabled={modalMode === 'edit'}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1.5">
                  Attendance Status*
                </label>
                <select
                  required
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                >
                  <option value="Present">Present (P - Green)</option>
                  <option value="Absent">Absent (A - Red)</option>
                  <option value="Half Day">Half Day (HD - Amber)</option>
                  <option value="Company Holiday">Company Holiday (O - Blue)</option>
                </select>
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1.5">
                  Reason / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Client visit, medical, vacation..."
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
                  className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#8a32c6] hover:bg-[#7828b0] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Save Record</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteLeaveId)}
        onClose={() => setDeleteLeaveId(null)}
        onConfirm={handleDeleteLeave}
        title="Delete Leave Record"
        message="Are you sure you want to remove this leave attendance record? This action cannot be undone."
        confirmText="Remove Record"
        loading={deletingLeave}
      />

    </div>
  );
};

export default Leaves;
