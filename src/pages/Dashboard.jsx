import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, 
  FiDollarSign, 
  FiActivity, 
  FiPlus, 
  FiTrendingUp, 
  FiTrendingDown,
  FiFileText, 
  FiClock, 
  FiCalendar 
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-2xs font-semibold text-neutral-500">Loading workspace analytics...</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalContacts: 0,
    totalMembers: 0,
    todayAttendance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0
  };

  const chartData = data?.chartData || [];
  const expenseBreakdown = data?.expenseBreakdown || [];
  const partnerBreakdown = data?.partnerBreakdown || [];
  
  const recent = data?.recent || {
    contacts: [],
    income: [],
    expenses: []
  };

  // Recharts theme colors
  const COLORS = ['#8a32c6', '#a35ad6', '#f4ce41', '#3b82f6', '#10b981', '#ef4444', '#f59e0b'];

  // Mini Calendar Calculations
  const dateObj = new Date();
  const currentMonthName = dateObj.toLocaleString('default', { month: 'long' });
  const currentYear = dateObj.getFullYear();
  const currentDay = dateObj.getDate();
  const totalDaysInMonth = new Date(currentYear, dateObj.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, dateObj.getMonth(), 1).getDay();

  const calendarDays = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= totalDaysInMonth; i++) {
    calendarDays.push(i);
  }

  const attendanceRate = summary.totalMembers > 0 
    ? ((summary.todayAttendance / summary.totalMembers) * 100).toFixed(1) 
    : '0.0';

  const kpis = [
    { 
      label: 'Total Contacts', 
      value: summary.totalContacts, 
      desc: '▲ 12% this month', 
      descColor: 'text-emerald-600',
      icon: FiUsers, 
      iconColor: '#8a32c6', 
      iconBg: 'rgba(138,50,198,0.08)' 
    },
    { 
      label: 'Total Income', 
      value: `₹${summary.totalIncome.toLocaleString()}`, 
      desc: '▲ 18.5% this month', 
      descColor: 'text-emerald-600',
      icon: FiDollarSign, 
      iconColor: '#10b981', 
      iconBg: 'rgba(16,185,129,0.08)' 
    },
    { 
      label: 'Total Expenses', 
      value: `₹${summary.totalExpense.toLocaleString()}`, 
      desc: '▼ 8.3% this month', 
      descColor: 'text-rose-600',
      icon: FiDollarSign, 
      iconColor: '#ef4444', 
      iconBg: 'rgba(239,68,68,0.08)' 
    },
    { 
      label: 'Net Profit', 
      value: `₹${summary.netProfit.toLocaleString()}`, 
      desc: '▲ 28.7% this month', 
      descColor: 'text-emerald-600',
      icon: FiTrendingUp, 
      iconColor: '#f4ce41', 
      iconBg: 'rgba(244,206,65,0.12)' 
    },
    { 
      label: 'Members', 
      value: summary.totalMembers, 
      desc: '▲ 2 this month', 
      descColor: 'text-emerald-600',
      icon: FiUsers, 
      iconColor: '#3b82f6', 
      iconBg: 'rgba(59,130,246,0.08)' 
    },
    { 
      label: "Today's Attendance", 
      value: `${summary.todayAttendance} / ${summary.totalMembers}`, 
      desc: `${attendanceRate}% Present`, 
      descColor: 'text-brand-600',
      icon: FiActivity, 
      iconColor: '#f97316', 
      iconBg: 'rgba(249,115,22,0.08)' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-wider text-neutral-800">
            Welcome back, Admin 👋
          </h1>
          <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-2xs font-bold">
          <button 
            onClick={() => navigate('/finance')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 shadow-sm transition-colors"
          >
            <FiPlus size={11} /> <span>Add Income</span>
          </button>
          <button 
            onClick={() => navigate('/finance')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 shadow-sm transition-colors"
          >
            <FiPlus size={11} /> <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl flex flex-col justify-between shadow-sm border border-neutral-100 bg-white hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-400">{kpi.label}</span>
              <div 
                className="p-1.5 rounded-lg flex items-center justify-center" 
                style={{ background: kpi.iconBg }}
              >
                <kpi.icon size={12} style={{ color: kpi.iconColor }} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-sm font-extrabold text-neutral-800 tracking-tight">
                {kpi.value}
              </div>
              <div className={`text-[8px] font-bold mt-1 ${kpi.descColor}`}>
                {kpi.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Income vs Expense Trend & Mini Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Income vs Expense Area Chart */}
        <div className="xl:col-span-2 bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">Income vs Expense Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a32c6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8a32c6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="month" tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', color: '#2c2438', fontSize: 10, fontFamily: 'Montserrat', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 600 }} />
                <Area type="monotone" dataKey="income" stroke="#8a32c6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Calendar Widget */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-2 text-neutral-800 mb-4 border-b border-neutral-50 pb-2">
            <FiCalendar className="text-brand-500" size={13} />
            <h4 className="font-bold text-2xs font-sans tracking-widest uppercase">{currentMonthName} {currentYear}</h4>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <span key={day} className="text-neutral-400 font-bold py-1 uppercase">{day}</span>
            ))}
            {calendarDays.map((day, index) => (
              <div 
                key={index} 
                className={`py-1.5 rounded-full font-semibold transition-colors font-mono flex items-center justify-center w-7 h-7 mx-auto
                  ${day === null ? 'invisible' : ''}
                  ${day === currentDay 
                    ? 'bg-brand-500 text-white font-bold shadow' 
                    : 'text-neutral-700 hover:bg-neutral-50 cursor-pointer'
                  }
                `}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Category Breakdowns & Partner Contribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Net Profit & Loss Area Chart */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">Profit & Loss Curve</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a32c6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8a32c6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="month" tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', color: '#2c2438', fontSize: 10, fontFamily: 'Montserrat', borderRadius: 8 }} />
                <Area type="monotone" dataKey="profit" stroke="#8a32c6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={1.5} name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">Expense Categories</h3>
          <div className="h-48 flex flex-col justify-center">
            {expenseBreakdown.length > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <div className="w-1/2 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseBreakdown}
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', borderRadius: 8, fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-[9px] w-1/2 max-h-[140px] overflow-y-auto pr-2">
                  {expenseBreakdown.slice(0, 5).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between font-semibold">
                      <div className="flex items-center space-x-1 truncate max-w-[65px]">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-neutral-600">{entry.name}</span>
                      </div>
                      <span className="font-mono text-neutral-800">₹{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-2xs text-neutral-400 italic">No expenses recorded yet.</p>
            )}
          </div>
        </div>

        {/* Partner breakdowns */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">Partner Contribution Ledger</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="name" tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="income" fill="#8a32c6" radius={[2, 2, 0, 0]} name="Inflow" />
                <Bar dataKey="expense" fill="#ef4444" radius={[2, 2, 0, 0]} name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Activity Timeline & Recent Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent leads table */}
        <div className="xl:col-span-2 bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-3 border-b border-neutral-50 pb-2">Recent Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-2xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-brand-600 font-extrabold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Business Name</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3 text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recent.contacts.length > 0 ? (
                  recent.contacts.map((lead) => (
                    <tr key={lead._id} className="hover:bg-neutral-50/50 text-neutral-700 font-medium transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-neutral-800">{lead.businessName}</td>
                      <td className="py-2.5 px-3">{lead.agentName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9px] bg-brand-50/15 border border-brand-100 text-brand-600 font-bold uppercase">
                          {lead.requirement}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-neutral-400">
                        {lead.date}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-neutral-400 italic">No recent leads found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Timeline logs */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-3 border-b border-neutral-50 pb-2">Recent Cash Activities</h3>
          <div className="space-y-3">
            {recent.income.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-start space-x-2.5 text-2xs">
                <div className="p-1 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 mt-0.5">
                  <FiTrendingUp size={11} />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-700 font-semibold">Inflow from {item.source}</p>
                  <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">{item.date} • Recv: {item.receiver}</span>
                </div>
                <div className="font-bold text-emerald-600 font-mono">
                  +₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}
            
            {recent.expenses.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-start space-x-2.5 text-2xs">
                <div className="p-1 rounded border border-rose-500/20 bg-rose-500/10 text-rose-500 mt-0.5">
                  <FiTrendingDown size={11} style={{ transform: 'scaleY(-1)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-700 font-semibold">Outflow for {item.reason}</p>
                  <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">{item.date} • Log: {item.partner}</span>
                </div>
                <div className="font-bold text-rose-600 font-mono">
                  -₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}

            {recent.income.length === 0 && recent.expenses.length === 0 && (
              <p className="text-center text-2xs text-neutral-400 italic py-6">No financial transactions recorded.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
