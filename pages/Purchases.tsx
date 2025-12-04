
import React, { useState } from 'react';
import { Search, ShoppingBag, Trash2, Truck, Plus, AlertCircle, History, Eye, Printer, X, CheckCircle, RotateCcw } from 'lucide-react';
import { Product, Supplier, CartItem, PaymentMethod, Transaction, TransactionType } from '../types';
import { Modal } from '../components/Modal';

interface PurchasesProps {
  products: Product[];
  suppliers: Supplier[];
  transactions?: Transaction[];
  onCompletePurchase: (items: CartItem[], supplierId: number, paymentMethod: PaymentMethod, total: number, dueDate?: string) => void;
  onReturnTransaction?: (transaction: Transaction) => void;
}

const Purchases: React.FC<PurchasesProps> = ({ products, suppliers, transactions = [], onCompletePurchase, onReturnTransaction }) => {
  const [view, setView] = useState<'create' | 'history'>('create');
  
  // Create View State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<number>(suppliers[0]?.id || 0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.DEFERRED);
  const [dueDate, setDueDate] = useState('');

  // History View State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Printing State
  const [printReceipt, setPrintReceipt] = useState<Transaction | null>(null);

  // Filter products for selection
  const filteredProducts = products.filter(p => 
    p.name.includes(searchTerm) || p.sku.includes(searchTerm)
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev;
      return [...prev, { ...product, cartQuantity: 1, discount: 0 }];
    });
  };

  const updateCartItem = (id: number, field: keyof CartItem, value: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.costPrice * item.cartQuantity), 0);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    if (paymentMethod === PaymentMethod.DEFERRED && !dueDate) {
       alert('يرجى تحديد تاريخ استحقاق الدفع للفاتورة الآجلة');
       return;
    }

    if (window.confirm(`تأكيد فاتورة الشراء بقيمة ${totalAmount.toLocaleString()} ج.م؟`)) {
      onCompletePurchase(cart, selectedSupplier, paymentMethod, totalAmount, dueDate);
      setCart([]);
      setDueDate('');
    }
  };

  const purchaseHistory = transactions
    .filter(t => t.type === TransactionType.PURCHASE)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePrint = () => {
    window.print();
  };

  const handleReturn = () => {
    if (selectedTransaction && onReturnTransaction) {
      if (window.confirm('هل أنت متأكد من عمل مرتجع لهذه الفاتورة؟ سيتم عكس المخزون وحساب المورد.')) {
        onReturnTransaction(selectedTransaction);
        setSelectedTransaction(null);
      }
    }
  };

  return (
    <>
      <div className="flex gap-4 mb-4 no-print">
        <button 
          onClick={() => setView('create')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'create' ? 'bg-blue-600 text-white' : 'bg-dark-900 text-gray-400 hover:text-white'}`}
        >
          فاتورة شراء جديدة
        </button>
        <button 
          onClick={() => setView('history')}
          className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'history' ? 'bg-blue-600 text-white' : 'bg-dark-900 text-gray-400 hover:text-white'}`}
        >
          أرشيف المشتريات
        </button>
      </div>

      {view === 'create' ? (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Product Selection (Left) */}
          <div className="lg:w-1/3 flex flex-col bg-dark-950 rounded-xl border border-dark-800">
            <div className="p-4 border-b border-dark-800">
               <h3 className="text-gray-200 font-bold mb-3 flex items-center gap-2">
                 <ShoppingBag size={20} className="text-blue-500" />
                 إضافة منتجات للفاتورة
               </h3>
               <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="بحث عن منتج..." 
                  className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-blue-500 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
               {filteredProducts.map(product => (
                 <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className="bg-dark-900 p-3 rounded-lg border border-dark-800 hover:border-blue-500/50 cursor-pointer flex justify-between items-center group transition-all"
                 >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-dark-950 rounded overflow-hidden">
                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-200">{product.name}</h4>
                        <span className="text-xs text-gray-500">{product.sku}</span>
                      </div>
                    </div>
                    <Plus size={18} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                 </div>
               ))}
            </div>
          </div>

          {/* Invoice Details (Right) */}
          <div className="lg:w-2/3 flex flex-col bg-dark-950 rounded-xl border border-dark-800">
            {/* Header */}
            <div className="p-4 border-b border-dark-800 bg-dark-900/30 flex justify-between items-start">
               <div>
                 <h2 className="text-xl font-bold text-white mb-1">فاتورة شراء جديدة</h2>
                 <p className="text-xs text-gray-500">تسجيل بضاعة واردة من مورد</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end">
                    <label className="text-xs text-gray-400 mb-1">المورد</label>
                    <div className="relative w-64">
                       <Truck className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                       <select 
                          className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-3 py-2 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                          value={selectedSupplier}
                          onChange={e => setSelectedSupplier(Number(e.target.value))}
                       >
                          {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                       </select>
                    </div>
                  </div>
               </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50 gap-4">
                  <Truck size={64} />
                  <p>لم يتم إضافة منتجات للفاتورة</p>
                </div>
              ) : (
                <table className="w-full text-right text-sm">
                  <thead className="bg-dark-900 text-gray-400">
                    <tr>
                      <th className="p-3 rounded-r-lg">المنتج</th>
                      <th className="p-3 w-32">سعر الشراء</th>
                      <th className="p-3 w-32">الكمية</th>
                      <th className="p-3">الإجمالي</th>
                      <th className="p-3 rounded-l-lg w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800">
                    {cart.map(item => (
                      <tr key={item.id} className="hover:bg-dark-900/30">
                        <td className="p-3 font-medium text-gray-200">{item.name}</td>
                        <td className="p-3">
                          <input 
                            type="number" 
                            className="w-24 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-blue-500 outline-none"
                            value={item.costPrice}
                            onChange={(e) => updateCartItem(item.id, 'costPrice', Number(e.target.value))}
                          />
                        </td>
                        <td className="p-3">
                           <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                className="w-20 bg-dark-900 border border-dark-700 rounded px-2 py-1 text-center text-white focus:border-blue-500 outline-none font-bold"
                                value={item.cartQuantity}
                                onChange={(e) => updateCartItem(item.id, 'cartQuantity', Number(e.target.value))}
                              />
                              <span className="text-xs text-gray-500">{item.unit}</span>
                           </div>
                        </td>
                        <td className="p-3 font-mono text-blue-400">{(item.costPrice * item.cartQuantity).toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="bg-dark-900 p-4 border-t border-dark-800">
               <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-4">
                     <button 
                       onClick={() => setPaymentMethod(PaymentMethod.DEFERRED)}
                       className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                         paymentMethod === PaymentMethod.DEFERRED 
                         ? 'bg-red-500/20 border-red-500 text-red-400' 
                         : 'border-dark-700 text-gray-400'
                       }`}
                     >
                       آجل (دين علي)
                     </button>
                     <button 
                       onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                       className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                         paymentMethod === PaymentMethod.CASH 
                         ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                         : 'border-dark-700 text-gray-400'
                       }`}
                     >
                       دفع نقدي (من الخزينة)
                     </button>
                  </div>
                  
                  <div className="text-right">
                     <p className="text-gray-400 text-sm">إجمالي الفاتورة</p>
                     <p className="text-2xl font-bold text-white neon-text">{totalAmount.toLocaleString()} <span className="text-sm text-gray-500">ج.م</span></p>
                  </div>
               </div>

               {paymentMethod === PaymentMethod.DEFERRED && (
                   <div className="mb-4 animate-in fade-in">
                      <label className="text-xs text-red-400 mb-1 block">تاريخ استحقاق الدفع (Due Date)</label>
                      <input 
                        type="date" 
                        className="w-full bg-dark-950 border border-red-900/50 text-white p-2 rounded text-sm focus:border-red-500 outline-none"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        required
                      />
                   </div>
               )}

               <button 
                 disabled={cart.length === 0}
                 onClick={handleSubmit}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                 <Truck size={20} />
                 <span>حفظ فاتورة الشراء وتحديث المخزن</span>
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-950 rounded-xl border border-dark-800 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            <div className="flex-1 overflow-auto">
               <table className="w-full text-right text-sm">
                  <thead className="bg-dark-900 text-gray-400 sticky top-0">
                     <tr>
                        <th className="p-4">رقم الحركة</th>
                        <th className="p-4">التاريخ</th>
                        <th className="p-4">المورد</th>
                        <th className="p-4">المبلغ</th>
                        <th className="p-4">طريقة الدفع</th>
                        <th className="p-4 text-center">تفاصيل</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-800 text-gray-300">
                     {purchaseHistory.length === 0 ? (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-500">لا توجد عمليات شراء سابقة</td></tr>
                     ) : (
                       purchaseHistory.map(pur => {
                          const supplier = suppliers.find(s => s.id === pur.relatedId);
                          return (
                             <tr key={pur.id} className="hover:bg-dark-900/50">
                                <td className="p-4 font-mono text-blue-400">{pur.id}</td>
                                <td className="p-4">{new Date(pur.date).toLocaleString('ar-EG')}</td>
                                <td className="p-4">{supplier?.name || 'مورد غير معروف'}</td>
                                <td className="p-4 font-bold text-white">{pur.amount.toLocaleString()} ج.م</td>
                                <td className="p-4">{pur.paymentMethod}</td>
                                <td className="p-4 flex justify-center">
                                   <button 
                                     onClick={() => setSelectedTransaction(pur)}
                                     className="p-2 hover:bg-dark-800 rounded text-gray-400 hover:text-white transition-colors"
                                   >
                                      <Eye size={18} />
                                   </button>
                                </td>
                             </tr>
                          );
                       })
                     )}
                  </tbody>
               </table>
            </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="تفاصيل فاتورة الشراء"
      >
        <div className="space-y-4">
           {selectedTransaction && (
             <>
                <div className="bg-dark-900 p-4 rounded-lg border border-dark-800 grid grid-cols-2 gap-4 text-sm">
                   <div>
                     <span className="text-gray-500 block mb-1">التاريخ</span>
                     <span className="text-white font-mono">{new Date(selectedTransaction.date).toLocaleString('ar-EG')}</span>
                   </div>
                   <div>
                     <span className="text-gray-500 block mb-1">المورد</span>
                     <span className="text-white">{suppliers.find(s => s.id === selectedTransaction.relatedId)?.name}</span>
                   </div>
                   <div>
                     <span className="text-gray-500 block mb-1">المبلغ الإجمالي</span>
                     <span className="text-blue-500 font-bold text-lg">{selectedTransaction.amount.toLocaleString()} ج.م</span>
                   </div>
                   <div className="flex items-end">
                      <button 
                         onClick={() => {
                           setPrintReceipt(selectedTransaction);
                           setTimeout(() => window.print(), 100);
                         }}
                         className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs transition-colors"
                      >
                         <Printer size={14} />
                         طباعة إذن استلام
                      </button>
                   </div>
                </div>

                <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
                   <table className="w-full text-sm text-right">
                     <thead className="bg-dark-800 text-gray-500">
                       <tr>
                         <th className="p-2">الصنف</th>
                         <th className="p-2">الكمية</th>
                         <th className="p-2">التكلفة</th>
                         <th className="p-2">الإجمالي</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-dark-800">
                       {selectedTransaction.items?.map((item, idx) => (
                         <tr key={idx}>
                           <td className="p-2 text-gray-300">{item.name}</td>
                           <td className="p-2 text-gray-300">{item.cartQuantity}</td>
                           <td className="p-2 text-gray-300">{item.costPrice}</td>
                           <td className="p-2 font-bold text-gray-200">
                             {(item.costPrice * item.cartQuantity).toLocaleString()}
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>

                {onReturnTransaction && (
                  <div className="pt-4 border-t border-dark-800">
                     <button 
                       onClick={handleReturn}
                       className="w-full flex items-center justify-center gap-2 py-2 bg-red-600/10 text-red-500 border border-red-500/30 rounded-lg hover:bg-red-600/20 transition-colors"
                     >
                       <RotateCcw size={16} />
                       عمل مرتجع كامل للفاتورة
                     </button>
                  </div>
                )}
             </>
           )}
        </div>
      </Modal>
      
      {/* Print Goods Receipt Modal (Hidden in View, Visible in Print) */}
      {printReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-white text-black w-full max-w-lg rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:h-full print:rounded-none">
             <div className="p-6 border-b-2 border-dashed border-gray-300 relative">
                {/* Close Button (Hidden in Print) */}
                <button 
                   onClick={() => setPrintReceipt(null)} 
                   className="absolute top-4 left-4 text-gray-400 hover:text-red-500 no-print"
                >
                   <X size={24} />
                </button>

                <div className="text-center mb-6">
                   <h1 className="text-2xl font-bold border-b-2 border-black inline-block pb-1">إذن استلام مخزني</h1>
                   <p className="text-sm text-gray-600 mt-2">رقم الإذن: {printReceipt.id}</p>
                   <p className="text-sm text-gray-600">التاريخ: {new Date(printReceipt.date).toLocaleString('ar-EG')}</p>
                </div>

                <div className="flex justify-between mb-6 text-sm">
                   <div className="text-right">
                      <p className="font-bold">المورد:</p>
                      <p>{suppliers.find(s => s.id === printReceipt.relatedId)?.name}</p>
                   </div>
                   <div className="text-left">
                      <p className="font-bold">المستلم:</p>
                      <p>أمين المخزن</p>
                   </div>
                </div>

                <table className="w-full text-sm text-right border-collapse border border-gray-300">
                   <thead className="bg-gray-100">
                      <tr>
                         <th className="p-2 border border-gray-300">م</th>
                         <th className="p-2 border border-gray-300">اسم الصنف</th>
                         <th className="p-2 border border-gray-300 text-center">الكمية</th>
                         <th className="p-2 border border-gray-300 text-center">ملاحظات</th>
                      </tr>
                   </thead>
                   <tbody>
                      {printReceipt.items?.map((item, idx) => (
                         <tr key={idx}>
                            <td className="p-2 border border-gray-300 text-center">{idx + 1}</td>
                            <td className="p-2 border border-gray-300">{item.name}</td>
                            <td className="p-2 border border-gray-300 text-center font-bold">{item.cartQuantity} {item.unit}</td>
                            <td className="p-2 border border-gray-300"></td>
                         </tr>
                      ))}
                   </tbody>
                </table>

                <div className="flex justify-between mt-12 text-center text-sm">
                   <div>
                      <p className="font-bold mb-8">توقيع المستلم</p>
                      <p className="border-t border-black w-32 mx-auto"></p>
                   </div>
                   <div>
                      <p className="font-bold mb-8">اعتماد المدير</p>
                      <p className="border-t border-black w-32 mx-auto"></p>
                   </div>
                </div>
             </div>
             
             <div className="bg-gray-100 p-4 flex gap-3 no-print">
               <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-500 flex items-center justify-center gap-2">
                 <Printer size={18} />
                 طباعة الإذن
               </button>
             </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Purchases;
