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
      descColor: 'text-violet-700',
      icon: FiUsers, 
      iconColor: '#8a32c6', 
      iconBg: 'rgba(138,50,198,0.12)' 
    },
    { 
      label: 'Total Income', 
      value: `₹${summary.totalIncome.toLocaleString()}`, 
      desc: '▲ 18.5% this month', 
      descColor: 'text-amber-700',
      icon: FiDollarSign, 
      iconColor: '#b08d02', 
      iconBg: 'rgba(244,206,65,0.20)' 
    },
    { 
      label: 'Total Expenses', 
      value: `₹${summary.totalExpense.toLocaleString()}`, 
      desc: '▼ 8.3% this month', 
      descColor: 'text-rose-600',
      icon: FiDollarSign, 
      iconColor: '#ef4444', 
      iconBg: 'rgba(239,68,68,0.12)' 
    },
    { 
      label: 'Net Profit', 
      value: `₹${summary.netProfit.toLocaleString()}`, 
      desc: '▲ 28.7% this month', 
      descColor: 'text-violet-700',
      icon: FiTrendingUp, 
      iconColor: '#8a32c6', 
      iconBg: 'rgba(138,50,198,0.12)' 
    },
    { 
      label: 'Members', 
      value: summary.totalMembers, 
      desc: '▲ 2 this month', 
      descColor: 'text-amber-700',
      icon: FiUsers, 
      iconColor: '#b08d02', 
      iconBg: 'rgba(244,206,65,0.20)' 
    },
    { 
      label: "Today's Attendance", 
      value: `${summary.todayAttendance} / ${summary.totalMembers}`, 
      desc: `${attendanceRate}% Present`, 
      descColor: 'text-violet-700',
      icon: FiActivity, 
      iconColor: '#8a32c6', 
      iconBg: 'rgba(138,50,198,0.12)' 
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-base font-medium uppercase tracking-wider text-neutral-800">
            Welcome back, Admin 👋
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            Here's what's happening with your business today.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <button 
            type="button"
            onClick={() => navigate('/finance')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#8a32c6] hover:bg-[#7828b0] text-white shadow-xs transition-all"
          >
            <FiPlus size={13} /> <span>Add Income</span>
          </button>
          <button 
            type="button"
            onClick={() => navigate('/finance')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#f4ce41] hover:bg-[#ebd035] text-[#2c2438] shadow-xs transition-all font-semibold"
          >
            <FiPlus size={13} /> <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="p-4 flex flex-col justify-between shadow-xs border border-purple-100/70 bg-white hover:border-purple-300 transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-medium text-neutral-500">{kpi.label}</span>
              <div 
                className="p-1.5 flex items-center justify-center" 
                style={{ background: kpi.iconBg }}
              >
                <kpi.icon size={14} style={{ color: kpi.iconColor }} />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-base font-medium text-neutral-900 tracking-tight">
                {kpi.value}
              </div>
              <div className={`text-[10px] font-medium mt-1 ${kpi.descColor}`}>
                {kpi.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 1: Income vs Expense Trend & Mini Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Income vs Expense Area Chart */}
        <div className="xl:col-span-2 bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-4 border-b border-purple-50 pb-2">Income vs Expense Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8a32c6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#8a32c6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f4ce41" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f4ce41" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="month" tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(138,50,198,0.2)', color: '#2c2438', fontSize: 11, fontFamily: 'Montserrat', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, fontWeight: 500 }} />
                <Area type="monotone" dataKey="income" stroke="#8a32c6" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#eab308" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mini Calendar Widget */}
        <div className="bg-white border border-purple-100/70 p-4 shadow-xs">
          <div className="flex items-center space-x-2 text-neutral-800 mb-4 border-b border-purple-50 pb-2">
            <FiCalendar className="text-[#8a32c6]" size={14} />
            <h4 className="font-semibold text-xs text-[#8a32c6] tracking-wider uppercase">{currentMonthName} {currentYear}</h4>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <span key={day} className="text-neutral-400 font-semibold py-1 uppercase">{day}</span>
            ))}
            {calendarDays.map((day, index) => (
              <div 
                key={index} 
                className={`py-1.5 font-medium transition-colors flex items-center justify-center w-7 h-7 mx-auto
                  ${day === null ? 'invisible' : ''}
                  ${day === currentDay 
                    ? 'bg-[#8a32c6] text-white font-semibold shadow-xs' 
                    : 'text-neutral-700 hover:bg-purple-50 cursor-pointer'
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
        <div className="bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-4 border-b border-purple-50 pb-2">Profit & Loss Curve</h3>
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
                <XAxis dataKey="month" tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(138,50,198,0.2)', color: '#2c2438', fontSize: 11, fontFamily: 'Montserrat' }} />
                <Area type="monotone" dataKey="profit" stroke="#8a32c6" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2} name="Net Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Breakdown */}
        <div className="bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-4 border-b border-purple-50 pb-2">Expense Categories</h3>
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
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(138,50,198,0.2)', fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs w-1/2 max-h-[140px] overflow-y-auto pr-2">
                  {expenseBreakdown.slice(0, 5).map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between font-medium">
                      <div className="flex items-center space-x-1 truncate max-w-[65px]">
                        <div className="w-1.5 h-1.5 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate text-neutral-600">{entry.name}</span>
                      </div>
                      <span className="text-neutral-800 font-medium">₹{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-neutral-400 italic">No expenses recorded yet.</p>
            )}
          </div>
        </div>

        {/* Partner breakdowns */}
        <div className="bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-4 border-b border-purple-50 pb-2">Partner Contribution Ledger</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="name" tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 500 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(138,50,198,0.2)', fontSize: 11 }} />
                <Bar dataKey="income" fill="#8a32c6" name="Inflow" />
                <Bar dataKey="expense" fill="#f4ce41" name="Outflow" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Activity Timeline & Recent Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent leads table */}
        <div className="xl:col-span-2 bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-3 border-b border-purple-50 pb-2">Recent Leads</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-purple-100 bg-purple-50/60 text-[#8a32c6] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Business Name</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3">Requirement</th>
                  <th className="py-2.5 px-3 text-right">Date Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-100/60">
                {recent.contacts.length > 0 ? (
                  recent.contacts.map((lead) => (
                    <tr key={lead._id} className="hover:bg-purple-50/30 text-neutral-800 font-medium transition-colors">
                      <td className="py-2.5 px-3 font-medium text-neutral-900">{lead.businessName}</td>
                      <td className="py-2.5 px-3">{lead.agentName}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] bg-purple-100 text-[#8a32c6] font-medium uppercase">
                          {lead.requirement}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500">
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
        <div className="bg-white border border-purple-100/70 p-4 shadow-xs">
          <h3 className="text-xs font-semibold text-[#8a32c6] uppercase tracking-wider mb-3 border-b border-purple-50 pb-2">Recent Cash Activities</h3>
          <div className="space-y-3">
            {recent.income.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-start space-x-2.5 text-xs">
                <div className="p-1 border border-violet-500/20 bg-violet-50 text-violet-700 mt-0.5">
                  <FiTrendingUp size={12} />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-800 font-medium">Inflow from {item.source}</p>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">{item.date} • Recv: {item.receiver}</span>
                </div>
                <div className="font-medium text-emerald-700">
                  +₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}
            
            {recent.expenses.slice(0, 3).map((item) => (
              <div key={item._id} className="flex items-start space-x-2.5 text-xs">
                <div className="p-1 border border-amber-500/20 bg-amber-50 text-amber-700 mt-0.5">
                  <FiTrendingDown size={12} style={{ transform: 'scaleY(-1)' }} />
                </div>
                <div className="flex-1">
                  <p className="text-neutral-800 font-medium">Outflow for {item.reason}</p>
                  <span className="text-[10px] text-neutral-400 block mt-0.5">{item.date} • Log: {item.partner}</span>
                </div>
                <div className="font-medium text-rose-700">
                  -₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}

            {recent.income.length === 0 && recent.expenses.length === 0 && (
              <p className="text-center text-xs text-neutral-400 italic py-6">No financial transactions recorded.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
