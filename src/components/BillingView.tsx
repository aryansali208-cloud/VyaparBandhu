import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  User,
  UserPlus,
  Percent,
  Receipt,
  CheckCircle,
  FileText,
  CreditCard,
  Building,
  Banknote,
  Smartphone,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertCircle,
  Barcode,
} from 'lucide-react';
import {
  BusinessProfile,
  Customer,
  Invoice,
  InvoiceItem,
  InvoicePayment,
  PaymentMode,
  Product,
  Category,
  UnitDefinition,
  Language,
} from '../types';
import { getTranslation } from '../i18n/translations';
import {
  calculateItemTaxes,
  calculateInvoiceTotals,
  calculatePaymentStatus,
  formatCurrency,
} from '../utils/billingMath';
import { generateUpiQrCodeDataUrl } from '../utils/upi';

interface BillingViewProps {
  business: BusinessProfile;
  products: Product[];
  categories: Category[];
  units: UnitDefinition[];
  customers: Customer[];
  language: Language;
  onSaveInvoice: (invoice: Invoice, newCustomer?: Customer) => void;
  onCancel: () => void;
  onQuickAddProduct: () => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  business,
  products,
  categories,
  units,
  customers,
  language,
  onSaveInvoice,
  onCancel,
  onQuickAddProduct,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Invoice Options
  const [isGstInvoice, setIsGstInvoice] = useState(business.gstStatus === 'registered');
  const [isInterState, setIsInterState] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');

  // Quick Add Customer Inline
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustCity, setNewCustCity] = useState(business.city);

  // Cart Items
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Bill-level discounts & notes
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState('');

  // Payment Setup
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [amountReceived, setAmountReceived] = useState<number | ''>('');
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [paymentReference, setPaymentReference] = useState('');

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Filtered Products for quick selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex((it) => it.productId === product.id);
    const unit = units.find((u) => u.code === product.unitCode);
    const step = unit?.allowDecimals ? 1 : 1;

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + step;

      const taxRes = calculateItemTaxes({
        rate: existing.rate,
        quantity: newQty,
        discountPercent: existing.discountPercent,
        discountAmount: existing.discountAmount,
        gstRate: isGstInvoice ? product.gstRate : 0,
        taxIncluded: product.taxIncluded,
        isInterState,
      });

      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        taxableAmount: taxRes.taxableAmount,
        cgstAmount: taxRes.cgstAmount,
        sgstAmount: taxRes.sgstAmount,
        igstAmount: taxRes.igstAmount,
        totalAmount: taxRes.totalAmount,
      };
      setCartItems(updated);
    } else {
      const initialQty = 1;
      const taxRes = calculateItemTaxes({
        rate: product.sellingPrice,
        quantity: initialQty,
        gstRate: isGstInvoice ? product.gstRate : 0,
        taxIncluded: product.taxIncluded,
        isInterState,
      });

      const newItem: InvoiceItem = {
        id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 4),
        productId: product.id,
        productName: product.name,
        hsnCode: product.hsnCode,
        unitCode: product.unitCode,
        quantity: initialQty,
        rate: product.sellingPrice,
        purchaseRate: product.purchasePrice || 0,
        gstRate: isGstInvoice ? product.gstRate : 0,
        taxableAmount: taxRes.taxableAmount,
        cgstAmount: taxRes.cgstAmount,
        sgstAmount: taxRes.sgstAmount,
        igstAmount: taxRes.igstAmount,
        totalAmount: taxRes.totalAmount,
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // Update Cart Item quantity or rate or discount
  const handleUpdateItem = (
    index: number,
    field: 'quantity' | 'rate' | 'discountPercent',
    value: number
  ) => {
    const updated = [...cartItems];
    const item = { ...updated[index] };
    const product = products.find((p) => p.id === item.productId);

    if (field === 'quantity') {
      item.quantity = Math.max(0.001, value);
    } else if (field === 'rate') {
      item.rate = Math.max(0, value);
    } else if (field === 'discountPercent') {
      item.discountPercent = Math.max(0, Math.min(100, value));
    }

    const taxRes = calculateItemTaxes({
      rate: item.rate,
      quantity: item.quantity,
      discountPercent: item.discountPercent,
      discountAmount: item.discountAmount,
      gstRate: isGstInvoice ? item.gstRate : 0,
      taxIncluded: product?.taxIncluded ?? false,
      isInterState,
    });

    item.taxableAmount = taxRes.taxableAmount;
    item.cgstAmount = taxRes.cgstAmount;
    item.sgstAmount = taxRes.sgstAmount;
    item.igstAmount = taxRes.igstAmount;
    item.totalAmount = taxRes.totalAmount;

    updated[index] = item;
    setCartItems(updated);
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Recalculate bill totals
  const billTotals = useMemo(() => {
    return calculateInvoiceTotals({
      items: cartItems,
      discountFlat: discountType === 'flat' ? discountValue : 0,
      discountPercent: discountType === 'percent' ? discountValue : 0,
      isInterState,
      isGstInvoice,
    });
  }, [cartItems, discountType, discountValue, isInterState, isGstInvoice]);

  // Default amount received to grand total if not manually edited or credit
  const effectiveReceived = useMemo(() => {
    if (paymentMode === 'credit') {
      return 0;
    }
    if (isSplitPayment) {
      return typeof amountReceived === 'number' ? amountReceived : 0;
    }
    return billTotals.grandTotal;
  }, [paymentMode, isSplitPayment, amountReceived, billTotals.grandTotal]);

  const balanceDue = Math.max(0, Math.round((billTotals.grandTotal - effectiveReceived) * 100) / 100);

  // Generate UPI QR code when UPI mode or QR modal is requested
  useEffect(() => {
    if (business.upiId && billTotals.grandTotal > 0) {
      const payableNow = paymentMode === 'credit' ? 0 : effectiveReceived;
      generateUpiQrCodeDataUrl({
        vpa: business.upiId,
        payeeName: business.name,
        amount: payableNow > 0 ? payableNow : billTotals.grandTotal,
        transactionNote: `Bill INV-${business.nextInvoiceNumber}`,
      }).then(setUpiQrUrl);
    }
  }, [business.upiId, business.name, business.nextInvoiceNumber, effectiveReceived, billTotals.grandTotal, paymentMode]);

  // Handle Quick Add Customer Submit
  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      city: newCustCity.trim(),
      openingBalance: 0,
      currentBalance: 0,
      createdAt: new Date().toISOString(),
    };

    setSelectedCustomerId(newCustomer.id);
    setIsAddingCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Submit and Complete Invoice
  const handleCompleteBill = () => {
    if (cartItems.length === 0) {
      alert('Cart is empty. Please add items to create a bill.');
      return;
    }

    if (balanceDue > 0 && selectedCustomerId === 'walkin') {
      alert('Cannot leave balance due for Walk-in Cash Customer. Please select or add a Customer for Udhar (Credit).');
      return;
    }

    const payments: InvoicePayment[] = [];
    if (effectiveReceived > 0) {
      payments.push({
        id: 'pay_' + Date.now(),
        amount: effectiveReceived,
        mode: paymentMode === 'credit' ? 'cash' : paymentMode,
        date: new Date().toISOString().split('T')[0],
        referenceNo: paymentReference || undefined,
      });
    }

    const { paymentStatus } = calculatePaymentStatus(billTotals.grandTotal, payments);

    const invoiceNumber = `${business.invoicePrefix}${business.nextInvoiceNumber}`;
    const today = new Date().toISOString().split('T')[0];

    let custName = 'Walk-in Customer';
    let custPhone: string | undefined = undefined;
    let custAddress: string | undefined = undefined;
    let custGstin: string | undefined = undefined;

    if (selectedCustomer) {
      custName = selectedCustomer.name;
      custPhone = selectedCustomer.phone;
      custAddress = selectedCustomer.address ? `${selectedCustomer.address}, ${selectedCustomer.city || ''}` : selectedCustomer.city;
      custGstin = selectedCustomer.gstin;
    }

    const invoice: Invoice = {
      id: 'inv_' + Date.now(),
      invoiceNumber,
      date: today,
      customerId: selectedCustomerId !== 'walkin' ? selectedCustomerId : undefined,
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      customerGstin: custGstin,
      items: cartItems,
      subtotal: billTotals.subtotal,
      discountFlat: billTotals.discountFlat,
      discountPercent: billTotals.discountPercent,
      taxableTotal: billTotals.taxableTotal,
      cgstTotal: billTotals.cgstTotal,
      sgstTotal: billTotals.sgstTotal,
      igstTotal: billTotals.igstTotal,
      taxTotal: billTotals.taxTotal,
      roundOff: billTotals.roundOff,
      grandTotal: billTotals.grandTotal,
      totalPaid: effectiveReceived,
      balanceDue,
      paymentStatus,
      payments,
      isInterState,
      isGstInvoice,
      notes: invoiceNotes || undefined,
      status: 'active',
      createdBy: business.ownerName || 'Staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveInvoice(invoice);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full max-w-7xl mx-auto p-2 sm:p-4">
      {/* LEFT PANE: Catalog / Products quick search and selector */}
      <div className="w-full lg:w-7/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search & Category Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchProductPlaceholder')}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onQuickAddProduct}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
              title={t('addItem')}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t('addItem')}</span>
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {t('allCategories')} ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {language === 'mr' ? cat.nameMr || cat.name : language === 'hi' ? cat.nameHi || cat.name : cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-14rem)]">
          {products.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 mb-1">No items created yet</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                Your shop is a clean slate! Click below to add your first product or service with custom units, rates, and stock.
              </p>
              <button
                type="button"
                onClick={onQuickAddProduct}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md transition"
              >
                + {t('addItem')}
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-medium">
              No items match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {filteredProducts.map((p) => {
                const inCart = cartItems.find((ci) => ci.productId === p.id);
                const isOutOfStock = p.itemType === 'goods' && p.currentStock <= 0;
                const isLowStock = p.itemType === 'goods' && p.currentStock <= p.minStockAlert && p.currentStock > 0;

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className={`relative p-3 rounded-xl border text-left transition flex flex-col justify-between hover:shadow-md ${
                      inCart
                        ? 'border-amber-400 bg-amber-50/60 ring-2 ring-amber-400/40'
                        : 'border-slate-200 bg-white hover:border-amber-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2">
                          {p.name}
                        </span>
                        {inCart && (
                          <span className="bg-amber-500 text-slate-950 font-black text-[11px] px-1.5 py-0.2 rounded-md">
                            {inCart.quantity}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                        <span>{p.unitCode}</span>
                        {p.barcode && <span className="text-[10px] text-slate-400">#{p.barcode}</span>}
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {formatCurrency(p.sellingPrice, false)}
                      </span>

                      {p.itemType === 'goods' ? (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {p.currentStock} {p.unitCode}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1 rounded">
                          Service
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Bill Cart, Calculations, Customer & Payment */}
      <div className="w-full lg:w-5/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Customer & Bill Settings Header */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-sm">
                Bill #{business.invoicePrefix}{business.nextInvoiceNumber}
              </span>
            </div>

            {/* GST & Inter-state Toggles */}
            <div className="flex items-center space-x-2 text-xs">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isGstInvoice}
                  onChange={(e) => setIsGstInvoice(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-slate-300 font-semibold">{t('gstInvoice')}</span>
              </label>

              {isGstInvoice && (
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInterState}
                    onChange={(e) => setIsInterState(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-slate-300 font-semibold">IGST</span>
                </label>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="walkin">{t('walkInCustomer')}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} {c.currentBalance > 0 ? `• Udhar: ₹${c.currentBalance}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setIsAddingCustomer(true)}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 rounded-xl text-xs font-bold transition flex items-center space-x-1"
              title="Add New Customer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>

          {selectedCustomer && (
            <div className="flex items-center justify-between text-xs bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300">
              <span>{selectedCustomer.name}</span>
              {selectedCustomer.currentBalance > 0 ? (
                <span className="text-amber-300 font-bold">
                  Existing Udhar: ₹{selectedCustomer.currentBalance.toLocaleString('en-IN')}
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">No Udhar</span>
              )}
            </div>
          )}
        </div>

        {/* Inline Add Customer Popup */}
        {isAddingCustomer && (
          <form
            onSubmit={handleCreateCustomerSubmit}
            className="p-3 bg-amber-50 border-b border-amber-200 space-y-2 animate-in fade-in duration-150"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950">{t('addCustomerQuick')}</span>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                ✕ Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder={t('customerName')}
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <input
                type="tel"
                placeholder={t('customerPhone')}
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition"
            >
              Save Customer &amp; Select
            </button>
          </form>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[160px] max-h-[35vh]">
          {cartItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              {t('cartEmpty')}
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 flex flex-col gap-1.5 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-2">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                      {item.productName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Rate: ₹{item.rate} / {item.unitCode}
                      {isGstInvoice && item.gstRate > 0 ? ` (GST ${item.gstRate}%)` : ''}
                    </span>
                  </div>

                  <span className="font-extrabold text-xs text-slate-900">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>

                {/* Controls: Quantity, Rate Override, and Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(idx, 'quantity', item.quantity - 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-14 px-1.5 py-0.5 text-center bg-white border border-slate-300 rounded-md font-bold text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(idx, 'quantity', item.quantity + 1)}
                      className="w-6 h-6 rounded-md bg-white border border-slate-300 text-slate-700 flex items-center justify-center font-bold text-xs hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="text-[11px] text-slate-500 font-semibold pl-1">{item.unitCode}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(idx)}
                    className="p-1 text-slate-400 hover:text-red-500 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Summary Calculations */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600">
            <span>{t('subtotal')}:</span>
            <span className="font-semibold">{formatCurrency(billTotals.subtotal)}</span>
          </div>

          {/* Bill Discount input */}
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center space-x-1">
              <span>{t('discount')}:</span>
              <button
                type="button"
                onClick={() => setDiscountType(discountType === 'flat' ? 'percent' : 'flat')}
                className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1 rounded"
              >
                {discountType === 'flat' ? '₹ Flat' : '% Pct'}
              </button>
            </span>
            <div className="flex items-center space-x-1">
              <span>-</span>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-right font-bold text-xs"
              />
            </div>
          </div>

          {isGstInvoice && billTotals.taxTotal > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>
                {isInterState ? 'IGST:' : 'GST (CGST + SGST):'}
              </span>
              <span className="font-semibold text-slate-700">{formatCurrency(billTotals.taxTotal)}</span>
            </div>
          )}

          {billTotals.roundOff !== 0 && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>{t('roundOff')}:</span>
              <span>{billTotals.roundOff > 0 ? `+${billTotals.roundOff}` : billTotals.roundOff}</span>
            </div>
          )}

          <div className="flex justify-between items-center pt-1.5 border-t border-slate-300 font-extrabold text-sm sm:text-base text-slate-900">
            <span>{t('grandTotal')}:</span>
            <span className="text-amber-600 font-black">{formatCurrency(billTotals.grandTotal)}</span>
          </div>
        </div>

        {/* Payment Methods & Quick Checkout */}
        <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
          {/* Payment Mode Selector Tabs */}
          <div className="grid grid-cols-5 gap-1">
            <button
              type="button"
              onClick={() => {
                setPaymentMode('cash');
                setIsSplitPayment(false);
              }}
              className={`p-1.5 rounded-lg text-center text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                paymentMode === 'cash' && !isSplitPayment
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{t('cash')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('upi');
                setIsSplitPayment(false);
                if (business.upiId) setShowQrModal(true);
              }}
              className={`p-1.5 rounded-lg text-center text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                paymentMode === 'upi' && !isSplitPayment
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('bank_transfer');
                setIsSplitPayment(false);
              }}
              className={`p-1.5 rounded-lg text-center text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                paymentMode === 'bank_transfer' && !isSplitPayment
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Bank</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentMode('credit');
                setIsSplitPayment(false);
              }}
              className={`p-1.5 rounded-lg text-center text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                paymentMode === 'credit' && !isSplitPayment
                  ? 'bg-red-500 text-white font-black shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('creditUdhar')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSplitPayment(!isSplitPayment);
                setAmountReceived(Math.round(billTotals.grandTotal / 2));
              }}
              className={`p-1.5 rounded-lg text-center text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                isSplitPayment
                  ? 'bg-purple-600 text-white font-black shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          {/* Partial Payment Amount Input */}
          {isSplitPayment && (
            <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-purple-900">{t('amountReceived')}:</span>
                <div className="flex items-center space-x-1">
                  <span>₹</span>
                  <input
                    type="number"
                    min="0"
                    max={billTotals.grandTotal}
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-white border border-purple-300 rounded font-bold text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-purple-800 font-semibold">
                <span>{t('balanceDue')}:</span>
                <span className="font-extrabold text-red-600">₹ {balanceDue.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}

          {/* Udhar Balance Notice */}
          {balanceDue > 0 && (
            <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <span className="font-medium">
                {selectedCustomer ? `Will add to ${selectedCustomer.name}'s Khata:` : 'Balance due:'}
              </span>
              <span className="font-extrabold text-red-600">₹ {balanceDue.toLocaleString('en-IN')}</span>
            </div>
          )}

          {/* Complete Bill Action Button */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              {t('cancel')}
            </button>

            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleCompleteBill}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-black text-sm rounded-xl shadow-md shadow-amber-500/25 flex items-center justify-center space-x-2 transition active:scale-98"
            >
              <CheckCircle className="w-5 h-5" />
              <span>{t('completeBill')} ({formatCurrency(billTotals.grandTotal)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic UPI QR Code Modal */}
      {showQrModal && upiQrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200 animate-in zoom-in-95 duration-150">
            <h3 className="font-black text-lg text-slate-900 mb-1">{t('scanUpiQr')}</h3>
            <p className="text-xs text-slate-500 mb-3">Pay to: {business.name} ({business.upiId})</p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block mb-3">
              <img src={upiQrUrl} alt="UPI QR Code" className="w-52 h-52 mx-auto" />
            </div>

            <div className="font-extrabold text-xl text-slate-900 mb-4">
              Amount: <span className="text-amber-600">{formatCurrency(effectiveReceived || billTotals.grandTotal)}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Payment Done / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
