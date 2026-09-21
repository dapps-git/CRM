import React, { useState, useEffect, useRef } from 'react';
import { 
  FiTrendingUp, 
  FiTrendingDown, 
  FiDollarSign, 
  FiPlus, 
  FiTrash2, 
  FiEdit,
  FiFile,
  FiX,
  FiPieChart,
  FiFilter,
  FiSearch,
  FiCalendar
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
import { isNumbersOnly, compressImageToWebP } from '../utils/validation';
import ConfirmModal from '../components/ConfirmModal';
import { playAddSound, playDeleteSound } from '../utils/soundEffects';

const Finance = () => {
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

  // Filters State
  const [viewType, setViewType] = useState('all'); // 'all' | 'income' | 'expense'
  const [selectedPartner, setSelectedPartner] = useState('All Partners');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedSourceType, setSelectedSourceType] = useState('All Sources'); // 'All Sources' | 'Company' | 'Client'
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // 'all' | 'today' | 'this_week' | 'this_month' | 'custom' | 'by_month'
  const [selectedMonth, setSelectedMonth] = useState('All Months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reasonSearch, setReasonSearch] = useState('');

  // Modal open triggers
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [editIncomeId, setEditIncomeId] = useState(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'income'|'expense', id: '...' }
  const [deleting, setDeleting] = useState(false);

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

  const [incomeTouched, setIncomeTouched] = useState({});
  const [expenseTouched, setExpenseTouched] = useState({});

  // Business and Client list for Source dropdown / autocomplete
  const [allClientSources, setAllClientSources] = useState([]);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const sourceDropdownRef = useRef(null);

  const partners = ['Saleel VT', 'Anfas Sir', 'Shamna Madam', 'Sabith Boss'];
  const expenseCategories = [
    'Office', 'Travel', 'Food', 'Software', 'Hardware', 'Marketing', 'Salary', 'Utilities', 'Miscellaneous'
  ];

  const fetchFinanceData = async () => {
    setLoading(true);
    try {
      const [incRes, expRes, busRes, clientRes] = await Promise.all([
        api.get('/income', { params: { limit: 2000 } }),
        api.get('/expense', { params: { limit: 2000 } }),
        api.get('/business', { params: { limit: 500 } }).catch(() => ({ data: { businesses: [] } })),
        api.get('/client', { params: { limit: 500 } }).catch(() => ({ data: { clients: [] } }))
      ]);
      setIncomes(incRes.data.incomes || []);
      setExpenses(expRes.data.expenses || []);

      const businesses = (busRes.data?.businesses || []).map(b => ({
        _id: `bus-${b._id}`,
        name: b.businessName,
        agent: b.agentName,
        location: b.location,
        type: 'Lead'
      }));
      const clients = (clientRes.data?.clients || []).map(c => ({
        _id: `cli-${c._id}`,
        name: c.clientName,
        agent: c.agentName,
        location: c.location,
        type: 'Client'
      }));

      // Merge and deduplicate
      const combined = [...businesses, ...clients].filter(Boolean);
      setAllClientSources(combined);
    } catch {
      toast.error('Failed to load transaction data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  // Close source dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(e.target)) {
        setShowSourceDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [submittingIncome, setSubmittingIncome] = useState(false);
  const [submittingExpense, setSubmittingExpense] = useState(false);

  // Income Validation
  const isIncomeSourceValid = incomeForm.source.trim() !== '';
  const isIncomeAmountValid = incomeForm.amount !== '' && Number(incomeForm.amount) > 0 && isNumbersOnly(incomeForm.amount);
  const isIncomeFormValid = isIncomeSourceValid && isIncomeAmountValid;

  // Expense Validation
  const isExpenseReasonValid = expenseForm.reason.trim() !== '';
  const isExpenseAmountValid = expenseForm.amount !== '' && Number(expenseForm.amount) > 0 && isNumbersOnly(expenseForm.amount);
  const isExpenseFormValid = isExpenseReasonValid && isExpenseAmountValid;

  // Handle Income submit with WebP image compression
  const handleIncomeSubmit = async (e) => {
    e.preventDefault();
    if (submittingIncome) return;

    if (!isIncomeSourceValid) {
      toast.error('Source name is required');
      return;
    }
    if (!isIncomeAmountValid) {
      toast.error('Amount must be a positive number');
      return;
    }

    setSubmittingIncome(true);
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
      toast.loading('Compressing receipt image...', { id: 'img-comp' });
      const compressedWebP = await compressImageToWebP(incomeForm.receiptImage);
      toast.dismiss('img-comp');
      formData.append('receiptImage', compressedWebP);
    }

    try {
      if (editIncomeId) {
        await api.put(`/income/${editIncomeId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Income transaction updated successfully');
      } else {
        await api.post('/income', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        playAddSound();
        toast.success('Income transaction logged successfully');
      }
      resetIncomeForm();
      setIncomeModalOpen(false);
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save income');
    } finally {
      setSubmittingIncome(false);
    }
  };

  const openEditIncomeModal = (item) => {
    setEditIncomeId(item._id);
    setIncomeForm({
      amount: item.amount || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      source: item.source || '',
      receiver: item.receiver || 'Saleel VT',
      businessName: item.businessName || '',
      commissionEnabled: !!item.commissionEnabled,
      commissionAgent: item.commissionAgent || '',
      commissionAmount: item.commissionAmount || '',
      receiptImage: null
    });
    setIncomeTouched({});
    setIncomeModalOpen(true);
  };

  const resetIncomeForm = () => {
    setEditIncomeId(null);
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
    setIncomeTouched({});
  };

  // Handle Expense Add / Edit with WebP image compression
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (submittingExpense) return;

    if (!isExpenseReasonValid) {
      toast.error('Reason / Purpose is required');
      return;
    }
    if (!isExpenseAmountValid) {
      toast.error('Amount must be a positive number');
      return;
    }

    setSubmittingExpense(true);
    const formData = new FormData();
    formData.append('amount', expenseForm.amount);
    formData.append('date', expenseForm.date);
    formData.append('category', expenseForm.category);
    formData.append('reason', expenseForm.reason);
    formData.append('description', expenseForm.description);
    formData.append('partner', expenseForm.partner);

    if (expenseForm.billImage) {
      toast.loading('Compressing bill image...', { id: 'img-comp-exp' });
      const compressedWebP = await compressImageToWebP(expenseForm.billImage);
      toast.dismiss('img-comp-exp');
      formData.append('billImage', compressedWebP);
    }

    try {
      if (editExpenseId) {
        await api.put(`/expense/${editExpenseId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Expense transaction updated successfully');
      } else {
        await api.post('/expense', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        playAddSound();
        toast.success('Expense transaction logged successfully');
      }
      resetExpenseForm();
      setExpenseModalOpen(false);
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const openEditExpenseModal = (item) => {
    setEditExpenseId(item._id);
    setExpenseForm({
      amount: item.amount || '',
      date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: item.category || 'Office',
      reason: item.reason || '',
      description: item.description || '',
      partner: item.partner || 'Saleel VT',
      billImage: null
    });
    setExpenseTouched({});
    setExpenseModalOpen(true);
  };

  const resetExpenseForm = () => {
    setEditExpenseId(null);
    setExpenseForm({
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'Office',
      reason: '',
      description: '',
      partner: 'Saleel VT',
      billImage: null
    });
    setExpenseTouched({});
  };

  const confirmDelete = (type, id) => {
    setDeleteTarget({ type, id });
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/${deleteTarget.type}/${deleteTarget.id}`);
      playDeleteSound();
      toast.success(`${deleteTarget.type === 'income' ? 'Income' : 'Expense'} record removed`);
      setDeleteTarget(null);
      fetchFinanceData();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to delete ${deleteTarget.type}`);
    } finally {
      setDeleting(false);
    }
  };

  const getAvailableMonths = () => {
    const months = new Set();
    incomes.forEach(i => months.add(new Date(i.date).toISOString().slice(0, 7)));
    expenses.forEach(e => months.add(new Date(e.date).toISOString().slice(0, 7)));
    return Array.from(months).sort().reverse();
  };

  // Helper date checker
  const isDateMatchingPeriod = (itemDateStr) => {
    if (!itemDateStr) return false;
    const itemDate = new Date(itemDateStr);
    const itemDateOnly = itemDate.toISOString().split('T')[0];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (selectedPeriod === 'today') {
      return itemDateOnly === todayStr;
    }

    if (selectedPeriod === 'this_week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return itemDate >= startOfWeek && itemDate <= endOfWeek;
    }

    if (selectedPeriod === 'this_month') {
      const curMonth = now.toISOString().slice(0, 7);
      return itemDate.toISOString().slice(0, 7) === curMonth;
    }

    if (selectedPeriod === 'by_month') {
      if (selectedMonth === 'All Months') return true;
      return itemDate.toISOString().slice(0, 7) === selectedMonth;
    }

    if (selectedPeriod === 'custom') {
      if (customStartDate && itemDateOnly < customStartDate) return false;
      if (customEndDate && itemDateOnly > customEndDate) return false;
      return true;
    }

    return true; // 'all'
  };

  // Filter computations
  const filteredIncomes = incomes.filter(item => {
    const matchPartner = selectedPartner === 'All Partners' || item.receiver === selectedPartner;
    const matchPeriod = isDateMatchingPeriod(item.date);
    
    // Category match for income (Revenue / Service category or reason)
    const matchCategory = selectedCategory === 'All Categories' || 
      (item.businessName && item.businessName.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      (item.source && item.source.toLowerCase().includes(selectedCategory.toLowerCase()));

    // Reason search match
    const matchReason = !reasonSearch.trim() || 
      (item.source && item.source.toLowerCase().includes(reasonSearch.toLowerCase())) ||
      (item.businessName && item.businessName.toLowerCase().includes(reasonSearch.toLowerCase()));

    // Source match
    const matchSource = selectedSourceType === 'All Sources' || 
      (selectedSourceType === 'Company' ? item.receiver : true) ||
      (selectedSourceType === 'Client' ? (item.source && item.source !== 'Company') : true);

    return matchPartner && matchPeriod && matchCategory && matchReason && matchSource;
  });

  const filteredExpenses = expenses.filter(item => {
    const matchPartner = selectedPartner === 'All Partners' || item.partner === selectedPartner;
    const matchPeriod = isDateMatchingPeriod(item.date);
    
    // Category match for expense (e.g. Travel, Office, etc.)
    const matchCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;

    // Reason search match
    const matchReason = !reasonSearch.trim() || 
      (item.reason && item.reason.toLowerCase().includes(reasonSearch.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(reasonSearch.toLowerCase()));

    // Source match
    const matchSource = selectedSourceType === 'All Sources' || true;

    return matchPartner && matchPeriod && matchCategory && matchReason && matchSource;
  });

  // 1. Overall / Total KPI Metrics (All Time Overall)
  const totalAllTimeIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalAllTimeExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalAllTimeNet = totalAllTimeIncome - totalAllTimeExpense;

  // 2. Daily (Today's) Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const todayIncomes = incomes.filter(i => new Date(i.date).toISOString().split('T')[0] === todayStr);
  const todayExpenses = expenses.filter(e => new Date(e.date).toISOString().split('T')[0] === todayStr);
  const dailyIncomeSum = todayIncomes.reduce((sum, item) => sum + item.amount, 0);
  const dailyExpenseSum = todayExpenses.reduce((sum, item) => sum + item.amount, 0);
  const dailyNetSum = dailyIncomeSum - dailyExpenseSum;

  // 3. Filtered Table sums
  const filteredInflowSum = filteredIncomes.reduce((s, i) => s + i.amount, 0);
  const filteredOutflowSum = filteredExpenses.reduce((s, e) => s + e.amount, 0);
  const filteredNetSum = filteredInflowSum - filteredOutflowSum;

  // Unified Transactions Ledger (Combined Inflow & Outflow based on viewType)
  const allInflows = (viewType === 'all' || viewType === 'income') ? filteredIncomes.map(item => ({
    _id: item._id,
    date: item.date,
    type: 'INCOME',
    deleteType: 'income',
    partner: item.receiver || 'Company Inflow',
    reason: item.source,
    category: item.businessName ? `Ref: ${item.businessName}` : 'Revenue',
    inflow: item.amount,
    outflow: 0,
    image: item.receiptImage,
    itemRef: item,
    isExpense: false
  })) : [];

  const allOutflows = (viewType === 'all' || viewType === 'expense') ? filteredExpenses.map(item => ({
    _id: item._id,
    date: item.date,
    type: 'EXPENSE',
    deleteType: 'expense',
    partner: item.partner,
    reason: item.reason,
    category: item.category,
    inflow: 0,
    outflow: item.amount,
    image: item.billImage,
    itemRef: item,
    isExpense: true
  })) : [];

  const combinedTransactions = [...allInflows, ...allOutflows].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Chart 1: Partner breakdown
  const currentMonthStr = new Date().toISOString().slice(0, 7);
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
      
      {/* --- Page Header --- */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">Expenses & Income</h1>
          <p className="text-[10px] text-brand-600 font-semibold mt-0.5">
            Log, verify and track ledger inflow/outflow balances.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-2xs font-bold">
          <button
            type="button"
            onClick={() => setShowCharts(!showCharts)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md border text-2xs font-bold transition-all ${
              showCharts ? 'bg-purple-100 text-[#8a32c6] border-purple-300' : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 shadow-xs'
            }`}
          >
            <FiPieChart size={13} />
            <span>{showCharts ? 'Hide Analytics' : 'Show Graphs'}</span>
          </button>

          <button
            type="button"
            onClick={() => { resetIncomeForm(); setIncomeModalOpen(true); }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 shadow-xs transition-colors"
          >
            <FiPlus size={11} />
            <span>Income</span>
          </button>
          <button
            type="button"
            onClick={() => { resetExpenseForm(); setExpenseModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 14px', borderRadius: 6, background: '#8a32c6', color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, boxShadow: '0 2px 8px rgba(138,50,198,0.25)', border: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = '#7828b0'}
            onMouseLeave={e => e.currentTarget.style.background = '#8a32c6'}
          >
            <FiPlus size={11} />
            <span>Expense</span>
          </button>
        </div>
      </div>

      {/* --- Top Summary KPI Cards (Total Income, Total Expenses, Net Profit) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Income Card (Placed Prominently on Top) */}
        <div className="bg-white border border-neutral-200/60 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">
              Total Income
            </span>
            <span className="text-sm font-extrabold text-neutral-800">
              ₹{totalAllTimeIncome.toLocaleString()}
            </span>
            <span className="block text-[9px] text-emerald-600 font-semibold mt-0.5">
              Today: +₹{dailyIncomeSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-md">
            <FiTrendingUp size={16} />
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white border border-neutral-200/60 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">
              Total Expenses
            </span>
            <span className="text-sm font-extrabold text-neutral-800">
              ₹{totalAllTimeExpense.toLocaleString()}
            </span>
            <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">
              Today: -₹{dailyExpenseSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-rose-500/10 text-rose-600 rounded-md">
            <FiTrendingDown size={16} />
          </div>
        </div>

        {/* Net Profit / Balance Card */}
        <div className="bg-white border border-neutral-200/60 p-4 rounded-lg flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider block mb-1">
              Net Balance
            </span>
            <span className={`text-sm font-extrabold ${totalAllTimeNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{totalAllTimeNet.toLocaleString()}
            </span>
            <span className={`block text-[9px] font-semibold mt-0.5 ${dailyNetSum >= 0 ? 'text-[#8a32c6]' : 'text-rose-500'}`}>
              Today's Net: ₹{dailyNetSum.toLocaleString()}
            </span>
          </div>
          <div className="p-2 bg-[#8a32c6]/10 text-[#8a32c6] rounded-md">
            <FiDollarSign size={16} />
          </div>
        </div>
      </div>

      {/* --- Charts Section (Hidden by Default) --- */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Partner Expenses Bar Chart */}
          <div className="bg-white border border-neutral-200/60 p-4 rounded-lg shadow-xs">
            <h3 className="text-2xs font-extrabold text-neutral-500 uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">
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
          <div className="bg-white border border-neutral-200/60 p-4 rounded-lg shadow-xs">
            <h3 className="text-2xs font-extrabold text-neutral-500 uppercase tracking-widest mb-4 border-b border-neutral-100 pb-2">
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
                        <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e3de', borderRadius: 6, fontSize: 10 }} />
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
      )}

      {/* --- Filter & View Controls --- */}
      <div className="bg-white p-3.5 border border-neutral-200/70 rounded-lg shadow-xs space-y-3">
        
        {/* Row 1: Type Toggles (All / Show Income / Show Expense) & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* View Type Toggle Buttons */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-md">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'income', label: 'Show Income' },
              { id: 'expense', label: 'Show Expense' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewType(tab.id)}
                className={`px-3 py-1 text-[11px] font-bold rounded transition-all ${
                  viewType === tab.id
                    ? 'bg-[#8a32c6] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reason / Details Text Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <FiSearch size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8a32c6]" />
            <input
              type="text"
              placeholder="Search reason or details..."
              value={reasonSearch}
              onChange={(e) => setReasonSearch(e.target.value)}
              style={{ ...INPUT, paddingLeft: 26, fontSize: 10 }}
              onFocus={onFocus}
              onBlur={onBlur}
            />
            {reasonSearch && (
              <button 
                type="button"
                onClick={() => setReasonSearch('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Dropdown Filters (Category/Reason, Period, Source, Partner, Month) */}
        <div className="flex flex-wrap items-center gap-2.5 text-[10px]">
          
          {/* 1. Category / Reason Filter (e.g. Travel, Office, etc.) */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-neutral-500 uppercase">Reason/Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ ...INPUT, width: 'auto', padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="All Categories">All Categories / Reasons</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 2. Period Filter (All / Today / This Week / This Month / Custom / By Month) */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-neutral-500 uppercase">Period:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              style={{ ...INPUT, width: 'auto', padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="all">All Time</option>
              <option value="today">Today (Daily)</option>
              <option value="this_week">This Week (Weekly)</option>
              <option value="this_month">This Month (Monthly)</option>
              <option value="by_month">Select Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* If By Month selected */}
          {selectedPeriod === 'by_month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ ...INPUT, width: 'auto', padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
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
          )}

          {/* If Custom Date Range selected */}
          {selectedPeriod === 'custom' && (
            <div className="flex items-center gap-1.5 bg-purple-50/50 p-1 rounded border border-purple-200">
              <span className="text-[9px] font-bold text-neutral-500">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{ ...INPUT, width: 'auto', padding: '4px 6px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              />
              <span className="text-[9px] font-bold text-neutral-500">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{ ...INPUT, width: 'auto', padding: '4px 6px', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
              />
            </div>
          )}

          {/* 3. Source Filter (Company / Client / All Sources) */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-neutral-500 uppercase">Source:</span>
            <select
              value={selectedSourceType}
              onChange={(e) => setSelectedSourceType(e.target.value)}
              style={{ ...INPUT, width: 'auto', padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="All Sources">All Sources</option>
              <option value="Company">Company</option>
              <option value="Client">Client</option>
            </select>
          </div>

          {/* 4. Partner Filter */}
          <div className="flex items-center gap-1">
            <span className="font-bold text-neutral-500 uppercase">Partner:</span>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              style={{ ...INPUT, width: 'auto', padding: '5px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
              onFocus={onFocus}
              onBlur={onBlur}
            >
              <option value="All Partners">All Partners</option>
              {partners.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters button */}
          {(selectedCategory !== 'All Categories' || selectedPeriod !== 'all' || selectedPartner !== 'All Partners' || selectedSourceType !== 'All Sources' || reasonSearch || selectedMonth !== 'All Months') && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All Categories');
                setSelectedPeriod('all');
                setSelectedPartner('All Partners');
                setSelectedSourceType('All Sources');
                setSelectedMonth('All Months');
                setReasonSearch('');
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-[#8a32c6] hover:underline font-bold text-[10px] ml-auto"
            >
              Reset Filters
            </button>
          )}

        </div>

      </div>

      {/* --- Unified Financial Ledger Table (Combined Inflow & Outflow Tally with Daily Tally in Position) --- */}
      <div className="bg-white border border-neutral-200/60 rounded-lg overflow-hidden mt-2 shadow-xs">
        
        {/* Table Bar with Daily Income & Filtered Tally Badges (Swapped Position) */}
        <div className="p-3 bg-purple-50/40 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xs font-extrabold text-[#8a32c6] uppercase tracking-widest">
              Transactions Ledger & Tally
            </h2>
            <span className="text-[10px] bg-purple-100 text-[#8a32c6] px-2 py-0.5 rounded font-bold uppercase">
              {viewType === 'income' ? 'Income Only' : viewType === 'expense' ? 'Expense Only' : 'All Rows'}
            </span>
          </div>

          {/* Badges: Daily Income in Position & Filtered Totals */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
            {/* Daily Income badge */}
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold" title="Today's total inflow">
              Daily Income: +₹{dailyIncomeSum.toLocaleString()}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-bold" title="Today's total outflow">
              Daily Expense: -₹{dailyExpenseSum.toLocaleString()}
            </span>
            <span className={`px-2 py-0.5 rounded border font-extrabold ${dailyNetSum >= 0 ? 'bg-purple-50 text-[#8a32c6] border-purple-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`} title="Today's net">
              Daily Net: ₹{dailyNetSum.toLocaleString()}
            </span>

            {/* Filtered Total (when filters applied or viewing specific items) */}
            <span className="text-neutral-400">│</span>
            <span className="text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
              Filtered Total: <strong className="text-neutral-900 font-mono">₹{filteredNetSum.toLocaleString()}</strong> ({combinedTransactions.length} records)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-purple-100 bg-purple-50/70 text-[#8a32c6] font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Partner / Source</th>
                <th className="py-2.5 px-3">Reason / Details</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Income (+₹)</th>
                <th className="py-2.5 px-3 text-right">Expense (-₹)</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-100/60 font-medium">
              {combinedTransactions.length > 0 ? (
                combinedTransactions.map(item => (
                  <tr key={`${item.type}-${item._id}`} className="hover:bg-purple-50/30 text-neutral-700 font-medium transition-colors">
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {(() => { const d = new Date(item.date); return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`; })()}
                    </td>
                    <td className="py-2.5 px-3">
                      {item.isExpense ? (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-rose-50 border border-rose-200 text-rose-700 font-bold uppercase tracking-wider">
                          Expense
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold uppercase tracking-wider">
                          Income
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800 font-semibold">{item.partner}</td>
                    <td className="py-2.5 px-3 truncate max-w-[170px]">{item.reason}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] bg-neutral-100 border border-neutral-200 text-neutral-600 font-semibold uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-600">
                      {item.inflow > 0 ? `+₹${item.inflow.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-rose-600">
                      {item.outflow > 0 ? `-₹${item.outflow.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {item.image && (
                          <a href={item.image} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 text-[#8a32c6] hover:text-[#7828b0] p-1" title="View Document">
                            <img src={item.image} alt="Doc" className="w-7 h-7 object-cover rounded border border-neutral-200 shadow-xs" />
                            <FiFile size={12} />
                          </a>
                        )}
                        {/* Edit button for both Expense and Income rows */}
                        <button
                          type="button"
                          onClick={() => item.isExpense ? openEditExpenseModal(item.itemRef) : openEditIncomeModal(item.itemRef)}
                          className="text-[#8a32c6] hover:text-[#7828b0] transition-colors p-1"
                          title={`Edit ${item.type}`}
                        >
                          <FiEdit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(item.deleteType, item._id)}
                          className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                          title={`Delete ${item.type}`}
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-neutral-400 italic">
                    No {viewType === 'income' ? 'income' : viewType === 'expense' ? 'expense' : 'income or expense'} transactions found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD INCOME MODAL --- */}
      {incomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative">
            <button
              onClick={() => setIncomeModalOpen(false)}
              className="absolute right-3 top-3 p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={16} />
            </button>
            <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-widest mb-4">
              {editIncomeId ? 'Edit Income Transaction' : 'Log New Inflow'}
            </h3>
            
            <form onSubmit={handleIncomeSubmit} className="space-y-3 text-2xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Amount (₹)*</label>
                  <input 
                    type="text" 
                    required 
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    onBlur={() => setIncomeTouched({ ...incomeTouched, amount: true })}
                    placeholder="5000"
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', borderColor: (incomeTouched.amount && !isIncomeAmountValid) ? '#ef4444' : INPUT.border }}
                    onFocus={onFocus}
                  />
                  {incomeTouched.amount && !isIncomeAmountValid && (
                    <span className="text-[9px] text-rose-500 block font-normal">Numbers only</span>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Date*</label>
                  <input 
                    type="date" 
                    required 
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>
              </div>

              <div ref={sourceDropdownRef} style={{ position: 'relative' }}>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Source (Company / Client)*</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Select or type company / client name" 
                  value={incomeForm.source}
                  onChange={(e) => {
                    setIncomeForm({ ...incomeForm, source: e.target.value });
                    setShowSourceDropdown(true);
                  }}
                  onFocus={() => setShowSourceDropdown(true)}
                  onBlur={() => setIncomeTouched({ ...incomeTouched, source: true })}
                  style={{ ...INPUT, borderColor: (incomeTouched.source && !isIncomeSourceValid) ? '#ef4444' : INPUT.border }}
                />
                {showSourceDropdown && (() => {
                  const q = incomeForm.source.toLowerCase();
                  const filtered = allClientSources.filter(b => 
                    b.name?.toLowerCase().includes(q)
                  );
                  return filtered.length > 0 ? (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                      background: '#ffffff', border: '1px solid rgba(138,50,198,0.25)',
                      boxShadow: '0 6px 20px rgba(138,50,198,0.12)',
                      maxHeight: 180, overflowY: 'auto', marginTop: 2
                    }}>
                      {filtered.map(b => (
                        <div
                          key={b._id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIncomeForm(prev => ({
                              ...prev,
                              source: b.name,
                              businessName: b.name || prev.businessName
                            }));
                            setShowSourceDropdown(false);
                          }}
                          style={{
                            padding: '8px 12px', cursor: 'pointer',
                            fontSize: 11, fontFamily: 'Montserrat, sans-serif',
                            borderBottom: '1px solid rgba(138,50,198,0.07)',
                            transition: 'background 0.1s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(138,50,198,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                        >
                          <span style={{ fontWeight: 700, color: '#8a32c6' }}>{b.name}</span>
                          <span style={{ padding: '1px 5px', borderRadius: 3, fontSize: 8, fontWeight: 700, marginLeft: 6, background: b.type === 'Client' ? 'rgba(16,185,129,0.12)' : 'rgba(138,50,198,0.12)', color: b.type === 'Client' ? '#059669' : '#8a32c6' }}>
                            {b.type}
                          </span>
                          {b.agent && (
                            <span style={{ color: '#76726a', marginLeft: 6, fontWeight: 400 }}>
                              ({b.agent})
                            </span>
                          )}
                          {b.location && (
                            <span style={{ color: '#a5a198', marginLeft: 6, fontSize: 10 }}>
                              · {b.location}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
                {incomeTouched.source && !isIncomeSourceValid && (
                  <span className="text-[9px] text-rose-500 block font-normal">Source is required</span>
                )}
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
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Receipt Document (Auto-WebP)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setIncomeForm({ ...incomeForm, receiptImage: e.target.files[0] })}
                  className="w-full text-neutral-500 font-semibold text-[10px]"
                />
              </div>

              {/* Commission toggle */}
              <div className="border border-neutral-200 p-2.5 rounded-md bg-neutral-50/50">
                <label className="flex items-center space-x-2 cursor-pointer mb-1">
                  <input 
                    type="checkbox" checked={incomeForm.commissionEnabled}
                    onChange={(e) => setIncomeForm({ ...incomeForm, commissionEnabled: e.target.checked })}
                    className="rounded border-neutral-300 text-[#8a32c6] focus:ring-[#8a32c6]"
                  />
                  <span className="font-bold text-neutral-700 text-[11px]">Log Agent Commission</span>
                </label>

                {incomeForm.commissionEnabled && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
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
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 font-bold uppercase transition-colors text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isIncomeFormValid || submittingIncome}
                  style={{
                    background: isIncomeFormValid ? '#8a32c6' : '#cccccc',
                    cursor: (isIncomeFormValid && !submittingIncome) ? 'pointer' : 'not-allowed'
                  }}
                  className="flex-1 py-2 text-white font-bold uppercase transition-colors rounded-md text-[10px] flex items-center justify-center space-x-1"
                >
                  {submittingIncome ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editIncomeId ? 'Update Income' : 'Log Income'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT EXPENSE MODAL --- */}
      {expenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm bg-white border border-neutral-200 rounded-lg p-5 shadow-xl relative">
            <button
              onClick={() => { setExpenseModalOpen(false); resetExpenseForm(); }}
              className="absolute right-3 top-3 p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FiX size={16} />
            </button>
            <h3 className="text-xs font-bold text-[#8a32c6] uppercase tracking-widest mb-4">
              {editExpenseId ? 'Edit Outflow Expense' : 'Log New Outflow'}
            </h3>
            
            <form onSubmit={handleExpenseSubmit} className="space-y-3 text-2xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Amount (₹)*</label>
                  <input 
                    type="text" 
                    required 
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    onBlur={() => setExpenseTouched({ ...expenseTouched, amount: true })}
                    placeholder="1500"
                    style={{ ...INPUT, fontFamily: 'JetBrains Mono, monospace', borderColor: (expenseTouched.amount && !isExpenseAmountValid) ? '#ef4444' : INPUT.border }}
                    onFocus={onFocus}
                  />
                  {expenseTouched.amount && !isExpenseAmountValid && (
                    <span className="text-[9px] text-rose-500 block font-normal">Numbers only</span>
                  )}
                </div>
                <div>
                  <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Date*</label>
                  <input 
                    type="date" 
                    required 
                    value={expenseForm.date}
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
                  type="text" 
                  required 
                  placeholder="Office rent, supplies, hardware" 
                  value={expenseForm.reason}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                  onBlur={() => setExpenseTouched({ ...expenseTouched, reason: true })}
                  style={{ ...INPUT, borderColor: (expenseTouched.reason && !isExpenseReasonValid) ? '#ef4444' : INPUT.border }}
                  onFocus={onFocus}
                />
                {expenseTouched.reason && !isExpenseReasonValid && (
                  <span className="text-[9px] text-rose-500 block font-normal">Reason is required</span>
                )}
              </div>

              <div>
                <label className="block text-neutral-500 uppercase tracking-wider font-bold mb-1">Bill Document (Auto-WebP)</label>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={(e) => setExpenseForm({ ...expenseForm, billImage: e.target.files[0] })}
                  className="w-full text-neutral-500 font-semibold text-[10px]"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button" 
                  onClick={() => { setExpenseModalOpen(false); resetExpenseForm(); }}
                  className="flex-1 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-md text-neutral-700 font-bold uppercase transition-colors text-[10px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isExpenseFormValid || submittingExpense}
                  style={{
                    background: isExpenseFormValid ? '#8a32c6' : '#cccccc',
                    cursor: (isExpenseFormValid && !submittingExpense) ? 'pointer' : 'not-allowed'
                  }}
                  className="flex-1 py-2 text-white font-bold uppercase transition-colors rounded-md text-[10px] flex items-center justify-center space-x-1"
                >
                  {submittingExpense ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editExpenseId ? 'Update Expense' : 'Log Expense'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Confirmation Delete Modal --- */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTransaction}
        title={`Delete ${deleteTarget?.type === 'income' ? 'Income' : 'Expense'} Record`}
        message="Are you sure you want to remove this transaction record permanently? This cannot be undone."
        confirmText="Remove Record"
        loading={deleting}
      />

    </div>
  );
};

export default Finance;
