import QRCode from 'qrcode';

export interface UpiPaymentDetails {
  vpa: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  invoiceNumber?: string;
}

export function buildUpiString(details: UpiPaymentDetails): string {
  const { vpa, payeeName, amount, transactionNote, invoiceNumber } = details;
  const cleanVpa = vpa.trim();
  const note = transactionNote || (invoiceNumber ? `Bill_${invoiceNumber}` : 'Payment');
  const encodedName = encodeURIComponent(payeeName.trim().substring(0, 30));
  const encodedNote = encodeURIComponent(note.substring(0, 40));

  // If amount is > 0, include am=
  const amountStr = amount > 0 ? `&am=${amount.toFixed(2)}` : '';
  return `upi://pay?pa=${cleanVpa}&pn=${encodedName}${amountStr}&tn=${encodedNote}&cu=INR`;
}

export async function generateUpiQrCodeDataUrl(details: UpiPaymentDetails): Promise<string> {
  try {
    const upiString = buildUpiString(details);
    const dataUrl = await QRCode.toDataURL(upiString, {
      width: 250,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate UPI QR code:', err);
    return '';
  }
}
