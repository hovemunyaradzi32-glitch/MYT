import React from 'react';
import { Printer, CheckCircle, HelpCircle, X, ExternalLink, Settings, Cpu } from 'lucide-react';

interface PrinterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrintTestPage: () => void;
}

export const PrinterGuideModal: React.FC<PrinterGuideModalProps> = ({
  isOpen,
  onClose,
  onPrintTestPage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">80mm POS Thermal Printer Setup</h3>
              <p className="text-xs text-slate-400">Step-by-step connection &amp; browser print configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs leading-relaxed text-slate-300">
          
          {/* Key Step 1 */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>1. Browser Print Dialog Settings (Crucial)</span>
            </div>
            <p className="text-slate-400 text-xs">
              When the browser print dialog pops up after clicking &quot;Print 80mm Receipt&quot;:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">Margins:</strong>
                <span className="text-emerald-400 font-mono">None</span>
                <span className="text-slate-400 block text-[11px]">(Prevents side whitespace and blank cut feeds)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">Paper Size:</strong>
                <span className="text-emerald-400 font-mono">80mm × Receipt / Roll Paper</span>
                <span className="text-slate-400 block text-[11px]">(Or 80mm × 297mm continuous)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">Headers &amp; Footers:</strong>
                <span className="text-rose-400 font-mono">Unchecked / Off</span>
                <span className="text-slate-400 block text-[11px]">(Hides browser URL, time, and page numbers)</span>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <strong className="text-white block mb-0.5">Scale:</strong>
                <span className="text-emerald-400 font-mono">100% or Fit to printable area</span>
                <span className="text-slate-400 block text-[11px]">(Keeps receipt text sharp and crisp)</span>
              </div>
            </div>
          </div>

          {/* Supported Printers */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Supported 80mm Thermal Printer Brands</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                'Epson TM-T88 / TM-T20',
                'Xprinter XP-80C / XP-N160',
                'Bixolon SRP-350 / 330',
                'Star Micronics TSP100 / 650',
                'Munbyn 80mm USB/LAN',
                'Sunmi POS & Handhelds',
                'Rongta RP80 / RP326',
                'Generic POS-80 Series',
                'ZIMRA Certified Devices',
              ].map((brand) => (
                <div key={brand} className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px] font-medium text-slate-300 text-center">
                  {brand}
                </div>
              ))}
            </div>
          </div>

          {/* Test Page Action */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between gap-4">
            <div>
              <h5 className="font-bold text-emerald-300 text-sm">Thermal Alignment Test</h5>
              <p className="text-xs text-emerald-200/80">
                Print a test 80mm fiscal slip to check paper feed, QR readability, and column alignment.
              </p>
            </div>
            <button
              onClick={() => {
                onClose();
                onPrintTestPage();
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Test Receipt</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
          >
            Got it, Close
          </button>
        </div>

      </div>
    </div>
  );
};
