import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  FileSpreadsheet,
  Receipt,
  Boxes,
  Users,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  Invoice,
  Expense,
  Product,
  Customer,
  Supplier,
  PurchaseInvoice,
  Language,
} from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/billingMath';

interface ReportsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  expenses,
  products,
  customers,
  suppliers,
  purchaseInvoices,
  language,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [activeReportTab, setActiveReportTab] = useState<
    'pnl' | 'daybook' | 'gst' | 'inventory' | 'udhar'
  >('pnl');

  const [timeRange, setTimeRange] = useState<'today' | 'last7' | 'this_month' | 'all'>('this_month');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  // Filtered invoices by time range
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (inv.status === 'cancelled') return false;
      if (timeRange === 'today') return inv.date === todayStr;
      if (timeRange === 'this_month') return inv.date.startsWith(currentMonthStr);
      if (timeRange === 'last7') {
        const d = new Date(inv.date).getTime();
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return d >= cutoff;
      }
      return true;
    });
  }, [invoices, timeRange, todayStr, currentMonthStr]);

  // Filtered expenses by time range
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (timeRange === 'today') return e.date === todayStr;
      if (timeRange === 'this_month') return e.date.startsWith(currentMonthStr);
      if (timeRange === 'last7') {
        const d = new Date(e.date).getTime();
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        return d >= cutoff;
      }
      return true;
    });
  }, [expenses, timeRange, todayStr, currentMonthStr]);

  // Profit and Loss calculations
  const pnl = useMemo(() => {
    let salesRevenue = 0;
    let costOfGoodsSold = 0;
    let taxCollected = 0;

    for (const inv of filteredInvoices) {
      salesRevenue += inv.taxableTotal; // Net sales before tax
      taxCollected += inv.taxTotal;
      for (const item of inv.items) {
        costOfGoodsSold += (item.purchaseRate || 0) * item.quantity;
      }
    }

    const grossProfit = Math.round((salesRevenue - costOfGoodsSold) * 100) / 100;
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    const netProfit = Math.round((grossProfit - totalExpenses) * 100) / 100;

    return {
      salesRevenue,
      costOfGoodsSold,
      grossProfit,
      totalExpenses,
      netProfit,
      taxCollected,
    };
  }, [filteredInvoices, filteredExpenses]);

  // GST Summary calculations
  const gstSummary = useMemo(() => {
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const inv of filteredInvoices) {
      if (inv.isGstInvoice) {
        taxableTotal += inv.taxableTotal;
        cgstTotal += inv.cgstTotal;
        sgstTotal += inv.sgstTotal;
        igstTotal += inv.igstTotal;
      }
    }

    const totalTax = cgstTotal + sgstTotal + igstTotal;
    return { taxableTotal, cgstTotal, sgstTotal, igstTotal, totalTax };
  }, [filteredInvoices]);

  // Daybook for Today
  const daybook = useMemo(() => {
    const todayInvoices = invoices.filter((i) => i.status !== 'cancelled' && i.date === todayStr);
    const todayPurchases = purchaseInvoices.filter((p) => p.date === todayStr);
    const todayExpenses = expenses.filter((e) => e.date === todayStr);

    let cashIn = 0;
    let upiIn = 0;
    let bankIn = 0;

    for (const inv of todayInvoices) {
      for (const pay of inv.payments) {
        if (pay.mode === 'cash') cashIn += pay.amount;
        else if (pay.mode === 'upi') upiIn += pay.amount;
        else if (pay.mode === 'bank_transfer') bankIn += pay.amount;
      }
    }

    let cashOut = 0;
    let bankOut = 0;
    for (const exp of todayExpenses) {
      if (exp.paymentMode === 'cash') cashOut += exp.amount;
      else bankOut += exp.amount;
    }
    for (const pur of todayPurchases) {
      if (pur.paidAmount > 0) {
        if (pur.paymentMode === 'cash') cashOut += pur.paidAmount;
        else bankOut += pur.paidAmount;
      }
    }

    const netInflow = cashIn + upiIn + bankIn;
    const netOutflow = cashOut + bankOut;
    const netClosing = netInflow - netOutflow;

    return { cashIn, upiIn, bankIn, cashOut, bankOut, netInflow, netOutflow, netClosing };
  }, [invoices, purchaseInvoices, expenses, todayStr]);

  // Export current report to CSV
  const handleExportCsv = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let filename = `Report_${activeReportTab}_${todayStr}.csv`;

    if (activeReportTab === 'pnl') {
      headers = ['Metric', 'Amount (₹)'];
      rows = [
        ['Sales Revenue (Excl Tax)', pnl.salesRevenue],
        ['Cost of Goods Sold (COGS)', pnl.costOfGoodsSold],
        ['Gross Profit', pnl.grossProfit],
        ['Operating Expenses', pnl.totalExpenses],
        ['Net Estimated Profit', pnl.netProfit],
        ['GST Collected', pnl.taxCollected],
      ];
    } else if (activeReportTab === 'gst') {
      headers = ['Invoice No', 'Date', 'Customer', 'GSTIN', 'Taxable Value', 'CGST', 'SGST', 'IGST', 'Total Tax'];
      rows = filteredInvoices
        .filter((i) => i.isGstInvoice)
        .map((i) => [
          i.invoiceNumber,
          i.date,
          `"${i.customerName}"`,
          i.customerGstin || '',
          i.taxableTotal,
          i.cgstTotal,
          i.sgstTotal,
          i.igstTotal,
          i.taxTotal,
        ]);
    } else if (activeReportTab === 'udhar') {
      headers = ['Customer Name', 'Phone', 'Credit Limit', 'Outstanding Balance'];
      rows = customers
        .filter((c) => c.currentBalance > 0)
        .map((c) => [`"${c.name}"`, c.phone, c.creditLimit || '', c.currentBalance]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('reports')}
          </h1>
          <p className="text-xs text-slate-500">
            Real-time Profit &amp; Loss, Daily cash register, GST summary, and receivables aging.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time range selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-xs"
          >
            <option value="today">Today</option>
            <option value="last7">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="all">All Time</option>
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto border border-slate-200">
        {[
          { id: 'pnl', label: 'Profit & Loss Estimate', icon: TrendingUp },
          { id: 'daybook', label: "Today's Daybook", icon: DollarSign },
          { id: 'gst', label: 'GST Summary (GSTR-1)', icon: Receipt },
          { id: 'udhar', label: 'Customer Udhar Aging', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReportTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveReportTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT BODY */}
      {activeReportTab === 'pnl' && (
        <div className="space-y-4">
          {/* Big Profit Hero Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                Estimated Net Profit ({timeRange.replace('_', ' ').toUpperCase()})
              </span>
              <div
                className={`text-3xl sm:text-4xl font-black mt-1 ${
                  pnl.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatCurrency(pnl.netProfit, false)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calculated as: Sales Revenue - Cost of Goods Sold - Shop Expenses
              </p>
            </div>

            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Gross Profit Margin:</span>
                <span className="font-bold text-white">
                  {pnl.salesRevenue > 0
                    ? `${Math.round((pnl.grossProfit / pnl.salesRevenue) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between gap-4 text-slate-300">
                <span>Bills Count:</span>
                <span className="font-bold text-white">{filteredInvoices.length}</span>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {t('totalSalesRevenue')} (Excl. Tax)
              </span>
              <span className="text-xl font-black text-slate-900">
                {formatCurrency(pnl.salesRevenue, false)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {t('costOfGoodsSold')}
              </span>
              <span className="text-xl font-black text-slate-700">
                {formatCurrency(pnl.costOfGoodsSold, false)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {t('grossProfit')}
              </span>
              <span className="text-xl font-black text-blue-700">
                {formatCurrency(pnl.grossProfit, false)}
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 block mb-1">
                {t('totalOperatingExpenses')}
              </span>
              <span className="text-xl font-black text-rose-600">
                {formatCurrency(pnl.totalExpenses, false)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DAYBOOK TAB */}
      {activeReportTab === 'daybook' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{t('daybookReport')}</h3>
                <p className="text-xs text-slate-500">Date: {todayStr} (Daily cash and bank flows)</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-semibold text-slate-500 block">Net Daily Closing Flow:</span>
                <span
                  className={`text-lg font-black ${
                    daybook.netClosing >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(daybook.netClosing, false)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Inflows */}
              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2 text-xs">
                <span className="font-black text-emerald-950 uppercase tracking-wider block">
                  Today&apos;s Inflows (+)
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>Cash Received from Bills:</span>
                  <span className="font-bold">{formatCurrency(daybook.cashIn)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>UPI Received from Bills:</span>
                  <span className="font-bold">{formatCurrency(daybook.upiIn)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Bank Transfers Received:</span>
                  <span className="font-bold">{formatCurrency(daybook.bankIn)}</span>
                </div>
                <div className="pt-2 border-t border-emerald-300 flex justify-between font-black text-emerald-950">
                  <span>Total Inflow Today:</span>
                  <span>{formatCurrency(daybook.netInflow)}</span>
                </div>
              </div>

              {/* Outflows */}
              <div className="p-4 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2 text-xs">
                <span className="font-black text-rose-950 uppercase tracking-wider block">
                  Today&apos;s Outflows (-)
                </span>
                <div className="flex justify-between text-slate-700">
                  <span>Cash Paid (Expenses + Purchases):</span>
                  <span className="font-bold">{formatCurrency(daybook.cashOut)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Bank / UPI Paid Out:</span>
                  <span className="font-bold">{formatCurrency(daybook.bankOut)}</span>
                </div>
                <div className="pt-2 border-t border-rose-300 flex justify-between font-black text-rose-950">
                  <span>Total Outflow Today:</span>
                  <span>{formatCurrency(daybook.netOutflow)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GST SUMMARY TAB */}
      {activeReportTab === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">Total Taxable Value</span>
              <span className="text-lg sm:text-xl font-black text-slate-900">
                {formatCurrency(gstSummary.taxableTotal, false)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">CGST Collected</span>
              <span className="text-lg sm:text-xl font-black text-blue-700">
                {formatCurrency(gstSummary.cgstTotal, false)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">SGST Collected</span>
              <span className="text-lg sm:text-xl font-black text-blue-700">
                {formatCurrency(gstSummary.sgstTotal, false)}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 block">IGST Collected</span>
              <span className="text-lg sm:text-xl font-black text-purple-700">
                {formatCurrency(gstSummary.igstTotal, false)}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 overflow-x-auto text-xs">
            <h4 className="font-bold text-slate-900 mb-2">GST Tax Invoice Breakdown</h4>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                  <th className="py-2 px-2">Invoice #</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Customer GSTIN</th>
                  <th className="py-2 px-2 text-right">Taxable</th>
                  <th className="py-2 px-2 text-right">CGST</th>
                  <th className="py-2 px-2 text-right">SGST</th>
                  <th className="py-2 px-2 text-right">IGST</th>
                  <th className="py-2 px-2 text-right">Total GST</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices
                  .filter((i) => i.isGstInvoice)
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td className="py-2 px-2 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-2 px-2 text-slate-500">{inv.date}</td>
                      <td className="py-2 px-2 font-mono text-slate-600">{inv.customerGstin || 'B2C (Unregistered)'}</td>
                      <td className="py-2 px-2 text-right font-medium">₹{inv.taxableTotal.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-slate-600">₹{inv.cgstTotal.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-slate-600">₹{inv.sgstTotal.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-slate-600">₹{inv.igstTotal.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold text-slate-900">₹{inv.taxTotal.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* UDHAR AGING TAB */}
      {activeReportTab === 'udhar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 overflow-x-auto text-xs">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-slate-900">Customer Udhar Receivables Outstanding List</h4>
            <span className="font-extrabold text-red-600 text-sm">
              Total Udhar: {formatCurrency(customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0))}
            </span>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px]">
                <th className="py-2 px-2">Customer Name</th>
                <th className="py-2 px-2">Phone</th>
                <th className="py-2 px-2">City</th>
                <th className="py-2 px-2 text-right">Credit Limit</th>
                <th className="py-2 px-2 text-right">Outstanding Balance (उधार)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers
                .filter((c) => c.currentBalance > 0)
                .map((c) => (
                  <tr key={c.id}>
                    <td className="py-2.5 px-2 font-bold text-slate-900">{c.name}</td>
                    <td className="py-2.5 px-2 text-slate-600">{c.phone || '-'}</td>
                    <td className="py-2.5 px-2 text-slate-500">{c.city || '-'}</td>
                    <td className="py-2.5 px-2 text-right text-slate-500">
                      {c.creditLimit ? `₹${c.creditLimit.toLocaleString('en-IN')}` : 'No Limit'}
                    </td>
                    <td className="py-2.5 px-2 text-right font-extrabold text-red-600">
                      {formatCurrency(c.currentBalance)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
