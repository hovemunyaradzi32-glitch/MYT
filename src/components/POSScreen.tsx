import React, { useState, useRef } from 'react';
import {
  Search,
  Barcode,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Printer,
  History,
  Settings,
  Package,
  HelpCircle,
  Tag,
  Receipt,
  User,
  Sparkles,
  RefreshCw,
  Edit3,
  Check,
  X,
  PlusCircle,
  Hash,
  DollarSign,
  Camera,
  Image as ImageIcon,
  Boxes
} from 'lucide-react';
import { Product, CartItem, StoreConfig, Invoice, POSPrinter } from '../types/pos';
import { formatCurrency, createInvoiceFromCart } from '../utils/receiptGenerator';

interface POSScreenProps {
  products: Product[];
  config: StoreConfig;
  cart: CartItem[];
  invoiceNumber: string;
  setInvoiceNumber: (inv: string) => void;
  onRegenerateInvoiceNumber: () => void;
  onAddToCart: (product: Product) => void;
  onAddCustomItem: (customItem: {
    name: string;
    price: number;
    quantity: number;
    discount: number;
    vatRate: number;
    unit?: string;
    isBundle?: boolean;
  }) => void;
  onUpdateCartItemQty: (productId: string, delta: number) => void;
  onUpdateCartItemDiscount: (productId: string, discount: number) => void;
  onUpdateCartItemDetails: (
    productId: string,
    updates: { customName?: string; price?: number; vatRate?: number; discount?: number; quantity?: number; isBundle?: boolean }
  ) => void;
  onToggleCartItemBundle?: (productId: string) => void;
  onRemoveFromCart: (productId: string) => void;
  onClearCart: () => void;
  onLoadSampleCart: () => void;
  onLoadPhotoCart: () => void;
  onOpenPaymentModal: () => void;
  onOpenReceiptPreview: (invoice?: Invoice) => void;
  onOpenSalesHistory: () => void;
  onOpenProductsModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenPrinterGuide: () => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  sampleInvoice: Invoice;
  photoInvoice: Invoice;
  oct31Invoice?: Invoice;
  onLoadOct31Cart?: () => void;
  printers: POSPrinter[];
  activePrinter: POSPrinter;
  onOpenPrintersModal: () => void;
  onSelectActivePrinter: (printerId: string) => void;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  config,
  cart,
  invoiceNumber,
  setInvoiceNumber,
  onRegenerateInvoiceNumber,
  onAddToCart,
  onAddCustomItem,
  onUpdateCartItemQty,
  onUpdateCartItemDiscount,
  onUpdateCartItemDetails,
  onToggleCartItemBundle,
  onRemoveFromCart,
  onClearCart,
  onLoadSampleCart,
  onLoadPhotoCart,
  onLoadOct31Cart,
  onOpenPaymentModal,
  onOpenReceiptPreview,
  onOpenSalesHistory,
  onOpenProductsModal,
  onOpenSettingsModal,
  onOpenPrinterGuide,
  customerName,
  setCustomerName,
  sampleInvoice,
  photoInvoice,
  oct31Invoice,
  printers,
  activePrinter,
  onOpenPrintersModal,
  onSelectActivePrinter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeDiscountEditId, setActiveDiscountEditId] = useState<string | null>(null);
  const [isPhotoReferenceModalOpen, setIsPhotoReferenceModalOpen] = useState(false);
  
  // Custom Product Modal state
  const [isCustomProductModalOpen, setIsCustomProductModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('10.00');
  const [customQty, setCustomQty] = useState('1');
  const [customDiscount, setCustomDiscount] = useState('0.00');
  const [customVat, setCustomVat] = useState('15');
  const [customUnit, setCustomUnit] = useState('PCS');
  const [customIsBundle, setCustomIsBundle] = useState(false);

  // Item inline edit state
  const [editItemName, setEditItemName] = useState('');
  const [editItemPrice, setEditItemPrice] = useState(0);
  const [editItemVat, setEditItemVat] = useState(0);
  const [editItemDiscount, setEditItemDiscount] = useState(0);
  const [editItemIsBundle, setEditItemIsBundle] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Compute categories - Bundles placed prominently after All
  const rawCategories = Array.from(new Set(products.map((p) => p.category)));
  const otherCategories = rawCategories.filter((c) => c !== 'Bundles' && c !== 'All');
  const categories = ['All', 'Bundles', ...otherCategories];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode.includes(searchTerm);
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'Bundles'
        ? (p.isBundle || p.category === 'Bundles')
        : p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Totals calculations
  let grossSubtotal = 0;
  let totalDiscounts = 0;
  let totalVat = 0;
  let grandTotal = 0;

  cart.forEach((item) => {
    const itemTotal = Math.max(0, item.price - (item.discount || 0)) * item.quantity;
    grossSubtotal += item.price * item.quantity;
    totalDiscounts += (item.discount || 0) * item.quantity;
    if (item.vatRate > 0) {
      totalVat += itemTotal - itemTotal / (1 + item.vatRate / 100);
    }
    grandTotal += itemTotal;
  });

  // Handle barcode submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = products.find((p) => p.barcode === barcodeInput.trim());
    if (found) {
      onAddToCart(found);
      setBarcodeInput('');
    } else {
      alert(`Barcode ${barcodeInput} not found in catalog.`);
    }
  };

  // Handle Add Custom Item Submit
  const handleAddCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;
    const priceNum = parseFloat(customPrice) || 0;
    const qtyNum = parseFloat(customQty) || 1;
    const discNum = parseFloat(customDiscount) || 0;
    const vatNum = parseFloat(customVat) || 0;

    onAddCustomItem({
      name: customName.trim().toUpperCase(),
      price: priceNum,
      quantity: qtyNum,
      discount: discNum,
      vatRate: vatNum,
      unit: customUnit.trim().toUpperCase(),
      isBundle: customIsBundle,
    });

    // Reset modal
    setCustomName('');
    setCustomPrice('10.00');
    setCustomQty('1');
    setCustomDiscount('0.00');
    setCustomIsBundle(false);
    setIsCustomProductModalOpen(false);
  };

  // Start inline editing of a cart product
  const startEditingItem = (item: CartItem) => {
    setEditingItemId(item.product.id);
    setEditItemName(item.customName || item.product.name);
    setEditItemPrice(item.price);
    setEditItemVat(item.vatRate);
    setEditItemDiscount(item.discount || 0);
    setEditItemIsBundle(item.isBundle !== undefined ? item.isBundle : (item.product.isBundle ?? false));
  };

  const saveEditingItem = (productId: string) => {
    onUpdateCartItemDetails(productId, {
      customName: editItemName.trim().toUpperCase(),
      price: Math.max(0, editItemPrice),
      vatRate: editItemVat,
      discount: Math.max(0, editItemDiscount),
      isBundle: editItemIsBundle,
    });
    setEditingItemId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100 no-print">
      
      {/* Top POS Terminal Navigation Bar */}
      <header className="h-16 px-4 sm:px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        {/* Brand & Store Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-slate-950 flex items-center justify-center font-black text-lg shadow-md shadow-emerald-500/20">
            GM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base text-white tracking-wide uppercase">
                {config.name}
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                80mm Thermal Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-[280px] sm:max-w-md">
              {config.tagline} • Masvingo
            </p>
          </div>
        </div>

        {/* Quick Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Load 31/10/2026 Fiscal Invoice ($331 - TRINITY) */}
          {onLoadOct31Cart && (
            <button
              onClick={onLoadOct31Cart}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition cursor-pointer shadow-sm shadow-emerald-500/10"
              title="Load 31/10/2026 Fiscal Tax Invoice ($331.00 - TRINITY) with all 10 bundle items"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Oct 31 ($331)</span>
              <span className="sm:hidden">Oct 31</span>
            </button>
          )}

          {/* Load Printed Photo Receipt (from user's real receipt image) */}
          <button
            onClick={onLoadPhotoCart}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer"
            title="Load GOLD WHITE RICE + HULLETS from your printed receipt photo"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Photo ($41)</span>
            <span className="sm:hidden">Photo</span>
          </button>

          {/* View user's real printed receipt photo */}
          <button
            onClick={() => setIsPhotoReferenceModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Inspect uploaded photo of printed receipt"
          >
            <Camera className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Photo</span>
          </button>

          {/* Add Custom Product Button */}
          <button
            onClick={() => setIsCustomProductModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
            title="Create and add custom product to order"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Custom Product</span>
          </button>

          {/* Quick load PDF sample */}
          <button
            onClick={onLoadSampleCart}
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Load Ashna Rice + Green Power sample matching original PDF"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-400" />
            <span>PDF Sample</span>
          </button>

          <button
            onClick={() => onOpenReceiptPreview(oct31Invoice || photoInvoice || sampleInvoice)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="View 80mm Invoice Preview"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Preview 80mm</span>
          </button>

          <button
            onClick={onOpenSalesHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Sales and Invoice History"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Printers Hardware Manager */}
          <button
            onClick={onOpenPrintersModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
            title="Configure Thermal Receipt Printers"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">{activePrinter ? activePrinter.name.slice(0, 15) : 'Printers'}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Thermal Printer Ready"></span>
          </button>

          <button
            onClick={onOpenProductsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Manage Products and Catalog"
          >
            <Package className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden md:inline">Catalog</span>
          </button>

          <button
            onClick={onOpenSettingsModal}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Receipt & Fiscal Settings"
          >
            <Settings className="w-4 h-4 text-slate-300" />
          </button>

          <button
            onClick={onOpenPrinterGuide}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="80mm Thermal Printer Guide"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </header>

      {/* Main Workspace: Left Catalog, Right Cart */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Section: Catalog & Search */}
        <section className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Search, Barcode & Category Bar */}
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              
              {/* Text Search */}
              <div className="relative sm:col-span-7">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Barcode Scanner simulation input */}
              <form onSubmit={handleBarcodeSubmit} className="relative sm:col-span-5">
                <Barcode className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  placeholder="Scan or enter barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-14 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold cursor-pointer"
                >
                  ADD
                </button>
              </form>
            </div>

            {/* Category Pills & Custom Product Quick Action */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
              <div className="flex items-center gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setIsCustomProductModalOpen(true)}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Custom Product</span>
              </button>
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-950/60">
            {filteredProducts.map((p) => {
              const netPrice = p.price - (p.defaultDiscount || 0);
              const inCart = cart.find((c) => c.product.id === p.id);

              return (
                <div
                  key={p.id}
                  onClick={() => onAddToCart(p)}
                  className={`relative p-3.5 rounded-2xl border transition text-left flex flex-col justify-between cursor-pointer select-none group active:scale-[0.98] ${
                    inCart
                      ? 'bg-slate-900 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    {/* Category & Badge */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="uppercase tracking-wider">{p.category}</span>
                        {p.isBundle && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5">
                            <Boxes className="w-2.5 h-2.5" />
                            BUNDLE
                          </span>
                        )}
                      </div>
                      {p.vatRate === 0 ? (
                        <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          0% VAT
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          15% VAT
                        </span>
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase line-clamp-2 leading-snug group-hover:text-emerald-400 transition">
                      {p.name}
                    </h3>

                    {/* Barcode / Stock */}
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {p.barcode} • {p.stock} in stock
                    </div>
                  </div>

                  {/* Pricing and Cart Badge */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-end justify-between">
                    <div>
                      <div className="text-sm sm:text-base font-extrabold text-white font-mono leading-none">
                        {formatCurrency(netPrice, config.currencySymbol)}
                      </div>
                      {p.defaultDiscount && p.defaultDiscount > 0 ? (
                        <div className="text-[10px] text-amber-400 font-mono mt-0.5">
                          Was {formatCurrency(p.price, config.currencySymbol)} (-{formatCurrency(p.defaultDiscount, config.currencySymbol)})
                        </div>
                      ) : null}
                    </div>

                    {inCart ? (
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-xs shadow-sm">
                        {inCart.quantity}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950 transition flex items-center justify-center text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </section>

        {/* Right Section: Active Cart & 80mm Print Checkout */}
        <section className="w-full lg:w-[440px] xl:w-[480px] bg-slate-900 flex flex-col shrink-0 border-l border-slate-800 h-[55vh] lg:h-auto">
          
          {/* Cart Header, Customizable Invoice # & Customer Details */}
          <div className="p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Current Cart</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono font-medium">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomProductModalOpen(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
                  title="Add custom item not in catalog"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Item</span>
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition cursor-pointer"
                    title="Empty Cart"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* Feature 1: Customizable Invoice Number Input */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-400" />
                  <span>Invoice # (Customizable):</span>
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber('INV2001513400-3-5-20261031-0119')}
                    className="text-[10px] text-emerald-400 hover:underline font-mono"
                    title="Set to 31/10/2026 Fiscal Invoice #"
                  >
                    #0119
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber('INV2001513400-3-5-20261030-0059')}
                    className="text-[10px] text-amber-400 hover:underline font-mono"
                    title="Set to Photo receipt invoice #"
                  >
                    #0059
                  </button>
                  <button
                    type="button"
                    onClick={onRegenerateInvoiceNumber}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition"
                    title="Generate standard ZIMRA format"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto</span>
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500 uppercase tracking-tight"
                placeholder="INV2001513400-3-5-20261031-0119"
              />
            </div>

            {/* Customer Name Input */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Customer Name (e.g. TRINITY)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-transparent text-xs text-white placeholder-slate-400 uppercase font-medium focus:outline-hidden"
              />
              <div className="flex items-center gap-1 shrink-0">
                {customerName !== 'TRINITY' && (
                  <button
                    type="button"
                    onClick={() => setCustomerName('TRINITY')}
                    className="text-[10px] text-emerald-400 whitespace-nowrap hover:underline font-bold"
                  >
                    TRINITY
                  </button>
                )}
                {customerName !== 'CHIHADA' && (
                  <button
                    type="button"
                    onClick={() => setCustomerName('CHIHADA')}
                    className="text-[10px] text-amber-400 whitespace-nowrap hover:underline"
                  >
                    CHIHADA
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mb-3 text-slate-500">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-300">Cart is empty</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[260px]">
                  Select products from the left, add custom items, or load invoice presets.
                </p>
                <div className="flex flex-col gap-2 mt-4 w-full max-w-xs">
                  {onLoadOct31Cart && (
                    <button
                      onClick={onLoadOct31Cart}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Load Oct 31 Invoice ($331 - TRINITY)</span>
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={onLoadPhotoCart}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Photo ($41)</span>
                    </button>
                    <button
                      onClick={() => setIsCustomProductModalOpen(true)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3 text-emerald-400" />
                      <span>+ Custom</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              cart.map((item) => {
                const displayName = item.customName || item.product.name;
                const netUnit = Math.max(0, item.price - (item.discount || 0));
                const lineTotal = netUnit * item.quantity;
                const isEditingThisItem = editingItemId === item.product.id;
                const isEditingDiscount = activeDiscountEditId === item.product.id;

                return (
                  <div
                    key={item.product.id}
                    className={`p-3 bg-slate-950/60 border rounded-xl space-y-2 text-xs transition ${
                      isEditingThisItem ? 'border-emerald-500/50 bg-slate-950 ring-1 ring-emerald-500/20' : 'border-slate-800'
                    }`}
                  >
                    {/* Item Top: Name and Actions */}
                    {isEditingThisItem ? (
                      /* Feature 2: In-Cart Product Customization */
                      <div className="space-y-2 bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-emerald-400 uppercase">
                            Customize Product
                          </span>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-400 block mb-0.5">
                            Product Description (Printed on Receipt):
                          </label>
                          <input
                            type="text"
                            value={editItemName}
                            onChange={(e) => setEditItemName(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-bold uppercase focus:outline-hidden focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              Unit Price ({config.currencySymbol}):
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={editItemPrice}
                              onChange={(e) => setEditItemPrice(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] text-slate-400 block mb-0.5">
                              VAT Category:
                            </label>
                            <select
                              value={editItemVat}
                              onChange={(e) => setEditItemVat(parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                            >
                              <option value={0}>0% (Exempt)</option>
                              <option value={15}>15% (Standard)</option>
                            </select>
                          </div>
                        </div>

                        {/* Feature: Mark as bundle or not in cart edit */}
                        <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs text-slate-300 select-none">
                          <input
                            type="checkbox"
                            checked={editItemIsBundle}
                            onChange={(e) => setEditItemIsBundle(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-amber-300 flex items-center gap-1">
                            <Boxes className="w-3.5 h-3.5" />
                            <span>Mark as Bundle Package (Printed in Bundle Summary)</span>
                          </span>
                        </label>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-2.5 py-1 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEditingItem(item.product.id)}
                            className="px-3 py-1 rounded text-[11px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Apply</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-100 uppercase leading-snug">
                              {displayName}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditingItem(item)}
                              className="text-slate-400 hover:text-emerald-400 p-0.5 transition"
                              title="Customize Product Name or Price"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-2">
                            <span>Base: {formatCurrency(item.price, config.currencySymbol)}</span>
                            <span>•</span>
                            <span>VAT: {item.vatRate}%</span>
                            {item.customName && (
                              <span className="text-emerald-400 font-semibold">[Customized]</span>
                            )}
                            {/* Feature: Direct toggle bundle status in cart */}
                            <button
                              type="button"
                              onClick={() => onToggleCartItemBundle && onToggleCartItemBundle(item.product.id)}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 cursor-pointer ${
                                (item.isBundle !== undefined ? item.isBundle : (item.product.isBundle ?? false))
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                              }`}
                              title="Click to toggle bundle status on receipt"
                            >
                              <Boxes className="w-2.5 h-2.5" />
                              <span>{(item.isBundle !== undefined ? item.isBundle : (item.product.isBundle ?? false)) ? 'Bundle ✓' : 'Regular'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            className="text-slate-400 hover:text-slate-200 p-1 text-[11px] rounded hover:bg-slate-800"
                            title="Edit Product Details"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveFromCart(item.product.id)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quantity Stepper and Line Total */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Quantity Controls */}
                      <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg">
                        <button
                          type="button"
                          onClick={() => onUpdateCartItemQty(item.product.id, -1)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-l-lg transition cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateCartItemQty(item.product.id, 1)}
                          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-r-lg transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <div className="font-mono font-bold text-white text-sm">
                          {formatCurrency(lineTotal, config.currencySymbol)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.quantity} × {formatCurrency(netUnit, config.currencySymbol)}
                        </div>
                      </div>
                    </div>

                    {/* Feature 3: Customizable Amount Discounted */}
                    <div className="pt-1.5 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-amber-400" />
                          <span className="text-[11px] font-semibold text-slate-300">
                            Amount Discounted:
                          </span>
                        </div>

                        {/* Quick Discount Input */}
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-mono text-slate-400">
                            {config.currencySymbol}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={item.price}
                            value={item.discount || 0}
                            onChange={(e) =>
                              onUpdateCartItemDiscount(
                                item.product.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono font-bold text-right focus:outline-hidden focus:border-amber-400"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Quick Discount Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        {[0.5, 1.0, 2.0, 3.0, 3.5, 5.0].map((discVal) => (
                          <button
                            key={discVal}
                            type="button"
                            onClick={() => onUpdateCartItemDiscount(item.product.id, discVal)}
                            className={`px-1.5 py-0.5 rounded border font-mono transition cursor-pointer ${
                              item.discount === discVal
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            -{formatCurrency(discVal, config.currencySymbol)}
                          </button>
                        ))}
                        {item.discount > 0 && (
                          <button
                            type="button"
                            onClick={() => onUpdateCartItemDiscount(item.product.id, 0)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-rose-300 transition"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Display exact PDF format receipt annotation */}
                      {item.discount > 0 && (
                        <div className="text-[11px] text-amber-400 font-mono flex items-center gap-1 pt-0.5 font-medium">
                          <span>↳</span>
                          <span>
                            ({formatCurrency(item.discount * item.quantity, config.currencySymbol)} was discounted)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Summary & Checkout Action */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
            {/* Calculation Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Gross):</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(grossSubtotal, config.currencySymbol)}
                </span>
              </div>

              {totalDiscounts > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>Discounts Applied:</span>
                  <span className="font-mono">
                    -{formatCurrency(totalDiscounts, config.currencySymbol)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Tax (15% VAT):</span>
                <span className="font-mono text-slate-200">
                  {formatCurrency(totalVat, config.currencySymbol)}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-base font-bold text-white uppercase tracking-wide">
                  TOTAL:
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  {formatCurrency(grandTotal, config.currencySymbol)}
                </span>
              </div>
            </div>

            {/* Target Printer Selector Row */}
            <div className="flex items-center justify-between text-xs bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 text-[11px] shrink-0">Print to:</span>
                <select
                  value={activePrinter?.id}
                  onChange={(e) => onSelectActivePrinter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white font-semibold text-xs truncate w-full focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  {printers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.paperWidthMm}mm) {p.isDefault ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={onOpenPrintersModal}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold shrink-0 cursor-pointer hover:underline"
              >
                Printers
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                disabled={cart.length === 0}
                onClick={onOpenPaymentModal}
                className="w-full py-3.5 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>PAY &amp; PRINT ({activePrinter?.paperWidthMm || 80}MM)</span>
              </button>

              <button
                disabled={cart.length === 0}
                onClick={() => {
                  const simulatedInvoice = createInvoiceFromCart(
                    cart,
                    customerName,
                    'Cash',
                    grandTotal,
                    config,
                    invoiceNumber
                  );
                  onOpenReceiptPreview(simulatedInvoice);
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5 text-slate-400" />
                <span>Preview 80mm Slip Before Payment</span>
              </button>
            </div>
          </div>

        </section>

      </div>

      {/* Feature 2 Modal: Add Custom Product */}
      {isCustomProductModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Add Custom Product</h3>
              </div>
              <button
                onClick={() => setIsCustomProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Product Description / Name (as printed on receipt):
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. SPECIAL BULK MAIZE 50KG"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase font-bold focus:outline-hidden focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Unit Price ({config.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Quantity:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Amount Discounted for custom product */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Amount Discounted ({config.currencySymbol}):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={customDiscount}
                    onChange={(e) => setCustomDiscount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-400 font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                    placeholder="0.00"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ↳ ($X was discounted)
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    VAT Category:
                  </label>
                  <select
                    value={customVat}
                    onChange={(e) => setCustomVat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
                  >
                    <option value="0">0% (Zero-rated / Exempt)</option>
                    <option value="15">15% (Standard VAT)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">
                  Packaging Unit (Optional):
                </label>
                <input
                  type="text"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value)}
                  placeholder="e.g. BALE, PKT, KG, PCS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Feature: Mark as bundle or not */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1 select-none">
                <input
                  type="checkbox"
                  checked={customIsBundle}
                  onChange={(e) => setCustomIsBundle(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Mark as Bundle Package (Printed under Bundle Summary)</span>
                </span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomProductModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real Physical Receipt Photo Comparison Modal */}
      {isPhotoReferenceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh] animate-in fade-in duration-150">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <Camera className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-sm text-white">
                  Real 80mm Printed Receipt Photo Reference
                </h3>
              </div>
              <button
                onClick={() => setIsPhotoReferenceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex flex-col items-center justify-center bg-slate-950 gap-3">
              <p className="text-xs text-slate-400 text-center max-w-lg">
                This is your actual printed thermal slip. Notice the solid black <strong className="text-white">FISCAL TAX INVOICE</strong> banner, the monospace character grid, and the exact ZIMRA verification details.
              </p>

              <div className="relative border border-slate-800 rounded-xl overflow-hidden bg-black max-w-2xl shadow-xl flex items-center justify-center">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-10-30_at_11.09.08_AM_fc30b1e1.jpeg"
                  alt="Real Printed 80mm POS Receipt"
                  className="max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onLoadPhotoCart();
                    setIsPhotoReferenceModalOpen(false);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load This Exact Sale into Cart</span>
                </button>
                <button
                  onClick={() => {
                    onOpenReceiptPreview(photoInvoice);
                    setIsPhotoReferenceModalOpen(false);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open 80mm Preview &amp; Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
