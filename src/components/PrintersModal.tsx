import React, { useState } from 'react';
import {
  Printer,
  Plus,
  Trash2,
  Edit3,
  X,
  Check,
  CheckCircle,
  Wifi,
  Bluetooth,
  Usb,
  Cpu,
  Star,
  Play,
  RotateCcw,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { POSPrinter, PrinterConnectionType, PrinterPaperSize, StoreConfig } from '../types/pos';
import { connectBluetoothPrinter, connectUsbPrinter } from '../utils/printerService';
import { initialPrinters } from '../data/initialData';

interface PrintersModalProps {
  isOpen: boolean;
  onClose: () => void;
  printers: POSPrinter[];
  config: StoreConfig;
  onSavePrinter: (printer: POSPrinter) => void;
  onDeletePrinter: (printerId: string) => void;
  onSetDefaultPrinter: (printerId: string) => void;
  onTestPrint: (printer: POSPrinter) => void;
}

export const PrintersModal: React.FC<PrintersModalProps> = ({
  isOpen,
  onClose,
  printers,
  config,
  onSavePrinter,
  onDeletePrinter,
  onSetDefaultPrinter,
  onTestPrint,
}) => {
  const [editingPrinter, setEditingPrinter] = useState<POSPrinter | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [pairingNotice, setPairingNotice] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!isOpen) return null;

  const startNewPrinter = () => {
    setEditingPrinter({
      id: `printer-${Date.now()}`,
      name: '',
      model: 'Xprinter XP-80 / Epson TM-T88',
      connectionType: 'browser',
      paperWidthMm: 80,
      isDefault: printers.length === 0,
      autoCut: true,
      openCashDrawer: true,
      printCopies: 1,
      characterColumns: 42,
      density: 'dark',
      status: 'ready',
    });
    setIsAddingNew(true);
    setPairingNotice(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter || !editingPrinter.name.trim()) return;
    onSavePrinter(editingPrinter);
    setEditingPrinter(null);
    setIsAddingNew(false);
  };

  const handlePairBluetooth = async () => {
    setPairingNotice({ message: 'Searching for Bluetooth thermal printers in pairing mode...', type: 'info' });
    const res = await connectBluetoothPrinter();
    if (res.success) {
      setPairingNotice({ message: `Successfully connected to ${res.deviceName}!`, type: 'success' });
      if (editingPrinter) {
        setEditingPrinter({
          ...editingPrinter,
          bluetoothDeviceName: res.deviceName,
          status: 'online',
        });
      }
    } else {
      setPairingNotice({ message: res.error || 'Pairing failed', type: 'error' });
    }
  };

  const handlePairUsb = async () => {
    setPairingNotice({ message: 'Searching for USB POS Printers...', type: 'info' });
    const res = await connectUsbPrinter();
    if (res.success) {
      setPairingNotice({ message: `Successfully paired ${res.deviceName}!`, type: 'success' });
      if (editingPrinter) {
        setEditingPrinter({
          ...editingPrinter,
          model: res.deviceName || editingPrinter.model,
          status: 'online',
        });
      }
    } else {
      setPairingNotice({ message: res.error || 'USB connection cancelled', type: 'error' });
    }
  };

  const getConnectionIcon = (type: PrinterConnectionType) => {
    switch (type) {
      case 'bluetooth':
        return <Bluetooth className="w-4 h-4 text-blue-400" />;
      case 'usb':
        return <Usb className="w-4 h-4 text-emerald-400" />;
      case 'network':
        return <Wifi className="w-4 h-4 text-amber-400" />;
      default:
        return <Printer className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">POS Thermal Printers</h3>
              <p className="text-xs text-slate-400">Manage 80mm &amp; 58mm thermal receipt printers, USB, Bluetooth, and Network hardware</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingPrinter && (
              <button
                onClick={startNewPrinter}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Printer</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form or List View */}
        {editingPrinter ? (
          <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                <span>{isAddingNew ? 'Add New POS Printer' : 'Edit Printer Configuration'}</span>
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                ID: {editingPrinter.id}
              </span>
            </div>

            {/* Notification banner */}
            {pairingNotice && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                  pairingNotice.type === 'success'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : pairingNotice.type === 'error'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    : 'bg-blue-950/30 border-blue-500/40 text-blue-300'
                }`}
              >
                <span>{pairingNotice.message}</span>
                <button
                  type="button"
                  onClick={() => setPairingNotice(null)}
                  className="p-1 opacity-70 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Printer Display Name:
                </label>
                <input
                  type="text"
                  value={editingPrinter.name}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  placeholder="e.g. Counter 1 Thermal Printer (80mm)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500 font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Hardware Model / Driver:
                </label>
                <input
                  type="text"
                  value={editingPrinter.model}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, model: e.target.value })}
                  placeholder="e.g. Xprinter XP-80C / Epson TM-T88"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Connection Interface Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Connection Interface:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'browser', label: 'System Driver', sub: 'Chrome/Edge Print', icon: Printer },
                  { id: 'bluetooth', label: 'Bluetooth', sub: 'Direct Wireless', icon: Bluetooth },
                  { id: 'usb', label: 'WebUSB', sub: 'Plug & Play USB', icon: Usb },
                  { id: 'network', label: 'Network / LAN', sub: 'IP Socket 9100', icon: Wifi },
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = editingPrinter.connectionType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setEditingPrinter({
                          ...editingPrinter,
                          connectionType: type.id as PrinterConnectionType,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="font-bold text-xs">{type.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block">{type.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Connection-specific fields */}
            {editingPrinter.connectionType === 'bluetooth' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Bluetooth Device Pairing
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Paired: {editingPrinter.bluetoothDeviceName || 'No device paired yet'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePairBluetooth}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Pair Bluetooth Printer</span>
                  </button>
                </div>
              </div>
            )}

            {editingPrinter.connectionType === 'usb' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      Direct WebUSB Device
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Connect via USB without needing complex print spooler drivers
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePairUsb}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Usb className="w-3.5 h-3.5" />
                    <span>Select USB Printer</span>
                  </button>
                </div>
              </div>
            )}

            {editingPrinter.connectionType === 'network' && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Printer IP Address:
                  </label>
                  <input
                    type="text"
                    value={editingPrinter.ipAddress || '192.168.1.200'}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, ipAddress: e.target.value })}
                    placeholder="192.168.1.200"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Raw Port (Default 9100):
                  </label>
                  <input
                    type="number"
                    value={editingPrinter.port || 9100}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, port: parseInt(e.target.value) || 9100 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            )}

            {/* Paper Size & Hardware Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Paper Roll Width:
                </label>
                <select
                  value={editingPrinter.paperWidthMm}
                  onChange={(e) =>
                    setEditingPrinter({
                      ...editingPrinter,
                      paperWidthMm: parseInt(e.target.value) as PrinterPaperSize,
                      characterColumns: parseInt(e.target.value) === 80 ? 42 : 32,
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-hidden focus:border-emerald-500"
                >
                  <option value={80}>80mm Roll (Standard Receipt - 42 cols)</option>
                  <option value={58}>58mm Roll (Compact Slip - 32 cols)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Thermal Darkness / Density:
                </label>
                <select
                  value={editingPrinter.density}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, density: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="dark">High Contrast Dark (Recommended)</option>
                  <option value="normal">Standard Density</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Copies per Sale:
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={editingPrinter.printCopies || 1}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, printCopies: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Toggles: Auto Cut, Cash Drawer Kick */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrinter.autoCut}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, autoCut: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Auto Paper Cutter</span>
                  <span className="text-[10px] text-slate-400">Trigger automatic knife cut after receipt feed</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingPrinter.openCashDrawer}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, openCashDrawer: e.target.checked })}
                  className="w-4 h-4 text-emerald-500 rounded bg-slate-900 border-slate-700"
                />
                <div>
                  <span className="text-xs font-semibold text-white block">Open Cash Drawer</span>
                  <span className="text-[10px] text-slate-400">Send 24V pulse to kick open cash drawer on payment</span>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onTestPrint(editingPrinter)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-amber-400" />
                <span>Print Test Slip</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPrinter(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Printer</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Printers List View */
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
            {printers.map((printer) => {
              return (
                <div
                  key={printer.id}
                  className="p-5 hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                        {getConnectionIcon(printer.connectionType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-white">{printer.name}</h4>
                          {printer.isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                              <span>DEFAULT</span>
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">{printer.model}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pl-10.5">
                      <span className="font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-[11px] text-slate-300">
                        {printer.paperWidthMm}mm Paper
                      </span>
                      <span>•</span>
                      <span className="capitalize">{printer.connectionType} interface</span>
                      <span>•</span>
                      <span>{printer.autoCut ? 'Auto-cut enabled' : 'Manual tear'}</span>
                      {printer.openCashDrawer && (
                        <>
                          <span>•</span>
                          <span>Drawer Kick</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!printer.isDefault && (
                      <button
                        onClick={() => onSetDefaultPrinter(printer.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
                        title="Make this printer default for checkout slips"
                      >
                        Set Default
                      </button>
                    )}

                    <button
                      onClick={() => onTestPrint(printer)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      title="Send hardware alignment test slip to printer"
                    >
                      <Play className="w-3 h-3 text-amber-400" />
                      <span>Test Print</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingPrinter({ ...printer });
                        setIsAddingNew(false);
                      }}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                      title="Edit Printer Settings"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Remove printer "${printer.name}"?`)) {
                          onDeletePrinter(printer.id);
                        }
                      }}
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                      title="Delete Printer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>{printers.length} configured printer profile(s)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
