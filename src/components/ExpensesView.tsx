import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Search,
  Download,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
  Tag,
  Trash2,
} from 'lucide-react';
import { Expense, Language, PaymentMode } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/billingMath';

interface ExpensesViewProps {
  expenses: Expense[];
  language: Language;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const EXPENSE_CATEGORIES = [
  'teaSnacks',
  'transport',
  'rent',
  'electricity',
  'salaries',
  'maintenance',
  'marketing',
  'otherExpenses',
] as const;

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  language,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_month'>('all');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expCategory, setExpCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [expAmount, setExpAmount] = useState<number | ''>('');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expMode, setExpMode] = useState<PaymentMode>('cash');
  const [expNotes, setExpNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== 'all' && e.category !== categoryFilter) return false;
      if (dateFilter === 'today' && e.date !== todayStr) return false;
      if (dateFilter === 'this_month' && !e.date.startsWith(currentMonthStr)) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (e.paidTo && e.paidTo.toLowerCase().includes(q)) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [expenses, categoryFilter, dateFilter, searchQuery, todayStr, currentMonthStr]);

  // Totals
  const totals = useMemo(() => {
    let today = 0;
    let thisMonth = 0;
    let totalAll = 0;

    for (const e of expenses) {
      totalAll += e.amount;
      if (e.date === todayStr) today += e.amount;
      if (e.date.startsWith(currentMonthStr)) thisMonth += e.amount;
    }
    return { today, thisMonth, totalAll };
  }, [expenses, todayStr, currentMonthStr]);

  // Submit Add Expense
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || expAmount <= 0) return;

    const newExp: Expense = {
      id: 'exp_' + Date.now(),
      category: expCategory,
      amount: Number(expAmount),
      date: new Date().toISOString().split('T')[0],
      paymentMode: expMode,
      paidTo: expPaidTo.trim() || undefined,
      notes: expNotes.trim() || undefined,
      recordedBy: 'Admin',
    };

    onSaveExpense(newExp);
    setIsAddExpenseOpen(false);

    setExpAmount('');
    setExpPaidTo('');
    setExpNotes('');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Date', 'Category', 'Paid To', 'Payment Mode', 'Amount', 'Notes'];
    const rows = filteredExpenses.map((e) => [
      e.date,
      `"${t(e.category as any) || e.category}"`,
      `"${e.paidTo || ''}"`,
      e.paymentMode,
      e.amount,
      `"${e.notes || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Expenses_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('expenses')}
          </h1>
          <p className="text-xs text-slate-500">
            Track daily shop operating costs, rent, utilities, tea, transport, and maintenance.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addExpense')}</span>
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="grid grid-cols-3 gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Today&apos;s Expenses</span>
          <span className="text-sm sm:text-lg font-black text-slate-900">
            {formatCurrency(totals.today, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">This Month&apos;s Expenses</span>
          <span className="text-sm sm:text-lg font-black text-rose-600">
            {formatCurrency(totals.thisMonth, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Total Recorded</span>
          <span className="text-sm sm:text-lg font-black text-slate-700">
            {formatCurrency(totals.totalAll, false)}
          </span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses by person, note, or category..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'today' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'this_month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              categoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {EXPENSE_CATEGORIES.map((catKey) => (
            <button
              key={catKey}
              type="button"
              onClick={() => setCategoryFilter(catKey)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                categoryFilter === catKey
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t(catKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Wallet className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <span>No expense records found.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Paid To</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3">Notes</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{exp.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                        {t(exp.category as any) || exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800">{exp.paidTo || '-'}</td>
                    <td className="py-3 px-3 text-slate-600 uppercase font-mono text-[11px]">
                      {exp.paymentMode}
                    </td>
                    <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{exp.notes || '-'}</td>
                    <td className="py-3 px-3 text-right font-black text-rose-600">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD EXPENSE MODAL ================= */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">{t('addExpense')}</h3>
              <button
                type="button"
                onClick={() => setIsAddExpenseOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('expenseCategory')} *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {t(c)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('expenseAmount')} *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="e.g. 250"
                  value={expAmount}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('paidTo')}</label>
                <input
                  type="text"
                  placeholder="e.g. Landlord, Electricity board, Tea stall..."
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('paymentMode')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'upi', 'bank_transfer'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setExpMode(mode)}
                      className={`p-1.5 rounded-lg text-center font-bold text-xs transition ${
                        expMode === mode
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI' : 'Bank'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes or bill number..."
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
