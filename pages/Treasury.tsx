
import React, { useState } from 'react';
import { Transaction, TransactionType, Customer, Supplier, PaymentMethod, AppSettings, User } from '../types';
import { ArrowDownLeft, ArrowUpRight, Wallet, Download, Eye, RotateCcw, HandCoins, CheckCircle, XCircle, AlertCircle, Building2, UserMinus, Filter } from 'lucide-react';
import { Modal } from '../components/Modal';

interface TreasuryProps {
  transactions: Transaction[];
  customers: Customer[];
  suppliers: Supplier[];
  onAddExpense: (amount: number, description: string, category: string) => void;
  onReturnTransaction?: (transaction: Transaction) => void;
  onDebtSettlement?: (type: 'customer' | 'supplier', id: number, amount: number, notes: string) => void;
  settings?: AppSettings;
  currentUser: User;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCapitalTransaction: (type: 'deposit' | 'withdrawal', amount: number, description: string) => void;
}

const Treasury: React.FC<TreasuryProps> = ({ transactions, customers, suppliers, onAddExpense, onReturnTransaction, onDebtSettlement, settings, currentUser, onApprove, onReject, onCapitalTransaction }) => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: 'مصروفات تشغيلية' });

  // Capital Modal
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [capitalType, setCapitalType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [capitalForm, setCapitalForm] = useState({ amount: '', description: '' });

  // Settlement Modal
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [settlementType, setSettlementType] = useState<'customer' | 'supplier'>('customer');
  const [settlementForm, setSettlementForm] = useState({ id: 0, amount: '', notes: '' });
  
  // Expense Categories
  const expenseCategories = [
    'مصروفات تشغيلية',
    'إيجار',
    'رواتب وأجور',
    'كهرباء ومياه',
    'نقل ومشال',
    'دعاية وإعلان',
    'صيانة',
    'نثريات',
    'أخرى'
  ];

  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  const calculateTreasuryBalance = () => {
    let balance = settings?.openingBalance || 50000;

    transactions.forEach(t => {
      if (t.paymentMethod === PaymentMethod.DEFERRED) return;
      if (t.status === 'pending' || t.status === 'rejected') return;

      switch (t.type) {
        case TransactionType.SALE:
        case TransactionType.CAPITAL:
          balance += t.amount; 
          break;
        case TransactionType.PURCHASE:
        case TransactionType.EXPENSE:
        case TransactionType.WITHDRAWAL:
          balance -= t.amount; 
          break;
        case TransactionType.RETURN:
          const isCustomerReturn = customers.some(c => c.id === t.relatedId);
          if (isCustomerReturn) {
            balance -= t.amount; 
          } else {
            balance += t.amount; 
          }
          break;
      }
    });

    return balance;
  };

  const currentBalance = calculateTreasuryBalance();
  const totalReceivables = customers.reduce((sum, c) => sum + (c.balance < 0 ? Math.abs(c.balance) : 0), 0);
  const totalPayables = suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);

  const sortedTransactions = [...transactions]
    .filter(t => !startDate || t.date >= startDate)
    .filter(t => !endDate || t.date.split('T')[0] <= endDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.description) return;
    onAddExpense(Number(expenseForm.amount), expenseForm.description, expenseForm.category);
    setIsExpenseModalOpen(false);
    setExpenseForm({ amount: '', description: '', category: 'مصروفات تشغيلية' });
  };

  const handleCapitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capitalForm.amount) return;
    onCapitalTransaction(capitalType, Number(capitalForm.amount), capitalForm.description);
    setIsCapitalModalOpen(false);
    setCapitalForm({ amount: '', description: '' });
  };

  const handleSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementForm.id || !settlementForm.amount) return;
    if (onDebtSettlement) {
      onDebtSettlement(settlementType, settlementForm.id, Number(settlementForm.amount), settlementForm.notes);
    }
    setIsSettlementModalOpen(false);
    setSettlementForm({ id: 0, amount: '', notes: '' });
  };

  const handleReturn = () => {
    if (selectedTransaction && onReturnTransaction) {
      if (window.confirm('هل أنت متأكد من عمل مرتجع لهذه الفاتورة؟ سيتم عكس المخزون والحسابات.')) {
        onReturnTransaction(selectedTransaction);
        setSelectedTransaction(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      {currentUser.role === 'admin' && pendingTransactions.length > 0 && (
        <div className="bg-yellow-900/10 border border-yellow-500/30 rounded-xl p-4 animate-pulse">
           <h3 className="text-yellow-500 font-bold mb-3 flex items-center gap-2">
             <AlertCircle size={20} />
             طلبات موافقة معلقة (مصروفات تتجاوز الحد)
           </h3>
           <div className="space-y-2">
              {pendingTransactions.map(t => (
                <div key={t.id} className="bg-dark-950 p-3 rounded-lg border border-dark-800 flex justify-between items-center">
                   <div>
                      <p className="text-gray-300 font-bold">{t.description} ({t.category})</p>
                      <p className="text-xs text-gray-500">{new Date(t.date).toLocaleString('ar-EG')} - بواسطة: الموظف</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <span className="font-mono font-bold text-red-400">{t.amount.toLocaleString()} ج.م</span>
                      <div className="flex gap-2">
                         <button onClick={() => onApprove?.(t.id)} className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg" title="موافقة">
                            <CheckCircle size={18} />
                         </button>
                         <button onClick={() => onReject?.(t.id)} className="p-2 bg-red-600 hover:bg-red-500 text-white rounded-lg" title="رفض">
                            <XCircle size={18} />
                         </button>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-dark-950 to-dark-900 p-6 rounded-xl border border-dark-800 shadow-xl relative overflow-hidden lg:col-span-2">
           <div className="absolute top-0 right-0 w-32 h-32 bg-fox-500/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-fox-500/20 text-fox-500 rounded-lg"><Wallet size={24} /></div>
               <span className="text-gray-400">رصيد الخزينة الفعلي (نقدية)</span>
             </div>
             <h2 className="text-4xl font-bold text-white mb-1 neon-text">{currentBalance.toLocaleString()} <span className="text-lg text-gray-500">ج.م</span></h2>
             <p className="text-emerald-400 text-sm flex items-center gap-1 mt-2">
               <ArrowUpRight size={14} />
               حركة النقدية (Live)
             </p>
           </div>
        </div>

        <div className="bg-dark-950 p-6 rounded-xl border border-dark-800 flex flex-col justify-center">
          <span className="text-gray-400 text-sm mb-1">الديون المستحقة (لنا)</span>
          <div className="text-2xl font-bold text-blue-400 mb-2">{totalReceivables.toLocaleString()} ج.م</div>
          <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
             <div className="bg-blue-500 h-full w-3/4"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">عند {customers.filter(c => c.balance < 0).length} عملاء</p>
        </div>

        <div className="bg-dark-950 p-6 rounded-xl border border-dark-800 flex flex-col justify-center">
          <span className="text-gray-400 text-sm mb-1">الديون المستحقة (علينا)</span>
          <div className="text-2xl font-bold text-red-400 mb-2">{totalPayables.toLocaleString()} ج.م</div>
          <div className="w-full bg-dark-900 rounded-full h-1.5 overflow-hidden">
             <div className="bg-red-500 h-full w-1/2"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">لـ {suppliers.filter(s => s.balance > 0).length} موردين</p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-dark-950 rounded-xl border border-dark-800">
        <div className="p-5 border-b border-dark-800 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
             <h3 className="text-lg font-bold text-gray-200">سجل المعاملات المالية</h3>
             <div className="flex flex-wrap gap-2">
               <button 
                  onClick={() => { setCapitalType('deposit'); setIsCapitalModalOpen(true); }}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600/10 text-emerald-400 border border-emerald-600/30 rounded-lg hover:bg-emerald-600/20 transition-all font-bold text-xs"
               >
                  <Building2 size={16} />
                  إيداع رأس مال
               </button>
               <button 
                  onClick={() => { setCapitalType('withdrawal'); setIsCapitalModalOpen(true); }}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600/10 text-orange-400 border border-orange-600/30 rounded-lg hover:bg-orange-600/20 transition-all font-bold text-xs"
               >
                  <UserMinus size={16} />
                  مسحوبات شخصية
               </button>
               <button 
                  onClick={() => setIsSettlementModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/20 transition-all font-bold text-xs"
               >
                  <HandCoins size={16} />
                  تسوية مديونية
               </button>
               <button 
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600/10 text-red-400 border border-red-600/30 rounded-lg hover:bg-red-600/20 transition-all font-bold text-xs"
               >
                 <ArrowDownLeft size={16} />
                 تسجيل مصروف
               </button>
             </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 p-3 bg-dark-900/50 rounded-lg">
             <span className="text-gray-400 text-xs flex items-center gap-1"><Filter size={12}/> تصفية:</span>
             <input 
               type="date" 
               className="bg-dark-950 border border-dark-700 text-white px-2 py-1 rounded text-xs focus:border-fox-500 outline-none"
               value={startDate}
               onChange={e => setStartDate(e.target.value)}
             />
             <span className="text-gray-500 text-xs">- إلى -</span>
             <input 
               type="date" 
               className="bg-dark-950 border border-dark-700 text-white px-2 py-1 rounded text-xs focus:border-fox-500 outline-none"
               value={endDate}
               onChange={e => setEndDate(e.target.value)}
             />
             {(startDate || endDate) && (
               <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-xs text-red-400 hover:text-red-300">مسح</button>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-dark-900 text-gray-500">
               <tr>
                 <th className="p-4">رقم الحركة</th>
                 <th className="p-4">التاريخ</th>
                 <th className="p-4">النوع</th>
                 <th className="p-4">التصنيف</th>
                 <th className="p-4">البيان</th>
                 <th className="p-4">طريقة الدفع</th>
                 <th className="p-4 text-left">المبلغ</th>
                 <th className="p-4 w-10"></th>
               </tr>
            </thead>
            <tbody className="divide-y divide-dark-800">
               {sortedTransactions.map(t => (
                 <tr key={t.id} className={`hover:bg-dark-900/50 group ${t.status === 'pending' ? 'bg-yellow-900/10' : t.status === 'rejected' ? 'opacity-50 line-through' : ''}`}>
                   <td className="p-4 font-mono text-gray-400">{t.id}</td>
                   <td className="p-4 text-gray-300">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                   <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-medium border ${
                       t.type === TransactionType.SALE ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                       t.type === TransactionType.PURCHASE ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                       t.type === TransactionType.EXPENSE ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                       t.type === TransactionType.CAPITAL ? 'bg-emerald-600/10 text-emerald-500 border-emerald-600/20' :
                       t.type === TransactionType.WITHDRAWAL ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                       'bg-gray-700/30 text-gray-400 border-gray-600'
                     }`}>
                       {t.type}
                     </span>
                     {t.status === 'pending' && <span className="mr-2 text-xs text-yellow-500">(معلق)</span>}
                   </td>
                   <td className="p-4 text-xs text-gray-400">{t.category || '-'}</td>
                   <td className="p-4 text-gray-300">{t.description}</td>
                   <td className="p-4 text-gray-400">{t.paymentMethod}</td>
                   <td className={`p-4 font-bold text-left ${
                     [TransactionType.SALE, TransactionType.RETURN, TransactionType.CAPITAL].includes(t.type) 
                     ? 'text-white' 
                     : 'text-gray-300'
                   }`}>
                     {t.amount.toLocaleString()}
                   </td>
                   <td className="p-4">
                     <button 
                       onClick={() => setSelectedTransaction(t)}
                       className="text-gray-500 hover:text-fox-500 transition-colors opacity-0 group-hover:opacity-100"
                       title="عرض التفاصيل"
                     >
                       <Eye size={18} />
                     </button>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title={`تفاصيل الحركة: ${selectedTransaction?.id || ''}`}
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
                     <span className="text-gray-500 block mb-1">النوع</span>
                     <span className="text-white">{selectedTransaction.type}</span>
                   </div>
                   {selectedTransaction.category && (
                     <div>
                       <span className="text-gray-500 block mb-1">التصنيف</span>
                       <span className="text-fox-400">{selectedTransaction.category}</span>
                     </div>
                   )}
                   <div>
                     <span className="text-gray-500 block mb-1">طريقة الدفع</span>
                     <span className="text-white">{selectedTransaction.paymentMethod}</span>
                   </div>
                   <div>
                     <span className="text-gray-500 block mb-1">المبلغ الإجمالي</span>
                     <span className="text-fox-500 font-bold text-lg">{selectedTransaction.amount.toLocaleString()} ج.م</span>
                   </div>
                   <div className="col-span-2">
                     <span className="text-gray-500 block mb-1">البيان / الوصف</span>
                     <span className="text-gray-300">{selectedTransaction.description}</span>
                   </div>
                </div>

                {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                  <div className="mt-4">
                     <h4 className="text-gray-400 mb-2 text-sm font-bold">الأصناف:</h4>
                     <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden">
                       <table className="w-full text-sm text-right">
                         <thead className="bg-dark-800 text-gray-500">
                           <tr>
                             <th className="p-2">الصنف</th>
                             <th className="p-2">الكمية</th>
                             <th className="p-2">السعر</th>
                             <th className="p-2">الإجمالي</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-dark-800">
                           {selectedTransaction.items.map((item, idx) => (
                             <tr key={idx}>
                               <td className="p-2 text-gray-300">{item.name}</td>
                               <td className="p-2 text-gray-300">{item.cartQuantity}</td>
                               <td className="p-2 text-gray-300">
                                 {selectedTransaction.type === TransactionType.PURCHASE ? item.costPrice : item.sellPrice}
                               </td>
                               <td className="p-2 font-bold text-gray-200">
                                 {((selectedTransaction.type === TransactionType.PURCHASE ? item.costPrice : item.sellPrice) * item.cartQuantity).toLocaleString()}
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                  </div>
                )}
                
                {(selectedTransaction.type === TransactionType.SALE || selectedTransaction.type === TransactionType.PURCHASE) && onReturnTransaction && (
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

      {/* Add Expense Modal */}
      <Modal 
        isOpen={isExpenseModalOpen} 
        onClose={() => setIsExpenseModalOpen(false)} 
        title="تسجيل مصروف جديد"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">نوع / تصنيف المصروف</label>
            <select
               className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
               value={expenseForm.category}
               onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
            >
               {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">قيمة المصروف (ج.م)</label>
            <input 
              type="number" 
              required
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-bold"
              value={expenseForm.amount}
              onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">بيان المصروف</label>
            <textarea 
              required
              rows={3}
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
              value={expenseForm.description}
              onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
              placeholder="مثال: فاتورة كهرباء شهر 10"
            />
          </div>
          <p className="text-xs text-gray-500">* ملاحظة: المصروفات التي تتجاوز 2000 ج.م تتطلب موافقة المدير.</p>
          <button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-lg font-bold mt-2 shadow-lg shadow-red-500/20"
          >
            تسجيل المصروف
          </button>
        </form>
      </Modal>
      
      {/* Add Capital/Withdrawal Modal */}
      <Modal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
        title={capitalType === 'deposit' ? 'إيداع رأس مال (زيادة رأس المال)' : 'مسحوبات شخصية (للمالك)'}
      >
         <form onSubmit={handleCapitalSubmit} className="space-y-4">
            <div>
               <label className="block text-sm text-gray-400 mb-1">المبلغ (ج.م)</label>
               <input 
                 type="number" 
                 required
                 className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-bold text-lg"
                 value={capitalForm.amount}
                 onChange={e => setCapitalForm({...capitalForm, amount: e.target.value})}
                 placeholder="0.00"
               />
            </div>
            <div>
               <label className="block text-sm text-gray-400 mb-1">بيان / ملاحظات</label>
               <textarea 
                 rows={3}
                 className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                 value={capitalForm.description}
                 onChange={e => setCapitalForm({...capitalForm, description: e.target.value})}
                 placeholder={capitalType === 'deposit' ? "إيداع نقدي لزيادة السيولة" : "سحب مبلغ لأغراض شخصية"}
               />
            </div>
            <button 
               type="submit" 
               className={`w-full text-white py-2.5 rounded-lg font-bold mt-2 shadow-lg ${capitalType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-500/20'}`}
            >
               {capitalType === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
            </button>
         </form>
      </Modal>

      {/* Debt Settlement Modal */}
      <Modal 
        isOpen={isSettlementModalOpen} 
        onClose={() => setIsSettlementModalOpen(false)} 
        title="تسوية مديونية (تحصيل / سداد)"
      >
        <form onSubmit={handleSettlementSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
             <button
               type="button"
               onClick={() => {
                 setSettlementType('customer');
                 setSettlementForm(prev => ({...prev, id: customers[0]?.id || 0}));
               }}
               className={`flex-1 py-2 rounded text-sm font-bold border transition-colors ${
                 settlementType === 'customer' 
                 ? 'bg-blue-600 border-blue-600 text-white' 
                 : 'bg-dark-900 border-dark-700 text-gray-400'
               }`}
             >
               تحصيل من عميل
             </button>
             <button
               type="button"
               onClick={() => {
                 setSettlementType('supplier');
                 setSettlementForm(prev => ({...prev, id: suppliers[0]?.id || 0}));
               }}
               className={`flex-1 py-2 rounded text-sm font-bold border transition-colors ${
                 settlementType === 'supplier' 
                 ? 'bg-red-600 border-red-600 text-white' 
                 : 'bg-dark-900 border-dark-700 text-gray-400'
               }`}
             >
               سداد لمورد
             </button>
          </div>

          <div>
             <label className="block text-sm text-gray-400 mb-1">
               {settlementType === 'customer' ? 'اختر العميل' : 'اختر المورد'}
             </label>
             <select
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                value={settlementForm.id}
                onChange={e => setSettlementForm({...settlementForm, id: Number(e.target.value)})}
             >
                {settlementType === 'customer' 
                  ? customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.balance})</option>)
                  : suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.balance})</option>)
                }
             </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">المبلغ (ج.م)</label>
            <input 
              type="number" 
              required
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-bold"
              value={settlementForm.amount}
              onChange={e => setSettlementForm({...settlementForm, amount: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
            <input 
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
              value={settlementForm.notes}
              onChange={e => setSettlementForm({...settlementForm, notes: e.target.value})}
              placeholder="مثال: دفعة نقدية من الحساب"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg font-bold mt-2 shadow-lg shadow-emerald-500/20"
          >
            تأكيد العملية
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Treasury;
