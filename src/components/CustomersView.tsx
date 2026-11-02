import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MapPin,
  CreditCard,
  Receipt,
  Share2,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  DollarSign,
  Send,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { Customer, CustomerTransaction, Language, PaymentMode } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatWhatsAppPaymentReceipt } from '../utils/billingMath';

interface CustomersViewProps {
  customers: Customer[];
  customerTransactions: CustomerTransaction[];
  language: Language;
  businessName: string;
  upiId?: string;
  onSaveCustomer: (customer: Customer) => void;
  onRecordPayment: (
    customerId: string,
    amount: number,
    mode: PaymentMode,
    notes?: string
  ) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  customerTransactions,
  language,
  businessName,
  upiId,
  onSaveCustomer,
  onRecordPayment,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers[0]?.id || null
  );

  // Add / Edit Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custCity, setCustCity] = useState('');
  const [custGstin, setCustGstin] = useState('');
  const [custCreditLimit, setCustCreditLimit] = useState<number | undefined>(undefined);
  const [custOpeningBalance, setCustOpeningBalance] = useState<number>(0);

  // Receive Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    });
  }, [customers, searchQuery]);

  // Selected Customer & Ledger Transactions
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const selectedTransactions = useMemo(() => {
    if (!selectedCustomerId) return [];
    return customerTransactions.filter((tx) => tx.customerId === selectedCustomerId);
  }, [customerTransactions, selectedCustomerId]);

  // Total Outstanding Udhar across all customers
  const totalOutstanding = useMemo(() => {
    return customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0);
  }, [customers]);

  // Submit Add Customer
  const handleSaveCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const newCust: Customer = {
      id: 'cust_' + Date.now(),
      name: custName.trim(),
      phone: custPhone.trim(),
      address: custAddress.trim() || undefined,
      city: custCity.trim() || undefined,
      gstin: custGstin.trim() || undefined,
      creditLimit: custCreditLimit,
      openingBalance: custOpeningBalance || 0,
      currentBalance: custOpeningBalance || 0,
      createdAt: new Date().toISOString(),
    };

    onSaveCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setIsAddCustomerOpen(false);

    // Reset form
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustCity('');
    setCustGstin('');
    setCustCreditLimit(undefined);
    setCustOpeningBalance(0);
  };

  // Submit Receive Payment
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount || paymentAmount <= 0) return;

    onRecordPayment(
      selectedCustomer.id,
      Number(paymentAmount),
      paymentMode,
      paymentNotes.trim() || undefined
    );

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setPaymentNotes('');
  };

  // WhatsApp Reminder message
  const handleSendWhatsAppReminder = () => {
    if (!selectedCustomer) return;
    const cleanPhone = selectedCustomer.phone ? selectedCustomer.phone.replace(/\D/g, '') : '';
    const phoneWithCode = cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone;

    const lines = [
      `🙏 *Namaste ${selectedCustomer.name} ji,*`,
      `This is a gentle payment reminder from *${businessName}*.`,
      `Your current outstanding balance (उधार बाकी) is *₹ ${selectedCustomer.currentBalance.toLocaleString('en-IN')}*.`,
      `Kindly clear the pending dues at your earliest convenience.`,
    ];

    if (upiId) {
      lines.push(`\n📲 Pay easily via UPI: ${upiId}`);
    }
    lines.push(`\nThank you for your continued business!`);

    const encoded = encodeURIComponent(lines.join('\n'));
    const url = phoneWithCode
      ? `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('customers')}
          </h1>
          <p className="text-xs text-slate-500">
            Customer directory, live Udhar Khata ledger, payment collection, and WhatsApp reminders.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddCustomerOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* KPI banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider block">Total Customer Udhar (Receivables)</span>
          <span className="text-2xl sm:text-3xl font-black">{formatCurrency(totalOutstanding)}</span>
        </div>
        <div className="bg-slate-950/10 px-3 py-1.5 rounded-xl font-bold text-xs">
          {customers.length} registered customers
        </div>
      </div>

      {/* Master-Detail Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT: Customer List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name or phone..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {t('noCustomers')}
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isSelected = selectedCustomerId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCustomerId(c.id)}
                    className={`w-full text-left p-3 transition flex items-center justify-between ${
                      isSelected ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone || 'No phone'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-black text-xs sm:text-sm ${
                          c.currentBalance > 0 ? 'text-red-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatCurrency(c.currentBalance)}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {c.currentBalance > 0 ? 'Udhar Baaki' : 'Cleared'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: Selected Customer Ledger & Statement (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {selectedCustomer ? (
            <div className="flex flex-col h-full">
              {/* Customer Profile Header */}
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{selectedCustomer.name}</h2>
                  <div className="text-xs text-slate-300 space-y-0.5 mt-1">
                    {selectedCustomer.phone && <p>Mobile: {selectedCustomer.phone}</p>}
                    {selectedCustomer.address && (
                      <p>Address: {selectedCustomer.address}, {selectedCustomer.city || ''}</p>
                    )}
                    {selectedCustomer.gstin && <p>GSTIN: {selectedCustomer.gstin}</p>}
                  </div>
                </div>

                <div className="flex flex-col sm:items-end justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block sm:text-right">Current Balance:</span>
                    <span
                      className={`text-xl font-black ${
                        selectedCustomer.currentBalance > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(selectedCustomer.currentBalance)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs transition"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{t('receivePayment')}</span>
                    </button>

                    {selectedCustomer.currentBalance > 0 && (
                      <button
                        type="button"
                        onClick={handleSendWhatsAppReminder}
                        className="p-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
                        title={t('sendReminderWhatsApp')}
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[50vh]">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  {t('transactionHistory')}
                </h3>

                {selectedTransactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No transactions recorded for this customer yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Description</th>
                        <th className="py-2 px-2 text-right">Debit (+)</th>
                        <th className="py-2 px-2 text-right">Credit (-)</th>
                        <th className="py-2 px-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">{tx.date}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-semibold text-slate-900 block">
                              {tx.type === 'sale'
                                ? `Bill ${tx.referenceNo || ''}`
                                : tx.type === 'payment_received'
                                ? `Payment Received (${tx.paymentMode?.toUpperCase() || 'CASH'})`
                                : 'Opening Balance'}
                            </span>
                            {tx.notes && <span className="text-[10px] text-slate-400">{tx.notes}</span>}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-red-600">
                            {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-600">
                            {tx.credit > 0 ? `₹${tx.credit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                            ₹{tx.runningBalance.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 text-slate-400 text-xs">
              Select a customer from the left to view their Khata ledger.
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD CUSTOMER MODAL ================= */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">{t('addCustomer')}</h3>
              <button
                type="button"
                onClick={() => setIsAddCustomerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomerSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('customerName')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Shinde"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('customerPhone')}</label>
                <input
                  type="tel"
                  placeholder="e.g. 9822334455"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('address')}</label>
                  <input
                    type="text"
                    placeholder="Area / Locality"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    placeholder="City"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('openingBalance')}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={custOpeningBalance || ''}
                    onChange={(e) => setCustOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('creditLimit')}</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Optional"
                    value={custCreditLimit || ''}
                    onChange={(e) => setCustCreditLimit(parseFloat(e.target.value) || undefined)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECEIVE PAYMENT (JAMA) MODAL ================= */}
      {isPaymentModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-emerald-700 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">{t('receivePayment')} (जमा करा)</h3>
                <p className="text-[11px] text-emerald-100">From: {selectedCustomer.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold text-slate-700">
                <span>Current Udhar Balance:</span>
                <span className="font-black text-red-600">
                  {formatCurrency(selectedCustomer.currentBalance)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="Enter amount..."
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('paymentMode')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'upi', 'bank_transfer'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`p-1.5 rounded-lg text-center font-bold text-xs transition ${
                        paymentMode === mode
                          ? 'bg-emerald-600 text-white font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode === 'cash' ? 'Cash' : mode === 'upi' ? 'UPI' : 'Bank'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Remarks / Note</label>
                <input
                  type="text"
                  placeholder="e.g. GooglePay Ref #9812..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-md transition"
                >
                  Record Payment (जमा)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
