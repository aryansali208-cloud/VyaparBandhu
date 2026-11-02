export type Language = 'en' | 'hi' | 'mr';

export type UserRole = 'owner' | 'cashier';

export type BusinessType = 
  | 'grocery_kirana'
  | 'wholesale_trader'
  | 'clothing_textile'
  | 'electronics_mobile'
  | 'hardware_sanitary'
  | 'furniture_timber'
  | 'spices_grain'
  | 'auto_parts'
  | 'general_store'
  | 'pharmacy'
  | 'food_restaurant'
  | 'services'
  | 'other';

export type GstStatus = 'registered' | 'composition' | 'unregistered';

export interface BusinessProfile {
  id: string;
  name: string;
  tagline?: string;
  businessType: BusinessType;
  customBusinessType?: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  stateCode: string; // e.g. "27" for Maharashtra, "24" for Gujarat, "07" for Delhi
  pincode: string;
  gstStatus: GstStatus;
  gstin?: string;
  pan?: string;
  upiId?: string; // for dynamic QR code (e.g. shop@okaxis)
  bankDetails?: {
    bankName: string;
    accountNo: string;
    ifsc: string;
    branch?: string;
    accountHolder?: string;
  };
  invoiceTerms?: string;
  invoicePrefix: string; // e.g. "INV-"
  nextInvoiceNumber: number;
  currency: string; // Default 'INR'
  currencySymbol: string; // Default '₹'
  defaultLanguage: Language;
  logoUrl?: string;
  bannerUrl?: string;
  securityEnabled?: boolean;
  ownerPin?: string;
  cashierPin?: string;
}

export interface UnitDefinition {
  id: string;
  code: string; // e.g. 'kg', 'pcs', 'box', 'm'
  name: string; // e.g. 'Kilogram', 'Piece'
  nameHi: string; // e.g. 'किलोग्राम'
  nameMr: string; // e.g. 'किलोग्रॅम'
  allowDecimals: boolean;
  isSystem?: boolean;
}

export interface Category {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  color?: string;
}

export type ItemType = 'goods' | 'service';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "500g", "1kg", "Red-XL"
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number;
  stock: number;
  barcode?: string;
}

export interface Product {
  id: string;
  name: string;
  nameHi?: string;
  nameMr?: string;
  itemType: ItemType; // 'goods' or 'service'
  categoryId: string;
  hsnCode?: string; // HSN for goods, SAC for services
  barcode?: string;
  unitCode: string; // references UnitDefinition.code
  purchasePrice: number; // cost price (buying rate)
  sellingPrice: number; // sales rate
  wholesalePrice?: number; // optional wholesale rate
  mrp?: number;
  gstRate: number; // 0, 5, 12, 18, 28
  taxIncluded: boolean; // whether sellingPrice includes GST
  currentStock: number;
  minStockAlert: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  warranty?: string; // e.g. "12 Months"
  serialOrBatch?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockAdjustmentType = 'damage' | 'expired' | 'theft' | 'audit_recount' | 'return' | 'manual';

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  adjustmentType: StockAdjustmentType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  reason: string;
  date: string;
  recordedBy: string;
}

export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'credit';

export type InvoicePaymentStatus = 'paid' | 'partial' | 'unpaid';

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  hsnCode?: string;
  unitCode: string;
  quantity: number;
  rate: number; // selling price per unit
  purchaseRate: number; // for profit calculation
  discountPercent?: number;
  discountAmount?: number;
  gstRate: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalAmount: number;
}

export interface InvoicePayment {
  id: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  referenceNo?: string; // UPI ref / Cheque no
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-1001"
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  customerGstin?: string;
  customerState?: string;
  items: InvoiceItem[];
  subtotal: number;
  discountFlat: number;
  discountPercent: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  totalPaid: number;
  balanceDue: number;
  paymentStatus: InvoicePaymentStatus;
  payments: InvoicePayment[];
  isInterState: boolean;
  isGstInvoice: boolean;
  notes?: string;
  status: 'active' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  creditLimit?: number;
  openingBalance: number; // positive = customer owes us (debit), negative = advance
  currentBalance: number; // live outstanding balance
  createdAt: string;
  notes?: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  type: 'sale' | 'payment_received' | 'opening_balance' | 'return';
  referenceNo?: string; // Invoice number or Payment ref
  invoiceId?: string;
  amount: number;
  debit: number; // increase outstanding (sale)
  credit: number; // decrease outstanding (payment received)
  runningBalance: number;
  paymentMode?: PaymentMode;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  openingBalance: number; // positive = we owe supplier (payable)
  currentBalance: number;
  createdAt: string;
  notes?: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  unitCode: string;
  quantity: number;
  rate: number;
  gstRate: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  id: string;
  billNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentMode: PaymentMode;
  notes?: string;
  createdAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  date: string;
  type: 'purchase' | 'payment_made' | 'opening_balance';
  referenceNo?: string;
  amount: number;
  debit: number; // payments we made
  credit: number; // purchases we owe
  runningBalance: number;
  paymentMode?: PaymentMode;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  paymentMode: PaymentMode;
  paidTo?: string;
  referenceNo?: string;
  notes?: string;
  recordedBy: string;
}
