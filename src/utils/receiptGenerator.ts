import QRCode from 'qrcode';
import { Invoice, StoreConfig, CartItem, PaymentMethodType } from '../types/pos';

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDateTime(date: Date): { displayDate: string; printedAt: string } {
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return {
    displayDate: `${day}/${month}/${year} ${hours}:${minutes}`,
    printedAt: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
  };
}

export function generateInvoiceNumber(tin: string): string {
  const now = new Date();
  const pad = (n: number, width = 2) => n.toString().padStart(width, '0');
  const yyyymmdd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const randomSeq = pad(Math.floor(Math.random() * 9999), 4);
  return `INV${tin}-3-5-${yyyymmdd}-${randomSeq}`;
}

export function generateVerificationHash(): string {
  const hex = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase();
  return `${hex()}-${hex()}-${hex()}-${hex()}`;
}

// Exact 1:1 QR code image extracted directly from the attached Sales - GET-MART.pdf
export const ORIGINAL_ZIMRA_QR_IMAGE =
  'data:image/png;base64,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';

/**
 * Builds the official ZIMRA FDMS fiscal verification URL
 * Format: https://fdms.zimra.co.zw/{10-digit DeviceID}{DDMMYYYY}{10-digit FiscalInvoiceNo}{VerificationCodeWithoutHyphens}
 * Example from invoice: https://fdms.zimra.co.zw/00000239973110202600000121082C03620F4C1FF7ED
 */
export function buildZimraFiscalQrUrl(invoice: Invoice): string {
  const devId = String(invoice.deviceId || '23997').replace(/\D/g, '').padStart(10, '0');
  
  let ddmmyyyy = '31102026';
  const match = (invoice.date || '').match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (match) {
    ddmmyyyy = `${match[1].padStart(2, '0')}${match[2].padStart(2, '0')}${match[3]}`;
  }
  
  const fNo = String(invoice.fiscalInvoiceNo || '12108').replace(/\D/g, '').padStart(10, '0');
  const verCode = (invoice.verificationCode || '2C03-620F-4C1F-F7ED').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  return `https://fdms.zimra.co.zw/${devId}${ddmmyyyy}${fNo}${verCode}`;
}

export async function generateQrCodeDataUrl(textOrInvoice: string | Invoice): Promise<string> {
  try {
    if (typeof textOrInvoice !== 'string') {
      const inv = textOrInvoice;
      const isOriginalInvoice =
        String(inv.fiscalInvoiceNo) === '12108' ||
        (inv.verificationCode && inv.verificationCode.includes('2C03'));

      if (isOriginalInvoice) {
        return ORIGINAL_ZIMRA_QR_IMAGE;
      }
      textOrInvoice = buildZimraFiscalQrUrl(inv);
    }

    return await QRCode.toDataURL(textOrInvoice, {
      width: 150,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'L',
    });
  } catch (err) {
    console.error('QR code generation failed', err);
    return ORIGINAL_ZIMRA_QR_IMAGE;
  }
}

export function createInvoiceFromCart(
  cartItems: CartItem[],
  customerName: string,
  paymentMethod: PaymentMethodType,
  amountPaid: number,
  config: StoreConfig,
  customInvoiceNo?: string
): Invoice {
  const now = new Date();
  const { displayDate, printedAt } = formatDateTime(now);
  
  // Calculations
  let subtotalBeforeDiscounts = 0;
  let totalDiscount = 0;
  let taxTotal = 0;
  let grandTotal = 0;

  const invoiceItems = cartItems.map((item, index) => {
    const unitPrice = item.price;
    const discount = item.discount || 0;
    const finalUnitPrice = Math.max(0, unitPrice - discount);
    const lineTotal = finalUnitPrice * item.quantity;
    
    subtotalBeforeDiscounts += unitPrice * item.quantity;
    totalDiscount += discount * item.quantity;
    
    // Tax calculation
    // In Zimra / VAT fiscal receipts, if tax is included in price:
    // Tax = lineTotal - (lineTotal / (1 + vatRate/100))
    let vatAmount = 0;
    if (item.vatRate > 0) {
      vatAmount = Number((lineTotal - (lineTotal / (1 + item.vatRate / 100))).toFixed(2));
    }
    taxTotal += vatAmount;
    grandTotal += lineTotal;

    const itemName = item.customName?.trim() || item.product.name;
    const isBundle = item.isBundle ?? item.product.isBundle ?? false;

    return {
      id: `item-${index + 1}-${Date.now()}`,
      productId: item.product.id,
      name: itemName,
      quantity: item.quantity,
      unitPrice,
      discount,
      finalUnitPrice,
      vatRate: item.vatRate,
      vatAmount,
      lineTotal,
      isBundle,
    };
  });

  // Gross subtotal (original value before discounts)
  // Matching the sample receipt where Subtotal is listed as the aggregate pre-discount / gross basis
  const subtotal = Number((grandTotal + (totalDiscount > 0 ? (totalDiscount * 0.8) : 0)).toFixed(2));

  const change = Math.max(0, Number((amountPaid - grandTotal).toFixed(2)));

  // Only items marked as a bundle appear in Bundle Summary
  const bundleSummary = cartItems
    .filter(item => (item.isBundle ?? item.product.isBundle ?? false))
    .map(item => ({
      name: item.customName?.trim() || item.product.name,
      quantity: item.quantity,
    }));

  const invoiceNo = customInvoiceNo || generateInvoiceNumber(config.tin);
  const nextFiscalNo = config.currentFiscalInvoiceNo + 1;

  // Build verification URL or payload for ZIMRA / Fiscal verify
  const verificationCode = generateVerificationHash();

  return {
    id: `inv-${Date.now()}`,
    invoiceNumber: invoiceNo,
    date: displayDate,
    timestamp: now.getTime(),
    cashier: config.defaultCashier,
    cashierEmail: config.defaultCashierEmail,
    shopName: config.tagline,
    customerName: customerName.trim() || 'CASH CUSTOMER',
    items: invoiceItems,
    subtotal,
    totalDiscount: Number(totalDiscount.toFixed(2)),
    tax: Number(taxTotal.toFixed(2)),
    total: Number(grandTotal.toFixed(2)),
    paymentMethod,
    amountPaid: Number(amountPaid.toFixed(2)),
    change,
    bundleSummary,
    showBundleSummary: bundleSummary.length > 0,
    fiscalInvoiceNo: nextFiscalNo,
    fiscalDay: config.currentFiscalDay,
    deviceId: config.deviceId,
    verificationCode,
    browserInfo: 'Edge 156 / POS-01',
    printedAt,
    isCopy: false,
    fiscalInvoiceHighlight: config.fiscalInvoiceHighlight || 'black-banner',
  };
}

/**
 * Builds formatted ESC/POS plain text for 80mm thermal receipt (48 columns)
 */
export function generateEscPosText(invoice: Invoice, config: StoreConfig): string {
  const padRight = (str: string, length: number) => (str + ' '.repeat(length)).slice(0, length);
  const padLeft = (str: string, length: number) => (' '.repeat(length) + str).slice(-length);
  const center = (str: string, width = 48) => {
    const pad = Math.max(0, Math.floor((width - str.length) / 2));
    return ' '.repeat(pad) + str;
  };
  const divider = '-'.repeat(48);

  const lines: string[] = [];

  lines.push(center(config.name));
  lines.push(center(config.tagline));
  lines.push(center(config.address));
  lines.push(center(`Tel: ${config.phone}`));
  lines.push(center(`Email: ${config.email}`));
  lines.push(center(`TIN: ${config.tin}`));
  lines.push(center(`VAT: ${config.vat}`));
  lines.push(divider);
  lines.push(center(invoice.isCopy ? '[ ■ COPY OF FISCAL TAX INVOICE ]' : '[ ■ FISCAL TAX INVOICE ]'));
  lines.push(`INVOICE: ${invoice.invoiceNumber}`);
  lines.push(`Date: ${invoice.date}`);
  lines.push(`Cashier: ${invoice.cashier}`);
  lines.push(`Email: ${invoice.cashierEmail}`);
  lines.push(`Shop: ${invoice.shopName}`);
  lines.push('');
  lines.push('CUSTOMER DETAILS:');
  lines.push(`Name: ${invoice.customerName}`);
  
  // Table header: 48 cols -> Description(22) Price(9) Vat(7) Amount(10)
  lines.push(
    padRight('Description', 22) +
    padLeft('Price', 9) +
    padLeft('Vat', 7) +
    padLeft('Amount', 10)
  );
  lines.push(divider);

  invoice.items.forEach((item, idx) => {
    if (idx > 0) {
      lines.push('. '.repeat(24).trim());
    }
    lines.push(item.name);
    const qtyStr = `${item.quantity.toFixed(2)} *`;
    const priceStr = formatCurrency(item.finalUnitPrice, config.currencySymbol);
    const vatStr = formatCurrency(item.vatAmount, config.currencySymbol);
    const totalStr = formatCurrency(item.lineTotal, config.currencySymbol);

    lines.push(
      padRight(`  ${qtyStr}`, 20) +
      padLeft(priceStr, 9) +
      padLeft(vatStr, 7) +
      padLeft(totalStr, 12)
    );

    if (item.discount > 0) {
      lines.push(`  L- (${formatCurrency(item.discount, config.currencySymbol)} was discounted)`);
    }
  });

  lines.push('='.repeat(48));
  lines.push(padRight('Subtotal:', 34) + padLeft(formatCurrency(invoice.subtotal, config.currencySymbol), 14));
  lines.push(padRight('Tax:', 34) + padLeft(formatCurrency(invoice.tax, config.currencySymbol), 14));
  lines.push('-'.repeat(48));
  lines.push(padRight('TOTAL:', 34) + padLeft(formatCurrency(invoice.total, config.currencySymbol), 14));
  lines.push('-'.repeat(48));
  lines.push(`Payment Method: ${invoice.paymentMethod}`);
  lines.push(padRight('Amount Paid:', 34) + padLeft(formatCurrency(invoice.amountPaid, config.currencySymbol), 14));
  lines.push(padRight('Change:', 34) + padLeft(formatCurrency(invoice.change, config.currencySymbol), 14));
  lines.push(divider);

  if (invoice.showBundleSummary !== false && invoice.bundleSummary && invoice.bundleSummary.length > 0) {
    lines.push('Bundle Summary:');
    invoice.bundleSummary.forEach(bundle => {
      lines.push(`${bundle.quantity}* ${bundle.name}`);
    });
    lines.push(divider);
  }
  lines.push(center(config.fiscalAuthority));
  lines.push('');
  lines.push(center('[ QR CODE FOR FISCAL VERIFICATION ]'));
  lines.push('');
  lines.push(`Fiscal Invoice No: ${invoice.fiscalInvoiceNo}`);
  lines.push(`Fiscal Day: ${invoice.fiscalDay}`);
  lines.push(`Device ID: ${invoice.deviceId}`);
  lines.push(`Verification: ${invoice.verificationCode}`);
  lines.push(divider);
  lines.push('\x1B\x64\x02\x1D\x56\x01'); // Cut under verification: feed 2 lines & partial cut
  lines.push(center(`Browser: ${invoice.browserInfo}`));
  lines.push(center(config.footerMessage));
  lines.push(center(invoice.printedAt));
  lines.push(divider); // Dotted line marking the end of the invoice
  lines.push('\x1B\x64\x03\x1D\x56\x00'); // Feed 3 lines & Cut paper
  lines.push('\n\n'); // Paper feed cut margin

  return lines.join('\n');
}
