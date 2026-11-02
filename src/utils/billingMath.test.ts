import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateItemTaxes,
  calculateInvoiceTotals,
  calculatePaymentStatus,
  formatCurrency,
  calculateInvoiceProfit,
} from './billingMath';
import { InvoiceItem } from '../types';

test('calculateItemTaxes: intra-state 18% GST calculation (exclusive)', () => {
  const result = calculateItemTaxes({
    rate: 100,
    quantity: 2,
    discountPercent: 10, // 200 - 10% = 180 taxable
    gstRate: 18,
    taxIncluded: false,
    isInterState: false,
  });

  assert.equal(result.baseAmount, 200);
  assert.equal(result.discountValue, 20);
  assert.equal(result.taxableAmount, 180);
  assert.equal(result.taxAmount, 32.4);
  assert.equal(result.cgstAmount, 16.2);
  assert.equal(result.sgstAmount, 16.2);
  assert.equal(result.igstAmount, 0);
  assert.equal(result.totalAmount, 212.4);
});

test('calculateItemTaxes: inter-state 18% GST calculation', () => {
  const result = calculateItemTaxes({
    rate: 500,
    quantity: 1,
    gstRate: 18,
    isInterState: true,
  });

  assert.equal(result.taxableAmount, 500);
  assert.equal(result.taxAmount, 90);
  assert.equal(result.cgstAmount, 0);
  assert.equal(result.sgstAmount, 0);
  assert.equal(result.igstAmount, 90);
  assert.equal(result.totalAmount, 590);
});

test('calculateItemTaxes: tax-included price reversal calculation', () => {
  // Selling price is ₹118 which includes 18% GST -> taxable should be ₹100, tax ₹18
  const result = calculateItemTaxes({
    rate: 118,
    quantity: 1,
    gstRate: 18,
    taxIncluded: true,
  });

  assert.equal(result.taxableAmount, 100);
  assert.equal(result.taxAmount, 18);
  assert.equal(result.cgstAmount, 9);
  assert.equal(result.sgstAmount, 9);
  assert.equal(result.totalAmount, 118);
});

test('calculateInvoiceTotals: aggregates subtotal, discounts, and roundoff correctly', () => {
  const mockItems: InvoiceItem[] = [
    {
      id: 'item-1',
      productId: 'p1',
      productName: 'Sample Item 1',
      unitCode: 'pcs',
      quantity: 2,
      rate: 100,
      purchaseRate: 70,
      gstRate: 18,
      taxableAmount: 200,
      cgstAmount: 18,
      sgstAmount: 18,
      igstAmount: 0,
      totalAmount: 236,
    },
    {
      id: 'item-2',
      productId: 'p2',
      productName: 'Sample Item 2',
      unitCode: 'kg',
      quantity: 1.5,
      rate: 80,
      purchaseRate: 50,
      gstRate: 5,
      taxableAmount: 120,
      cgstAmount: 3,
      sgstAmount: 3,
      igstAmount: 0,
      totalAmount: 126,
    },
  ];

  const totals = calculateInvoiceTotals({
    items: mockItems,
    discountFlat: 10,
    isInterState: false,
    isGstInvoice: true,
  });

  assert.equal(totals.subtotal, 362); // 236 + 126
  assert.equal(totals.totalDiscount, 10);
  assert.equal(totals.grandTotal, 352); // 362 - 10 = 352
  assert.equal(totals.cgstTotal, 21); // 18 + 3
  assert.equal(totals.sgstTotal, 21); // 18 + 3
  assert.equal(totals.taxTotal, 42);
});

test('calculatePaymentStatus: handles full, partial, and unpaid balances', () => {
  const unpaid = calculatePaymentStatus(1000, []);
  assert.equal(unpaid.balanceDue, 1000);
  assert.equal(unpaid.paymentStatus, 'unpaid');

  const partial = calculatePaymentStatus(1000, [
    { id: '1', amount: 400, mode: 'cash', date: '2026-11-02' },
  ]);
  assert.equal(partial.balanceDue, 600);
  assert.equal(partial.paymentStatus, 'partial');

  const paid = calculatePaymentStatus(1000, [
    { id: '1', amount: 400, mode: 'cash', date: '2026-11-02' },
    { id: '2', amount: 600, mode: 'upi', date: '2026-11-02' },
  ]);
  assert.equal(paid.balanceDue, 0);
  assert.equal(paid.paymentStatus, 'paid');
});

test('formatCurrency: formats Indian numbering system with Lakhs and Crores', () => {
  assert.equal(formatCurrency(500), '₹ 500.00');
  assert.equal(formatCurrency(12500), '₹ 12,500.00');
  assert.equal(formatCurrency(150000), '₹ 1,50,000.00');
  assert.equal(formatCurrency(25000000), '₹ 2,50,00,000.00');
  assert.equal(formatCurrency(0), '₹ 0.00');
});

test('calculateInvoiceProfit: calculates net profit excluding taxes', () => {
  const mockItems: InvoiceItem[] = [
    {
      id: 'item-1',
      productId: 'p1',
      productName: 'Item 1',
      unitCode: 'pcs',
      quantity: 5,
      rate: 100,
      purchaseRate: 60, // cost = 300, taxable revenue = 500 -> profit = 200
      gstRate: 0,
      taxableAmount: 500,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalAmount: 500,
    },
  ];

  const profit = calculateInvoiceProfit(mockItems);
  assert.equal(profit, 200);
});
