import React, { useState, useMemo } from 'react';
import {
  Truck,
  Search,
  Plus,
  Phone,
  Building,
  DollarSign,
  Boxes,
  Trash2,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  Supplier,
  SupplierTransaction,
  PurchaseInvoice,
  Product,
  Language,
  PaymentMode,
  PurchaseItem,
} from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/billingMath';

interface SuppliersViewProps {
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  purchaseInvoices: PurchaseInvoice[];
  products: Product[];
  language: Language;
  onSaveSupplier: (supplier: Supplier) => void;
  onRecordPurchase: (
    purchase: PurchaseInvoice,
    stockUpdates: { productId: string; qtyToAdd: number; newCost?: number }[]
  ) => void;
  onRecordSupplierPayment: (
    supplierId: string,
    amount: number,
    mode: PaymentMode,
    notes?: string
  ) => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  suppliers,
  supplierTransactions,
  purchaseInvoices,
  products,
  language,
  onSaveSupplier,
  onRecordPurchase,
  onRecordSupplierPayment,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(
    suppliers[0]?.id || null
  );

  // Add Supplier Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supGstin, setSupGstin] = useState('');
  const [supOpeningBalance, setSupOpeningBalance] = useState<number>(0);

  // Record Purchase Bill Modal (+ Stock)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseBillNo, setPurchaseBillNo] = useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseItems, setPurchaseItems] = useState<
    { productId: string; quantity: number; rate: number }[]
  >([]);
  const [purchasePaidAmount, setPurchasePaidAmount] = useState<number>(0);
  const [purchasePaymentMode, setPurchasePaymentMode] = useState<PaymentMode>('bank_transfer');

  // Supplier Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMode, setPayMode] = useState<PaymentMode>('bank_transfer');
  const [payNotes, setPayNotes] = useState('');

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.companyName && s.companyName.toLowerCase().includes(q)) ||
        s.phone.includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  const selectedTransactions = useMemo(() => {
    if (!selectedSupplierId) return [];
    return supplierTransactions.filter((tx) => tx.supplierId === selectedSupplierId);
  }, [supplierTransactions, selectedSupplierId]);

  const totalPayable = useMemo(() => {
    return suppliers.reduce((acc, s) => acc + Math.max(0, s.currentBalance), 0);
  }, [suppliers]);

  // Submit Add Supplier
  const handleSaveSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const newSup: Supplier = {
      id: 'sup_' + Date.now(),
      name: supName.trim(),
      companyName: supCompany.trim() || undefined,
      phone: supPhone.trim(),
      address: supAddress.trim() || undefined,
      gstin: supGstin.trim() || undefined,
      openingBalance: supOpeningBalance || 0,
      currentBalance: supOpeningBalance || 0,
      createdAt: new Date().toISOString(),
    };

    onSaveSupplier(newSup);
    setSelectedSupplierId(newSup.id);
    setIsAddSupplierOpen(false);

    setSupName('');
    setSupCompany('');
    setSupPhone('');
    setSupAddress('');
    setSupGstin('');
    setSupOpeningBalance(0);
  };

  // Add Item row to Purchase bill
  const handleAddPurchaseItemRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    setPurchaseItems([
      ...purchaseItems,
      { productId: firstProd.id, quantity: 1, rate: firstProd.purchasePrice || 0 },
    ]);
  };

  const handleUpdatePurchaseItemRow = (
    idx: number,
    field: 'productId' | 'quantity' | 'rate',
    value: any
  ) => {
    const updated = [...purchaseItems];
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      updated[idx] = {
        productId: value,
        quantity: updated[idx].quantity || 1,
        rate: prod?.purchasePrice || 0,
      };
    } else {
      (updated[idx] as any)[field] = value;
    }
    setPurchaseItems(updated);
  };

  const handleRemovePurchaseItemRow = (idx: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== idx));
  };

  // Total amount of purchase bill
  const purchaseGrandTotal = useMemo(() => {
    return purchaseItems.reduce((acc, it) => acc + it.quantity * it.rate, 0);
  }, [purchaseItems]);

  // Submit Purchase Bill
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0 || !purchaseSupplierId) return;

    const supplier = suppliers.find((s) => s.id === purchaseSupplierId);
    if (!supplier) return;

    const items: PurchaseItem[] = purchaseItems.map((pi) => {
      const prod = products.find((p) => p.id === pi.productId);
      return {
        id: 'pi_' + Date.now() + Math.random().toString(36).substr(2, 4),
        productId: pi.productId,
        productName: prod?.name || 'Item',
        unitCode: prod?.unitCode || 'pcs',
        quantity: pi.quantity,
        rate: pi.rate,
        gstRate: prod?.gstRate || 0,
        totalAmount: pi.quantity * pi.rate,
      };
    });

    const subtotal = purchaseGrandTotal;
    const paidAmount = Number(purchasePaidAmount) || 0;
    const balanceDue = Math.max(0, subtotal - paidAmount);

    const purchaseInvoice: PurchaseInvoice = {
      id: 'pur_' + Date.now(),
      billNumber: purchaseBillNo.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      date: new Date().toISOString().split('T')[0],
      items,
      subtotal,
      taxTotal: 0,
      grandTotal: subtotal,
      paidAmount,
      balanceDue,
      paymentMode: purchasePaymentMode,
      createdAt: new Date().toISOString(),
    };

    const stockUpdates = purchaseItems.map((pi) => ({
      productId: pi.productId,
      qtyToAdd: pi.quantity,
      newCost: pi.rate,
    }));

    onRecordPurchase(purchaseInvoice, stockUpdates);
    setIsPurchaseModalOpen(false);
    setPurchaseItems([]);
    setPurchaseBillNo('');
    setPurchasePaidAmount(0);
  };

  // Submit Supplier Payment
  const handleSupplierPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !payAmount || payAmount <= 0) return;

    onRecordSupplierPayment(
      selectedSupplier.id,
      Number(payAmount),
      payMode,
      payNotes.trim() || undefined
    );

    setIsPaymentModalOpen(false);
    setPayAmount('');
    setPayNotes('');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('suppliers')}
          </h1>
          <p className="text-xs text-slate-500">
            Supplier ledger, purchase bills (+ automatic stock addition), and payables.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (products.length === 0) {
                alert('Please add products first before recording purchases.');
                return;
              }
              if (suppliers.length === 0) {
                alert('Please add a supplier first.');
                return;
              }
              setPurchaseItems([{ productId: products[0].id, quantity: 1, rate: products[0].purchasePrice || 0 }]);
              setPurchasePaidAmount(0);
              setIsPurchaseModalOpen(true);
            }}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition"
          >
            <Boxes className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('recordPurchase')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSupplierOpen(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addSupplier')}</span>
          </button>
        </div>
      </div>

      {/* KPI banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between border border-slate-700">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Supplier Payables (देणे बाकी)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400">
            {formatCurrency(totalPayable)}
          </span>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-xl font-bold text-xs text-slate-300">
          {suppliers.length} active suppliers
        </div>
      </div>

      {/* Master-Detail Split Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Suppliers List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers by name or firm..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] divide-y divide-slate-100">
            {filteredSuppliers.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {t('noSuppliers')}
              </div>
            ) : (
              filteredSuppliers.map((s) => {
                const isSelected = selectedSupplierId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSupplierId(s.id)}
                    className={`w-full text-left p-3 transition flex items-center justify-between ${
                      isSelected ? 'bg-amber-50/70 border-l-4 border-amber-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-slate-900">{s.name}</div>
                      {s.companyName && (
                        <div className="text-[11px] text-slate-500 font-medium">{s.companyName}</div>
                      )}
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-xs sm:text-sm text-slate-900">
                        {formatCurrency(s.currentBalance)}
                      </div>
                      <span className="text-[10px] text-slate-400">Payable</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Supplier Ledger */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          {selectedSupplier ? (
            <div className="flex flex-col h-full">
              <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black">{selectedSupplier.name}</h2>
                  {selectedSupplier.companyName && (
                    <p className="text-xs text-amber-400 font-bold">{selectedSupplier.companyName}</p>
                  )}
                  <p className="text-xs text-slate-300 mt-1">Phone: {selectedSupplier.phone}</p>
                </div>

                <div className="flex flex-col sm:items-end justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block sm:text-right">Amount Payable:</span>
                    <span className="text-xl font-black text-amber-400">
                      {formatCurrency(selectedSupplier.currentBalance)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs transition"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay Supplier</span>
                  </button>
                </div>
              </div>

              {/* Transactions list */}
              <div className="flex-1 p-4 overflow-y-auto max-h-[50vh]">
                <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2">
                  {t('supplierLedger')}
                </h3>

                {selectedTransactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No transactions recorded for this supplier.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="py-2 px-2">Date</th>
                        <th className="py-2 px-2">Type</th>
                        <th className="py-2 px-2 text-right">Debit (Paid)</th>
                        <th className="py-2 px-2 text-right">Credit (Bill)</th>
                        <th className="py-2 px-2 text-right">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-2 text-slate-500">{tx.date}</td>
                          <td className="py-2.5 px-2">
                            <span className="font-semibold text-slate-900 block">
                              {tx.type === 'purchase'
                                ? `Purchase Bill #${tx.referenceNo || ''}`
                                : `Payment Made (${tx.paymentMode?.toUpperCase() || 'BANK'})`}
                            </span>
                            {tx.notes && <span className="text-[10px] text-slate-400">{tx.notes}</span>}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-600">
                            {tx.debit > 0 ? `₹${tx.debit.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-bold text-amber-600">
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
              Select a supplier to view purchase and payment history.
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD SUPPLIER MODAL ================= */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">{t('addSupplier')}</h3>
              <button
                type="button"
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplierSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('supplierName')} *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Bhai Patel"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('companyName')}</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat Oil & Grain Trading Co."
                  value={supCompany}
                  onChange={(e) => setSupCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('phone')} *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9822114433"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={supGstin}
                    onChange={(e) => setSupGstin(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('openingBalance')} (देणे बाकी)</label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={supOpeningBalance || ''}
                  onChange={(e) => setSupOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECORD PURCHASE BILL MODAL (+ AUTO STOCK ADDITION) ================= */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">{t('recordPurchase')}</h3>
                <p className="text-[11px] text-slate-300">Items bought will automatically add to stock inventory</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPurchaseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('addSupplier')} *</label>
                  <select
                    value={purchaseSupplierId}
                    onChange={(e) => setPurchaseSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.companyName ? `(${s.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('billNumber')}</label>
                  <input
                    type="text"
                    placeholder="e.g. SUP-2041"
                    value={purchaseBillNo}
                    onChange={(e) => setPurchaseBillNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800">Items to Purchase (+ Stock)</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseItemRow}
                    className="text-xs font-bold text-amber-700 hover:underline"
                  >
                    + Add Item Row
                  </button>
                </div>

                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200">
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdatePurchaseItemRow(idx, 'productId', e.target.value)}
                      className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.unitCode})
                        </option>
                      ))}
                    </select>

                    <div className="w-20">
                      <input
                        type="number"
                        step="any"
                        min="0.001"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdatePurchaseItemRow(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-center font-bold text-xs"
                      />
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Rate ₹"
                        value={item.rate}
                        onChange={(e) =>
                          handleUpdatePurchaseItemRow(idx, 'rate', parseFloat(e.target.value) || 0)
                        }
                        className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-right font-bold text-xs"
                      />
                    </div>

                    <div className="w-24 text-right font-bold text-slate-900">
                      ₹{(item.quantity * item.rate).toFixed(2)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemovePurchaseItemRow(idx)}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Bill Totals & Payment */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex justify-between font-black text-sm text-amber-950">
                  <span>Grand Total:</span>
                  <span>₹{purchaseGrandTotal.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">{t('paidToSupplier')}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max={purchaseGrandTotal}
                      value={purchasePaidAmount}
                      onChange={(e) => setPurchasePaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">{t('balancePayable')}</label>
                    <div className="py-1.5 font-black text-sm text-red-600">
                      ₹{Math.max(0, purchaseGrandTotal - purchasePaidAmount).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={purchaseItems.length === 0}
                  className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition"
                >
                  Save Purchase Bill &amp; Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= RECORD PAYMENT TO SUPPLIER MODAL ================= */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm">Pay Supplier</h3>
                <p className="text-[11px] text-slate-300">To: {selectedSupplier.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSupplierPaymentSubmit} className="p-4 space-y-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-bold text-slate-700">
                <span>Total Payable Now:</span>
                <span className="font-black text-amber-700">{formatCurrency(selectedSupplier.currentBalance)}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Paid (₹) *</label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  placeholder="Enter amount..."
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || '')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('paymentMode')}</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['bank_transfer', 'upi', 'cash'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPayMode(mode)}
                      className={`p-1.5 rounded-lg text-center font-bold text-xs transition ${
                        payMode === mode
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {mode === 'bank_transfer' ? 'Bank' : mode === 'upi' ? 'UPI' : 'Cash'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bank Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UTR #881920..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
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
                  className="w-2/3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
