export interface Product {
  id: string;
  name: string;
  category: string;
  barcode: string;
  price: number;
  costPrice?: number;
  stock: number;
  vatRate: number; // e.g. 0 for zero-rated, 15 for 15% VAT
  defaultDiscount?: number;
  unit?: string;
  imageUrl?: string;
  isBundle?: boolean; // True if this item is a bundle/bulk package
}

export interface CartItem {
  product: Product;
  quantity: number;
  price: number; // unit price charged
  discount: number; // discount per unit
  vatRate: number; // percentage e.g. 15
  vatAmount: number; // total vat for this line item
  lineTotal: number; // (price - discount) * quantity
  customName?: string; // customized product name
  isBundle?: boolean; // Whether marked as bundle in this cart transaction
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number; // base price before discount
  discount: number; // discount per unit
  finalUnitPrice: number; // unitPrice - discount
  vatRate: number; // % e.g. 15 or 0
  vatAmount: number; // calculated tax portion
  lineTotal: number; // finalUnitPrice * quantity
  isBundle?: boolean; // Marked as bundle on invoice
}

export type PaymentMethodType = 'Cash' | 'Card' | 'EcoCash' | 'Split';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV2001513400-3-5-20261029-0086"
  date: string; // formatted e.g. "29/10/2026 11:50"
  timestamp: number;
  cashier: string;
  cashierEmail: string;
  shopName: string;
  customerName: string;
  customerPhone?: string;
  customerTin?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethodType;
  amountPaid: number;
  change: number;
  bundleSummary: { name: string; quantity: number }[];
  showBundleSummary?: boolean; // Toggle whether Bundle Summary prints on receipt
  
  // Fiscal verification data
  fiscalInvoiceNo: number; // e.g. 11815
  fiscalDay: number; // e.g. 152
  deviceId: string; // e.g. "23997"
  verificationCode: string; // e.g. "F25D-CD08-20AC-85BD"
  browserInfo: string; // e.g. "Edge 156"
  printedAt: string; // e.g. "30/10/2026 08:00:29"
  isCopy?: boolean;
  fiscalInvoiceHighlight?: 'black-banner' | 'bordered' | 'yellow' | 'none';
}

export interface StoreConfig {
  name: string;
  tagline: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  tin: string;
  vat: string;
  fiscalAuthority: string;
  deviceId: string;
  currentFiscalDay: number;
  currentFiscalInvoiceNo: number;
  defaultCashier: string;
  defaultCashierEmail: string;
  currencySymbol: string;
  currencyCode: string; // USD, ZiG, etc.
  footerMessage: string;
  paperWidthMm: number; // 80 or 58
  showBarcode: boolean;
  showQrCode: boolean;
  taxIncludedInPrice: boolean;
  defaultVatRate: number;
  fiscalInvoiceHighlight?: 'black-banner' | 'bordered' | 'yellow' | 'none';
}

export type PrinterConnectionType = 'browser' | 'bluetooth' | 'usb' | 'network';
export type PrinterPaperSize = 80 | 58;

export interface POSPrinter {
  id: string;
  name: string;
  model: string;
  connectionType: PrinterConnectionType;
  paperWidthMm: PrinterPaperSize;
  isDefault: boolean;
  ipAddress?: string;
  port?: number;
  bluetoothDeviceId?: string;
  bluetoothDeviceName?: string;
  usbVendorId?: string;
  autoCut: boolean;
  openCashDrawer: boolean;
  printCopies: number;
  characterColumns: number; // 42 or 48 for 80mm, 32 for 58mm
  density: 'normal' | 'dark';
  status: 'online' | 'ready' | 'paired' | 'disconnected';
}
