import React, { useState } from 'react';
import { Banknote, CreditCard, Smartphone, Check, Printer, X, RefreshCw, Hash } from 'lucide-react';
import { PaymentMethodType, StoreConfig, POSPrinter } from '../types/pos';
import { formatCurrency } from '../utils/receiptGenerator';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  config: StoreConfig;
  customerName: string;
  invoiceNumber: string;
  setInvoiceNumber: (inv: string) => void;
  onRegenerateInvoiceNumber: () => void;
  printers?: POSPrinter[];
  activePrinter?: POSPrinter;
  onSelectActivePrinter?: (printerId: string) => void;
  onConfirmPayment: (
    paymentMethod: PaymentMethodType,
    amountTendered: number,
    shouldPrintImmediately: boolean,
    customInvoiceNumber?: string
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  config,
  customerName,
  invoiceNumber,
  setInvoiceNumber,
  onRegenerateInvoiceNumber,
  printers = [],
  activePrinter,
  onSelectActivePrinter,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethodType>('Cash');
  const [amountTendered, setAmountTendered] = useState<string>(totalAmount.toFixed(2));
  const [mobileRef, setMobileRef] = useState<string>('');
  const [cardAuthCode, setCardAuthCode] = useState<string>('');

  if (!isOpen) return null;

  const numericTendered = parseFloat(amountTendered) || 0;
  const change = Math.max(0, numericTendered - totalAmount);
  const isSufficient = numericTendered >= totalAmount || method !== 'Cash';

  const quickCashOptions = [
    Math.ceil(totalAmount),
    5,
    10,
    20,
    50,
    100,
  ].filter((val, idx, arr) => val >= totalAmount && arr.indexOf(val) === idx).slice(0, 4);

  if (quickCashOptions.length === 0) {
    quickCashOptions.push(totalAmount);
  }

  const handleComplete = (printImmediate: boolean) => {
    if (!isSufficient && method === 'Cash') return;
    onConfirmPayment(method, numericTendered, printImmediate, invoiceNumber);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h3 className="text-lg font-bold text-white">Payment &amp; Fiscal Checkout</h3>
            <p className="text-xs text-slate-400">
              Customer: <span className="text-slate-200 font-medium">{customerName || 'Walk-in'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Display */}
        <div className="bg-slate-950 px-6 py-5 text-center border-b border-slate-800/80">
          <div className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
            Total Amount Due
          </div>
          <div className="text-4xl font-extrabold text-emerald-400 tracking-tight font-mono">
            {formatCurrency(totalAmount, config.currencySymbol)}
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Custom Invoice Number Field */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-emerald-400" />
                <span>Invoice Number (Customizable)</span>
              </label>
              <button
                type="button"
                onClick={onRegenerateInvoiceNumber}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                title="Generate fresh ZIMRA fiscal sequence"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-generate</span>
              </button>
            </div>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono font-semibold focus:outline-hidden focus:border-emerald-500 uppercase"
              placeholder="e.g. INV2001513400-3-5-20261029-0086"
              required
            />
            <p className="text-[10px] text-slate-400">
              This invoice number will be printed on the receipt and embedded in the QR verification code.
            </p>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setMethod('Cash');
                  setAmountTendered(totalAmount.toFixed(2));
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                  method === 'Cash'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('Card');
                  setAmountTendered(totalAmount.toFixed(2));
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                  method === 'Card'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Card (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMethod('EcoCash');
                  setAmountTendered(totalAmount.toFixed(2));
                }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                  method === 'EcoCash'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 ring-1 ring-emerald-500/50'
                    : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>EcoCash / ZiG</span>
              </button>
            </div>
          </div>

          {/* Method Specific Fields */}
          {method === 'Cash' && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Amount Received:
                </label>
                <button
                  type="button"
                  onClick={() => setAmountTendered(totalAmount.toFixed(2))}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Exact Amount ({formatCurrency(totalAmount, config.currencySymbol)})
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-base font-bold">
                  {config.currencySymbol}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-8 pr-4 text-white text-lg font-mono font-bold focus:outline-hidden focus:border-emerald-500"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quickCashOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setAmountTendered(opt.toFixed(2))}
                    className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-medium transition cursor-pointer"
                  >
                    {formatCurrency(opt, config.currencySymbol)}
                  </button>
                ))}
              </div>

              {/* Change Calculation Box */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-sm">
                <span className="text-slate-400">Change Due:</span>
                <span className={`font-mono text-base font-bold ${change > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {formatCurrency(change, config.currencySymbol)}
                </span>
              </div>
            </div>
          )}

          {method === 'Card' && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Card Approval / Terminal Reference (Optional)
              </label>
              <input
                type="text"
                value={cardAuthCode}
                onChange={(e) => setCardAuthCode(e.target.value)}
                placeholder="e.g. AUTH-882314"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                Payment processed via external bank point of sale terminal.
              </p>
            </div>
          )}

          {method === 'EcoCash' && (
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                EcoCash / Mobile Approval Code
              </label>
              <input
                type="text"
                value={mobileRef}
                onChange={(e) => setMobileRef(e.target.value)}
                placeholder="e.g. MP261029.0831.G091"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-sm text-white focus:outline-hidden focus:border-emerald-500 font-mono"
              />
              <p className="text-[11px] text-slate-400">
                EcoCash dial code *151*2*2*MerchantCode# or transfer verification.
              </p>
            </div>
          )}

          {/* Target Printer Selector */}
          {printers.length > 0 && (
            <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 text-[11px] shrink-0">Print to:</span>
                <select
                  value={activePrinter?.id}
                  onChange={(e) => onSelectActivePrinter && onSelectActivePrinter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-semibold truncate w-full focus:outline-hidden"
                >
                  {printers.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.name} ({pr.paperWidthMm}mm) {pr.isDefault ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono shrink-0 font-bold">
                {activePrinter?.paperWidthMm || 80}MM READY
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="sm:w-1/3 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!isInclusiveValid(method, numericTendered, totalAmount)}
            onClick={() => handleComplete(false)}
            className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Complete Sale</span>
          </button>

          <button
            type="button"
            disabled={!isInclusiveValid(method, numericTendered, totalAmount)}
            onClick={() => handleComplete(true)}
            className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Charge &amp; Print 80mm</span>
          </button>
        </div>

      </div>
    </div>
  );
};

function isInclusiveValid(method: PaymentMethodType, amountTendered: number, totalAmount: number): boolean {
  if (method === 'Cash') {
    return amountTendered >= totalAmount;
  }
  return true;
}
