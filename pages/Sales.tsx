
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, CreditCard, User, Box, Printer, CheckCircle, X, ScanBarcode, History, Eye, RotateCcw, Zap, Percent, Calculator, Calendar, Keyboard, PauseCircle, PlayCircle, Lock, Unlock, Banknote, UserPlus } from 'lucide-react';
import { Product, Customer, CartItem, PaymentMethod, AppSettings, Transaction, TransactionType, User as AppUser, Shift } from '../types';
import { Modal } from '../components/Modal';

interface SalesProps {
  products: Product[];
  customers: Customer[];
  transactions: Transaction[];
  onCompleteSale: (items: CartItem[], customerId: number, paymentMethod: PaymentMethod, paidAmount: number, invoiceId: string, isDirectSale: boolean, dueDate?: string) => void;
  onReturnTransaction?: (transaction: Transaction) => void;
  settings: AppSettings;
  currentUser: AppUser;
  onOpenShift: (startCash: number) => void;
  onCloseShift: (endCash: number) => Shift | undefined;
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Customer;
}

interface HeldCart {
  id: number;
  customerName: string;
  items: CartItem[];
  date: string;
}

const Sales: React.FC<SalesProps> = ({ products, customers, transactions, onCompleteSale, onReturnTransaction, settings, currentUser, onOpenShift, onCloseShift, onAddCustomer }) => {
  const [view, setView] = useState<'pos' | 'history'>('pos');
  
  // Shift State
  const [startCash, setStartCash] = useState('');
  const [endCash, setEndCash] = useState('');
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [lastClosedShift, setLastClosedShift] = useState<Shift | null>(null);

  // POS State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [isDirectSale, setIsDirectSale] = useState(false); 
  const [dueDate, setDueDate] = useState(''); 
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Quick Customer State
  const [isQuickCustomerModalOpen, setIsQuickCustomerModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Held Carts
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>(() => {
    const saved = localStorage.getItem('fox_erp_held_carts');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHeldCartsModal, setShowHeldCartsModal] = useState(false);

  // Discount Modal State
  const [discountModalItem, setDiscountModalItem] = useState<{id: number, price: number, currentDiscount: number} | null>(null);
  const [discountValue, setDiscountValue] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');

  // History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyDate, setHistoryDate] = useState('');

  // Invoice Modal State (for Print)
  const [lastInvoice, setLastInvoice] = useState<{ id: string, items: CartItem[], total: number, customer: string, date: string, tax: number, subTotal: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('fox_erp_held_carts', JSON.stringify(heldCarts));
  }, [heldCarts]);

  if (!settings.currentShiftId && view === 'pos') {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] animate-in fade-in">
         <div className="bg-dark-950 p-8 rounded-2xl border border-dark-800 shadow-2xl w-full max-w-md text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-fox-500 to-fox-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-fox-500/30">
               <Lock size={40} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">الوردية مغلقة (Shift Closed)</h1>
            <p className="text-gray-400 mb-6">يجب فتح الوردية وتحديد رصيد بداية الدرج قبل البدء في البيع.</p>
            
            <div className="text-right mb-4">
              <label className="text-sm text-gray-300 font-bold mb-2 block">رصيد بداية الدرج (Opening Cash)</label>
              <div className="relative">
                 <Banknote className="absolute right-3 top-3 text-gray-500" />
                 <input 
                   type="number" 
                   autoFocus
                   className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-3 rounded-lg focus:border-fox-500 outline-none text-xl font-bold"
                   placeholder="0.00"
                   value={startCash}
                   onChange={e => setStartCash(e.target.value)}
                   onKeyDown={e => {
                     if (e.key === 'Enter') onOpenShift(Number(startCash) || 0);
                   }}
                 />
              </div>
            </div>
            
            <button 
               onClick={() => onOpenShift(Number(startCash) || 0)}
               className="w-full bg-fox-600 hover:bg-fox-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
            >
               <Unlock size={20} />
               فتح الوردية وبدء العمل
            </button>
         </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const customerObj = customers.find(c => c.id === selectedCustomer);
  const isConsumer = customerObj?.type === 'consumer';

  const addToCart = (product: Product) => {
    if (!isDirectSale && product.quantity <= 0) {
      if(settings.preventNegativeStock) {
         alert('عذراً، المنتج غير متوفر والنظام يمنع البيع بالسالب.');
         return;
      } else {
         alert('تنبيه: المنتج غير متوفر في المخزون!');
      }
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (!isDirectSale && existing.cartQuantity >= product.quantity) {
           if(settings.preventNegativeStock) {
              alert('لا توجد كمية كافية (الكمية محدودة).');
              return prev;
           } else {
              alert('تنبيه: الكمية في السلة تجاوزت المخزون');
           }
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1, discount: 0 }];
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm) {
      const exactMatch = products.find(p => 
        p.sku.toLowerCase() === searchTerm.toLowerCase() || 
        p.name.toLowerCase() === searchTerm.toLowerCase()
      );
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchTerm('');
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    }
  };

  const updateQuantity = (id: number, newQty: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if (!isDirectSale && product && newQty > product.quantity) {
           if(settings.preventNegativeStock) {
              alert('لا توجد كمية كافية');
              return item;
           }
        }
        return newQty > 0 ? { ...item, cartQuantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const openDiscountModal = (item: CartItem) => {
    setDiscountModalItem({ id: item.id, price: item.sellPrice, currentDiscount: item.discount });
    setDiscountValue(item.discount.toString());
    setDiscountType('percent');
  };

  const applyDiscount = () => {
    if (!discountModalItem) return;
    let finalPercent = 0;
    const val = parseFloat(discountValue) || 0;
    if (discountType === 'percent') {
      finalPercent = Math.min(100, Math.max(0, val));
    } else {
      finalPercent = (val / discountModalItem.price) * 100;
      finalPercent = Math.min(100, Math.max(0, finalPercent));
    }
    setCart(prev => prev.map(item => 
      item.id === discountModalItem.id ? { ...item, discount: finalPercent } : item
    ));
    setDiscountModalItem(null);
    setDiscountValue('');
  };

  const subTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.cartQuantity), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + (item.sellPrice * item.cartQuantity * (item.discount / 100)), 0);
  const netBeforeTax = subTotal - totalDiscount;
  const taxAmount = netBeforeTax * ((settings.taxRate || 0) / 100);
  const total = netBeforeTax + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Strict Stock Check before checkout
    if (!isDirectSale && settings.preventNegativeStock) {
       const invalidItems = cart.filter(item => {
          const product = products.find(p => p.id === item.id);
          return product && item.cartQuantity > product.quantity;
       });
       if (invalidItems.length > 0) {
          alert(`خطأ: لا يمكن إتمام البيع. الكمية غير متوفرة للأصناف التالية: ${invalidItems.map(i => i.name).join(', ')}`);
          return;
       }
    }

    const losingItems = cart.filter(item => {
       const finalPrice = item.sellPrice * (1 - item.discount / 100);
       return finalPrice < item.costPrice;
    });

    if (losingItems.length > 0) {
       if (!window.confirm(`تحذير هام: هناك ${losingItems.length} أصناف سيتم بيعها بأقل من سعر التكلفة! هل أنت متأكد؟`)) return;
    }

    const invoiceId = settings.nextInvoiceNumber.toString();
    if (paymentMethod === PaymentMethod.DEFERRED && customerObj) {
       const currentDebt = customerObj.balance < 0 ? Math.abs(customerObj.balance) : 0;
       const newTotalDebt = currentDebt + total;
       if (customerObj.creditLimit > 0 && newTotalDebt > customerObj.creditLimit) {
         if (!window.confirm(`تحذير: هذا العميل سيتجاوز الحد الائتماني المسموح.`)) return;
       }
       if (!dueDate) {
          alert('يرجى تحديد تاريخ الاستحقاق للفواتير الآجلة');
          return;
       }
    }

    if (window.confirm(`تأكيد عملية البيع بمبلغ ${total.toLocaleString()} ج.م؟`)) {
      onCompleteSale(cart, selectedCustomer, paymentMethod, total, invoiceId, isDirectSale, dueDate);
      setLastInvoice({
        id: invoiceId,
        items: [...cart],
        total: total,
        customer: customerObj?.name || 'عميل نقدي',
        date: new Date().toLocaleString('ar-EG'),
        tax: taxAmount,
        subTotal: netBeforeTax
      });
      setCart([]);
      setSearchTerm('');
      setDueDate('');
      if (settings.autoPrint) setTimeout(() => window.print(), 500);
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName || !newCustomerPhone) return;
    const newCustomer = onAddCustomer({
      name: newCustomerName,
      phone: newCustomerPhone,
      type: 'consumer',
      balance: 0,
      creditLimit: 0
    });
    setSelectedCustomer(newCustomer.id);
    setIsQuickCustomerModalOpen(false);
    setNewCustomerName('');
    setNewCustomerPhone('');
    alert('تم إضافة العميل وتحديده بنجاح');
  };

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const customerName = customers.find(c => c.id === selectedCustomer)?.name || 'غير معروف';
    const newHeld: HeldCart = {
      id: Date.now(),
      customerName,
      items: [...cart],
      date: new Date().toLocaleTimeString('ar-EG')
    };
    setHeldCarts(prev => [newHeld, ...prev]);
    setCart([]);
    setSearchTerm('');
  };

  const handleRecallCart = (held: HeldCart) => {
    if (cart.length > 0) {
      if(!window.confirm('السلة الحالية ليست فارغة. هل تريد استبدالها؟')) return;
    }
    setCart(held.items);
    setHeldCarts(prev => prev.filter(c => c.id !== held.id));
    setShowHeldCartsModal(false);
  };

  const handleCloseShiftSubmit = () => {
    const shift = onCloseShift(Number(endCash) || 0);
    if (shift) {
      setLastClosedShift(shift);
      setIsCloseShiftModalOpen(false);
      setEndCash('');
    }
  };

  const salesHistory = transactions
    .filter(t => t.type === TransactionType.SALE)
    .filter(t => t.id.includes(historySearch) || customers.find(c => c.id === t.relatedId)?.name.includes(historySearch))
    .filter(t => !historyDate || t.date.startsWith(historyDate))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleReturn = (transaction: Transaction) => {
    if (onReturnTransaction && window.confirm('هل أنت متأكد من عمل مرتجع لهذه الفاتورة؟')) {
       onReturnTransaction(transaction);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-4 mb-4 items-center no-print">
        <div className="flex gap-2">
          <button 
            onClick={() => setView('pos')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'pos' ? 'bg-fox-600 text-white' : 'bg-dark-900 text-gray-400 hover:text-white'}`}
          >
            نقطة البيع (POS)
          </button>
          <button 
            onClick={() => setView('history')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${view === 'history' ? 'bg-fox-600 text-white' : 'bg-dark-900 text-gray-400 hover:text-white'}`}
          >
            سجل الفواتير
          </button>
        </div>
        
        {/* Shortcuts Hint */}
        {view === 'pos' && (
           <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500 border border-dark-800 rounded px-3 py-1 bg-dark-950">
             <Keyboard size={14} />
             <div className="flex gap-3">
               <span><kbd className="bg-dark-800 px-1 rounded">F2</kbd> بحث</span>
               <span><kbd className="bg-dark-800 px-1 rounded">F9</kbd> دفع</span>
             </div>
           </div>
        )}

        <div className="flex-1 flex justify-end gap-3">
           <div 
             onClick={() => setIsDirectSale(!isDirectSale)}
             className={`cursor-pointer px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${isDirectSale ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'bg-dark-900 border-dark-700 text-gray-400'}`}
           >
             <Zap size={18} />
             <span className="font-bold">بيع مباشر</span>
           </div>
           
           {/* Close Shift Button */}
           <button 
             onClick={() => setIsCloseShiftModalOpen(true)}
             className="px-4 py-2 bg-red-900/20 text-red-500 border border-red-500/30 rounded-lg font-bold hover:bg-red-900/40 flex items-center gap-2"
           >
             <Lock size={18} />
             إغلاق الوردية
           </button>
        </div>
      </div>

      {view === 'pos' ? (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
          {/* Left Column: Products Grid (65%) */}
          <div className="lg:w-[65%] flex flex-col bg-dark-950 rounded-xl border border-dark-800 overflow-hidden relative">
             {isDirectSale && <div className="bg-purple-600 text-white text-center py-1 text-xs font-bold animate-pulse">وضع البيع المباشر مفعل</div>}
            <div className="p-4 border-b border-dark-800 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-fox-500" size={20} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="بحث باسم المنتج أو مسح الباركود..." 
                  className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-12 py-2.5 rounded-lg focus:outline-none focus:border-fox-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors border ${
                      selectedCategory === cat ? 'bg-fox-500 text-white border-fox-500' : 'bg-dark-900 text-gray-400 border-dark-700 hover:bg-dark-800'
                    }`}
                  >
                    {cat === 'all' ? 'الكل' : cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 content-start">
              {filteredProducts.map(product => {
                const isOutOfStock = !isDirectSale && product.quantity <= 0;
                return (
                  <div 
                    key={product.id} 
                    onClick={() => addToCart(product)}
                    className={`bg-dark-900 border border-dark-800 rounded-lg p-3 cursor-pointer hover:border-fox-500/50 hover:bg-dark-800 transition-all group relative overflow-hidden ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="aspect-square bg-dark-950 rounded mb-3 flex items-center justify-center overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-gray-200 text-sm font-medium line-clamp-2 h-10 mb-1">{product.name}</h4>
                    <div className="flex justify-between items-end">
                      <span className="text-fox-400 font-bold">{product.sellPrice} ج.م</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${product.quantity > 0 ? 'text-gray-500 bg-dark-950 border-dark-800' : 'text-red-500 bg-red-900/20 border-red-900/30'}`}>
                        {product.quantity > 0 ? `${product.quantity} ${product.unit}` : 'نفذت'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Cart & Checkout (35%) */}
          <div className="lg:w-[35%] flex flex-col bg-dark-950 rounded-xl border border-dark-800 shadow-xl">
            <div className="p-4 border-b border-dark-800 bg-dark-900/50 flex flex-col gap-2">
               <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-500 mb-1 block">العميل</label>
                  <div className="flex gap-2">
                    <button onClick={() => setShowHeldCartsModal(true)} className="text-[10px] flex items-center gap-1 bg-blue-900/30 text-blue-400 border border-blue-800 px-2 py-1 rounded">
                       <PlayCircle size={12} /> استدعاء
                    </button>
                    <button onClick={handleHoldCart} disabled={cart.length === 0} className="text-[10px] flex items-center gap-1 bg-yellow-900/30 text-yellow-400 border border-yellow-800 px-2 py-1 rounded">
                       <PauseCircle size={12} /> تعليق
                    </button>
                  </div>
               </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <select 
                    className="w-full bg-dark-950 border border-dark-700 text-white py-2 px-3 pr-10 rounded-lg appearance-none focus:border-fox-500 focus:outline-none"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type === 'consumer' ? 'نقدي' : 'آجل'})</option>
                    ))}
                  </select>
                  <User className="absolute right-3 top-2.5 text-gray-500" size={18} />
                </div>
                {/* Quick Add Customer */}
                <button 
                   onClick={() => setIsQuickCustomerModalOpen(true)}
                   className="p-2 bg-fox-600 hover:bg-fox-500 text-white rounded-lg"
                   title="إضافة عميل سريع"
                >
                   <UserPlus size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-50">
                  <Box size={48} />
                  <p>السلة فارغة - امسح الباركود للبدء</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-dark-900 border border-dark-800 rounded-lg p-3 flex gap-3 animate-in fade-in">
                     <div className="w-14 h-14 bg-dark-950 rounded flex items-center justify-center shrink-0"><img src={item.image} className="w-full h-full object-cover rounded" alt="" /></div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1">
                         <h5 className="text-sm font-medium text-gray-200 truncate">{item.name}</h5>
                         <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                       </div>
                       <div className="flex items-center justify-between mt-2">
                         <div className="flex items-center gap-2">
                            <div className="flex items-center bg-dark-950 rounded border border-dark-700 h-8">
                              <button onClick={() => updateQuantity(item.id, item.cartQuantity + 1)} className="px-2 text-gray-400 hover:text-white hover:bg-dark-800 h-full">+</button>
                              <input type="number" className="w-10 text-center bg-transparent text-white text-sm focus:outline-none appearance-none" value={item.cartQuantity} onChange={(e) => updateQuantity(item.id, Number(e.target.value))} step="0.1" />
                              <button onClick={() => updateQuantity(item.id, item.cartQuantity - 1)} className="px-2 text-gray-400 hover:text-white hover:bg-dark-800 h-full">-</button>
                            </div>
                         </div>
                         <div className="flex flex-col items-end">
                           <div className="flex items-center gap-2">
                              {item.discount > 0 && <span className="text-xs text-red-400 line-through">{(item.sellPrice * item.cartQuantity).toLocaleString()}</span>}
                              <span className="text-fox-400 text-sm font-bold">{(item.sellPrice * item.cartQuantity * (1 - item.discount/100)).toLocaleString()}</span>
                           </div>
                           <button onClick={() => openDiscountModal(item)} className="text-[10px] px-1.5 py-0.5 rounded border bg-dark-800 text-gray-500 border-dark-700 flex items-center gap-1"><Percent size={10} /> خصم</button>
                         </div>
                       </div>
                     </div>
                  </div>
                ))
              )}
            </div>

            <div className="bg-dark-900 p-4 border-t border-dark-800 space-y-3">
               <div className="space-y-1 text-sm">
                 <div className="flex justify-between text-gray-400"><span>المجموع الفرعي</span><span>{subTotal.toLocaleString()} ج.م</span></div>
                 {totalDiscount > 0 && <div className="flex justify-between text-emerald-400"><span>خصم</span><span>- {totalDiscount.toLocaleString()} ج.م</span></div>}
                 {(settings.taxRate || 0) > 0 && <div className="flex justify-between text-blue-400"><span>ضريبة ({settings.taxRate}%)</span><span>+ {taxAmount.toLocaleString()} ج.م</span></div>}
                 <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-dark-800 mt-2"><span>الإجمالي</span><span className="text-fox-500 neon-text">{total.toLocaleString()} ج.م</span></div>
               </div>
               
               <div className="grid grid-cols-3 gap-2 py-2">
                 {[PaymentMethod.CASH, PaymentMethod.WALLET, PaymentMethod.INSTAPAY].map(method => (
                   <button key={method} onClick={() => setPaymentMethod(method)} className={`py-2 text-xs rounded border transition-colors ${paymentMethod === method ? 'bg-fox-600 border-fox-600 text-white' : 'bg-transparent border-dark-700 text-gray-400'}`}>{method}</button>
                 ))}
                 <button onClick={() => !isConsumer && setPaymentMethod(PaymentMethod.DEFERRED)} disabled={isConsumer} className={`py-2 text-xs rounded border transition-colors col-span-3 ${paymentMethod === PaymentMethod.DEFERRED ? 'bg-red-600 border-red-600 text-white' : isConsumer ? 'opacity-50' : 'text-red-400 border-dark-700'}`}>{isConsumer ? 'آجل (غير متاح للمستهلك)' : 'آجل (دين)'}</button>
               </div>
               
               {paymentMethod === PaymentMethod.DEFERRED && (
                 <div className="animate-in fade-in"><label className="text-xs text-red-400 mb-1 block">تاريخ الاستحقاق</label><input type="date" className="w-full bg-dark-950 border border-red-900/50 text-white p-2 rounded text-sm focus:border-red-500 outline-none" value={dueDate} onChange={e => setDueDate(e.target.value)} required /></div>
               )}

               <button disabled={cart.length === 0} onClick={handleCheckout} className="w-full bg-gradient-to-r from-fox-600 to-red-600 hover:from-fox-500 hover:to-red-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-fox-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                 <CreditCard size={20} /> <span>إتمام البيع (F9)</span>
               </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-dark-950 rounded-xl border border-dark-800 overflow-hidden h-[calc(100vh-200px)] flex flex-col">
            {/* Sales History Table */}
            <div className="p-4 border-b border-dark-800 flex items-center gap-4">
               <input type="text" placeholder="بحث برقم الفاتورة أو العميل..." className="bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg" value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
               <input type="date" className="bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg" value={historyDate} onChange={e => setHistoryDate(e.target.value)} />
            </div>
            <div className="flex-1 overflow-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-dark-900 text-gray-400">
                    <tr>
                       <th className="p-4">الفاتورة</th>
                       <th className="p-4">المبلغ</th>
                       <th className="p-4">التاريخ</th>
                       <th className="p-4">العميل</th>
                       {currentUser.role === 'admin' && <th className="p-4">الربح</th>}
                       <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-dark-800 text-gray-300">
                    {salesHistory.map(s => {
                        // Profit Calculation for Admin
                        let profit = 0;
                        if(currentUser.role === 'admin' && s.items) {
                           const cost = s.items.reduce((a, b) => a + (b.costPrice * b.cartQuantity), 0);
                           profit = s.amount - cost; 
                        }
                        const customerName = customers.find(c => c.id === s.relatedId)?.name || 'غير معروف';

                        return (
                           <tr key={s.id} className="hover:bg-dark-900">
                              <td className="p-4 font-mono text-fox-400">{s.id}</td>
                              <td className="p-4 font-bold text-white">{s.amount.toLocaleString()}</td>
                              <td className="p-4">{new Date(s.date).toLocaleString('ar-EG')}</td>
                              <td className="p-4">{customerName}</td>
                              {currentUser.role === 'admin' && <td className="p-4 text-emerald-400">{profit.toLocaleString()}</td>}
                              <td className="p-4 flex justify-center gap-2">
                                 <button onClick={() => {
                                    setLastInvoice({
                                       id: s.id, items: s.items || [], total: s.amount, customer: customerName, date: new Date(s.date).toLocaleString('ar-EG'),
                                       tax: 0, subTotal: s.amount // simplified for history view
                                    });
                                 }} className="p-2 text-gray-400 hover:text-white bg-dark-800 rounded">
                                    <Eye size={16} />
                                 </button>
                                 <button onClick={() => handleReturn(s)} className="p-2 text-gray-400 hover:text-red-500 bg-dark-800 rounded">
                                    <RotateCcw size={16} />
                                 </button>
                              </td>
                           </tr>
                        );
                    })}
                 </tbody>
               </table>
            </div>
        </div>
      )}
      
      {/* Quick Add Customer Modal */}
      <Modal 
         isOpen={isQuickCustomerModalOpen} 
         onClose={() => setIsQuickCustomerModalOpen(false)} 
         title="إضافة عميل سريع"
      >
         <form onSubmit={handleQuickAddCustomer} className="space-y-4">
             <div>
                <label className="block text-sm text-gray-400 mb-1">اسم العميل</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                />
             </div>
             <div>
                <label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label>
                <input 
                  required 
                  type="text" 
                  className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                />
             </div>
             <button type="submit" className="w-full bg-fox-600 text-white py-2 rounded-lg font-bold hover:bg-fox-500">حفظ واختيار العميل</button>
         </form>
      </Modal>

      {/* Held Carts Modal */}
      {showHeldCartsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-dark-950 border border-dark-700 w-full max-w-lg rounded-xl p-5">
              <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-white">الفواتير المعلقة</h3><button onClick={() => setShowHeldCartsModal(false)}><X className="text-gray-500" /></button></div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                 {heldCarts.map(cart => (
                    <div key={cart.id} className="bg-dark-900 p-3 rounded flex justify-between">
                       <div><p className="text-white font-bold">{cart.customerName}</p><p className="text-xs text-gray-500">{cart.date}</p></div>
                       <button onClick={() => handleRecallCart(cart)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">استدعاء</button>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* Discount Modal */}
      {discountModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-dark-950 border border-fox-500/30 w-full max-w-sm rounded-xl p-5">
              <h3 className="font-bold text-white mb-4">إضافة خصم</h3>
              <div className="flex gap-2 mb-4">
                 <button onClick={() => setDiscountType('percent')} className={`flex-1 py-2 rounded text-sm ${discountType === 'percent' ? 'bg-fox-600 text-white' : 'bg-dark-900 text-gray-400'}`}>نسبة %</button>
                 <button onClick={() => setDiscountType('amount')} className={`flex-1 py-2 rounded text-sm ${discountType === 'amount' ? 'bg-fox-600 text-white' : 'bg-dark-900 text-gray-400'}`}>مبلغ</button>
              </div>
              <input 
                 type="number" 
                 autoFocus
                 className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none mb-4"
                 placeholder={discountType === 'percent' ? 'النسبة %' : 'المبلغ'}
                 value={discountValue}
                 onChange={e => setDiscountValue(e.target.value)}
              />
              <div className="flex gap-2">
                 <button onClick={applyDiscount} className="flex-1 bg-fox-600 text-white py-2 rounded font-bold">تطبيق</button>
                 <button onClick={() => setDiscountModalItem(null)} className="flex-1 bg-dark-800 text-gray-400 py-2 rounded font-bold">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* Close Shift Modal */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="bg-dark-950 border border-red-500/30 w-full max-w-md rounded-xl p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Lock className="text-red-500"/> إغلاق الوردية (End of Day)</h2>
              <p className="text-gray-400 text-sm mb-4">يرجى عد الأموال الموجودة في الدرج (الكاش فقط) وإدخال القيمة أدناه.</p>
              
              <div className="mb-6">
                 <label className="text-sm text-gray-300 font-bold mb-2 block">الكاش الفعلي في الدرج</label>
                 <input 
                   type="number" 
                   autoFocus
                   className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-red-500 outline-none text-lg font-bold"
                   value={endCash}
                   onChange={e => setEndCash(e.target.value)}
                 />
              </div>
              
              <div className="flex gap-3">
                 <button onClick={handleCloseShiftSubmit} className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-500">تأكيد الإغلاق</button>
                 <button onClick={() => setIsCloseShiftModalOpen(false)} className="flex-1 bg-dark-800 text-gray-300 py-2 rounded font-bold hover:bg-dark-700">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* Z-Report Modal */}
      {lastClosedShift && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white text-black w-full max-w-md rounded-xl p-8 shadow-2xl print:w-full print:h-full print:rounded-none">
               <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <h1 className="text-2xl font-bold">تقرير إغلاق وردية (Z-Report)</h1>
                  <p className="text-sm">{settings.companyName}</p>
                  <p className="text-xs text-gray-500">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
               </div>
               
               <div className="space-y-2 text-sm text-right mb-6">
                  <div className="flex justify-between"><span>الكاشير:</span> <span className="font-bold">{lastClosedShift.userName}</span></div>
                  <div className="flex justify-between"><span>وقت البدء:</span> <span>{new Date(lastClosedShift.startTime).toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span>وقت الإغلاق:</span> <span>{new Date(lastClosedShift.endTime!).toLocaleTimeString()}</span></div>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  
                  {/* Detailed Sales Breakdown */}
                  {lastClosedShift.salesByMethod && (
                    <>
                       <div className="font-bold mb-1">تفاصيل المبيعات:</div>
                       <div className="flex justify-between text-xs"><span>كاش:</span> <span>{lastClosedShift.salesByMethod[PaymentMethod.CASH]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>محفظة:</span> <span>{lastClosedShift.salesByMethod[PaymentMethod.WALLET]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>Instapay:</span> <span>{lastClosedShift.salesByMethod[PaymentMethod.INSTAPAY]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>آجل:</span> <span>{lastClosedShift.salesByMethod[PaymentMethod.DEFERRED]?.toLocaleString() || 0}</span></div>
                       <div className="border-t border-dashed border-gray-400 my-2"></div>
                    </>
                  )}

                  <div className="flex justify-between"><span>بداية الدرج:</span> <span>{lastClosedShift.startCash.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t border-black pt-2"><span>المتوقع في الدرج (كاش):</span> <span>{lastClosedShift.expectedCash!.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>الفعلي (العد):</span> <span>{lastClosedShift.endCash!.toLocaleString()}</span></div>
                  
                  <div className={`flex justify-between font-bold p-2 mt-2 rounded ${
                     (lastClosedShift.endCash! - lastClosedShift.expectedCash!) < 0 ? 'bg-red-100 text-red-600' : 
                     (lastClosedShift.endCash! - lastClosedShift.expectedCash!) > 0 ? 'bg-green-100 text-green-600' : 
                     'bg-gray-100 text-gray-800'
                  }`}>
                     <span>العجز / الزيادة:</span> 
                     <span>{(lastClosedShift.endCash! - lastClosedShift.expectedCash!).toLocaleString()}</span>
                  </div>
               </div>

               <div className="no-print flex gap-3">
                  <button onClick={() => window.print()} className="flex-1 bg-black text-white py-2 rounded font-bold flex items-center justify-center gap-2"><Printer size={16}/> طباعة</button>
                  <button onClick={() => setLastClosedShift(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-bold">إغلاق</button>
               </div>
            </div>
         </div>
      )}

      {/* Invoice Print Modal */}
      {lastInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
           <div className="bg-white text-black w-full max-w-sm rounded-xl p-0 shadow-2xl print:w-full print:h-full print:rounded-none overflow-hidden relative">
              <div className="p-6">
                 {/* Print Header */}
                 <div className="text-center mb-6">
                    {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto mx-auto mb-2 object-contain" />}
                    <h1 className="text-xl font-bold uppercase">{settings.companyName}</h1>
                    <p className="text-xs text-gray-500">{settings.companyAddress}</p>
                    <p className="text-xs text-gray-500">{settings.companyPhone}</p>
                 </div>
                 
                 <div className="flex justify-between text-sm mb-4 border-b border-gray-300 pb-2">
                    <div className="text-right">
                       <p className="text-gray-500 text-xs">رقم الفاتورة</p>
                       <p className="font-bold font-mono">#{lastInvoice.id}</p>
                    </div>
                    <div className="text-left">
                       <p className="text-gray-500 text-xs">التاريخ</p>
                       <p className="font-mono text-xs">{lastInvoice.date}</p>
                    </div>
                 </div>

                 <div className="mb-4">
                    <p className="text-xs text-gray-500">العميل</p>
                    <p className="font-bold">{lastInvoice.customer}</p>
                 </div>

                 <table className="w-full text-right text-sm border-collapse mb-4">
                    <thead className="border-b-2 border-black">
                       <tr>
                          <th className="py-1">الصنف</th>
                          <th className="py-1 text-center">الكمية</th>
                          <th className="py-1">السعر</th>
                          <th className="py-1">الإجمالي</th>
                       </tr>
                    </thead>
                    <tbody>
                       {lastInvoice.items.map((item, i) => (
                          <tr key={i} className="border-b border-gray-200">
                             <td className="py-2 text-xs">{item.name}</td>
                             <td className="py-2 text-center">{item.cartQuantity}</td>
                             <td className="py-2">{item.sellPrice}</td>
                             <td className="py-2 font-bold">{(item.sellPrice * item.cartQuantity).toLocaleString()}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>

                 <div className="space-y-1 text-sm border-t-2 border-black pt-2 mb-6">
                    <div className="flex justify-between">
                       <span>المجموع الفرعي:</span>
                       <span>{lastInvoice.subTotal.toLocaleString()}</span>
                    </div>
                    {lastInvoice.tax > 0 && (
                      <div className="flex justify-between text-xs">
                         <span>ضريبة ({settings.taxRate}%):</span>
                         <span>{lastInvoice.tax.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg mt-2">
                       <span>الإجمالي:</span>
                       <span>{lastInvoice.total.toLocaleString()} ج.م</span>
                    </div>
                 </div>
                 
                 {/* Invoice Barcode */}
                 <div className="text-center mb-4">
                    <div className="font-libre-barcode text-4xl">{lastInvoice.id}</div>
                 </div>

                 {/* Footer Terms */}
                 <div className="text-center text-[10px] text-gray-500 border-t pt-2">
                    <p>{settings.invoiceTerms}</p>
                    <p className="mt-1">شكراً لتعاملكم معنا!</p>
                 </div>
              </div>

              {/* No Print Controls */}
              <div className="bg-gray-100 p-4 flex gap-2 no-print">
                 <button onClick={() => window.print()} className="flex-1 bg-black text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                    <Printer size={16}/> طباعة
                 </button>
                 <button onClick={() => setLastInvoice(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-bold">
                    إغلاق
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Sales;
