import React, { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Download,
  HelpCircle,
  Eye,
  RefreshCw,
  Edit3,
  Hash,
  Tag,
  DollarSign,
  Boxes,
  Calendar,
  Clock
} from 'lucide-react';
import { Invoice, StoreConfig, POSPrinter } from '../types/pos';
import { Receipt80mm } from './Receipt80mm';
import { generateEscPosText, generateInvoiceNumber } from '../utils/receiptGenerator';

interface ReceiptModalProps {
  invoice: Invoice | null;
  config: StoreConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateInvoice?: (updatedInvoice: Invoice) => void;
  printers?: POSPrinter[];
  activePrinter?: POSPrinter;
  onSelectActivePrinter?: (printerId: string) => void;
  onOpenPrintersModal?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  invoice,
  config,
  isOpen,
  onClose,
  onUpdateInvoice,
  printers,
  activePrinter,
  onSelectActivePrinter,
  onOpenPrintersModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showPrinterTips, setShowPrinterTips] = useState<boolean>(false);
  const [boldLevel, setBoldLevel] = useState<'bold' | 'extra-bold'>('extra-bold');
  
  // Local editable invoice state so user can customize invoice #, discounts, and customer in preview
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(invoice);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  useEffect(() => {
    setCurrentInvoice(invoice);
  }, [invoice]);

  if (!isOpen || !currentInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = generateEscPosText(currentInvoice, config);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadEscPos = () => {
    const text = generateEscPosText(currentInvoice, config);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${currentInvoice.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleInvoiceNumberChange = (newNumber: string) => {
    const updated = { ...currentInvoice, invoiceNumber: newNumber.trim() };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleRegenerateInvoiceNumber = () => {
    const newNumber = generateInvoiceNumber(config.tin);
    handleInvoiceNumberChange(newNumber);
  };

  const handleFiscalDayChange = (newFiscalDay: number) => {
    const val = Math.max(1, newFiscalDay);
    const updated = { ...currentInvoice, fiscalDay: val };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleDateTimeChange = (newDateTime: string) => {
    const updated = {
      ...currentInvoice,
      date: newDateTime,
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handlePrintedAtChange = (newPrintedAt: string) => {
    const updated = {
      ...currentInvoice,
      printedAt: newPrintedAt,
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleSetExactLiveDateTime = () => {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const day = pad(now.getDate());
    const month = pad(now.getMonth() + 1);
    const year = now.getFullYear();
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const exactDate = `${day}/${month}/${year} ${hours}:${minutes}`;
    const exactPrintedAt = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    const updated = {
      ...currentInvoice,
      date: exactDate,
      printedAt: exactPrintedAt,
      timestamp: now.getTime(),
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleDiscountChange = (itemId: string, newDiscount: number) => {
    const validDiscount = Math.max(0, newDiscount);
    let totalDiscount = 0;
    let grandTotal = 0;
    let taxTotal = 0;

    const newItems = currentInvoice.items.map(item => {
      if (item.id !== itemId) {
        totalDiscount += item.discount * item.quantity;
        grandTotal += item.lineTotal;
        taxTotal += item.vatAmount;
        return item;
      }
      const finalUnitPrice = Math.max(0, item.unitPrice - validDiscount);
      const lineTotal = finalUnitPrice * item.quantity;
      let vatAmount = 0;
      if (item.vatRate > 0) {
        vatAmount = Number((lineTotal - (lineTotal / (1 + item.vatRate / 100))).toFixed(2));
      }
      totalDiscount += validDiscount * item.quantity;
      grandTotal += lineTotal;
      taxTotal += vatAmount;

      return {
        ...item,
        discount: validDiscount,
        finalUnitPrice,
        lineTotal,
        vatAmount,
      };
    });

    const updated: Invoice = {
      ...currentInvoice,
      items: newItems,
      totalDiscount: Number(totalDiscount.toFixed(2)),
      tax: Number(taxTotal.toFixed(2)),
      total: Number(grandTotal.toFixed(2)),
      amountPaid: Math.max(currentInvoice.amountPaid, Number(grandTotal.toFixed(2))),
      change: Math.max(0, currentInvoice.amountPaid - grandTotal),
    };

    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleCustomerNameChange = (newName: string) => {
    const updated = { ...currentInvoice, customerName: newName.trim() || 'CASH CUSTOMER' };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleToggleCopy = (isCopy: boolean) => {
    const updated = { ...currentInvoice, isCopy };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleHighlightStyleChange = (style: 'black-banner' | 'bordered' | 'yellow' | 'none') => {
    const updated = { ...currentInvoice, fiscalInvoiceHighlight: style };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleToggleItemBundle = (itemId: string) => {
    if (!currentInvoice) return;
    const updatedItems = currentInvoice.items.map((item) => {
      if (item.id !== itemId) return item;
      const nextVal = !item.isBundle;
      return {
        ...item,
        isBundle: nextVal,
      };
    });

    const updatedBundleSummary = updatedItems
      .filter((it) => it.isBundle)
      .map((it) => ({ name: it.name, quantity: it.quantity }));

    const updated: Invoice = {
      ...currentInvoice,
      items: updatedItems,
      bundleSummary: updatedBundleSummary,
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  const handleToggleShowBundleSummary = () => {
    if (!currentInvoice) return;
    const nextVal = currentInvoice.showBundleSummary === false ? true : false;
    const updated: Invoice = {
      ...currentInvoice,
      showBundleSummary: nextVal,
    };
    setCurrentInvoice(updated);
    if (onUpdateInvoice) onUpdateInvoice(updated);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>80mm POS Receipt Preview</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {currentInvoice.isCopy ? 'COPY' : 'ORIGINAL'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {currentInvoice.invoiceNumber} • {currentInvoice.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingDetails(!isEditingDetails)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 cursor-pointer ${
                isEditingDetails
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Customize Invoice #, Customer, and Discounts"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isEditingDetails ? 'Hide Customizer' : 'Customize Receipt'}</span>
            </button>

            <button
              onClick={() => setShowPrinterTips(!showPrinterTips)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="80mm Thermal Printer Setup Tips"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Printer Guide</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printer Tips Alert Banner */}
        {showPrinterTips && (
          <div className="bg-amber-950/40 border-b border-amber-500/30 px-5 py-3 text-xs text-amber-200 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">
                Recommended 80mm Thermal Printer Settings in Chrome/Edge Print Dialog:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-200/90 text-[11px]">
                <li><strong>Destination:</strong> Select your 80mm thermal receipt printer (e.g. XP-80, Epson TM-T88, POS-80)</li>
                <li><strong>Paper size:</strong> 80mm × Continuous / 80(72.1) × 297mm</li>
                <li><strong>Margins:</strong> Set to <em>None</em> or <em>Minimum</em> (prevents blank paper margins)</li>
                <li><strong>Options:</strong> Uncheck <em>Headers and footers</em> (hides URL and date lines)</li>
              </ul>
            </div>
            <button
              onClick={() => setShowPrinterTips(false)}
              className="text-amber-400 hover:text-amber-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Area: Left Controls & Right Thermal Receipt Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-0 bg-slate-950">
          
          {/* Controls Panel (Desktop Left) */}
          <div className="md:col-span-5 p-5 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between space-y-5 bg-slate-900/40">
            <div className="space-y-4">
              
              {/* Quick Actions */}
              {/* Target Printer Selector */}
              {printers && printers.length > 0 && activePrinter && (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-emerald-400" />
                      Target Printer
                    </span>
                    {onOpenPrintersModal && (
                      <button
                        onClick={onOpenPrintersModal}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2 cursor-pointer"
                      >
                        Manage Printers
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={activePrinter.id}
                      onChange={(e) => onSelectActivePrinter && onSelectActivePrinter(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                    >
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.paperWidthMm}mm • {p.connectionType.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded font-semibold whitespace-nowrap">
                      {activePrinter.paperWidthMm}mm Roll
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-between">
                    <span>{activePrinter.model}</span>
                    <span>{activePrinter.autoCut ? 'Auto-Cut ON' : 'No Cut'} • {activePrinter.characterColumns} Cols</span>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Quick Actions
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={handlePrint}
                    className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-[0.99] cursor-pointer text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print {activePrinter ? `${activePrinter.paperWidthMm}mm` : '80mm'} Receipt Now</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleCopyText}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Plain Text</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadEscPos}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      <span>ESC/POS (.txt)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Customizer Box (Active when isEditingDetails is true) */}
              {isEditingDetails && (
                <div className="bg-slate-950/80 border border-emerald-500/40 rounded-xl p-4 space-y-3.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5" />
                      Receipt Customizer
                    </span>
                    <span className="text-[10px] text-slate-400">Live preview updates</span>
                  </div>

                  {/* 1. Customize Invoice Number */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-emerald-400" />
                        Custom Invoice #:
                      </label>
                      <button
                        onClick={handleRegenerateInvoiceNumber}
                        className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Auto-Format</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentInvoice.invoiceNumber}
                      onChange={(e) => handleInvoiceNumberChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-emerald-500 uppercase"
                    />
                  </div>

                  {/* 2. Customer Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300 block">
                      Customer Name:
                    </label>
                    <input
                      type="text"
                      value={currentInvoice.customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-hidden focus:border-emerald-500 uppercase"
                    />
                  </div>

                  {/* 3. Editable Fiscal Day */}
                  <div className="space-y-1 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-sky-400" />
                        Fiscal Day (Editable):
                      </label>
                      <span className="text-[10px] text-sky-400/90 font-mono">
                        Day #{currentInvoice.fiscalDay}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="9999"
                        value={currentInvoice.fiscalDay}
                        onChange={(e) => handleFiscalDayChange(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-sky-500"
                        title="Edit fiscal day number printed on the receipt"
                      />
                      <button
                        type="button"
                        onClick={() => handleFiscalDayChange((currentInvoice.fiscalDay || 1) - 1)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
                        title="Decrease Fiscal Day"
                      >
                        -1
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFiscalDayChange((currentInvoice.fiscalDay || 1) + 1)}
                        className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition"
                        title="Increase Fiscal Day"
                      >
                        +1
                      </button>
                    </div>
                  </div>

                  {/* 4. Exact Day and Time */}
                  <div className="space-y-1.5 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Exact Invoice Date &amp; Time:
                      </label>
                      <button
                        type="button"
                        onClick={handleSetExactLiveDateTime}
                        className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        title="Set invoice to exact current live system day and time"
                      >
                        <Clock className="w-2.5 h-2.5" />
                        <span>Set Live Now</span>
                      </button>
                    </div>
                    <div>
                      <input
                        type="text"
                        value={currentInvoice.date}
                        onChange={(e) => handleDateTimeChange(e.target.value)}
                        placeholder="DD/MM/YYYY HH:MM (e.g. 31/10/2026 13:27)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                      <span>Printed At:</span>
                      <input
                        type="text"
                        value={currentInvoice.printedAt}
                        onChange={(e) => handlePrintedAtChange(e.target.value)}
                        placeholder="DD/MM/YYYY HH:MM:SS"
                        className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 font-mono w-40 text-right focus:border-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* 3. Customize Discounts & Mark as Bundle per Product */}
                  <div className="space-y-2 pt-1 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-400" />
                        Discounts &amp; Bundle Status:
                      </label>
                      <button
                        type="button"
                        onClick={handleToggleShowBundleSummary}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border transition flex items-center gap-1 cursor-pointer ${
                          currentInvoice.showBundleSummary !== false
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                        title="Toggle visibility of the Bundle Summary section on the thermal receipt"
                      >
                        <Boxes className="w-2.5 h-2.5" />
                        <span>Bundle Section: {currentInvoice.showBundleSummary !== false ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {currentInvoice.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-slate-200 uppercase text-[11px] truncate flex-1">
                              {item.name}
                            </div>
                            {/* Feature: Mark as bundle or not */}
                            <button
                              type="button"
                              onClick={() => handleToggleItemBundle(item.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border flex items-center gap-1 transition cursor-pointer shrink-0 ${
                                item.isBundle
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                                  : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-slate-200'
                              }`}
                              title={item.isBundle ? 'Click to unmark as bundle' : 'Click to mark as bundle package'}
                            >
                              <Boxes className="w-3 h-3" />
                              <span>{item.isBundle ? 'Bundle ✓' : 'Regular Item'}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400">
                              Unit Price: {config.currencySymbol}{item.unitPrice.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-amber-400 font-mono">Disc:</span>
                              <div className="relative w-20">
                                <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                                  {config.currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={item.unitPrice}
                                  value={item.discount}
                                  onChange={(e) =>
                                    handleDiscountChange(
                                      item.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 pl-4 text-xs font-mono text-white text-right focus:outline-hidden focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                          {item.discount > 0 && (
                            <div className="text-[10px] text-amber-400 font-mono">
                              ↳ ({config.currencySymbol}{(item.discount * item.quantity).toFixed(2)} was discounted)
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Invoice Mode Toggle */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Fiscal Document Mode
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleCopy(false)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      !currentInvoice.isCopy
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Original Tax Invoice
                  </button>
                  <button
                    onClick={() => handleToggleCopy(true)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition cursor-pointer ${
                      currentInvoice.isCopy
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Copy of Tax Invoice
                  </button>
                </div>
              </div>

              {/* Highlight on Fiscal Tax Invoice */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 bg-black border border-white inline-block"></span>
                    Highlight on "FISCAL TAX INVOICE"
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {currentInvoice.fiscalInvoiceHighlight === 'bordered' ? 'Border Box' : currentInvoice.fiscalInvoiceHighlight === 'yellow' ? 'Yellow Marker' : currentInvoice.fiscalInvoiceHighlight === 'none' ? 'None' : 'Inverted Bar (Active)'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleHighlightStyleChange('black-banner')}
                    className={`py-1.5 px-2 text-[11px] rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      (!currentInvoice.fiscalInvoiceHighlight || currentInvoice.fiscalInvoiceHighlight === 'black-banner')
                        ? 'bg-black text-white border-2 border-emerald-500 shadow-sm font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-2 h-2 bg-white inline-block"></span>
                    <span>Black Banner</span>
                  </button>
                  <button
                    onClick={() => handleHighlightStyleChange('bordered')}
                    className={`py-1.5 px-2 text-[11px] rounded-lg font-semibold transition cursor-pointer border ${
                      currentInvoice.fiscalInvoiceHighlight === 'bordered'
                        ? 'bg-slate-800 text-white border-emerald-500 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span>Border Box</span>
                  </button>
                  <button
                    onClick={() => handleHighlightStyleChange('yellow')}
                    className={`py-1.5 px-2 text-[11px] rounded-lg font-semibold transition cursor-pointer ${
                      currentInvoice.fiscalInvoiceHighlight === 'yellow'
                        ? 'bg-yellow-400 text-black border-2 border-yellow-500 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>Yellow Marker</span>
                  </button>
                  <button
                    onClick={() => handleHighlightStyleChange('none')}
                    className={`py-1.5 px-2 text-[11px] rounded-lg font-semibold transition cursor-pointer ${
                      currentInvoice.fiscalInvoiceHighlight === 'none'
                        ? 'bg-slate-700 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>None (Plain)</span>
                  </button>
                </div>
              </div>

              {/* Receipt Summary Stats */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Customer:</span>
                  <span className="text-slate-200 font-medium">{currentInvoice.customerName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Line Items:</span>
                  <span className="text-slate-200 font-medium">{currentInvoice.items.length} items</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Discount:</span>
                  <span className="text-emerald-400 font-medium">
                    {config.currencySymbol}{currentInvoice.totalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>VAT / Tax:</span>
                  <span className="text-slate-200 font-medium">
                    {config.currencySymbol}{currentInvoice.tax.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                  <span className="text-slate-200">Total Paid:</span>
                  <span className="text-emerald-400">
                    {config.currencySymbol}{currentInvoice.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Thermal Print Specifications */}
            <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Thermal Specs: 80mm Roll (72mm / 48 cols)</span>
              </div>
              <p className="text-slate-400 leading-normal">
                Formatted specifically for 80mm thermal receipt rolls with ZIMRA fiscal signature, QR code, and itemized discounts.
              </p>
            </div>
          </div>

          {/* Thermal Receipt Visual Preview (Desktop Right) */}
          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col items-center justify-start bg-slate-950/80 min-h-[500px]">
            {/* Zoom / Width / Boldness bar */}
            <div className="w-[78mm] flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Eye className="w-3.5 h-3.5" />
                <span>80mm Preview</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBoldLevel(b => b === 'extra-bold' ? 'bold' : 'extra-bold')}
                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono border transition flex items-center gap-1 cursor-pointer ${
                    boldLevel === 'extra-bold'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 font-bold'
                  }`}
                  title="Toggle thermal bold lettering intensity"
                >
                  <span>B</span>
                  <span>{boldLevel === 'extra-bold' ? 'Extra Bold' : 'Bold'}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoomLevel(z => Math.max(80, z - 10))}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                    title="Zoom out"
                  >
                    -
                  </button>
                  <span className="font-mono text-[11px]">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(z => Math.min(130, z + 10))}
                    className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono cursor-pointer"
                    title="Zoom in"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Paper Container with Thermal Roll Presentation */}
            <div
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s ease-out',
              }}
              className="relative shadow-2xl rounded-xs bg-white text-black my-2"
            >
              {/* Serrated Top Paper Cut Edge */}
              <div
                className="w-full h-2.5 bg-repeat-x opacity-90"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px -2px, transparent 4px, #ffffff 4.5px)`,
                  backgroundSize: '8px 10px',
                }}
              />

              {/* Receipt Render */}
              <Receipt80mm
                invoice={currentInvoice}
                config={config}
                className="border-none shadow-none"
                paperWidthMm={activePrinter?.paperWidthMm || 80}
                boldLevel={boldLevel}
                fiscalHighlightStyle={currentInvoice.fiscalInvoiceHighlight}
              />

              {/* Serrated Bottom Paper Tear Edge */}
              <div
                className="w-full h-2.5 bg-repeat-x opacity-90"
                style={{
                  backgroundImage: `radial-gradient(circle at 4px 10px, transparent 4px, #ffffff 4.5px)`,
                  backgroundSize: '8px 10px',
                }}
              />
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Press <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 rounded border border-slate-700 font-mono text-slate-300">Ctrl + P</kbd> anytime to print
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-950/40"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 80mm</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
