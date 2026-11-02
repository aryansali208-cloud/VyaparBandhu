import React from 'react';
import {
  TrendingUp,
  Receipt,
  Users,
  Truck,
  Wallet,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  CheckCircle2,
  Clock,
  DollarSign,
  PackagePlus,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BusinessProfile,
  Customer,
  Expense,
  Invoice,
  Language,
  Product,
  Supplier,
  UserRole,
} from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/billingMath';

interface DashboardViewProps {
  business: BusinessProfile;
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  language: Language;
  userRole: UserRole;
  onNavigateToTab: (tab: any) => void;
  onQuickBill: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onQuickAddProduct: () => void;
  onQuickAddCustomer: () => void;
  onQuickAddExpense: () => void;
  onAdjustStockItem: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  business,
  invoices,
  products,
  customers,
  suppliers,
  expenses,
  language,
  userRole,
  onNavigateToTab,
  onQuickBill,
  onSelectInvoice,
  onQuickAddProduct,
  onQuickAddCustomer,
  onQuickAddExpense,
  onAdjustStockItem,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const todayStr = new Date().toISOString().split('T')[0];

  // Active invoices
  const activeInvoices = invoices.filter((i) => i.status !== 'cancelled');

  // Today's stats
  const todaysInvoices = activeInvoices.filter((i) => i.date === todayStr);
  const todaysSales = todaysInvoices.reduce((acc, i) => acc + i.grandTotal, 0);
  const todaysPaid = todaysInvoices.reduce((acc, i) => acc + i.totalPaid, 0);

  // Today's expenses
  const todaysExpensesList = expenses.filter((e) => e.date === todayStr);
  const todaysExpenses = todaysExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Total receivables (Udhar)
  const totalReceivables = customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0);

  // Total supplier payables
  const totalPayables = suppliers.reduce((acc, s) => acc + Math.max(0, s.currentBalance), 0);

  // Estimated gross profit across today's sales
  let todaysProfit = 0;
  for (const inv of todaysInvoices) {
    for (const item of inv.items) {
      const cost = (item.purchaseRate || 0) * item.quantity;
      todaysProfit += item.taxableAmount - cost;
    }
  }

  // Low stock products
  const lowStockItems = products.filter(
    (p) => p.itemType === 'goods' && p.currentStock <= p.minStockAlert
  );

  // Recent 6 invoices
  const recentInvoices = [...activeInvoices].reverse().slice(0, 6);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Welcome & Quick Action Bar with optional custom Store Banner & Logo */}
      <div
        className="relative text-white rounded-2xl p-4 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"
        style={
          business.bannerUrl
            ? {
                backgroundImage: `linear-gradient(to right, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.82)), url(${business.bannerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {!business.bannerUrl && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 -z-10" />
        )}

        <div className="flex items-center space-x-3.5 z-10">
          {business.logoUrl && (
            <img
              src={business.logoUrl}
              alt={business.name}
              className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 border border-slate-700 shadow-lg shadow-amber-500/10 flex-shrink-0"
            />
          )}
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{business.name}</h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {t(`type_${business.businessType}` as any)}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {todayStr} • {business.city}, {business.state} • {t('roleOwner')}: {business.ownerName}
            </p>
          </div>
        </div>

        {/* Quick buttons */}
        <div className="flex items-center flex-wrap gap-2 z-10">
          <button
            type="button"
            onClick={onQuickBill}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md shadow-amber-500/20 flex items-center space-x-1.5 transition active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>{t('quickBillShortcut')}</span>
          </button>

          <button
            type="button"
            onClick={onQuickAddProduct}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
          >
            <PackagePlus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ {t('item')}</span>
          </button>

          <button
            type="button"
            onClick={onQuickAddCustomer}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Customer</span>
          </button>

          <button
            type="button"
            onClick={onQuickAddExpense}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold rounded-xl text-xs flex items-center space-x-1 transition"
          >
            <Wallet className="w-3.5 h-3.5 text-rose-400" />
            <span>+ Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>{t('todaysSales')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-lg sm:text-2xl text-slate-900 tracking-tight">
            {formatCurrency(todaysSales, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{todaysInvoices.length} bills generated</span>
            <span className="text-emerald-600 font-bold">Rec: ₹{todaysPaid.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Total Receivables (Udhar) */}
        <div
          onClick={() => onNavigateToTab('customers')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>{t('totalReceivables')}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-lg sm:text-2xl text-amber-600 tracking-tight">
            {formatCurrency(totalReceivables, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Customer Udhar</span>
            <span className="text-amber-700 font-bold hover:underline">View Khata →</span>
          </div>
        </div>

        {/* Total Payables (Suppliers) */}
        <div
          onClick={() => onNavigateToTab('suppliers')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>{t('totalPayables')}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-black text-lg sm:text-2xl text-slate-900 tracking-tight">
            {formatCurrency(totalPayables, false)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>To Suppliers</span>
            <span className="text-slate-600 font-bold hover:underline">Manage →</span>
          </div>
        </div>

        {/* Profit or Expenses */}
        {userRole === 'owner' ? (
          <div
            onClick={() => onNavigateToTab('reports')}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition cursor-pointer"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>{t('estProfit')} (Today)</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="font-black text-lg sm:text-2xl text-blue-700 tracking-tight">
              {formatCurrency(todaysProfit, false)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Expenses: ₹{todaysExpenses}</span>
              <span className="text-blue-600 font-bold hover:underline">P&amp;L Report →</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>{t('todaysExpenses')}</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="font-black text-lg sm:text-2xl text-slate-900 tracking-tight">
              {formatCurrency(todaysExpenses, false)}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {todaysExpensesList.length} expenses logged
            </div>
          </div>
        )}
      </div>

      {/* Two Column Layout: Low Stock Alerts + Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (1 Column) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-bold text-sm text-slate-900">{t('lowStockAlerts')}</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {lowStockItems.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                <span>{t('noLowStock')}</span>
              </div>
            ) : (
              lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 flex items-center justify-between gap-2"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-900 block line-clamp-1">
                      {item.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Alert min: {item.minStockAlert} {item.unitCode}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded ${
                        item.currentStock <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.currentStock} {item.unitCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustStockItem(item)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded text-xs font-bold transition"
                      title="Adjust or add stock"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('inventory')}
            className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition text-center"
          >
            Manage All Inventory →
          </button>
        </div>

        {/* Recent Invoices (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-slate-700" />
              <h2 className="font-bold text-sm text-slate-900">{t('recentInvoices')}</h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToTab('invoices')}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              View All ({activeInvoices.length}) →
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No bills generated yet. Click &quot;Create Fast Bill&quot; above to start billing!
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-2 px-2">Invoice #</th>
                    <th className="py-2 px-2">Customer</th>
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2 text-right">Amount</th>
                    <th className="py-2 px-2 text-center">Status</th>
                    <th className="py-2 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-2 font-mono font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-800">
                        {inv.customerName}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500">{inv.date}</td>
                      <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                        {formatCurrency(inv.grandTotal)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : inv.paymentStatus === 'partial'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          {inv.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectInvoice(inv)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-[11px] transition inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
