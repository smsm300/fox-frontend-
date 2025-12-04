
import React, { useState, useRef } from 'react';
import { Product, ProductUnit, Transaction, TransactionType, AppSettings } from '../types';
import { Search, Filter, Edit, Barcode, Plus, History, ArrowUpRight, ArrowDownLeft, AlertTriangle, Image as ImageIcon, Printer, Upload, Download, Trash2, Sliders, X, FileWarning } from 'lucide-react';
import { Modal } from '../components/Modal';

interface InventoryProps {
  products: Product[];
  transactions: Transaction[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct?: (id: number) => void;
  onStockAdjustment?: (productId: number, quantityDiff: number, reason: string) => void;
  settings?: AppSettings;
}

const Inventory: React.FC<InventoryProps> = ({ products, transactions, onAddProduct, onUpdateProduct, onDeleteProduct, onStockAdjustment, settings }) => {
  const [filter, setFilter] = useState('');
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);
  const [selectedProductBarcode, setSelectedProductBarcode] = useState<Product | null>(null);
  
  // Product Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', sku: '', category: '', quantity: 0, costPrice: 0, sellPrice: 0, unit: ProductUnit.PIECE, minStockAlert: 5, image: ''
  });

  // Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustmentForm, setAdjustmentForm] = useState({ productId: 0, quantityDiff: 0, reason: '' });

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase()) || 
    p.sku.toLowerCase().includes(filter.toLowerCase()) || 
    p.category.toLowerCase().includes(filter.toLowerCase())
  );

  const getProductHistory = (productId: number) => {
    return transactions.filter(t => 
      t.items?.some(item => item.id === productId)
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '', sku: `PROD-${Date.now().toString().slice(-4)}`, category: '', quantity: 0, costPrice: 0, sellPrice: 0, unit: ProductUnit.PIECE, minStockAlert: 5, image: 'https://picsum.photos/200/200?random=' + Math.floor(Math.random()*100)
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({ ...product });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      onUpdateProduct({ ...editingProduct, ...formData } as Product);
    } else {
      onAddProduct(formData as Omit<Product, 'id'>);
    }
    setIsFormOpen(false);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onStockAdjustment && adjustmentForm.productId && adjustmentForm.quantityDiff !== 0) {
       onStockAdjustment(adjustmentForm.productId, adjustmentForm.quantityDiff, adjustmentForm.reason);
       setIsAdjustmentModalOpen(false);
       setAdjustmentForm({ productId: 0, quantityDiff: 0, reason: '' });
    }
  };

  const handlePrintBarcode = () => {
    window.print();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'اسم المنتج', 'SKU', 'القسم', 'الكمية', 'التكلفة', 'سعر البيع', 'القيمة الإجمالية'];
    const csvContent = [
       headers.join(','),
       ...filtered.map(p => [
          p.id, p.name, p.sku, p.category, p.quantity, p.costPrice, p.sellPrice, p.quantity * p.sellPrice
       ].join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_report_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintLowStock = () => {
     const lowStockItems = products.filter(p => p.quantity <= p.minStockAlert);
     if (lowStockItems.length === 0) {
        alert('لا توجد منتجات منخفضة المخزون');
        return;
     }

     const printWindow = window.open('', '', 'width=800,height=600');
     if (printWindow) {
        printWindow.document.write(`
           <html dir="rtl">
              <head>
                 <title>تقرير النواقص</title>
                 <style>
                    body { font-family: 'Cairo', sans-serif; padding: 20px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                    th { background-color: #f2f2f2; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { margin: 0; }
                 </style>
              </head>
              <body>
                 <div class="header">
                    <h1>تقرير النواقص (Low Stock Report)</h1>
                    <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</p>
                 </div>
                 <table>
                    <thead>
                       <tr>
                          <th>المنتج</th>
                          <th>القسم</th>
                          <th>الكمية الحالية</th>
                          <th>الحد الأدنى</th>
                          <th>المورد المقترح</th>
                       </tr>
                    </thead>
                    <tbody>
                       ${lowStockItems.map(p => `
                          <tr>
                             <td>${p.name}</td>
                             <td>${p.category}</td>
                             <td style="color: red; font-weight: bold;">${p.quantity}</td>
                             <td>${p.minStockAlert}</td>
                             <td>-</td>
                          </tr>
                       `).join('')}
                    </tbody>
                 </table>
                 <script>window.print();</script>
              </body>
           </html>
        `);
        printWindow.document.close();
     }
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-dark-950 p-4 rounded-xl border border-dark-800">
        <div className="relative flex-1 max-w-lg">
           <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
           <input 
             type="text" 
             placeholder="بحث في المخزن (الاسم، الكود، القسم)..." 
             className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
             value={filter}
             onChange={e => setFilter(e.target.value)}
           />
        </div>
        <div className="flex gap-2">
          <button 
             onClick={handlePrintLowStock}
             className="flex items-center gap-2 px-4 py-2 bg-red-900/20 text-red-500 border border-red-900/30 rounded-lg hover:bg-red-900/30 transition-colors text-sm font-bold"
             title="طباعة تقرير النواقص"
          >
             <FileWarning size={18} />
             <span>تقرير النواقص</span>
          </button>
          <button 
             onClick={() => setIsAdjustmentModalOpen(true)}
             className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 text-yellow-500 border border-yellow-600/30 rounded-lg hover:bg-yellow-600/30 transition-colors font-bold text-sm"
          >
            <Sliders size={18} />
            <span>تسوية مخزون</span>
          </button>
          <button 
             onClick={handleExportCSV}
             className="flex items-center gap-2 px-4 py-2 bg-dark-900 border border-dark-700 hover:border-fox-500 text-gray-300 rounded-lg transition-colors text-sm"
          >
            <Download size={18} />
            <span>تصدير (CSV)</span>
          </button>
          <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-fox-600 text-white rounded-lg hover:bg-fox-500 font-bold shadow-lg shadow-fox-500/20 text-sm"
          >
            <Plus size={18} />
            <span>منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-dark-950 rounded-xl border border-dark-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-dark-900 text-gray-400 text-sm uppercase">
              <tr>
                <th className="p-4">المنتج</th>
                <th className="p-4">القسم</th>
                <th className="p-4">السعر (بيع/شراء)</th>
                <th className="p-4">هامش الربح</th>
                <th className="p-4">المخزون</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-800 text-gray-300">
              {filtered.map(product => {
                const isLowStock = product.quantity <= product.minStockAlert;
                const profitMargin = product.costPrice > 0 
                  ? ((product.sellPrice - product.costPrice) / product.costPrice) * 100 
                  : 100;

                return (
                  <tr key={product.id} className="hover:bg-dark-900/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-dark-800 overflow-hidden border border-dark-700 relative group/img">
                           <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                           <div className="absolute top-0 left-full ml-2 w-48 h-48 bg-dark-900 border border-fox-500 rounded-lg shadow-2xl z-50 hidden group-hover/img:block p-1">
                              <img src={product.image} alt={product.name} className="w-full h-full object-contain rounded" />
                           </div>
                        </div>
                        <div>
                          <div className="font-bold text-white mb-0.5">{product.name}</div>
                          <div className="flex items-center gap-2 text-xs">
                             <span className="bg-dark-800 px-1.5 py-0.5 rounded text-gray-400 font-mono">{product.sku}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col text-sm">
                        <span className="text-emerald-400 font-bold">{product.sellPrice} ج.م</span>
                        <span className="text-gray-500 text-xs">ت: {product.costPrice} ج.م</span>
                      </div>
                    </td>
                    <td className="p-4">
                       <span className={`text-xs font-bold px-2 py-1 rounded ${profitMargin >= 30 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          %{profitMargin.toFixed(1)}
                       </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-lg ${isLowStock ? 'text-red-500' : 'text-white'}`}>
                          {product.quantity}
                        </span>
                        <span className="text-xs text-gray-500">{product.unit}</span>
                        {isLowStock && (
                          <div className="group/tooltip relative">
                             <AlertTriangle size={16} className="text-red-500 animate-pulse" />
                             <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-red-600 text-white rounded opacity-0 group-hover/tooltip:opacity-100 whitespace-nowrap transition-opacity pointer-events-none">
                               مخزون منخفض
                             </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setSelectedProductHistory(product)}
                          className="p-2 hover:bg-dark-800 rounded-lg text-blue-400 transition-colors"
                          title="سجل الحركة"
                        >
                          <History size={18} />
                        </button>
                        <button 
                          onClick={() => setSelectedProductBarcode(product)}
                          className="p-2 hover:bg-dark-800 rounded-lg text-fox-500 transition-colors" title="طباعة باركود"
                        >
                          <Barcode size={18} />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 hover:bg-dark-800 rounded-lg text-gray-400 hover:text-white transition-colors" title="تعديل"
                        >
                          <Edit size={18} />
                        </button>
                        {onDeleteProduct && (
                           <button 
                             onClick={() => onDeleteProduct(product.id)}
                             className="p-2 hover:bg-dark-800 rounded-lg text-gray-500 hover:text-red-500 transition-colors" title="حذف"
                           >
                              <Trash2 size={18} />
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal (Add/Edit) */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
             {/* ... (Existing fields) ... */}
            <div className="col-span-2">
              <label className="block text-sm text-gray-400 mb-1">اسم المنتج</label>
              <input 
                required
                type="text" 
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">كود المنتج (SKU)</label>
              <input 
                required
                type="text" 
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">القسم / التصنيف</label>
              <input 
                required
                type="text" 
                list="categories"
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="categories">
                {Array.from(new Set(products.map(p => p.category))).map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">سعر الشراء (التكلفة)</label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                value={formData.costPrice}
                onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">سعر البيع</label>
              <input 
                required
                type="number" 
                step="0.01"
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-bold"
                value={formData.sellPrice}
                onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})}
              />
            </div>

            <div>
               <label className="block text-sm text-gray-400 mb-1">
                 {editingProduct ? 'الكمية (للتعديل استخدم تسوية مخزون)' : 'الكمية الافتتاحية'}
               </label>
               <input 
                 type="number" 
                 step="0.01"
                 disabled={!!editingProduct}
                 className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                 value={formData.quantity}
                 onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
               />
               {editingProduct && (
                 <p className="text-xs text-yellow-500 mt-1">لتغيير الكمية، يرجى استخدام زر "تسوية مخزون" لضمان دقة التقارير.</p>
               )}
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">الوحدة</label>
              <select 
                className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value as ProductUnit})}
              >
                {Object.values(ProductUnit).map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
               <label className="block text-sm text-gray-400 mb-1">تنبيه مخزون منخفض عند</label>
               <input 
                 type="number" 
                 className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                 value={formData.minStockAlert}
                 onChange={e => setFormData({...formData, minStockAlert: Number(e.target.value)})}
               />
            </div>

            <div className="col-span-2">
               <label className="block text-sm text-gray-400 mb-1">صورة المنتج</label>
               <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 pl-10 rounded-lg focus:border-fox-500 focus:outline-none text-xs"
                      value={formData.image}
                      onChange={e => setFormData({...formData, image: e.target.value})}
                      placeholder="رابط مباشر..."
                    />
                    <ImageIcon className="absolute left-3 top-2.5 text-gray-500" size={16} />
                  </div>
                  <div className="relative">
                     <input 
                       type="file" 
                       accept="image/*"
                       onChange={handleImageUpload}
                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                     />
                     <button type="button" className="px-3 py-2 bg-dark-800 text-gray-300 border border-dark-700 rounded-lg hover:bg-dark-700 flex items-center gap-1">
                        <Upload size={16} />
                        <span className="text-xs">رفع</span>
                     </button>
                  </div>
               </div>
               {formData.image && (
                 <div className="mt-2 w-16 h-16 rounded border border-dark-700 overflow-hidden">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                 </div>
               )}
            </div>
          </div>

          <button type="submit" className="w-full bg-fox-600 hover:bg-fox-500 text-white py-2.5 rounded-lg font-bold mt-4 shadow-lg shadow-fox-500/20">
            {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </button>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal isOpen={isAdjustmentModalOpen} onClose={() => setIsAdjustmentModalOpen(false)} title="تسوية مخزون (تعديل كميات)">
         <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div>
               <label className="block text-sm text-gray-400 mb-1">اختر المنتج</label>
               <select className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg" value={adjustmentForm.productId} onChange={e => setAdjustmentForm({...adjustmentForm, productId: Number(e.target.value)})} required>
                  <option value={0}>-- اختر المنتج --</option>
                  {products.map(p => (<option key={p.id} value={p.id}>{p.name} (الحالي: {p.quantity})</option>))}
               </select>
            </div>
            <div>
               <label className="block text-sm text-gray-400 mb-1">فرق الكمية (+ زيادة / - نقص)</label>
               <input type="number" step="0.01" className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg" value={adjustmentForm.quantityDiff} onChange={e => setAdjustmentForm({...adjustmentForm, quantityDiff: Number(e.target.value)})} placeholder="-5 أو 10" required />
            </div>
            <div>
               <label className="block text-sm text-gray-400 mb-1">السبب / الملاحظات</label>
               <textarea className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg" value={adjustmentForm.reason} onChange={e => setAdjustmentForm({...adjustmentForm, reason: e.target.value})} placeholder="مثال: تلف أثناء النقل، جرد سنوي، إلخ" rows={3} required />
            </div>
            <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-2.5 rounded-lg font-bold mt-2">تأكيد التسوية</button>
         </form>
      </Modal>

      {/* Product History Modal / Stock Card Print */}
      {selectedProductHistory && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
             <div className="bg-dark-950 border border-dark-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black">
                 <div className="relative">
                     {/* Screen Header */}
                     <div className="flex justify-between items-center p-4 border-b border-dark-800 bg-dark-900/50 no-print">
                        <h3 className="text-lg font-bold text-white">سجل حركة الصنف</h3>
                        <button onClick={() => setSelectedProductHistory(null)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                     </div>

                     {/* Print Header */}
                     <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 pt-4 px-4">
                        {settings?.logoUrl && <img src={settings.logoUrl} className="h-16 mx-auto mb-2 object-contain" alt="Logo" />}
                        <h1 className="text-2xl font-bold uppercase">{settings?.companyName}</h1>
                        <h2 className="text-xl text-gray-700">كارت صنف (Stock Card)</h2>
                        <div className="text-right text-sm mt-4 border border-gray-300 p-2 rounded">
                           <p><strong>اسم الصنف:</strong> {selectedProductHistory.name}</p>
                           <p><strong>SKU:</strong> {selectedProductHistory.sku}</p>
                           <p><strong>الرصيد الحالي:</strong> {selectedProductHistory.quantity} {selectedProductHistory.unit}</p>
                        </div>
                     </div>

                     <div className="p-4 overflow-y-auto max-h-[60vh] print:max-h-none print:overflow-visible">
                         {getProductHistory(selectedProductHistory.id).length === 0 ? (
                           <p className="text-gray-500 text-center py-8">لا توجد حركات مسجلة</p>
                         ) : (
                           <div className="space-y-4 print:space-y-0">
                              <table className="w-full text-right text-sm border-collapse hidden print:table">
                                 <thead className="bg-gray-200">
                                    <tr>
                                       <th className="p-2 border border-gray-300">التاريخ</th>
                                       <th className="p-2 border border-gray-300">النوع</th>
                                       <th className="p-2 border border-gray-300">البيان</th>
                                       <th className="p-2 border border-gray-300 text-center">الكمية</th>
                                    </tr>
                                 </thead>
                                 <tbody className="divide-y divide-gray-300">
                                    {getProductHistory(selectedProductHistory.id).map(t => {
                                       const itemDetails = t.items?.find(i => i.id === selectedProductHistory.id);
                                       return (
                                          <tr key={t.id}>
                                             <td className="p-2 border border-gray-300">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                             <td className="p-2 border border-gray-300">{t.type}</td>
                                             <td className="p-2 border border-gray-300">{t.description}</td>
                                             <td className="p-2 border border-gray-300 text-center font-bold">
                                                {itemDetails?.cartQuantity} {selectedProductHistory.unit}
                                             </td>
                                          </tr>
                                       );
                                    })}
                                 </tbody>
                              </table>

                              {/* Screen View */}
                              <div className="no-print space-y-4">
                                 {getProductHistory(selectedProductHistory.id).map(t => {
                                   const itemDetails = t.items?.find(i => i.id === selectedProductHistory.id);
                                   return (
                                     <div key={t.id} className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-800">
                                        <div className="flex items-center gap-3">
                                           <div className={`p-2 rounded-full ${
                                              t.type === TransactionType.SALE ? 'bg-red-500/20 text-red-400' :
                                              t.type === TransactionType.ADJUSTMENT ? 'bg-yellow-500/20 text-yellow-400' :
                                              'bg-emerald-500/20 text-emerald-400'
                                           }`}>
                                              {t.type === TransactionType.SALE ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                           </div>
                                           <div>
                                              <div className="text-sm text-gray-300 font-medium">
                                                {t.type === TransactionType.ADJUSTMENT ? 'تسوية مخزون' :
                                                 t.type === TransactionType.SALE ? 'فاتورة مبيعات' : 
                                                 t.type === TransactionType.PURCHASE ? 'فاتورة مشتريات' : t.type}
                                              </div>
                                              <div className="text-xs text-gray-500 font-mono">{new Date(t.date).toLocaleDateString('ar-EG')}</div>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                           <div className="font-bold text-white">
                                             {itemDetails?.cartQuantity} {selectedProductHistory.unit}
                                           </div>
                                           <div className="text-xs text-gray-500">رقم: {t.id}</div>
                                        </div>
                                     </div>
                                   );
                                 })}
                              </div>
                           </div>
                         )}
                     </div>

                     <div className="bg-dark-900 p-4 border-t border-dark-800 flex justify-center no-print">
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-fox-600 text-white rounded-lg font-bold hover:bg-fox-500">
                           <Printer size={18} /> طباعة كارت الصنف
                        </button>
                     </div>

                     <div className="hidden print:block text-center text-xs text-gray-500 mt-8 border-t border-gray-300 pt-4">
                        <p>{settings?.companyAddress} - {settings?.companyPhone}</p>
                     </div>
                 </div>
             </div>
         </div>
      )}

      {/* Barcode Print Modal */}
      {selectedProductBarcode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
           <div className="bg-white text-black w-full max-w-sm rounded-xl p-6 relative print:w-full print:h-full print:rounded-none">
              <button 
                onClick={() => setSelectedProductBarcode(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black no-print"
              >
                 ✕
              </button>
              
              <div id="print-area" className="flex flex-col items-center justify-center text-center space-y-2 py-4 border-2 border-dashed border-gray-300 rounded print:border-none">
                 <h2 className="font-bold text-lg">{selectedProductBarcode.name}</h2>
                 <p className="text-sm text-gray-600 font-bold">{selectedProductBarcode.sellPrice} ج.م</p>
                 <div className="py-2">
                    {/* Real Barcode using Font */}
                    <div className="font-libre-barcode text-6xl tracking-widest px-4 h-16 flex items-center justify-center">
                       *{selectedProductBarcode.sku}*
                    </div>
                 </div>
                 <p className="font-mono text-sm tracking-widest">{selectedProductBarcode.sku}</p>
              </div>

              <div className="mt-6 flex gap-3 no-print">
                 <button 
                   onClick={handlePrintBarcode}
                   className="flex-1 bg-fox-600 text-white py-2 rounded font-bold hover:bg-fox-500 flex items-center justify-center gap-2"
                 >
                   <Printer size={18} />
                   طباعة
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
