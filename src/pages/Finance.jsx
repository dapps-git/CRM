import React, { useState, useEffect } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiPlus, 
  FiTrash2, 
  FiFile,
  FiX
} from 'react-icons/fi';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../services/api';
import toast from 'react-hot-toast';

const Finance = () => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPartner, setSelectedPartner] = useState('All Partners');
  const [selectedMonth, setSelectedMonth] = useState('All Months');

  // Modal open triggers
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Form states
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    receiver: 'Saleel VT',
    businessName: '',
    commissionEnabled: false,
    commissionAgent: '',
    commissionAmount: '',
    receiptImage: null
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'Office',
    reason: '',
    description: '',
    partner: 'Saleel VT',
    billImage: null
  });

  const partners = ['Saleel VT', 'Anfas Sir', 'Shamna Madam', 'Sabith Boss'];
  const expenseCategories = [
    'Office', 'Travel', 'Food', 'Software', 'Hardware', 'Marketing', 'Salary', 'Utilities', 'Miscellaneous'
  ];

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [incRes, expRes] = await Promise.all([
        api.get('/income', { params: { limit: 2000 } }),
        api.get('/expense', { params: { limit: 2000 } })
      ]);
      setIncomes(incRes.data.incomes || []);
      setExpenses(expRes.data.expenses || []);
    } catch (err) {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Form submits
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || !incomeForm.source) return toast.error('Please enter amount and source');

    const formData = new FormData();
    formData.append('amount', incomeForm.amount);
    formData.append('date', incomeForm.date);
    formData.append('source', incomeForm.source);
    formData.append('receiver', incomeForm.receiver);
    formData.append('businessName', incomeForm.businessName);
    formData.append('commissionEnabled', incomeForm.commissionEnabled);
    if (incomeForm.commissionEnabled) {
      formData.append('commissionAgent', incomeForm.commissionAgent);
      formData.append('commissionAmount', incomeForm.commissionAmount);
    }
    if (incomeForm.receiptImage) {
      formData.append('receiptImage', incomeForm.receiptImage);
    }

    try {
      await api.post('/income', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Income transaction logged successfully');
      setIncomeForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        source: '',
        receiver: 'Saleel VT',
        businessName: '',
        commissionEnabled: false,
        commissionAgent: '',
        commissionAmount: '',
        receiptImage: null
      });
      setIncomeModalOpen(false);
      fetchFinanceData();
    } catch {
      toast.error('Failed to log income');
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.reason) return toast.error('Please enter amount and reason');

    const formData = new FormData();
    formData.append('amount', expenseForm.amount);
    formData.append('date', expenseForm.date);
    formData.append('category', expenseForm.category);
    formData.append('reason', expenseForm.reason);
    formData.append('description', expenseForm.description);
    formData.append('partner', expenseForm.partner);
    if (expenseForm.billImage) {
      formData.append('billImage', expenseForm.billImage);
    }

    try {
      await api.post('/expense', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Expense transaction logged successfully');
      setExpenseForm({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Office',
        reason: '',
        description: '',
        partner: 'Saleel VT',
        billImage: null
      });
      setExpenseModalOpen(false);
      fetchFinanceData();
    } catch {
      toast.error('Failed to log expense');
    }
  };

  const handleDeleteTransaction = async (type, id) => {
    if (!window.confirm('Delete this record permanently?')) return;
    try {
      await api.delete(`/${type}/${id}`);
      toast.success('Record removed');
      fetchFinanceData();
    } catch {
      toast.error('Failed to delete transaction');
    }
  };

  const getAvailableMonths = () => {
    const months = new Set();
    incomes.forEach(i => months.add(new Date(i.date).toISOString().slice(0, 7)));
    expenses.forEach(e => months.add(new Date(e.date).toISOString().slice(0, 7)));
    return Array.from(months).sort().reverse();
  };

  // Filter computations
  const filteredIncomes = incomes.filter(item => {
    const matchPartner = selectedPartner === 'All Partners' || item.receiver === selectedPartner;
    const matchMonth = selectedMonth === 'All Months' || new Date(item.date).toISOString().slice(0, 7) === selectedMonth;
    return matchPartner && matchMonth;
  });

  const filteredExpenses = expenses.filter(item => {
    const matchPartner = selectedPartner === 'All Partners' || item.partner === selectedPartner;
    const matchMonth = selectedMonth === 'All Months' || new Date(item.date).toISOString().slice(0, 7) === selectedMonth;
    return matchPartner && matchMonth;
  });

  // KPI Calculations
  const dateObj = new Date();
  const currentMonthStr = dateObj.toISOString().slice(0, 7);
  const currentMonthIncomes = incomes.filter(i => new Date(i.date).toISOString().slice(0, 7) === currentMonthStr);
  const currentMonthExpenses = expenses.filter(e => new Date(e.date).toISOString().slice(0, 7) === currentMonthStr);

  const statsIncome = currentMonthIncomes.reduce((sum, item) => sum + item.amount, 0);
  const statsExpense = currentMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const statsNet = statsIncome - statsExpense;

  // Chart 1: Partner breakdown
  const partnerExpenseShareData = partners.map(name => {
    const sum = expenses
      .filter(e => e.partner === name && new Date(e.date).toISOString().slice(0, 7) === currentMonthStr)
      .reduce((s, item) => s + item.amount, 0);
    return { name: name.split(' ')[0], amount: sum };
  });

  // Chart 2: Category distribution
  const categoryBreakdownData = expenseCategories.map(cat => {
    const sum = expenses
      .filter(e => e.category === cat && new Date(e.date).toISOString().slice(0, 7) === currentMonthStr)
      .reduce((s, item) => s + item.amount, 0);
    return { name: cat, value: sum };
  }).filter(item => item.value > 0);

  const CHART_COLORS = ['#8a32c6', '#a35ad6', '#f4ce41', '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#f43f5e'];

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
    <div className="space-y-6">
      
      {/* --- Page Header --- */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Expenses & Income</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            Log, verify and track ledger inflow/outflow balances.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs font-bold">
          <button
            onClick={() => setIncomeModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 shadow-sm transition-colors"
          >
            <FiPlus size={11} />
            <span>+ Income</span>
          </button>
          <button
            onClick={() => setExpenseModalOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: 'var(--primary)', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, boxShadow: '0 3px 12px var(--primary-glow)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary)'}
          >
            <FiPlus size={11} />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* --- Summary KPI Cards (Current Month focus) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Card */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Total Income (This Month)
            </span>
            <span className="text-sm font-extrabold text-neutral-800">
              ₹{statsIncome.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <FiTrendingUp size={16} />
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Total Expenses (This Month)
            </span>
            <span className="text-sm font-extrabold text-neutral-800">
              ₹{statsExpense.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
            <FiTrendingDown size={16} />
          </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
              Net Profit (This Month)
            </span>
            <span className={`text-sm font-extrabold ${statsNet >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ₹{statsNet.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-brand-50/15 text-brand-600 rounded-lg">
            <FiDollarSign size={16} />
          </div>
        </div>
      </div>

      {/* --- Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Partner Expenses Bar Chart */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">
            Partner Expense Share
          </h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={partnerExpenseShareData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0eeff" />
                <XAxis dataKey="name" tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#76726a', fontSize: 9, fontFamily: 'Montserrat', fontWeight: 600 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(138, 50, 198, 0.03)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', color: '#2c2438', fontSize: 10, fontFamily: 'Montserrat' }}
                />
                <Bar dataKey="amount" fill="#8a32c6" radius={[3, 3, 0, 0]} maxBarSize={35} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Distribution Pie Chart */}
        <div className="bg-white border border-neutral-100 p-4 rounded-xl shadow-sm">
          <h3 className="text-2xs font-extrabold text-neutral-400 uppercase tracking-widest mb-4 border-b border-neutral-50 pb-2">
            Expense Distribution
          </h3>
          <div className="h-44 flex items-center justify-around">
            {categoryBreakdownData.length > 0 ? (
              <>
                <div className="w-1/2 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdownData}
                        innerRadius={30}
                        outerRadius={45}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', borderRadius: 8, fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 w-1/2 max-h-[140px] overflow-y-auto pr-2">
                  {categoryBreakdownData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center justify-between text-[9px] text-neutral-600 font-semibold">
                      <div className="flex items-center space-x-1 truncate max-w-[80px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                        <span className="truncate">{entry.name}</span>
                      </div>
                      <span className="font-mono text-neutral-800">₹{entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-2xs text-neutral-400 italic">No expenses logged for this month.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Filter Inputs for Tables --- */}
      <div className="flex flex-wrap items-center gap-3 mt-8">
        <select
          value={selectedPartner}
          onChange={(e) => setSelectedPartner(e.target.value)}
          style={{ ...INPUT, width: 'auto', padding: '6px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <option value="All Partners">All Partners</option>
          {partners.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={{ ...INPUT, width: 'auto', padding: '6px 12px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
          onFocus={onFocus}
          onBlur={onBlur}
        >
          <option value="All Months">All Months</option>
          {getAvailableMonths().map(m => {
            const [y, num] = m.split('-');
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return (
              <option key={m} value={m}>{months[parseInt(num) - 1]} {y}</option>
            );
          })}
        </select>
      </div>

      {/* --- Expense Records Ledger Table --- */}
      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden mt-2 shadow-sm">
        <div className="p-3 bg-brand-50/20 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-2xs font-extrabold text-brand-600 uppercase tracking-widest">All Expenses</h2>
          <span className="text-[10px] text-neutral-500 font-mono font-semibold">
            Outflow Total: ₹{filteredExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-2xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Partner</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map(item => (
                  <tr key={item._id} className="hover:bg-neutral-50/30 text-neutral-700 font-medium transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-500">{(() => { const d = new Date(item.date); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`; })()}</td>
                    <td className="py-2.5 px-3 text-neutral-800 font-semibold">{item.partner}</td>
                    <td className="py-2.5 px-3 truncate max-w-[150px]">{item.reason}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-rose-600">₹{item.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {item.billImage && (
                          <a href={item.billImage} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 p-1" title="View Document">
                            <FiFile size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteTransaction('expense', item._id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-neutral-400 italic">No expenses logged.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Income Records Ledger Table --- */}
      <div className="bg-white border border-neutral-100 rounded-xl overflow-hidden mt-6 shadow-sm">
        <div className="p-3 bg-brand-50/20 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-2xs font-extrabold text-brand-600 uppercase tracking-widest">Income Records</h2>
          <span className="text-[10px] text-neutral-500 font-mono font-semibold">
            Inflow Total: ₹{filteredIncomes.reduce((s, i) => s + i.amount, 0).toLocaleString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-2xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/50 text-neutral-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredIncomes.length > 0 ? (
                filteredIncomes.map(item => (
                  <tr key={item._id} className="hover:bg-neutral-50/30 text-neutral-700 font-medium transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-500">{(() => { const d = new Date(item.date); return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`; })()}</td>
                    <td className="py-2.5 px-3 text-neutral-800 font-semibold">
                      <div>{item.source}</div>
                      {item.businessName && <span className="text-[9px] text-brand-500 font-mono">{item.businessName}</span>}
                    </td>
                    <td className="py-2.5 px-3 font-bold font-mono text-emerald-600">₹{item.amount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {item.receiptImage && (
                          <a href={item.receiptImage} target="_blank" rel="noreferrer" className="text-brand-500 hover:text-brand-600 p-1" title="View Document">
                            <FiFile size={12} />
                          </a>
                        )}
                        <button
                          onClick={() => handleDeleteTransaction('income', item._id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-neutral-400 italic">No income logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD INCOME MODAL --- */}
      {incomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-100 rounded-xl p-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIncomeModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={15} />
            </button>
            <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Log New Inflow</h3>
            
            <form onSubmit={handleIncomeSubmit} className="space-y-3.5 text-2xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Amount (₹)*</label>
                  <input 
                    type="number" required value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Date*</label>
                  <input 
                    type="date" required value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Source (Company / Client)*</label>
                <input 
                  type="text" required placeholder="Acme Corp" value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Receiver Partner*</label>
                  <select
                    value={incomeForm.receiver}
                    onChange={(e) => setIncomeForm({ ...incomeForm, receiver: e.target.value })}
                    style={INPUT}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    {partners.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Business Ref (Opt)</label>
                  <input 
                    type="text" placeholder="Dev Project" value={incomeForm.businessName}
                    onChange={(e) => setIncomeForm({ ...incomeForm, businessName: e.target.value })}
                    style={INPUT}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Receipt Document</label>
                <input 
                  type="file"
                  onChange={(e) => setIncomeForm({ ...incomeForm, receiptImage: e.target.files[0] })}
                  className="w-full text-neutral-500 font-semibold"
                />
              </div>

              {/* Commission toggle */}
              <div className="border border-neutral-100 p-2.5 rounded bg-neutral-50/50">
                <label className="flex items-center space-x-2 cursor-pointer mb-1.5">
                  <input 
                    type="checkbox" checked={incomeForm.commissionEnabled}
                    onChange={(e) => setIncomeForm({ ...incomeForm, commissionEnabled: e.target.checked })}
                    className="rounded border-neutral-200 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="font-bold text-neutral-600">Log Agent Commission</span>
                </label>

                {incomeForm.commissionEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <input 
                      type="text" placeholder="Agent Name" value={incomeForm.commissionAgent}
                      onChange={(e) => setIncomeForm({ ...incomeForm, commissionAgent: e.target.value })}
                      style={INPUT}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <input 
                      type="number" placeholder="₹ Amount" value={incomeForm.commissionAmount}
                      onChange={(e) => setIncomeForm({ ...incomeForm, commissionAmount: e.target.value })}
                      style={INPUT}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button" onClick={() => setIncomeModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600 font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold uppercase transition-colors rounded shadow shadow-brand-500/20"
                >
                  Log Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-100 rounded-xl p-6 shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setExpenseModalOpen(false)}
              className="absolute right-4 top-4 p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={15} />
            </button>
            <h3 className="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Log New Outflow</h3>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-3.5 text-2xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Amount (₹)*</label>
                  <input 
                    type="number" required value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Date*</label>
                  <input 
                    type="date" required value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Category*</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    style={INPUT}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    {expenseCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Expense Partner*</label>
                  <select
                    value={expenseForm.partner}
                    onChange={(e) => setExpenseForm({ ...expenseForm, partner: e.target.value })}
                    style={INPUT}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  >
                    {partners.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Reason / Purpose*</label>
                <input 
                  type="text" required placeholder="Office rent, supplies, hardware" value={expenseForm.reason}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                  style={INPUT}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Bill Document</label>
                <input 
                  type="file"
                  onChange={(e) => setExpenseForm({ ...expenseForm, billImage: e.target.files[0] })}
                  className="w-full text-neutral-500 font-semibold"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button" onClick={() => setExpenseModalOpen(false)}
                  className="flex-1 py-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-600 font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-500 hover:bg-brand-400 text-white font-bold uppercase transition-colors rounded shadow shadow-brand-500/20"
                >
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
