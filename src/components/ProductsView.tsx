import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  Tag,
  Settings,
  ArrowUpDown,
  History,
  CheckCircle2,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  Product,
  Category,
  UnitDefinition,
  ItemType,
  Language,
  StockAdjustment,
  StockAdjustmentType,
} from '../types';
import { getTranslation } from '../i18n/translations';
import { formatCurrency } from '../utils/billingMath';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  units: UnitDefinition[];
  stockAdjustments: StockAdjustment[];
  language: Language;
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onAdjustStock: (adjustment: StockAdjustment) => void;
  onSaveCategory: (category: Category) => void;
  onSaveUnit: (unit: UnitDefinition) => void;
  initialAdjustProduct?: Product | null;
  onClearInitialAdjust?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  units,
  stockAdjustments,
  language,
  onSaveProduct,
  onDeleteProduct,
  onAdjustStock,
  onSaveCategory,
  onSaveUnit,
  initialAdjustProduct,
  onClearInitialAdjust,
}) => {
  const t = (key: Parameters<typeof getTranslation>[1]) => getTranslation(language, key);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(!!initialAdjustProduct);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(initialAdjustProduct || null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);

  // Category modal states
  const [newCatName, setNewCatName] = useState('');

  // Unit modal states
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitAllowDecimals, setNewUnitAllowDecimals] = useState(false);

  // Stock Adjust modal states
  const [adjustType, setAdjustType] = useState<StockAdjustmentType>('manual');
  const [adjustQtyChange, setAdjustQtyChange] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');

  // Product Form states
  const [formName, setFormName] = useState('');
  const [formItemType, setFormItemType] = useState<ItemType>('goods');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formUnitCode, setFormUnitCode] = useState('pcs');
  const [formPurchasePrice, setFormPurchasePrice] = useState<number>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number>(0);
  const [formWholesalePrice, setFormWholesalePrice] = useState<number | undefined>(undefined);
  const [formMrp, setFormMrp] = useState<number | undefined>(undefined);
  const [formGstRate, setFormGstRate] = useState<number>(0);
  const [formTaxIncluded, setFormTaxIncluded] = useState<boolean>(false);
  const [formCurrentStock, setFormCurrentStock] = useState<number>(0);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(5);
  const [formHsnCode, setFormHsnCode] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formWarranty, setFormWarranty] = useState('');

  // Handle open add product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormName('');
    setFormItemType('goods');
    setFormCategoryId(categories[0]?.id || '');
    setFormUnitCode(units[0]?.code || 'pcs');
    setFormPurchasePrice(0);
    setFormSellingPrice(0);
    setFormWholesalePrice(undefined);
    setFormMrp(undefined);
    setFormGstRate(0);
    setFormTaxIncluded(false);
    setFormCurrentStock(10);
    setFormMinStockAlert(5);
    setFormHsnCode('');
    setFormBarcode('');
    setFormWarranty('');
    setIsEditModalOpen(true);
  };

  // Handle open edit product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormItemType(p.itemType);
    setFormCategoryId(p.categoryId);
    setFormUnitCode(p.unitCode);
    setFormPurchasePrice(p.purchasePrice || 0);
    setFormSellingPrice(p.sellingPrice);
    setFormWholesalePrice(p.wholesalePrice);
    setFormMrp(p.mrp);
    setFormGstRate(p.gstRate);
    setFormTaxIncluded(p.taxIncluded);
    setFormCurrentStock(p.currentStock);
    setFormMinStockAlert(p.minStockAlert);
    setFormHsnCode(p.hsnCode || '');
    setFormBarcode(p.barcode || '');
    setFormWarranty(p.warranty || '');
    setIsEditModalOpen(true);
  };

  // Save Product form
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newOrUpdated: Product = {
      id: editingProduct ? editingProduct.id : 'prod_' + Date.now(),
      name: formName.trim(),
      itemType: formItemType,
      categoryId: formCategoryId || categories[0]?.id || 'cat_default',
      unitCode: formUnitCode,
      purchasePrice: Number(formPurchasePrice) || 0,
      sellingPrice: Number(formSellingPrice) || 0,
      wholesalePrice: formWholesalePrice ? Number(formWholesalePrice) : undefined,
      mrp: formMrp ? Number(formMrp) : undefined,
      gstRate: Number(formGstRate) || 0,
      taxIncluded: formTaxIncluded,
      currentStock: formItemType === 'goods' ? Number(formCurrentStock) || 0 : 0,
      minStockAlert: formItemType === 'goods' ? Number(formMinStockAlert) || 0 : 0,
      hsnCode: formHsnCode.trim() || undefined,
      barcode: formBarcode.trim() || undefined,
      warranty: formWarranty.trim() || undefined,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(newOrUpdated);
    setIsEditModalOpen(false);
  };

  // Save new category
  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat: Category = {
      id: 'cat_' + Date.now(),
      name: newCatName.trim(),
      color: 'amber',
    };
    onSaveCategory(cat);
    setNewCatName('');
  };

  // Save new unit
  const handleSaveUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitCode.trim() || !newUnitName.trim()) return;
    const unit: UnitDefinition = {
      id: 'u_' + Date.now(),
      code: newUnitCode.trim().toLowerCase(),
      name: newUnitName.trim(),
      nameHi: newUnitName.trim(),
      nameMr: newUnitName.trim(),
      allowDecimals: newUnitAllowDecimals,
      isSystem: false,
    };
    onSaveUnit(unit);
    setNewUnitCode('');
    setNewUnitName('');
    setNewUnitAllowDecimals(false);
  };

  // Open Adjust stock modal
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setAdjustType('manual');
    setAdjustQtyChange(0);
    setAdjustReason('');
    setIsAdjustModalOpen(true);
  };

  // Submit stock adjustment
  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjustQtyChange === 0) return;

    const previousStock = adjustingProduct.currentStock;
    const newStock = previousStock + adjustQtyChange;

    const adj: StockAdjustment = {
      id: 'adj_' + Date.now(),
      productId: adjustingProduct.id,
      productName: adjustingProduct.name,
      adjustmentType: adjustType,
      quantityChange: adjustQtyChange,
      previousStock,
      newStock,
      reason: adjustReason.trim() || t(`adjustment${adjustType.charAt(0).toUpperCase() + adjustType.slice(1)}` as any),
      date: new Date().toISOString().split('T')[0],
      recordedBy: 'Admin',
    };

    onAdjustStock(adj);
    setIsAdjustModalOpen(false);
    setAdjustingProduct(null);
    if (onClearInitialAdjust) onClearInitialAdjust();
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;

      // Stock status filter
      if (stockStatusFilter === 'low') {
        if (p.itemType !== 'goods' || p.currentStock > p.minStockAlert || p.currentStock <= 0) return false;
      } else if (stockStatusFilter === 'out') {
        if (p.itemType !== 'goods' || p.currentStock > 0) return false;
      }

      // Search
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, stockStatusFilter, searchQuery]);

  // Inventory valuation figures
  const valuation = useMemo(() => {
    let cost = 0;
    let retail = 0;
    for (const p of products) {
      if (p.itemType === 'goods' && p.currentStock > 0) {
        cost += p.currentStock * (p.purchasePrice || 0);
        retail += p.currentStock * p.sellingPrice;
      }
    }
    return { cost, retail, potentialProfit: retail - cost };
  }, [products]);

  // Export inventory to CSV
  const handleExportCsv = () => {
    const headers = ['Item Name', 'Category', 'Unit', 'Buy Rate', 'Sell Rate', 'MRP', 'Stock', 'Stock Value (Cost)'];
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || '';
      return [
        `"${p.name}"`,
        `"${cat}"`,
        p.unitCode,
        p.purchasePrice,
        p.sellingPrice,
        p.mrp || '',
        p.currentStock,
        (p.currentStock * (p.purchasePrice || 0)).toFixed(2),
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto p-3 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('inventory')}
          </h1>
          <p className="text-xs text-slate-500">
            Universal product catalog, custom units, buy/sell rates, and stock movement.
          </p>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>{t('manageCategories')}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsUnitModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t('manageUnits')}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs flex items-center space-x-1 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md shadow-amber-500/20 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addItem')}</span>
          </button>
        </div>
      </div>

      {/* Stock Valuation Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Stock Value (Cost Price)</span>
          <span className="text-sm sm:text-lg font-black text-slate-900">
            {formatCurrency(valuation.cost, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Stock Value (Retail Price)</span>
          <span className="text-sm sm:text-lg font-black text-amber-600">
            {formatCurrency(valuation.retail, false)}
          </span>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-slate-500 block">Potential Margin in Stock</span>
          <span className="text-sm sm:text-lg font-black text-emerald-600">
            {formatCurrency(valuation.potentialProfit, false)}
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name, barcode, or HSN code..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
            />
          </div>

          {/* Stock status filter tabs */}
          <div className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setStockStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                stockStatusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                stockStatusFilter === 'low'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Low Stock
            </button>
            <button
              type="button"
              onClick={() => setStockStatusFilter('out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                stockStatusFilter === 'out'
                  ? 'bg-red-600 text-white font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>

        {/* Category Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t('allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {language === 'mr' ? cat.nameMr || cat.name : language === 'hi' ? cat.nameHi || cat.name : cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No items match your criteria.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-3 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition"
            >
              + {t('addItem')}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price</th>
                  <th className="py-3 px-3 text-center">GST %</th>
                  <th className="py-3 px-3 text-right">Current Stock</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLow = p.itemType === 'goods' && p.currentStock <= p.minStockAlert && p.currentStock > 0;
                  const isOut = p.itemType === 'goods' && p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span>Unit: {p.unitCode}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          {p.hsnCode && <span>• HSN: {p.hsnCode}</span>}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {cat ? cat.name : 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatCurrency(p.purchasePrice || 0)}
                      </td>

                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        {formatCurrency(p.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {p.gstRate}%
                      </td>

                      <td className="py-3 px-3 text-right">
                        {p.itemType === 'goods' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-black ${
                                isOut
                                  ? 'bg-red-100 text-red-700'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {p.currentStock} {p.unitCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjust(p)}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded transition"
                              title="Adjust stock"
                            >
                              +/-
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            Service
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD / EDIT PRODUCT MODAL ================= */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-6">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-base">
                {editingProduct ? t('editItem') : t('addItem')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              {/* Type: Goods vs Service */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('itemType')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormItemType('goods')}
                    className={`p-2 rounded-xl text-center font-bold border transition ${
                      formItemType === 'goods'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    📦 {t('goods')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormItemType('service')}
                    className={`p-2 rounded-xl text-center font-bold border transition ${
                      formItemType === 'service'
                        ? 'bg-amber-500 text-slate-950 border-amber-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    🛠️ {t('service')}
                  </button>
                </div>
              </div>

              {/* Item Name */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('itemName')} *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Enter product or service name..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('category')}</label>
                  <select
                    value={formCategoryId}
                    onChange={(e) => setFormCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('unitOfMeasure')}</label>
                  <select
                    value={formUnitCode}
                    onChange={(e) => setFormUnitCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.code}>
                        {u.name} ({u.code}) {u.allowDecimals ? '[Decimals OK]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing: Purchase Rate, Selling Rate, MRP */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('purchasePrice')}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('sellingPrice')} *</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('mrp')}</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formMrp || ''}
                    onChange={(e) => setFormMrp(parseFloat(e.target.value) || undefined)}
                    placeholder="Optional"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* GST & Tax included */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('taxRate')}</label>
                  <select
                    value={formGstRate}
                    onChange={(e) => setFormGstRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div className="pt-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formTaxIncluded}
                      onChange={(e) => setFormTaxIncluded(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-semibold text-slate-700">Selling Price includes GST</span>
                  </label>
                </div>
              </div>

              {/* Stock Fields (Goods only) */}
              {formItemType === 'goods' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-950 mb-1">
                      {editingProduct ? t('currentStock') : t('openingStock')}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-amber-950 mb-1">{t('minStockAlert')}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formMinStockAlert}
                      onChange={(e) => setFormMinStockAlert(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* HSN & Barcode */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('hsnCode')}</label>
                  <input
                    type="text"
                    value={formHsnCode}
                    onChange={(e) => setFormHsnCode(e.target.value)}
                    placeholder="e.g. 1006 or 8517"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">{t('barcodeSku')}</label>
                  <input
                    type="text"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    placeholder="Scan or type barcode..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  {editingProduct ? 'Update Product' : 'Save New Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADJUST STOCK MODAL ================= */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base">
                {t('adjustStock')}: {adjustingProduct.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAdjustModalOpen(false);
                  setAdjustingProduct(null);
                  if (onClearInitialAdjust) onClearInitialAdjust();
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-600">Current Stock:</span>
                <span className="font-black text-sm text-slate-900">
                  {adjustingProduct.currentStock} {adjustingProduct.unitCode}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('adjustmentType')}</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockAdjustmentType)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="damage">{t('adjustmentDamage')}</option>
                  <option value="expired">{t('adjustmentExpired')}</option>
                  <option value="theft">{t('adjustmentTheft')}</option>
                  <option value="audit_recount">{t('adjustmentRecount')}</option>
                  <option value="return">{t('adjustmentReturn')}</option>
                  <option value="manual">{t('adjustmentManual')}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {t('qtyChange')} (e.g. +10 to add, -5 to reduce)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustQtyChange || ''}
                  onChange={(e) => setAdjustQtyChange(parseFloat(e.target.value) || 0)}
                  placeholder="Enter positive or negative quantity..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-sm text-slate-900"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex justify-between font-bold text-amber-900">
                <span>Resulting Final Stock:</span>
                <span className="font-black text-sm">
                  {adjustingProduct.currentStock + adjustQtyChange} {adjustingProduct.unitCode}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory recount, damaged carton..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="w-1/3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={adjustQtyChange === 0}
                  className="w-2/3 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-md transition"
                >
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MANAGE CATEGORIES MODAL ================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">{t('manageCategories')}</h3>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <form onSubmit={handleSaveCategorySubmit} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="New Category Name (e.g. Snacks, Plywood)..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  + Add
                </button>
              </form>

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200 font-semibold"
                  >
                    <span>{c.name}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {products.filter((p) => p.categoryId === c.id).length} items
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MANAGE UNITS MODAL ================= */}
      {isUnitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm">{t('manageUnits')}</h3>
              <button
                type="button"
                onClick={() => setIsUnitModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs">
              <form onSubmit={handleSaveUnitSubmit} className="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block">{t('addCustomUnit')}</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Symbol (e.g. tin, bori, crt)"
                    value={newUnitCode}
                    onChange={(e) => setNewUnitCode(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Full Name (e.g. Tin, Crate)"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold"
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newUnitAllowDecimals}
                    onChange={(e) => setNewUnitAllowDecimals(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="font-medium text-slate-700">{t('allowDecimals')}</span>
                </label>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg transition"
                >
                  Save Custom Unit
                </button>
              </form>

              <div className="max-h-52 overflow-y-auto space-y-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {units.map((u) => (
                  <div
                    key={u.id}
                    className="flex justify-between items-center p-2 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{u.name}</span>
                      <span className="ml-1.5 font-mono text-[11px] text-amber-700 font-bold">({u.code})</span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {u.allowDecimals ? 'Decimals allowed' : 'Whole units'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
