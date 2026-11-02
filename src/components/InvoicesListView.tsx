import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Eye,
  Printer,
  Share2,
  FileSpreadsheet,
  Plus,
  Receipt,
  Download,
  Calendar,
} from 'lucide-react';
import { Invoice, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatWhatsAppInvoiceMessage } from '../utils/billingMath';

interface InvoicesListViewProps {
  invoices: Invoice[];
  language: Language;
  onViewInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
  businessName: string;
}

export const InvoicesListView: React.FC<InvoicesListViewProps> = ({
  invoices,
  language,
  onViewInvoice,
  onNewInvoice,
  businessName,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid' | 'cancelled'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'this_month'>('all');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Status filter
      if (statusFilter === 'cancelled') {
        if (inv.status !== 'cancelled') return false;
      } else {
        if (inv.status === 'cancelled') return false;
        if (statusFilter !== 'all' && inv.paymentStatus !== statusFilter) return false;
      }

      // Date filter
      if (dateFilter === 'today' && inv.date !== todayStr) return false;
      if (dateFilter === 'this_month' && !inv.date.startsWith(currentMonthStr)) return false;

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.includes(q))
      );
    });
  }, [invoices, statusFilter, dateFilter, searchQuery, todayStr, currentMonthStr]);

  // Summary figures
  const totals = useMemo(() => {
    let sales = 0;
    let paid = 0;
    let balance = 0;
    for (const inv of filteredInvoices) {
      if (inv.status !== 'cancelled') {
        sales += inv.grandTotal;
        paid += inv.totalPaid;
        balance += inv.balanceDue;
      }
    }
    return { sales, paid, balance };
  }, [filteredInvoices]);

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['Invoice No', 'Date', 'Customer Name', 'Phone', 'Total Amount', 'Paid Amount', 'Balance Due', 'Status'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.date,
      `"${inv.customerName}"`,
      inv.customerPhone || '',
      inv.grandTotal,
      inv.totalPaid,
      inv.balanceDue,
      inv.paymentStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsAppClick = (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    const msg = formatWhatsAppInvoiceMessage(
      businessName,
      inv.invoiceNumber,
      inv.date,
      inv.customerName,
      inv.items,
      inv.grandTotal,
      inv.totalPaid,
      inv.balanceDue
    );

    let cleanPhone = inv.customerPhone ? inv.customerPhone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`
      : `https://api.whatsapp.com/send?text=${msg}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('invoices')}
          </h1>
          <p className="text-xs text-slate-500">
            View, search, print, share, and track all sales bills and invoices.
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
            onClick={onNewInvoice}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newSale')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-3 gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Total Sales</span>
          <span className="text-sm sm:text-lg font-black text-slate-900">
            {formatCurrency(totals.sales, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Amount Received</span>
          <span className="text-sm sm:text-lg font-black text-emerald-600">
            {formatCurrency(totals.paid, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Udhar Outstanding</span>
          <span className="text-sm sm:text-lg font-black text-red-600">
            {formatCurrency(totals.balance, false)}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice #, Customer name, or Phone..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Dates
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'today'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                dateFilter === 'this_month'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {[
            { id: 'all', label: 'All Bills' },
            { id: 'paid', label: 'Fully Paid' },
            { id: 'partial', label: 'Partial Paid' },
            { id: 'unpaid', label: 'Udhar / Unpaid' },
            { id: 'cancelled', label: 'Cancelled' },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st.id
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <span>No invoices found matching criteria.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-right">Paid</th>
                  <th className="py-3 px-3 text-right">Balance Due</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onViewInvoice(inv)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      {inv.isGstInvoice && (
                        <span className="ml-1 text-[9px] bg-slate-200 text-slate-700 px-1 py-0.2 rounded font-sans">
                          GST
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{inv.date}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div className="text-[10px] text-slate-400 font-normal">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-500 font-medium">
                      {inv.items.length}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {formatCurrency(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                      {formatCurrency(inv.totalPaid)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-red-600">
                      {inv.balanceDue > 0 ? formatCurrency(inv.balanceDue) : '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'cancelled'
                            ? 'bg-slate-200 text-slate-600'
                            : inv.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : inv.paymentStatus === 'partial'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {inv.status === 'cancelled' ? 'CANCELLED' : inv.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          onClick={() => onViewInvoice(inv)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="View / Print"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleWhatsAppClick(inv, e)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
