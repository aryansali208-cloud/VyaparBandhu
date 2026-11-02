import React, { useState, useEffect, useMemo } from 'react';
import {
  AppStoreData,
  getActiveBusinessId,
  setActiveBusinessId,
  loadStore,
  saveStore,
  createDefaultBusiness,
  initializeStore,
  getAllBusinessesList,
  deleteStore,
} from './utils/storage';
import {
  BusinessProfile,
  Customer,
  CustomerTransaction,
  Expense,
  Invoice,
  Language,
  Product,
  PurchaseInvoice,
  StockAdjustment,
  Supplier,
  SupplierTransaction,
  UserRole,
  PaymentMode,
  Category,
  UnitDefinition,
} from './types';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { OnboardingModal } from './components/OnboardingModal';
import { DashboardView } from './components/DashboardView';
import { BillingView } from './components/BillingView';
import { InvoicesListView } from './components/InvoicesListView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { SuppliersView } from './components/SuppliersView';
import { ExpensesView } from './components/ExpensesView';
import {
  Store,
  Lock,
  LogIn,
  Building2,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Globe,
  Key,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

interface RoleAuthModalProps {
  role: UserRole;
  storeName: string;
  language: Language;
  onSubmit: (password: string) => void;
  onCancel: () => void;
  error?: string;
}

const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  role,
  storeName,
  language,
  onSubmit,
  onCancel,
  error,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [showVal, setShowVal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputVal);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2.5 rounded-2xl ${
                role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {role === 'owner' ? <ShieldCheck className="w-6 h-6" /> : <Key className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {role === 'owner'
                  ? language === 'mr'
                    ? 'मालक पासवर्ड आवश्यक'
                    : language === 'hi'
                    ? 'मालिक पासवर्ड आवश्यक'
                    : 'Owner Password Required'
                  : language === 'mr'
                  ? 'कॅशियर पासवर्ड आवश्यक'
                  : language === 'hi'
                  ? 'कैशियर पासवर्ड आवश्यक'
                  : 'Cashier Password Required'}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-1">{storeName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {role === 'owner'
                ? language === 'mr'
                  ? 'मालक पासवर्ड / PIN:'
                  : language === 'hi'
                  ? 'मालिक (Owner) पासवर्ड / PIN:'
                  : 'Owner Password / PIN:'
                : language === 'mr'
                ? 'कॅशियर पासवर्ड / PIN:'
                : language === 'hi'
                ? 'कैशियर (Staff) पासवर्ड / PIN:'
                : 'Cashier Password / PIN:'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type={showVal ? 'text' : 'password'}
                autoFocus
                required
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={
                  language === 'mr'
                    ? 'पासवर्ड किंवा पिन टाका...'
                    : language === 'hi'
                    ? 'पासवर्ड या पिन दर्ज करें...'
                    : 'Enter password or PIN...'
                }
                className="w-full pl-9 pr-10 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowVal(!showVal)}
                className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                tabIndex={-1}
              >
                {showVal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2 rounded-xl flex items-center space-x-1.5">
                <span>⚠️</span>
                <span>{error}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              {language === 'mr' ? 'रद्द करा' : language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {language === 'mr' ? 'अनलॉक करा' : language === 'hi' ? 'अनलॉक करें' : 'Unlock & Access'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const [activeBusinessId, setActiveBusinessIdState] = useState<string | null>(() => getActiveBusinessId());
  const [store, setStore] = useState<AppStoreData | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [showSwitchStoreModal, setShowSwitchStoreModal] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [language, setLanguage] = useState<Language>('en');
  const [userRole, setUserRole] = useState<UserRole>('owner');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modals & Cross-tab navigation
  const [activeModalInvoice, setActiveModalInvoice] = useState<Invoice | null>(null);
  const [targetAdjustProduct, setTargetAdjustProduct] = useState<Product | null>(null);

  // Role Authentication Modal states
  const [pendingAuthRole, setPendingAuthRole] = useState<UserRole | null>(null);
  const [authPasswordError, setAuthPasswordError] = useState('');

  const requestRoleChange = (targetRole: UserRole) => {
    if (!store) return;
    const targetPin = targetRole === 'owner' ? store.business.ownerPin : store.business.cashierPin;

    // Check if security is enabled and target role has a non-empty password configured
    if (store.business.securityEnabled && targetPin && targetPin.trim() !== '') {
      setPendingAuthRole(targetRole);
      setAuthPasswordError('');
    } else {
      // Direct access without prompt
      setUserRole(targetRole);
      setIsLoggedOut(false);
    }
  };

  const handleAuthSubmit = (password: string) => {
    if (!store || !pendingAuthRole) return;
    const expectedPin = pendingAuthRole === 'owner' ? store.business.ownerPin : store.business.cashierPin;

    if (password === expectedPin) {
      setUserRole(pendingAuthRole);
      setIsLoggedOut(false);
      setPendingAuthRole(null);
      setAuthPasswordError('');
    } else {
      setAuthPasswordError(
        language === 'mr'
          ? 'चुकीचा पासवर्ड किंवा पिन. प्रवेश नाकारला.'
          : language === 'hi'
          ? 'गलत पासवर्ड या पिन। प्रवेश अस्वीकृत।'
          : 'Incorrect password or PIN. Access denied.'
      );
    }
  };

  // Initialize store on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');

    let currentId = activeBusinessId || getActiveBusinessId();

    if (currentId) {
      const loaded = loadStore(currentId);
      if (loaded) {
        setStore(loaded);
        setLanguage(loaded.business.defaultLanguage || 'en');
        return;
      }
    }

    // If no business or autostart is requested, create a clean starter shop
    if (autostart === '1') {
      const defaultBiz = createDefaultBusiness(
        'Shree Ganesh Traders',
        'grocery_kirana',
        'Ganesh Patil',
        '9822012345',
        'Pune',
        'Maharashtra',
        '27',
        'registered',
        '27AABCS1234F1Z5',
        'ganeshtraders@upi',
        'en'
      );
      const initial = initializeStore(defaultBiz);
      setStore(initial);
      setActiveBusinessIdState(initial.business.id);
      setIsOnboardingOpen(false);
    } else {
      // Check if any business exists in business list
      const list = getAllBusinessesList();
      if (list.length > 0) {
        const first = loadStore(list[0].id);
        if (first) {
          setStore(first);
          setActiveBusinessIdState(first.business.id);
          setActiveBusinessId(first.business.id);
          setLanguage(first.business.defaultLanguage || 'en');
          return;
        }
      }
      // Otherwise open onboarding wizard
      setIsOnboardingOpen(true);
    }
  }, []);

  // Keyboard shortcut F2 for quick billing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save changes to localStorage whenever store state changes
  const updateStore = (updater: (prev: AppStoreData) => AppStoreData) => {
    setStore((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      saveStore(next);
      return next;
    });
  };

  // Low stock products count
  const lowStockCount = useMemo(() => {
    if (!store) return 0;
    return store.products.filter(
      (p) => p.itemType === 'goods' && p.currentStock <= p.minStockAlert
    ).length;
  }, [store]);

  // Total customer receivables
  const totalReceivables = useMemo(() => {
    if (!store) return 0;
    return store.customers.reduce((acc, c) => acc + Math.max(0, c.currentBalance), 0);
  }, [store]);

  // Onboarding Complete Handler
  const handleOnboardingComplete = (newStoreData: AppStoreData) => {
    setStore(newStoreData);
    setActiveBusinessIdState(newStoreData.business.id);
    setActiveBusinessId(newStoreData.business.id);
    setIsOnboardingOpen(false);
    setLanguage(newStoreData.business.defaultLanguage || 'en');
    setActiveTab('dashboard');
  };

  // ================= BILLING & INVOICE OPERATIONS =================
  const handleSaveInvoice = (invoice: Invoice, newCustomer?: Customer) => {
    updateStore((prev) => {
      // 1. Deduct stock for all goods sold
      const updatedProducts = prev.products.map((p) => {
        const itemSold = invoice.items.find((it) => it.productId === p.id);
        if (itemSold && p.itemType === 'goods') {
          return {
            ...p,
            currentStock: Math.max(0, Math.round((p.currentStock - itemSold.quantity) * 1000) / 1000),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      // 2. Customer updates & ledger entry
      let updatedCustomers = [...prev.customers];
      let updatedCustomerTransactions = [...prev.customerTransactions];

      if (newCustomer) {
        updatedCustomers.push(newCustomer);
      }

      if (invoice.customerId) {
        const custIndex = updatedCustomers.findIndex((c) => c.id === invoice.customerId);
        if (custIndex >= 0) {
          const cust = updatedCustomers[custIndex];
          const newBal = Math.round((cust.currentBalance + invoice.balanceDue) * 100) / 100;
          updatedCustomers[custIndex] = { ...cust, currentBalance: newBal };

          // Ledger entry
          updatedCustomerTransactions.push({
            id: 'ctx_' + Date.now(),
            customerId: cust.id,
            date: invoice.date,
            type: 'sale',
            referenceNo: invoice.invoiceNumber,
            invoiceId: invoice.id,
            amount: invoice.grandTotal,
            debit: invoice.grandTotal,
            credit: invoice.totalPaid,
            runningBalance: newBal,
            paymentMode: invoice.payments[0]?.mode,
            notes: invoice.notes || (invoice.balanceDue > 0 ? `Unpaid balance ₹${invoice.balanceDue}` : 'Fully Paid'),
          });
        }
      }

      // 3. Increment next invoice number
      const updatedBusiness: BusinessProfile = {
        ...prev.business,
        nextInvoiceNumber: prev.business.nextInvoiceNumber + 1,
      };

      return {
        ...prev,
        business: updatedBusiness,
        products: updatedProducts,
        customers: updatedCustomers,
        customerTransactions: updatedCustomerTransactions,
        invoices: [invoice, ...prev.invoices],
      };
    });

    // Automatically open print preview modal
    setActiveModalInvoice(invoice);
    setActiveTab('invoices');
  };

  // Cancel / Void invoice & restore stock
  const handleCancelInvoice = (invoiceId: string) => {
    updateStore((prev) => {
      const target = prev.invoices.find((i) => i.id === invoiceId);
      if (!target || target.status === 'cancelled') return prev;

      // Restore stock
      const updatedProducts = prev.products.map((p) => {
        const itemSold = target.items.find((it) => it.productId === p.id);
        if (itemSold && p.itemType === 'goods') {
          return {
            ...p,
            currentStock: Math.round((p.currentStock + itemSold.quantity) * 1000) / 1000,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      // Reverse customer balance if balance was due
      let updatedCustomers = [...prev.customers];
      if (target.customerId && target.balanceDue > 0) {
        const cIdx = updatedCustomers.findIndex((c) => c.id === target.customerId);
        if (cIdx >= 0) {
          const c = updatedCustomers[cIdx];
          updatedCustomers[cIdx] = {
            ...c,
            currentBalance: Math.max(0, c.currentBalance - target.balanceDue),
          };
        }
      }

      const updatedInvoices = prev.invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : i
      );

      return {
        ...prev,
        products: updatedProducts,
        customers: updatedCustomers,
        invoices: updatedInvoices,
      };
    });

    if (activeModalInvoice?.id === invoiceId) {
      setActiveModalInvoice((prev) => (prev ? { ...prev, status: 'cancelled' } : null));
    }
  };

  // ================= INVENTORY & PRODUCTS =================
  const handleSaveProduct = (product: Product) => {
    updateStore((prev) => {
      const idx = prev.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const updated = [...prev.products];
        updated[idx] = product;
        return { ...prev, products: updated };
      }
      return { ...prev, products: [product, ...prev.products] };
    });
  };

  const handleDeleteProduct = (productId: string) => {
    updateStore((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== productId),
    }));
  };

  const handleAdjustStock = (adjustment: StockAdjustment) => {
    updateStore((prev) => {
      const updatedProducts = prev.products.map((p) => {
        if (p.id === adjustment.productId) {
          return {
            ...p,
            currentStock: adjustment.newStock,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      return {
        ...prev,
        products: updatedProducts,
        stockAdjustments: [adjustment, ...prev.stockAdjustments],
      };
    });
  };

  const handleSaveCategory = (category: Category) => {
    updateStore((prev) => ({
      ...prev,
      categories: [...prev.categories, category],
    }));
  };

  const handleSaveUnit = (unit: UnitDefinition) => {
    updateStore((prev) => ({
      ...prev,
      units: [...prev.units, unit],
    }));
  };

  // ================= CUSTOMERS & KHATA =================
  const handleSaveCustomer = (customer: Customer) => {
    updateStore((prev) => {
      const idx = prev.customers.findIndex((c) => c.id === customer.id);
      if (idx >= 0) {
        const updated = [...prev.customers];
        updated[idx] = customer;
        return { ...prev, customers: updated };
      }
      return { ...prev, customers: [customer, ...prev.customers] };
    });
  };

  const handleRecordPayment = (
    customerId: string,
    amount: number,
    mode: PaymentMode,
    notes?: string
  ) => {
    updateStore((prev) => {
      const custIndex = prev.customers.findIndex((c) => c.id === customerId);
      if (custIndex < 0) return prev;

      const cust = prev.customers[custIndex];
      const newBal = Math.round((cust.currentBalance - amount) * 100) / 100;
      const updatedCusts = [...prev.customers];
      updatedCusts[custIndex] = { ...cust, currentBalance: newBal };

      const tx: CustomerTransaction = {
        id: 'ctx_' + Date.now(),
        customerId: cust.id,
        date: new Date().toISOString().split('T')[0],
        type: 'payment_received',
        amount,
        debit: 0,
        credit: amount,
        runningBalance: newBal,
        paymentMode: mode,
        notes: notes || 'Payment Received (जमा)',
      };

      return {
        ...prev,
        customers: updatedCusts,
        customerTransactions: [...prev.customerTransactions, tx],
      };
    });
  };

  // ================= SUPPLIERS & PURCHASES =================
  const handleSaveSupplier = (supplier: Supplier) => {
    updateStore((prev) => {
      const idx = prev.suppliers.findIndex((s) => s.id === supplier.id);
      if (idx >= 0) {
        const updated = [...prev.suppliers];
        updated[idx] = supplier;
        return { ...prev, suppliers: updated };
      }
      return { ...prev, suppliers: [supplier, ...prev.suppliers] };
    });
  };

  const handleRecordPurchase = (
    purchase: PurchaseInvoice,
    stockUpdates: { productId: string; qtyToAdd: number; newCost?: number }[]
  ) => {
    updateStore((prev) => {
      // 1. Add stock to products
      const updatedProducts = prev.products.map((p) => {
        const update = stockUpdates.find((u) => u.productId === p.id);
        if (update && p.itemType === 'goods') {
          return {
            ...p,
            currentStock: Math.round((p.currentStock + update.qtyToAdd) * 1000) / 1000,
            purchasePrice: update.newCost && update.newCost > 0 ? update.newCost : p.purchasePrice,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      });

      // 2. Update supplier balance payable
      const updatedSuppliers = [...prev.suppliers];
      const supIdx = updatedSuppliers.findIndex((s) => s.id === purchase.supplierId);
      let updatedSupTx = [...prev.supplierTransactions];

      if (supIdx >= 0) {
        const sup = updatedSuppliers[supIdx];
        const newBal = Math.round((sup.currentBalance + purchase.balanceDue) * 100) / 100;
        updatedSuppliers[supIdx] = { ...sup, currentBalance: newBal };

        updatedSupTx.push({
          id: 'stx_' + Date.now(),
          supplierId: sup.id,
          date: purchase.date,
          type: 'purchase',
          referenceNo: purchase.billNumber,
          amount: purchase.grandTotal,
          debit: purchase.paidAmount,
          credit: purchase.grandTotal,
          runningBalance: newBal,
          paymentMode: purchase.paymentMode,
          notes: purchase.notes || (purchase.balanceDue > 0 ? `Payable balance ₹${purchase.balanceDue}` : 'Fully Paid'),
        });
      }

      return {
        ...prev,
        products: updatedProducts,
        suppliers: updatedSuppliers,
        supplierTransactions: updatedSupTx,
        purchaseInvoices: [purchase, ...prev.purchaseInvoices],
      };
    });
  };

  const handleRecordSupplierPayment = (
    supplierId: string,
    amount: number,
    mode: PaymentMode,
    notes?: string
  ) => {
    updateStore((prev) => {
      const supIdx = prev.suppliers.findIndex((s) => s.id === supplierId);
      if (supIdx < 0) return prev;

      const sup = prev.suppliers[supIdx];
      const newBal = Math.round((sup.currentBalance - amount) * 100) / 100;
      const updatedSups = [...prev.suppliers];
      updatedSups[supIdx] = { ...sup, currentBalance: newBal };

      const tx: SupplierTransaction = {
        id: 'stx_' + Date.now(),
        supplierId: sup.id,
        date: new Date().toISOString().split('T')[0],
        type: 'payment_made',
        amount,
        debit: amount,
        credit: 0,
        runningBalance: newBal,
        paymentMode: mode,
        notes: notes || 'Paid to Supplier',
      };

      return {
        ...prev,
        suppliers: updatedSups,
        supplierTransactions: [...prev.supplierTransactions, tx],
      };
    });
  };

  // ================= EXPENSES =================
  const handleSaveExpense = (expense: Expense) => {
    updateStore((prev) => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
  };

  const handleDeleteExpense = (expenseId: string) => {
    updateStore((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== expenseId),
    }));
  };

  // ================= BUSINESS SETTINGS & MULTI-BUSINESS =================
  const handleSaveBusiness = (updated: BusinessProfile) => {
    updateStore((prev) => ({
      ...prev,
      business: updated,
    }));
  };

  const handleRestoreStore = (imported: AppStoreData) => {
    setStore(imported);
    setActiveBusinessIdState(imported.business.id);
    setActiveBusinessId(imported.business.id);
    setLanguage(imported.business.defaultLanguage || 'en');
  };

  const handleSwitchBusiness = (id: string) => {
    const loaded = loadStore(id);
    if (loaded) {
      setStore(loaded);
      setActiveBusinessIdState(id);
      setActiveBusinessId(id);
      setLanguage(loaded.business.defaultLanguage || 'en');
      setActiveTab('dashboard');
    }
  };

  const handleCreateNewBusiness = () => {
    setIsOnboardingOpen(true);
  };

  const handleDeleteStore = (businessId: string) => {
    const { remainingCount, nextBusinessId } = deleteStore(businessId);
    if (remainingCount > 0 && nextBusinessId) {
      const nextStore = loadStore(nextBusinessId);
      if (nextStore) {
        setStore(nextStore);
        setActiveBusinessIdState(nextBusinessId);
        setActiveBusinessId(nextBusinessId);
        setLanguage(nextStore.business.defaultLanguage || 'en');
        setActiveTab('dashboard');
        return;
      }
    }
    // If no stores left, clear and open setup wizard
    setStore(null);
    setActiveBusinessIdState(null);
    setIsOnboardingOpen(true);
  };

  // If no store loaded yet and onboarding is closed, show loading or fallback
  if (!store && !isOnboardingOpen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white font-sans p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-bold text-sm">Loading VyaparBandhu Business System...</p>
        </div>
      </div>
    );
  }

  // Logged-out / Lock Screen
  if (store && isLoggedOut) {
    const allBusinesses = getAllBusinessesList();
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative styling */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black opacity-90 pointer-events-none" />

        {/* Top bar with language switcher */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-1.5 shadow-lg">
          <Globe className="w-4 h-4 text-slate-400 ml-1.5 mr-1" />
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              language === 'en' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              language === 'hi' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => setLanguage('mr')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
              language === 'mr' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            मराठी
          </button>
        </div>

        {/* Login Modal Box */}
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative z-10">
          {/* Store Banner Hero if present */}
          {store.business.bannerUrl ? (
            <div className="h-28 w-full relative bg-slate-800 overflow-hidden">
              <img
                src={store.business.bannerUrl}
                alt={store.business.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>
          ) : (
            <div className="h-16 w-full bg-gradient-to-r from-amber-600/30 via-slate-800 to-amber-900/30 border-b border-slate-800/60" />
          )}

          <div className="p-6 sm:p-8 pt-0 relative">
            {/* Store Logo floating over header */}
            <div className="-mt-10 mb-4 flex justify-center">
              {store.business.logoUrl ? (
                <div className="p-1.5 bg-slate-900 rounded-2xl shadow-xl border-2 border-amber-500/50">
                  <img
                    src={store.business.logoUrl}
                    alt={store.business.name}
                    className="w-18 h-18 object-contain rounded-xl bg-white"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center text-slate-950 shadow-xl border-2 border-slate-900 ring-4 ring-amber-500/20">
                  <Store className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Store Name & Details */}
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {store.business.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-2">
                <span>{store.business.city}, {store.business.state}</span>
                {store.business.gstin && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800/60">
                    GSTIN: {store.business.gstin}
                  </span>
                )}
              </p>
              <div className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>
                  {language === 'mr' ? 'लॉगआउट सत्र / लॉक केले' : language === 'hi' ? 'सत्र लॉक / लॉगआउट किया गया' : 'Session Locked / Logged Out'}
                </span>
              </div>
            </div>

            {/* Login Role Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => requestRoleChange('owner')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-950/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-950 flex items-center space-x-1.5">
                      <span>{language === 'mr' ? 'मालक म्हणून लॉगिन करा' : language === 'hi' ? 'मालिक के रूप में लॉगिन करें' : 'Log in as Owner (Admin)'}</span>
                      {store.business.securityEnabled && store.business.ownerPin && (
                        <Lock className="w-3.5 h-3.5 text-slate-950" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-800 font-medium">
                      {language === 'mr' ? 'सर्व अहवाल, सेटिंग्ज व व्यवस्थापन' : language === 'hi' ? 'सभी रिपोर्ट, सेटिंग्स और नियंत्रण' : 'Full access to Reports, Settings & Stock'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-950 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={() => requestRoleChange('cashier')}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-semibold rounded-xl transition flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-700/60 rounded-lg">
                    <UserCheck className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white flex items-center space-x-1.5">
                      <span>{language === 'mr' ? 'कॅशियर / स्टाफ म्हणून लॉगिन' : language === 'hi' ? 'कैशियर / स्टाफ लॉगिन' : 'Log in as Cashier / Staff'}</span>
                      {store.business.securityEnabled && store.business.cashierPin && (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {language === 'mr' ? 'झटपट काउंटर बिलिंग व पावती' : language === 'hi' ? 'फास्ट काउंटर बिलिंग और रसीद' : 'Fast billing & invoice generation'}
                    </div>
                  </div>
                </div>
                <LogIn className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition" />
              </button>
            </div>

            {/* Switch / Change Store or Create New Store */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={() => setShowSwitchStoreModal(true)}
                className="text-slate-400 hover:text-amber-400 font-medium transition flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {language === 'mr' ? 'दुसरे दुकान निवडा' : language === 'hi' ? 'अन्य दुकान चुनें' : 'Switch Store'}
                  {allBusinesses.length > 1 ? ` (${allBusinesses.length})` : ''}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoggedOut(false);
                  setIsOnboardingOpen(true);
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold transition cursor-pointer"
              >
                + {language === 'mr' ? 'नवीन दुकान जोडा' : language === 'hi' ? 'नई दुकान जोड़ें' : 'Create New Business'}
              </button>
            </div>
          </div>
        </div>

        {/* Switch Store Modal if opened */}
        {showSwitchStoreModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>{language === 'mr' ? 'तुमची दुकाने' : language === 'hi' ? 'आपकी दुकानें' : 'Your Businesses'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowSwitchStoreModal(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {allBusinesses.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      handleSwitchBusiness(b.id);
                      setShowSwitchStoreModal(false);
                      setIsLoggedOut(false);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      b.id === store.business.id
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-white hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-sm">{b.name}</div>
                      <div className="text-xs text-slate-400 capitalize">{b.businessType.replace(/_/g, ' ')}</div>
                    </div>
                    {b.id === store.business.id && (
                      <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-medium">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowSwitchStoreModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Switch / Login Password Authentication Modal */}
        {pendingAuthRole && (
          <RoleAuthModal
            role={pendingAuthRole}
            storeName={store.business.name}
            language={language}
            onSubmit={handleAuthSubmit}
            onCancel={() => {
              setPendingAuthRole(null);
              setAuthPasswordError('');
            }}
            error={authPasswordError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Onboarding Setup Wizard */}
      <OnboardingModal
        isOpen={isOnboardingOpen || !store}
        onComplete={handleOnboardingComplete}
        language={language}
        onLanguageChange={setLanguage}
      />

      {store && (
        <>
          {/* Main Top Header */}
          <Header
            business={store.business}
            language={language}
            onLanguageChange={setLanguage}
            userRole={userRole}
            onRoleChange={requestRoleChange}
            lowStockCount={lowStockCount}
            onQuickBill={() => setActiveTab('billing')}
            onOpenLowStock={() => {
              setActiveTab('inventory');
            }}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onLogout={() => setIsLoggedOut(true)}
          />

          {/* Main App Container */}
          <div className="flex-1 flex flex-row">
            {/* Left Persistent & Responsive Sidebar */}
            <Sidebar
              activeTab={activeTab}
              onSelectTab={setActiveTab}
              language={language}
              userRole={userRole}
              isMobileOpen={isMobileMenuOpen}
              onCloseMobile={() => setIsMobileMenuOpen(false)}
              lowStockCount={lowStockCount}
              totalReceivables={totalReceivables}
              onLogout={() => setIsLoggedOut(true)}
              onRoleChange={requestRoleChange}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto min-w-0 pb-16 md:pb-6">
              {activeTab === 'dashboard' && (
                <DashboardView
                  business={store.business}
                  invoices={store.invoices}
                  products={store.products}
                  customers={store.customers}
                  suppliers={store.suppliers}
                  expenses={store.expenses}
                  language={language}
                  userRole={userRole}
                  onNavigateToTab={setActiveTab}
                  onQuickBill={() => setActiveTab('billing')}
                  onSelectInvoice={(inv) => setActiveModalInvoice(inv)}
                  onQuickAddProduct={() => setActiveTab('inventory')}
                  onQuickAddCustomer={() => setActiveTab('customers')}
                  onQuickAddExpense={() => setActiveTab('expenses')}
                  onAdjustStockItem={(p) => {
                    setTargetAdjustProduct(p);
                    setActiveTab('inventory');
                  }}
                />
              )}

              {activeTab === 'billing' && (
                <BillingView
                  business={store.business}
                  products={store.products}
                  categories={store.categories}
                  units={store.units}
                  customers={store.customers}
                  language={language}
                  onSaveInvoice={handleSaveInvoice}
                  onCancel={() => setActiveTab('dashboard')}
                  onQuickAddProduct={() => setActiveTab('inventory')}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesListView
                  invoices={store.invoices}
                  language={language}
                  onViewInvoice={(inv) => setActiveModalInvoice(inv)}
                  onNewInvoice={() => setActiveTab('billing')}
                  businessName={store.business.name}
                />
              )}

              {activeTab === 'inventory' && (
                <ProductsView
                  products={store.products}
                  categories={store.categories}
                  units={store.units}
                  stockAdjustments={store.stockAdjustments}
                  language={language}
                  onSaveProduct={handleSaveProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onAdjustStock={handleAdjustStock}
                  onSaveCategory={handleSaveCategory}
                  onSaveUnit={handleSaveUnit}
                  initialAdjustProduct={targetAdjustProduct}
                  onClearInitialAdjust={() => setTargetAdjustProduct(null)}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  customers={store.customers}
                  customerTransactions={store.customerTransactions}
                  language={language}
                  businessName={store.business.name}
                  upiId={store.business.upiId}
                  onSaveCustomer={handleSaveCustomer}
                  onRecordPayment={handleRecordPayment}
                />
              )}

              {activeTab === 'suppliers' && (
                <SuppliersView
                  suppliers={store.suppliers}
                  supplierTransactions={store.supplierTransactions}
                  purchaseInvoices={store.purchaseInvoices}
                  products={store.products}
                  language={language}
                  onSaveSupplier={handleSaveSupplier}
                  onRecordPurchase={handleRecordPurchase}
                  onRecordSupplierPayment={handleRecordSupplierPayment}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesView
                  expenses={store.expenses}
                  language={language}
                  onSaveExpense={handleSaveExpense}
                  onDeleteExpense={handleDeleteExpense}
                />
              )}

              {activeTab === 'reports' && userRole === 'owner' && (
                <ReportsView
                  invoices={store.invoices}
                  expenses={store.expenses}
                  products={store.products}
                  customers={store.customers}
                  suppliers={store.suppliers}
                  purchaseInvoices={store.purchaseInvoices}
                  language={language}
                />
              )}

              {activeTab === 'settings' && userRole === 'owner' && (
                <SettingsView
                  business={store.business}
                  storeData={store}
                  language={language}
                  userRole={userRole}
                  onSaveBusiness={handleSaveBusiness}
                  onRestoreStore={handleRestoreStore}
                  onSwitchBusiness={handleSwitchBusiness}
                  onCreateNewBusiness={handleCreateNewBusiness}
                  onDeleteStore={handleDeleteStore}
                />
              )}
            </main>
          </div>

          {/* Full Invoice Preview & Print Modal */}
          <InvoiceDetailModal
            isOpen={!!activeModalInvoice}
            invoice={activeModalInvoice}
            business={store.business}
            language={language}
            onClose={() => setActiveModalInvoice(null)}
            onCancelInvoice={handleCancelInvoice}
          />

          {/* Role Switch Password Authentication Modal */}
          {pendingAuthRole && (
            <RoleAuthModal
              role={pendingAuthRole}
              storeName={store.business.name}
              language={language}
              onSubmit={handleAuthSubmit}
              onCancel={() => {
                setPendingAuthRole(null);
                setAuthPasswordError('');
              }}
              error={authPasswordError}
            />
          )}
        </>
      )}
    </div>
  );
}
