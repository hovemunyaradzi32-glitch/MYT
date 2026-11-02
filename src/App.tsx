import React, { useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  StoreConfig,
  Invoice,
  PaymentMethodType,
  POSPrinter
} from './types/pos';
import {
  defaultStoreConfig,
  initialProducts,
  initialPrinters,
  sampleOctober31Invoice,
  samplePhotoInvoice,
  sampleInitialInvoice
} from './data/initialData';
import { POSScreen } from './components/POSScreen';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentModal } from './components/PaymentModal';
import { SalesHistoryModal } from './components/SalesHistoryModal';
import { ProductsModal } from './components/ProductsModal';
import { SettingsModal } from './components/SettingsModal';
import { PrinterGuideModal } from './components/PrinterGuideModal';
import { PrintersModal } from './components/PrintersModal';
import { Receipt80mm } from './components/Receipt80mm';
import { createInvoiceFromCart, generateInvoiceNumber } from './utils/receiptGenerator';
import { generateTestReceipt } from './utils/printerService';

export default function App() {
  // Persistence state
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pos_products_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 350) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return initialProducts;
  });

  const [printers, setPrinters] = useState<POSPrinter[]>(() => {
    const saved = localStorage.getItem('pos_printers');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialPrinters;
  });

  const [activePrinterId, setActivePrinterId] = useState<string>(() => {
    const def = initialPrinters.find((p) => p.isDefault);
    return def ? def.id : initialPrinters[0]?.id || 'printer-1';
  });

  const [config, setConfig] = useState<StoreConfig>(() => {
    const saved = localStorage.getItem('pos_store_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return defaultStoreConfig;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('pos_invoices');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [sampleOctober31Invoice, samplePhotoInvoice, sampleInitialInvoice];
  });

  // Current session states (default to latest 31/10/2026 Fiscal Invoice: TRINITY / INV2001513400-3-5-20261031-0119)
  const [customerName, setCustomerName] = useState<string>('TRINITY');
  const [invoiceNumber, setInvoiceNumber] = useState<string>('INV2001513400-3-5-20261031-0119');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals (defaults to 31/10/2026 Fiscal Tax Invoice, ignoring 'COPY OF' per user instructions)
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(sampleOctober31Invoice);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isSalesHistoryOpen, setIsSalesHistoryOpen] = useState(false);
  const [isProductsModalOpen, setIsProductsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPrinterGuideOpen, setIsPrinterGuideOpen] = useState(false);
  const [isPrintersModalOpen, setIsPrintersModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('pos_products_v3', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('pos_printers', JSON.stringify(printers));
  }, [printers]);

  useEffect(() => {
    localStorage.setItem('pos_store_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('pos_invoices', JSON.stringify(invoices));
  }, [invoices]);

  const activePrinter = printers.find((p) => p.id === activePrinterId) || printers[0];

  const handleRegenerateInvoiceNumber = () => {
    setInvoiceNumber(generateInvoiceNumber(config.tin));
  };

  // Printer Management Handlers
  const handleSavePrinter = (savedPrinter: POSPrinter) => {
    setPrinters((prev) => {
      const idx = prev.findIndex((p) => p.id === savedPrinter.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = savedPrinter;
        return updated;
      }
      return [...prev, savedPrinter];
    });
  };

  const handleDeletePrinter = (printerId: string) => {
    setPrinters((prev) => {
      const filtered = prev.filter((p) => p.id !== printerId);
      if (activePrinterId === printerId && filtered.length > 0) {
        setActivePrinterId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleSetDefaultPrinter = (printerId: string) => {
    setPrinters((prev) =>
      prev.map((p) => ({
        ...p,
        isDefault: p.id === printerId,
      }))
    );
    setActivePrinterId(printerId);
  };

  const handleTestPrint = (targetPrinter: POSPrinter) => {
    const testSlip = generateTestReceipt(targetPrinter, config);
    setActiveReceipt(testSlip);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                lineTotal:
                  Math.max(0, item.price - item.discount) * (item.quantity + 1),
              }
            : item
        );
      }

      const discount = product.defaultDiscount || 0;
      const unitPrice = product.price;
      const netPrice = Math.max(0, unitPrice - discount);
      const vatAmount =
        product.vatRate > 0
          ? Number((netPrice - netPrice / (1 + product.vatRate / 100)).toFixed(2))
          : 0;

      const newItem: CartItem = {
        product,
        quantity: 1,
        price: unitPrice,
        discount,
        vatRate: product.vatRate,
        vatAmount,
        lineTotal: netPrice,
        isBundle: product.isBundle ?? false,
      };

      return [...prev, newItem];
    });
  };

  // Add ad-hoc custom product to cart
  const handleAddCustomItem = (customItem: {
    name: string;
    price: number;
    quantity: number;
    discount: number;
    vatRate: number;
    unit?: string;
    isBundle?: boolean;
  }) => {
    const isBundleVal = customItem.isBundle ?? false;
    const dummyProduct: Product = {
      id: `custom-prod-${Date.now()}`,
      name: customItem.name,
      category: 'Custom',
      barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      price: customItem.price,
      stock: 999,
      vatRate: customItem.vatRate,
      defaultDiscount: customItem.discount,
      unit: customItem.unit || 'PCS',
      isBundle: isBundleVal,
    };

    const netPrice = Math.max(0, customItem.price - customItem.discount);
    const vatAmount =
      customItem.vatRate > 0
        ? Number((netPrice - netPrice / (1 + customItem.vatRate / 100)).toFixed(2))
        : 0;

    const newCartItem: CartItem = {
      product: dummyProduct,
      customName: customItem.name,
      quantity: customItem.quantity,
      price: customItem.price,
      discount: customItem.discount,
      vatRate: customItem.vatRate,
      vatAmount,
      lineTotal: netPrice * customItem.quantity,
      isBundle: isBundleVal,
    };

    setCart((prev) => [...prev, newCartItem]);
  };

  // Update in-cart product details (name, price, vat, discount, isBundle)
  const handleUpdateCartItemDetails = (
    productId: string,
    updates: {
      customName?: string;
      price?: number;
      vatRate?: number;
      discount?: number;
      quantity?: number;
      isBundle?: boolean;
    }
  ) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;

        const updatedName = updates.customName !== undefined ? updates.customName : item.customName;
        const updatedPrice = updates.price !== undefined ? updates.price : item.price;
        const updatedDiscount = updates.discount !== undefined ? updates.discount : item.discount;
        const updatedVat = updates.vatRate !== undefined ? updates.vatRate : item.vatRate;
        const updatedQty = updates.quantity !== undefined ? updates.quantity : item.quantity;
        const updatedIsBundle = updates.isBundle !== undefined ? updates.isBundle : item.isBundle;

        const netUnit = Math.max(0, updatedPrice - updatedDiscount);
        const vatAmount =
          updatedVat > 0
            ? Number((netUnit - netUnit / (1 + updatedVat / 100)).toFixed(2))
            : 0;

        return {
          ...item,
          customName: updatedName,
          price: updatedPrice,
          discount: updatedDiscount,
          vatRate: updatedVat,
          vatAmount,
          quantity: updatedQty,
          lineTotal: netUnit * updatedQty,
          isBundle: updatedIsBundle,
        };
      })
    );
  };

  const handleToggleCartItemBundle = (productId: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const currentVal = item.isBundle !== undefined ? item.isBundle : (item.product.isBundle ?? false);
        return {
          ...item,
          isBundle: !currentVal,
        };
      })
    );
  };

  const handleUpdateCartItemQty = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            lineTotal: Math.max(0, item.price - item.discount) * newQty,
          };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleUpdateCartItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id !== productId) return item;
        const validDiscount = Math.max(0, discount);
        const netPrice = Math.max(0, item.price - validDiscount);
        return {
          ...item,
          discount: validDiscount,
          lineTotal: netPrice * item.quantity,
        };
      })
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Pre-load the exact 10 items from the latest 31/10/2026 Fiscal Tax Invoice (TRINITY - $331.00)
  // All 10 items marked as bundles, exact prices, discounts, and VAT
  const handleLoadOct31Cart = () => {
    setCustomerName('TRINITY');
    setInvoiceNumber('INV2001513400-3-5-20261031-0119');

    const octCartItems: CartItem[] = sampleOctober31Invoice.items.map((item) => {
      const prod = products.find((p) => p.name === item.name) || {
        id: item.productId || `prod-oct31-${Math.random().toString(36).substring(2, 9)}`,
        name: item.name,
        category: 'Groceries',
        barcode: '6001001100',
        price: item.unitPrice,
        stock: 50,
        vatRate: item.vatRate,
        defaultDiscount: item.discount,
        unit: 'BALE',
        isBundle: true,
      };
      return {
        product: prod,
        customName: item.name,
        quantity: item.quantity,
        price: item.unitPrice,
        discount: item.discount,
        vatRate: item.vatRate,
        vatAmount: item.vatAmount,
        lineTotal: item.lineTotal,
        isBundle: true,
      };
    });

    setCart(octCartItems);
  };

  // Pre-load the exact items from the user's printed receipt photo:
  // GOLD WHITE RICE 10 X 2KG ($16.50, 15% VAT -> $2.21 tax)
  // HULLETS 10 X 2KG ($26.00 with $1.20 discount -> $24.80, 0% VAT)
  const handleLoadPhotoCart = () => {
    const prodRice = products.find((p) => p.name.includes('GOLD WHITE RICE')) || products[0];
    const prodHullets = products.find((p) => p.name.includes('HULLETS 10')) || products[1];

    setCustomerName('CHIHADA');
    setInvoiceNumber('INV2001513400-3-5-20261030-0059');
    setCart([
      {
        product: prodRice,
        quantity: 1,
        price: 16.50,
        discount: 0.00,
        vatRate: 15,
        vatAmount: 2.21,
        lineTotal: 16.50,
        isBundle: true,
      },
      {
        product: prodHullets,
        quantity: 1,
        price: 26.00,
        discount: 1.20,
        vatRate: 0,
        vatAmount: 0.00,
        lineTotal: 24.80,
        isBundle: true,
      },
    ]);
  };

  // Pre-load the exact items from the PDF:
  // ASHNA VALUE RICE 10X2KGS ($16.50 after $3.50 discount, 0% VAT)
  // GREEN POWER 10 X 1KG ($7.00 after $3.00 discount, 15% VAT)
  const handleLoadSampleCart = () => {
    const prodRice = products.find((p) => p.name.includes('ASHNA VALUE RICE')) || products[0];
    const prodGreen = products.find((p) => p.name.includes('GREEN POWER')) || products[1];

    setCustomerName('MUREGI');
    setInvoiceNumber('INV2001513400-3-5-20261029-0086');
    setCart([
      {
        product: prodRice,
        quantity: 1,
        price: 20.00,
        discount: 3.50,
        vatRate: 0,
        vatAmount: 0.00,
        lineTotal: 16.50,
        isBundle: true,
      },
      {
        product: prodGreen,
        quantity: 1,
        price: 10.00,
        discount: 3.00,
        vatRate: 15,
        vatAmount: 0.66,
        lineTotal: 7.00,
        isBundle: true,
      },
    ]);
  };

  // Checkout flow
  const handleConfirmPayment = (
    paymentMethod: PaymentMethodType,
    amountTendered: number,
    shouldPrintImmediately: boolean,
    customInvoiceNumber?: string
  ) => {
    if (cart.length === 0) return;

    const finalInvoiceNumber = customInvoiceNumber?.trim() || invoiceNumber?.trim() || generateInvoiceNumber(config.tin);

    const newInvoice = createInvoiceFromCart(
      cart,
      customerName,
      paymentMethod,
      amountTendered,
      config,
      finalInvoiceNumber
    );

    // Update invoices list
    setInvoices((prev) => [newInvoice, ...prev]);

    // Advance fiscal counters in config
    setConfig((prev) => ({
      ...prev,
      currentFiscalInvoiceNo: newInvoice.fiscalInvoiceNo,
    }));

    // Set as active receipt for printing
    setActiveReceipt(newInvoice);
    setIsPaymentModalOpen(false);
    setCart([]); // Reset cart for next customer
    setInvoiceNumber(generateInvoiceNumber(config.tin)); // Prep fresh invoice # for next customer

    if (shouldPrintImmediately) {
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      setIsReceiptModalOpen(true);
    }
  };

  // Reprint previous invoice
  const handleSelectInvoiceFromHistory = (invoice: Invoice, autoPrint = false) => {
    setActiveReceipt(invoice);
    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      setIsReceiptModalOpen(true);
    }
  };

  // Total amount in current cart
  const currentCartTotal = cart.reduce((sum, item) => {
    return sum + Math.max(0, item.price - (item.discount || 0)) * item.quantity;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      
      {/* Active Screen */}
      <POSScreen
        products={products}
        config={config}
        cart={cart}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        onRegenerateInvoiceNumber={handleRegenerateInvoiceNumber}
        onAddToCart={handleAddToCart}
        onAddCustomItem={handleAddCustomItem}
        onUpdateCartItemQty={handleUpdateCartItemQty}
        onUpdateCartItemDiscount={handleUpdateCartItemDiscount}
        onUpdateCartItemDetails={handleUpdateCartItemDetails}
        onToggleCartItemBundle={handleToggleCartItemBundle}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onLoadSampleCart={handleLoadSampleCart}
        onLoadPhotoCart={handleLoadPhotoCart}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onOpenReceiptPreview={(inv) => {
          setActiveReceipt(inv || sampleOctober31Invoice);
          setIsReceiptModalOpen(true);
        }}
        onOpenSalesHistory={() => setIsSalesHistoryOpen(true)}
        onOpenProductsModal={() => setIsProductsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenPrinterGuide={() => setIsPrinterGuideOpen(true)}
        customerName={customerName}
        setCustomerName={setCustomerName}
        oct31Invoice={sampleOctober31Invoice}
        photoInvoice={samplePhotoInvoice}
        sampleInvoice={sampleInitialInvoice}
        onLoadOct31Cart={handleLoadOct31Cart}
        printers={printers}
        activePrinter={activePrinter}
        onOpenPrintersModal={() => setIsPrintersModalOpen(true)}
        onSelectActivePrinter={(id) => setActivePrinterId(id)}
      />

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={currentCartTotal}
        config={config}
        customerName={customerName}
        invoiceNumber={invoiceNumber}
        setInvoiceNumber={setInvoiceNumber}
        onRegenerateInvoiceNumber={handleRegenerateInvoiceNumber}
        printers={printers}
        activePrinter={activePrinter}
        onSelectActivePrinter={(id) => setActivePrinterId(id)}
        onConfirmPayment={handleConfirmPayment}
      />

      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        invoice={activeReceipt}
        config={config}
        onUpdateInvoice={(upd) => setActiveReceipt(upd)}
        printers={printers}
        activePrinter={activePrinter}
        onSelectActivePrinter={(id) => setActivePrinterId(id)}
        onOpenPrintersModal={() => setIsPrintersModalOpen(true)}
      />

      <SalesHistoryModal
        isOpen={isSalesHistoryOpen}
        onClose={() => setIsSalesHistoryOpen(false)}
        invoices={invoices}
        config={config}
        onSelectInvoice={handleSelectInvoiceFromHistory}
      />

      <ProductsModal
        isOpen={isProductsModalOpen}
        onClose={() => setIsProductsModalOpen(false)}
        products={products}
        config={config}
        onSaveProduct={(p) => {
          setProducts((prev) => {
            const index = prev.findIndex((item) => item.id === p.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = p;
              return updated;
            }
            return [p, ...prev];
          });
        }}
        onDeleteProduct={(id) => {
          setProducts((prev) => prev.filter((p) => p.id !== id));
        }}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => setConfig(newConfig)}
      />

      <PrintersModal
        isOpen={isPrintersModalOpen}
        onClose={() => setIsPrintersModalOpen(false)}
        printers={printers}
        config={config}
        onSavePrinter={handleSavePrinter}
        onDeletePrinter={handleDeletePrinter}
        onSetDefaultPrinter={handleSetDefaultPrinter}
        onTestPrint={handleTestPrint}
      />

      <PrinterGuideModal
        isOpen={isPrinterGuideOpen}
        onClose={() => setIsPrinterGuideOpen(false)}
        onPrintTestPage={() => {
          handleTestPrint(activePrinter);
        }}
      />

      {/* Dedicated Print Container for 80mm POS Thermal Printers */}
      {/* On screen this is hidden; when window.print() is executed, index.css renders it at exact 78-80mm width */}
      {activeReceipt && (
        <div className="printable-area">
          <Receipt80mm
            invoice={activeReceipt}
            config={config}
            isPrintVersion={true}
            paperWidthMm={activePrinter?.paperWidthMm || 80}
            boldLevel="extra-bold"
            fiscalHighlightStyle={activeReceipt.fiscalInvoiceHighlight}
          />
        </div>
      )}

    </div>
  );
}
