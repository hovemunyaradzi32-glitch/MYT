import React, { useState } from 'react';
import { History, Search, Printer, Eye, X, Calendar, FileText, ArrowUpDown } from 'lucide-react';
import { Invoice, StoreConfig } from '../types/pos';
import { formatCurrency } from '../utils/receiptGenerator';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  config: StoreConfig;
  onSelectInvoice: (invoice: Invoice, autoPrint?: boolean) => void;
}

export const SalesHistoryModal: React.FC<SalesHistoryModalProps> = ({
  isOpen,
  onClose,
  invoices,
  config,
  onSelectInvoice,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string>('all');

  if (!isOpen) return null;

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.verificationCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMethod =
      selectedMethod === 'all' || inv.paymentMethod.toLowerCase() === selectedMethod.toLowerCase();

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Fiscal Sales &amp; Invoice History</h3>
              <p className="text-xs text-slate-400">View previous sales, reprint 80mm tax receipts, or export fiscal data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by invoice number, customer name, cashier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Payment:</span>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs rounded-xl px-3 py-2 text-white focus:outline-hidden focus:border-emerald-500"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="ecocash">EcoCash / ZiG</option>
            </select>
          </div>
        </div>

        {/* Table of Invoices */}
        <div className="flex-1 overflow-y-auto">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching fiscal invoices found.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs text-emerald-400">
                        {inv.invoiceNumber}
                      </span>
                      {inv.isCopy && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          COPY
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.paymentMethod}
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-3 flex-wrap">
                      <span>Customer: <strong className="text-white">{inv.customerName}</strong></span>
                      <span>•</span>
                      <span>Items: {inv.items.length}</span>
                      <span>•</span>
                      <span>Cashier: {inv.cashier}</span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono text-[11px]">{inv.date}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono">
                      Fiscal Day #{inv.fiscalDay} | Inv #{inv.fiscalInvoiceNo} | Hash: {inv.verificationCode}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:self-center justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-white">
                        {formatCurrency(inv.total, config.currencySymbol)}
                      </div>
                      {inv.tax > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Tax: {formatCurrency(inv.tax, config.currencySymbol)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          onSelectInvoice(inv, false);
                          onClose();
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
                        title="View 80mm Receipt"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          onSelectInvoice(inv, true);
                          onClose();
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        title="Reprint 80mm Thermal Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Reprint</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredInvoices.length} of {invoices.length} fiscal invoices</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
