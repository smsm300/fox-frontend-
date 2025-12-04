
import React, { useState } from 'react';
import { ClipboardList, Plus, Search, FileText, Printer, Check, Trash2 } from 'lucide-react';
import { Customer, Product, CartItem, Quotation, AppSettings } from '../types';

interface QuotationsProps {
  quotations: Quotation[];
  customers: Customer[];
  products: Product[];
  onCreateQuotation: (customerId: number, items: CartItem[]) => void;
  onConvertToInvoice: (quotationId: string) => void;
  settings: AppSettings;
}

const Quotations: React.FC<QuotationsProps> = ({ quotations, customers, products, onCreateQuotation, onConvertToInvoice, settings }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create Mode State
  const [selectedCustomer, setSelectedCustomer] = useState<number>(customers[0]?.id || 0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const filteredQuotations = quotations.filter(q => 
    q.customerName.includes(searchTerm) || q.id.includes(searchTerm)
  );

  const filteredProducts = products.filter(p => p.name.includes(productSearch));

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      return [...prev, { ...product, cartQuantity: 1, discount: 0 }];
    });
  };

  const handleSaveQuotation = () => {
    if (cart.length === 0) return;
    onCreateQuotation(selectedCustomer, cart);
    setView('list');
    setCart([]);
  };

  const handleConvert = (id: string) => {
     if(window.confirm('هل أنت متأكد من تحويل عرض السعر إلى فاتورة بيع؟ سيتم خصم الكميات من المخزون.')) {
        onConvertToInvoice(id);
     }
  };

  if (view === 'create') {
    return (
      <div className="flex gap-6 h-[calc(100vh-140px)]">
        {/* Products */}
        <div className="w-1/3 bg-dark-950 rounded-xl border border-dark-800 flex flex-col no-print">
          <div className="p-4 border-b border-dark-800">
            <input 
              type="text" 
              placeholder="بحث عن منتج..."
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredProducts.map(product => (
              <div key={product.id} onClick={() => addToCart(product)} className="bg-dark-900 p-3 rounded-lg border border-dark-800 hover:border-fox-500 cursor-pointer flex justify-between">
                <span className="text-gray-200 text-sm">{product.name}</span>
                <span className="text-fox-400 text-sm">{product.sellPrice}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quotation Preview */}
        <div className="flex-1 bg-white text-black rounded-xl shadow-xl overflow-hidden flex flex-col print:rounded-none print:shadow-none print:absolute print:inset-0 print:h-auto print:z-50">
          <div className="p-8 flex-1 overflow-y-auto print:p-0 print:overflow-visible">
             {/* Print Header */}
             <div className="flex justify-between items-center border-b-2 border-orange-500 pb-4 mb-6">
               <div className="flex items-center gap-4">
                  {settings.logoUrl && (
                     <img src={settings.logoUrl} alt="Logo" className="h-20 w-auto object-contain" />
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-orange-600">{settings.companyName}</h1>
                    <p className="text-sm text-gray-500">للديكور والإضاءة الحديثة</p>
                    <p className="text-xs text-gray-400 mt-1" dir="ltr">{settings.companyPhone}</p>
                    <p className="text-xs text-gray-400">{settings.companyAddress}</p>
                  </div>
               </div>
               <div className="text-left bg-gray-50 p-3 rounded border border-gray-200">
                 <h2 className="text-xl font-bold text-gray-800">عرض سعر</h2>
                 <p className="text-sm text-gray-500 mt-1">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                 <p className="text-sm text-gray-500">رقم العرض: QT-{Date.now().toString().slice(-6)}</p>
               </div>
             </div>

             {/* Customer Info */}
             <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-200 print:border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                   <label className="text-xs text-gray-500 font-bold">موجه إلى السيد / السادة:</label>
                </div>
                <select 
                  className="w-full bg-transparent border-b border-gray-300 font-bold text-lg focus:outline-none print:border-none print:appearance-none"
                  value={selectedCustomer}
                  onChange={e => setSelectedCustomer(Number(e.target.value))}
                >
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                   {customers.find(c => c.id === selectedCustomer)?.phone}
                </div>
             </div>

             {/* Items Table */}
             <table className="w-full text-right mb-6 border-collapse">
                <thead className="bg-orange-50 text-orange-800 border-t border-b border-orange-200">
                  <tr>
                    <th className="p-3 border-l border-orange-100">م</th>
                    <th className="p-3 border-l border-orange-100">الصنف / البيان</th>
                    <th className="p-3 border-l border-orange-100 text-center">الكمية</th>
                    <th className="p-3 border-l border-orange-100">سعر الوحدة</th>
                    <th className="p-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {cart.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 border-l border-gray-200">{idx + 1}</td>
                      <td className="p-3 border-l border-gray-200 font-medium">{item.name}</td>
                      <td className="p-3 border-l border-gray-200 text-center">{item.cartQuantity}</td>
                      <td className="p-3 border-l border-gray-200">{item.sellPrice.toLocaleString()}</td>
                      <td className="p-3 font-bold">{(item.sellPrice * item.cartQuantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
             </table>

             <div className="flex justify-end mt-8">
               <div className="w-64 bg-gray-50 p-4 rounded border border-gray-200">
                 <div className="flex justify-between font-bold text-xl text-gray-800">
                    <span>الإجمالي:</span>
                    <span>{cart.reduce((a, b) => a + (b.sellPrice * b.cartQuantity), 0).toLocaleString()} ج.م</span>
                 </div>
                 <p className="text-xs text-center text-gray-500 mt-2">* الأسعار سارية لمدة 3 أيام من تاريخ العرض</p>
               </div>
             </div>
             
             {/* Print Footer */}
             <div className="hidden print:block fixed bottom-0 left-0 w-full text-center border-t border-gray-300 pt-4 pb-4 bg-white">
                <p className="text-xs text-gray-600 mb-1">{settings.invoiceTerms}</p>
                <p className="text-[10px] text-gray-400">
                   {settings.companyName} - {settings.companyAddress} - ت: {settings.companyPhone}
                </p>
             </div>
          </div>

          <div className="bg-gray-100 p-4 border-t flex justify-between no-print">
            <button onClick={() => setView('list')} className="text-red-500 px-4 py-2 font-bold hover:bg-red-100 rounded">إلغاء</button>
            <div className="flex gap-2">
               <button onClick={() => window.print()} className="bg-gray-800 text-white px-6 py-2 rounded font-bold hover:bg-gray-700 flex items-center gap-2">
                 <Printer size={16} />
                 طباعة
               </button>
               <button onClick={handleSaveQuotation} className="bg-fox-600 text-white px-8 py-2 rounded font-bold hover:bg-fox-500 flex items-center gap-2">
                 <Check size={16} />
                 حفظ العرض
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-dark-950 p-4 rounded-xl border border-dark-800">
        <div className="relative w-96">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث في عروض الأسعار..." 
            className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setView('create')}
          className="flex items-center gap-2 px-6 py-2 bg-fox-600 text-white rounded-lg hover:bg-fox-500 font-bold"
        >
          <Plus size={18} />
          <span>عرض سعر جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQuotations.map(quote => (
          <div key={quote.id} className="bg-dark-950 border border-dark-800 rounded-xl p-5 hover:border-fox-500/30 transition-all">
             <div className="flex justify-between items-start mb-4">
               <div>
                 <h3 className="font-bold text-gray-200">{quote.customerName}</h3>
                 <span className="text-xs text-gray-500 font-mono">{quote.date.split('T')[0]}</span>
               </div>
               <span className={`px-2 py-1 rounded text-xs border ${
                 quote.status === 'converted' 
                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                 : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
               }`}>
                 {quote.status === 'converted' ? 'تم البيع' : 'معلق'}
               </span>
             </div>
             <div className="bg-dark-900 p-3 rounded-lg mb-4">
               <div className="flex justify-between text-sm text-gray-400 mb-1">
                 <span>عدد الأصناف</span>
                 <span>{quote.items.length}</span>
               </div>
               <div className="flex justify-between font-bold text-white">
                 <span>القيمة</span>
                 <span className="text-fox-400">{quote.totalAmount.toLocaleString()} ج.م</span>
               </div>
             </div>
             <div className="flex gap-2">
               {/* Using a hidden iframe or new window is better for printing strictly one quote, 
                   but for prototype window.print() with specific CSS suffices if we open it in view mode.
                   Here we assume the user views it first or we trigger print on the list item via a modal if refined further.
               */}
               <button onClick={() => { /* In a real app, open modal to print */ window.print() }} className="flex-1 py-2 bg-dark-800 text-gray-300 rounded hover:bg-dark-700 flex justify-center items-center gap-2">
                 <Printer size={16} />
                 طباعة
               </button>
               {quote.status === 'pending' && (
                 <button 
                   onClick={() => handleConvert(quote.id)}
                   className="flex-1 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-500 flex justify-center items-center gap-2 font-bold"
                 >
                   <Check size={16} />
                   تحويل لفاتورة
                 </button>
               )}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Quotations;
