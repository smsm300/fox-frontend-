
import React, { useState } from 'react';
import { Search, Plus, User, Phone, Wallet, Briefcase, UserCheck, FileText, Edit2, ShieldAlert, Trash2, Printer, X } from 'lucide-react';
import { Customer, Transaction, TransactionType, AppSettings } from '../types';
import { Modal } from '../components/Modal';

interface CustomersProps {
  customers: Customer[];
  transactions: Transaction[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer?: (id: number) => void;
  settings?: AppSettings;
}

const Customers: React.FC<CustomersProps> = ({ customers, transactions, onAddCustomer, onUpdateCustomer, onDeleteCustomer, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatementCustomer, setSelectedStatementCustomer] = useState<Customer | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  
  // Form State (Add/Edit)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    type: 'consumer' as 'consumer' | 'business',
    balance: 0,
    creditLimit: 0
  });

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', type: 'consumer', balance: 0, creditLimit: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({ 
      name: customer.name, 
      phone: customer.phone, 
      type: customer.type, 
      balance: customer.balance,
      creditLimit: customer.creditLimit || 0
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdateCustomer({ ...editingCustomer, ...formData });
    } else {
      onAddCustomer(formData);
    }
    setIsModalOpen(false);
  };

  const getCustomerTransactions = (customerId: number) => {
    return transactions
      .filter(t => t.relatedId === customerId && t.type === TransactionType.SALE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handlePrintStatement = () => {
     setIsPrintMode(true);
     setTimeout(() => {
        window.print();
        setIsPrintMode(false);
     }, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-dark-950 p-4 rounded-xl border border-dark-800">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن عميل بالاسم أو الهاتف..." 
            className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-6 py-2 bg-fox-600 text-white rounded-lg hover:bg-fox-500 shadow-lg shadow-fox-500/20 transition-all font-bold"
        >
          <Plus size={18} />
          <span>إضافة عميل</span>
        </button>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-dark-950 border border-dark-800 rounded-xl p-5 hover:border-fox-500/30 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  customer.type === 'business' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {customer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-200">{customer.name}</h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <Phone size={12} />
                    <span className="font-mono">{customer.phone}</span>
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs border ${
                customer.type === 'business' 
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              }`}>
                {customer.type === 'business' ? 'تجاري' : 'مستهلك'}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg border border-dark-800 mb-2">
              <span className="text-gray-400 text-sm flex items-center gap-2">
                <Wallet size={16} />
                الرصيد
              </span>
              <span className={`font-bold font-mono ${customer.balance < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {customer.balance.toLocaleString()} ج.م
              </span>
            </div>
            
            <div className="mt-4 flex gap-2 opacity-10 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={() => setSelectedStatementCustomer(customer)}
                  className="flex-1 py-1.5 text-xs bg-dark-800 hover:bg-dark-700 text-gray-300 rounded flex items-center justify-center gap-1"
               >
                  <FileText size={14} />
                  كشف حساب
               </button>
               <button 
                 onClick={() => handleOpenEdit(customer)}
                 className="flex-1 py-1.5 text-xs bg-dark-800 hover:bg-dark-700 text-gray-300 rounded flex items-center justify-center gap-1"
               >
                 <Edit2 size={14} />
                 تعديل
               </button>
            </div>
            {onDeleteCustomer && (
               <button 
                 onClick={() => onDeleteCustomer(customer.id)}
                 className="absolute top-2 left-2 p-1.5 bg-dark-900 hover:bg-red-900/30 text-gray-600 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-all"
                 title="حذف العميل"
               >
                 <Trash2 size={14} />
               </button>
            )}
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingCustomer ? "تعديل بيانات عميل" : "إضافة عميل جديد"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
           {/* ... existing form fields ... */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم العميل</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
             <label className="block text-sm text-gray-400 mb-1">نوع العميل</label>
             <select 
               className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
               value={formData.type}
               onChange={e => setFormData({...formData, type: e.target.value as any})}
             >
                <option value="consumer">مستهلك</option>
                <option value="business">تجاري</option>
             </select>
          </div>
          {formData.type === 'business' && (
             <div>
                <label className="block text-sm text-gray-400 mb-1">الحد الائتماني</label>
                <input 
                   type="number" 
                   className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
                   value={formData.creditLimit}
                   onChange={e => setFormData({...formData, creditLimit: Number(e.target.value)})}
                />
             </div>
          )}
          <button type="submit" className="w-full bg-fox-600 hover:bg-fox-500 text-white py-2.5 rounded-lg font-bold mt-4 transition-colors">
            {editingCustomer ? 'حفظ التعديلات' : 'حفظ البيانات'}
          </button>
        </form>
      </Modal>

      {/* Account Statement Modal / Print View */}
      {selectedStatementCustomer && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
             <div className="bg-dark-950 border border-dark-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black">
                 <div className="relative">
                    {/* Header (Visible only on screen) */}
                    <div className="flex justify-between items-center p-4 border-b border-dark-800 bg-dark-900/50 no-print">
                       <h3 className="text-lg font-bold text-white">كشف حساب: {selectedStatementCustomer.name}</h3>
                       <button onClick={() => setSelectedStatementCustomer(null)} className="text-gray-400 hover:text-red-500">
                          <X size={24} />
                       </button>
                    </div>

                    {/* Print Header (Visible only on print) */}
                    <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 pt-4 px-4">
                       {settings?.logoUrl && <img src={settings.logoUrl} className="h-16 mx-auto mb-2 object-contain" alt="Logo" />}
                       <h1 className="text-2xl font-bold uppercase">{settings?.companyName}</h1>
                       <h2 className="text-xl text-gray-700">كشف حساب عميل</h2>
                       <div className="text-right text-sm mt-4 border border-gray-300 p-2 rounded">
                          <p><strong>العميل:</strong> {selectedStatementCustomer.name}</p>
                          <p><strong>الهاتف:</strong> {selectedStatementCustomer.phone}</p>
                          <p><strong>تاريخ الطباعة:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                       </div>
                    </div>

                    <div className="p-4 overflow-y-auto max-h-[60vh] print:max-h-none print:overflow-visible">
                       {/* Current Balance */}
                       <div className="bg-dark-900 p-3 rounded-lg flex justify-between items-center border border-dark-800 mb-4 print:bg-gray-100 print:border-gray-300">
                          <span className="text-gray-400 print:text-black">الرصيد الحالي</span>
                          <span className={`font-bold text-lg font-mono ${selectedStatementCustomer.balance < 0 ? 'text-red-400 print:text-red-600' : 'text-emerald-400 print:text-green-600'}`}>
                            {selectedStatementCustomer.balance.toLocaleString()} ج.م
                          </span>
                       </div>
                       
                       {/* Transactions List */}
                       <div className="space-y-2">
                         <h4 className="text-sm font-bold text-gray-400 print:text-black mb-2">سجل العمليات</h4>
                         <table className="w-full text-right text-sm border-collapse">
                            <thead className="bg-dark-900 text-gray-400 print:bg-gray-200 print:text-black">
                               <tr>
                                  <th className="p-2 border border-dark-800 print:border-gray-300">التاريخ</th>
                                  <th className="p-2 border border-dark-800 print:border-gray-300">البيان</th>
                                  <th className="p-2 border border-dark-800 print:border-gray-300">المبلغ</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-dark-800 print:divide-gray-300">
                               {getCustomerTransactions(selectedStatementCustomer.id).length === 0 ? (
                                  <tr><td colSpan={3} className="p-4 text-center text-gray-500">لا توجد عمليات</td></tr>
                               ) : (
                                  getCustomerTransactions(selectedStatementCustomer.id).map(t => (
                                     <tr key={t.id} className="hover:bg-dark-900/50">
                                        <td className="p-2 border border-dark-800 print:border-gray-300 print:text-black">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                        <td className="p-2 border border-dark-800 print:border-gray-300 print:text-black">{t.description}</td>
                                        <td className="p-2 border border-dark-800 print:border-gray-300 font-bold font-mono text-emerald-400 print:text-black">{t.amount.toLocaleString()}</td>
                                     </tr>
                                  ))
                               )}
                            </tbody>
                         </table>
                       </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-dark-900 p-4 border-t border-dark-800 flex justify-center no-print">
                       <button onClick={handlePrintStatement} className="flex items-center gap-2 px-6 py-2 bg-fox-600 text-white rounded-lg font-bold hover:bg-fox-500">
                          <Printer size={18} />
                          طباعة كشف الحساب
                       </button>
                    </div>

                    <div className="hidden print:block text-center text-xs text-gray-500 mt-8 border-t border-gray-300 pt-4">
                       <p>{settings?.companyAddress} - {settings?.companyPhone}</p>
                    </div>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default Customers;
