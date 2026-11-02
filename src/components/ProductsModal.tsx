import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit3, X, Check, Search, Boxes } from 'lucide-react';
import { Product, StoreConfig } from '../types/pos';
import { formatCurrency } from '../utils/receiptGenerator';

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  config: StoreConfig;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
}

export const ProductsModal: React.FC<ProductsModalProps> = ({
  isOpen,
  onClose,
  products,
  config,
  onSaveProduct,
  onDeleteProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  if (!isOpen) return null;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.barcode.includes(searchTerm) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startNewProduct = () => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      category: 'Groceries',
      barcode: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      price: 0,
      stock: 50,
      vatRate: config.defaultVatRate,
      defaultDiscount: 0,
      unit: 'PCS',
      isBundle: false,
    });
    setIsAddingNew(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim()) return;
    onSaveProduct(editingProduct);
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Product Catalog &amp; Tax Pricing</h3>
              <p className="text-xs text-slate-400">Manage items, barcodes, promo discounts, and VAT categories</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startNewProduct}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: If editing/adding show form, else show list */}
        {editingProduct ? (
          <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wide">
              {isAddingNew ? 'Add New Product' : 'Edit Product'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Product Description / Name (as printed on receipt)
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="e.g. ASHNA VALUE RICE 10X2KGS"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-hidden focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Retail Price ({config.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Discount ({config.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingProduct.defaultDiscount || 0}
                  onChange={(e) => setEditingProduct({ ...editingProduct, defaultDiscount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Prints as: ↳ ($X was discounted)</span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  VAT Rate (%)
                </label>
                <select
                  value={editingProduct.vatRate}
                  onChange={(e) => setEditingProduct({ ...editingProduct, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value={0}>0% (Zero-rated / Exempt)</option>
                  <option value={15}>15% (Standard VAT)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Barcode (UPC / EAN)
                </label>
                <input
                  type="text"
                  value={editingProduct.barcode}
                  onChange={(e) => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Packaging Unit
                </label>
                <input
                  type="text"
                  value={editingProduct.unit || 'PCS'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Inventory Stock
                </label>
                <input
                  type="number"
                  value={editingProduct.stock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              {/* Feature: Mark product as bundle */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 select-none sm:col-span-3">
                <input
                  type="checkbox"
                  checked={editingProduct.isBundle || false}
                  onChange={(e) => setEditingProduct({ ...editingProduct, isBundle: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-700 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Mark as Bundle Package (Printed under Bundle Summary on thermal receipts)</span>
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Product</span>
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* Search */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name, category, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80">
              {filteredProducts.map((p) => {
                const netPrice = p.price - (p.defaultDiscount || 0);
                return (
                  <div
                    key={p.id}
                    className="p-4 hover:bg-slate-800/40 transition flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-sm text-white uppercase">{p.name}</div>
                        {p.isBundle && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5">
                            <Boxes className="w-2.5 h-2.5" />
                            BUNDLE
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {p.barcode}
                        </span>
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>Stock: {p.stock} {p.unit || 'PCS'}</span>
                        <span>•</span>
                        <span>VAT: {p.vatRate}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          {formatCurrency(netPrice, config.currencySymbol)}
                        </div>
                        {p.defaultDiscount && p.defaultDiscount > 0 ? (
                          <div className="text-[10px] text-amber-400 font-mono">
                            Disc: -{formatCurrency(p.defaultDiscount, config.currencySymbol)} (orig {formatCurrency(p.price, config.currencySymbol)})
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingProduct({ ...p });
                            setIsAddingNew(false);
                          }}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                          title="Edit Product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete "${p.name}"?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>
    </div>
  );
};
