import React, { useState } from 'react';
import {
  Printer,
  Share2,
  X,
  FileText,
  Receipt,
  AlertOctagon,
  Building2,
  CheckCircle2,
  Phone,
  QrCode,
} from 'lucide-react';
import { BusinessProfile, Invoice, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency, formatWhatsAppInvoiceMessage } from '../utils/billingMath';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  business: BusinessProfile;
  language: Language;
  onClose: () => void;
  onCancelInvoice?: (invoiceId: string) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  isOpen,
  invoice,
  business,
  language,
  onClose,
  onCancelInvoice,
}) => {
  const [printFormat, setPrintFormat] = useState<'a4' | 'thermal'>('a4');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!isOpen || !invoice) return null;

  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const message = formatWhatsAppInvoiceMessage(
      business.name,
      invoice.invoiceNumber,
      invoice.date,
      invoice.customerName,
      invoice.items,
      invoice.grandTotal,
      invoice.totalPaid,
      invoice.balanceDue,
      business.upiId
    );

    let cleanPhone = invoice.customerPhone ? invoice.customerPhone.replace(/\D/g, '') : '';
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`
      : `https://api.whatsapp.com/send?text=${message}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-4">
        {/* Top Actions Bar (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-base">
              {invoice.invoiceNumber}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                invoice.status === 'cancelled'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : invoice.paymentStatus === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : invoice.paymentStatus === 'partial'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            >
              {invoice.status === 'cancelled' ? 'CANCELLED' : invoice.paymentStatus.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Format toggle: A4 vs Thermal */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => setPrintFormat('a4')}
                className={`px-2 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
                  printFormat === 'a4' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax Invoice</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintFormat('thermal')}
                className={`px-2 py-1 rounded text-xs font-bold transition flex items-center space-x-1 ${
                  printFormat === 'thermal' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>3&quot; Receipt</span>
              </button>
            </div>

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
              title="Share on WhatsApp"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1 shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              <span>{t('print')}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto print-area bg-white text-slate-900">
          {printFormat === 'a4' ? (
            /* ================= STANDARD A4 TAX INVOICE ================= */
            <div className="border border-slate-300 rounded-lg p-5 sm:p-6 text-xs text-slate-800">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                <div className="flex items-start space-x-3.5">
                  {business.logoUrl && (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="w-14 h-14 object-contain rounded-lg border border-slate-300 p-0.5 flex-shrink-0 bg-white"
                    />
                  )}
                  <div>
                    <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
                      {business.name}
                    </h1>
                    {business.tagline && <p className="text-xs text-slate-500">{business.tagline}</p>}
                    <p className="mt-1 text-slate-600">
                      {business.address}, {business.city}, {business.state} - {business.pincode}
                    </p>
                    <p className="text-slate-600">
                      Phone: <span className="font-semibold">{business.phone}</span>
                      {business.email ? ` | Email: ${business.email}` : ''}
                    </p>
                    {business.gstin && (
                      <p className="font-bold text-slate-900 mt-0.5">
                        GSTIN: <span className="font-mono">{business.gstin}</span> (State Code: {business.stateCode})
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs rounded uppercase mb-2">
                    {invoice.isGstInvoice ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
                  </div>
                  <p className="font-bold text-sm text-slate-900">
                    Invoice No: <span className="font-mono">{invoice.invoiceNumber}</span>
                  </p>
                  <p className="text-slate-600">
                    Date: <span className="font-semibold">{invoice.date}</span>
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="py-3 border-b border-slate-300 flex justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Billed To:
                  </span>
                  <p className="font-bold text-sm text-slate-950">{invoice.customerName}</p>
                  {invoice.customerPhone && <p className="text-slate-600">Mobile: {invoice.customerPhone}</p>}
                  {invoice.customerAddress && <p className="text-slate-600">{invoice.customerAddress}</p>}
                  {invoice.customerGstin && (
                    <p className="font-bold text-slate-800">GSTIN: {invoice.customerGstin}</p>
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Payment Status:
                  </span>
                  <p className="font-extrabold text-xs uppercase text-slate-900">
                    {invoice.paymentStatus}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Method: {invoice.payments[0]?.mode.toUpperCase() || 'CREDIT'}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-y border-slate-300 text-[11px] font-bold text-slate-700">
                      <th className="py-2 px-2 w-8">#</th>
                      <th className="py-2 px-2">Item Description</th>
                      {invoice.isGstInvoice && <th className="py-2 px-2 text-center">HSN</th>}
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 px-2 text-right">Rate</th>
                      {invoice.isGstInvoice && <th className="py-2 px-2 text-right">GST %</th>}
                      <th className="py-2 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id} className="text-xs">
                        <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                        <td className="py-2 px-2 font-medium text-slate-900">{item.productName}</td>
                        {invoice.isGstInvoice && (
                          <td className="py-2 px-2 text-center text-slate-500 font-mono text-[11px]">
                            {item.hsnCode || '-'}
                          </td>
                        )}
                        <td className="py-2 px-2 text-right font-semibold">
                          {item.quantity} {item.unitCode}
                        </td>
                        <td className="py-2 px-2 text-right">₹{item.rate.toFixed(2)}</td>
                        {invoice.isGstInvoice && (
                          <td className="py-2 px-2 text-right text-slate-600">{item.gstRate}%</td>
                        )}
                        <td className="py-2 px-2 text-right font-bold text-slate-950">
                          ₹{item.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Tax Breakdown */}
              <div className="border-t border-slate-300 pt-3 flex justify-between items-start">
                {/* Bank Details & UPI QR info */}
                <div className="w-7/12 pr-4 space-y-2 text-[11px] text-slate-600">
                  {business.bankDetails?.accountNo && (
                    <div className="p-2 bg-slate-50 rounded border border-slate-200">
                      <p className="font-bold text-slate-800">Bank Details for Payment:</p>
                      <p>Bank: {business.bankDetails.bankName}</p>
                      <p>A/C No: <span className="font-mono font-bold">{business.bankDetails.accountNo}</span></p>
                      <p>IFSC: <span className="font-mono font-bold">{business.bankDetails.ifsc}</span></p>
                    </div>
                  )}

                  {business.upiId && (
                    <p className="font-semibold text-slate-800">
                      UPI ID: <span className="font-mono text-amber-700 font-bold">{business.upiId}</span>
                    </p>
                  )}

                  {business.invoiceTerms && (
                    <div>
                      <p className="font-bold text-slate-700">Terms &amp; Conditions:</p>
                      <p className="whitespace-pre-line text-[10px] text-slate-500">{business.invoiceTerms}</p>
                    </div>
                  )}
                </div>

                {/* Calculation column */}
                <div className="w-5/12 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-medium">₹{invoice.subtotal.toFixed(2)}</span>
                  </div>

                  {invoice.discountFlat > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Discount:</span>
                      <span>- ₹{invoice.discountFlat.toFixed(2)}</span>
                    </div>
                  )}

                  {invoice.isGstInvoice && invoice.taxTotal > 0 && (
                    <>
                      {invoice.isInterState ? (
                        <div className="flex justify-between text-slate-600">
                          <span>IGST:</span>
                          <span>₹{invoice.igstTotal.toFixed(2)}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-slate-600">
                            <span>CGST:</span>
                            <span>₹{invoice.cgstTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>SGST:</span>
                            <span>₹{invoice.sgstTotal.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {invoice.roundOff !== 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Round Off:</span>
                      <span>{invoice.roundOff > 0 ? `+₹${invoice.roundOff}` : `-₹${Math.abs(invoice.roundOff)}`}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-y border-slate-900 font-black text-sm text-slate-950">
                    <span>Grand Total:</span>
                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Amount Paid:</span>
                    <span>₹{invoice.totalPaid.toFixed(2)}</span>
                  </div>

                  {invoice.balanceDue > 0 && (
                    <div className="flex justify-between text-red-600 font-extrabold text-xs">
                      <span>Balance Due (उधार):</span>
                      <span>₹{invoice.balanceDue.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatory Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end">
                <div className="text-[10px] text-slate-400">
                  Thank you for your business! Computer Generated Invoice.
                </div>
                <div className="text-center">
                  <div className="h-10"></div>
                  <p className="border-t border-slate-400 px-6 pt-1 font-bold text-xs text-slate-900">
                    For {business.name}
                  </p>
                  <p className="text-[10px] text-slate-500">Authorized Signatory</p>
                </div>
              </div>
            </div>
          ) : (
            /* ================= 3-INCH THERMAL POS RECEIPT ================= */
            <div className="max-w-[320px] mx-auto border border-dashed border-slate-400 p-4 font-mono text-[11px] leading-tight text-slate-900 thermal-mode">
              <div className="text-center pb-2 border-b border-dashed border-slate-400 space-y-1">
                {business.logoUrl && (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="w-12 h-12 object-contain mx-auto mb-1 rounded"
                  />
                )}
                <p className="font-extrabold text-sm">{business.name}</p>
                <p>{business.address}, {business.city}</p>
                <p>Phone: {business.phone}</p>
                {business.gstin && <p className="font-bold">GSTIN: {business.gstin}</p>}
                <p className="text-[10px] uppercase font-bold pt-1">
                  {invoice.isGstInvoice ? '*** TAX INVOICE ***' : '*** RETAIL BILL ***'}
                </p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5">
                <div className="flex justify-between">
                  <span>Bill No: {invoice.invoiceNumber}</span>
                  <span>{invoice.date}</span>
                </div>
                <div>Customer: {invoice.customerName}</div>
                {invoice.customerPhone && <div>Phone: {invoice.customerPhone}</div>}
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1 mb-1">
                  <span>ITEM</span>
                  <span>QTY x RATE</span>
                  <span>AMT</span>
                </div>
                {invoice.items.map((it) => (
                  <div key={it.id} className="flex justify-between py-0.5">
                    <span className="truncate max-w-[120px]">{it.productName}</span>
                    <span>{it.quantity}x{it.rate}</span>
                    <span className="font-bold">₹{it.totalAmount.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="py-2 space-y-1 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>SUBTOTAL:</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountFlat > 0 && (
                  <div className="flex justify-between">
                    <span>DISCOUNT:</span>
                    <span>-₹{invoice.discountFlat.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxTotal > 0 && (
                  <div className="flex justify-between">
                    <span>GST TOTAL:</span>
                    <span>₹{invoice.taxTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-900">
                  <span>TOTAL:</span>
                  <span>₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>PAID:</span>
                  <span>₹{invoice.totalPaid.toFixed(2)}</span>
                </div>
                {invoice.balanceDue > 0 && (
                  <div className="flex justify-between font-extrabold text-red-600">
                    <span>BALANCE DUE:</span>
                    <span>₹{invoice.balanceDue.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 text-[10px] space-y-1">
                {business.upiId && <p>Pay via UPI: {business.upiId}</p>}
                <p>THANK YOU! VISIT AGAIN!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer info & Cancel bill action (Hidden in Print) */}
        <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <div>
            {onCancelInvoice && invoice.status !== 'cancelled' && (
              <>
                {!showCancelConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowCancelConfirm(true)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
                  >
                    <AlertOctagon className="w-3.5 h-3.5" />
                    <span>Cancel / Void Bill</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-red-700 font-semibold">Restore stock &amp; cancel?</span>
                    <button
                      type="button"
                      onClick={() => onCancelInvoice(invoice.id)}
                      className="px-2 py-1 bg-red-600 text-white font-bold text-xs rounded hover:bg-red-700"
                    >
                      Yes, Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCancelConfirm(false)}
                      className="px-2 py-1 bg-slate-200 text-slate-700 font-bold text-xs rounded"
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};
