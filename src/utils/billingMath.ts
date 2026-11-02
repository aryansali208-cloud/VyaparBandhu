import { InvoiceItem, InvoicePayment, InvoicePaymentStatus } from '../types';

export interface ItemTaxCalculationInput {
  rate: number;
  quantity: number;
  discountPercent?: number;
  discountAmount?: number;
  gstRate: number; // e.g. 5, 12, 18
  taxIncluded?: boolean;
  isInterState?: boolean;
}

export interface ItemTaxCalculationResult {
  baseAmount: number;
  discountValue: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  totalAmount: number;
}

/**
 * Calculates item level discount, taxable amount, and GST (CGST/SGST or IGST).
 * Safely handles both tax-included and tax-excluded pricing.
 */
export function calculateItemTaxes(input: ItemTaxCalculationInput): ItemTaxCalculationResult {
  const {
    rate,
    quantity,
    discountPercent = 0,
    discountAmount = 0,
    gstRate = 0,
    taxIncluded = false,
    isInterState = false,
  } = input;

  const validQty = Math.max(0, quantity);
  const validRate = Math.max(0, rate);
  const rawTotal = validQty * validRate;

  // Determine discount
  let discountValue = 0;
  if (discountPercent > 0) {
    discountValue = (rawTotal * discountPercent) / 100;
  } else if (discountAmount > 0) {
    discountValue = Math.min(rawTotal, discountAmount);
  }
  discountValue = Math.round(discountValue * 100) / 100;

  const netAmountAfterDiscount = Math.max(0, rawTotal - discountValue);

  let taxableAmount = 0;
  let taxAmount = 0;

  if (gstRate > 0) {
    if (taxIncluded) {
      // Reverse tax calculation: taxable = net / (1 + gstRate/100)
      taxableAmount = Math.round((netAmountAfterDiscount / (1 + gstRate / 100)) * 100) / 100;
      taxAmount = Math.round((netAmountAfterDiscount - taxableAmount) * 100) / 100;
    } else {
      taxableAmount = Math.round(netAmountAfterDiscount * 100) / 100;
      taxAmount = Math.round(((taxableAmount * gstRate) / 100) * 100) / 100;
    }
  } else {
    taxableAmount = Math.round(netAmountAfterDiscount * 100) / 100;
    taxAmount = 0;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (taxAmount > 0) {
    if (isInterState) {
      igstAmount = taxAmount;
    } else {
      cgstAmount = Math.round((taxAmount / 2) * 100) / 100;
      sgstAmount = Math.round((taxAmount - cgstAmount) * 100) / 100;
    }
  }

  const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

  return {
    baseAmount: Math.round(rawTotal * 100) / 100,
    discountValue,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    taxAmount,
    totalAmount,
  };
}

export interface InvoiceTotalsCalculationInput {
  items: InvoiceItem[];
  discountFlat?: number;
  discountPercent?: number;
  isInterState?: boolean;
  isGstInvoice?: boolean;
}

export interface InvoiceTotalsCalculationResult {
  subtotal: number;
  discountFlat: number;
  discountPercent: number;
  totalDiscount: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
}

/**
 * Aggregates all items in an invoice, applies any overall discount,
 * calculates final GST breakdowns, and computes roundoff.
 */
export function calculateInvoiceTotals(
  input: InvoiceTotalsCalculationInput
): InvoiceTotalsCalculationResult {
  const {
    items,
    discountFlat = 0,
    discountPercent = 0,
    isInterState = false,
    isGstInvoice = true,
  } = input;

  let subtotal = 0;
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  for (const item of items) {
    subtotal += item.totalAmount;
    if (isGstInvoice) {
      taxableTotal += item.taxableAmount;
      if (isInterState) {
        igstTotal += item.igstAmount || item.cgstAmount + item.sgstAmount;
      } else {
        cgstTotal += item.cgstAmount;
        sgstTotal += item.sgstAmount;
      }
    } else {
      taxableTotal += item.totalAmount;
    }
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // Apply bill-level discount
  let overallDiscount = 0;
  if (discountPercent > 0) {
    overallDiscount = (subtotal * discountPercent) / 100;
  } else if (discountFlat > 0) {
    overallDiscount = Math.min(subtotal, discountFlat);
  }
  overallDiscount = Math.round(overallDiscount * 100) / 100;

  const amountBeforeRound = Math.max(0, subtotal - overallDiscount);
  const roundedGrandTotal = Math.round(amountBeforeRound);
  const roundOff = Math.round((roundedGrandTotal - amountBeforeRound) * 100) / 100;

  const taxTotal = isGstInvoice ? Math.round((cgstTotal + sgstTotal + igstTotal) * 100) / 100 : 0;

  return {
    subtotal,
    discountFlat,
    discountPercent,
    totalDiscount: overallDiscount,
    taxableTotal: Math.round(taxableTotal * 100) / 100,
    cgstTotal: isGstInvoice ? Math.round(cgstTotal * 100) / 100 : 0,
    sgstTotal: isGstInvoice ? Math.round(sgstTotal * 100) / 100 : 0,
    igstTotal: isGstInvoice ? Math.round(igstTotal * 100) / 100 : 0,
    taxTotal,
    roundOff,
    grandTotal: roundedGrandTotal,
  };
}

/**
 * Calculates payment status and balance due
 */
export function calculatePaymentStatus(
  grandTotal: number,
  payments: InvoicePayment[]
): {
  totalPaid: number;
  balanceDue: number;
  paymentStatus: InvoicePaymentStatus;
} {
  const totalPaid = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const roundedPaid = Math.round(totalPaid * 100) / 100;
  const balanceDue = Math.max(0, Math.round((grandTotal - roundedPaid) * 100) / 100);

  let paymentStatus: InvoicePaymentStatus = 'unpaid';
  if (balanceDue === 0 && grandTotal > 0) {
    paymentStatus = 'paid';
  } else if (roundedPaid > 0 && balanceDue > 0) {
    paymentStatus = 'partial';
  } else if (grandTotal === 0) {
    paymentStatus = 'paid';
  }

  return {
    totalPaid: roundedPaid,
    balanceDue,
    paymentStatus,
  };
}

/**
 * Formats a number in standard Indian Numbering system (Lakhs, Crores) with ₹ symbol.
 * Example: 125000 -> ₹ 1,25,000.00
 */
export function formatCurrency(amount: number, showDecimals: boolean = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹ 0';
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(showDecimals ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian numbering regex: last 3 digits, then groups of 2 digits
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const result = showDecimals && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
  return `${isNegative ? '- ' : ''}₹ ${result}`;
}

/**
 * Calculates profit from invoice items
 */
export function calculateInvoiceProfit(items: InvoiceItem[]): number {
  let profit = 0;
  for (const item of items) {
    const itemCost = (item.purchaseRate || 0) * item.quantity;
    const itemRevenue = item.taxableAmount; // Net revenue excluding tax
    profit += (itemRevenue - itemCost);
  }
  return Math.round(profit * 100) / 100;
}

/**
 * Formats WhatsApp bill message
 */
export function formatWhatsAppInvoiceMessage(
  businessName: string,
  invoiceNumber: string,
  date: string,
  customerName: string,
  items: InvoiceItem[],
  grandTotal: number,
  totalPaid: number,
  balanceDue: number,
  upiId?: string
): string {
  const lines: string[] = [
    `🧾 *INVOICE: ${invoiceNumber}*`,
    `🏪 *${businessName}*`,
    `📅 Date: ${date}`,
    `👤 Customer: ${customerName}`,
    `--------------------------------`,
    `*ITEMS:*`,
  ];

  items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. ${item.productName} (${item.quantity} ${item.unitCode}) @ ₹${item.rate} = ₹${item.totalAmount}`
    );
  });

  lines.push(`--------------------------------`);
  lines.push(`💰 *Grand Total: ₹ ${grandTotal.toLocaleString('en-IN')}*`);
  lines.push(`✅ Paid: ₹ ${totalPaid.toLocaleString('en-IN')}`);

  if (balanceDue > 0) {
    lines.push(`⚠️ *Balance Due (उधार): ₹ ${balanceDue.toLocaleString('en-IN')}*`);
  } else {
    lines.push(`🎉 Status: Fully Paid`);
  }

  if (upiId && balanceDue > 0) {
    lines.push(`\n📲 Pay via UPI: ${upiId}`);
  }

  lines.push(`\n🙏 *Thank you for your business!*`);

  return encodeURIComponent(lines.join('\n'));
}

/**
 * Formats WhatsApp Payment Receipt message
 */
export function formatWhatsAppPaymentReceipt(
  businessName: string,
  customerName: string,
  amount: number,
  paymentMode: string,
  remainingBalance: number,
  date: string
): string {
  const lines = [
    `💵 *PAYMENT RECEIVED RECEIPT*`,
    `🏪 *${businessName}*`,
    `📅 Date: ${date}`,
    `👤 Customer: ${customerName}`,
    `--------------------------------`,
    `✅ Amount Received: *₹ ${amount.toLocaleString('en-IN')}*`,
    `💳 Payment Mode: ${paymentMode.toUpperCase()}`,
    `--------------------------------`,
    remainingBalance > 0
      ? `⚠️ Remaining Outstanding Balance (बाकी): *₹ ${remainingBalance.toLocaleString('en-IN')}*`
      : `🎉 Remaining Balance: *₹ 0 (All Cleared)*`,
    `\n🙏 *Thank you! Your payment has been credited.*`,
  ];
  return encodeURIComponent(lines.join('\n'));
}
