
import React, { useState } from 'react';
import { Search, Plus, Truck, Phone, FileText, Edit2, Trash2, Printer, X } from 'lucide-react';
import { Supplier, Transaction, TransactionType, AppSettings } from '../types';
import { Modal } from '../components/Modal';

interface SuppliersProps {
  suppliers: Supplier[];
  transactions: Transaction[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier?: (id: number) => void;
  settings?: AppSettings;
}

const Suppliers: React.FC<SuppliersProps> = ({ suppliers, transactions, onAddSupplier, onUpdateSupplier, onDeleteSupplier, settings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState<Supplier | null>(null);
  
  // Form State
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', balance: 0 });

  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: '', phone: '', balance: 0 });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({ name: supplier.name, phone: supplier.phone, balance: supplier.balance });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) onUpdateSupplier({ ...editingSupplier, ...formData });
    else onAddSupplier(formData);
    setIsModalOpen(false);
  };

  const getSupplierTransactions = (supplierId: number) => {
    return transactions
      .filter(t => t.relatedId === supplierId && t.type === TransactionType.PURCHASE)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <div className="space-y-6">
       {/* Actions */}
       <div className="flex flex-col sm:flex-row justify-between gap-4 bg-dark-950 p-4 rounded-xl border border-dark-800">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="بحث عن مورد..." 
            className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 font-bold">
          <Plus size={18} /> <span>إضافة مورد</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-950 rounded-xl border border-dark-800 overflow-hidden shadow-xl">
        <table className="w-full text-right">
          <thead className="bg-dark-900 text-gray-400">
            <tr><th className="p-4">اسم المورد</th><th className="p-4">رقم الهاتف</th><th className="p-4">رصيد الحساب</th><th className="p-4">الإجراءات</th></tr>
          </thead>
          <tbody className="divide-y divide-dark-800 text-gray-300">
            {filtered.map(supplier => (
              <tr key={supplier.id} className="hover:bg-dark-900/50 transition-colors group">
                <td className="p-4"><div className="flex items-center gap-3"><Truck size={20} className="text-blue-400" /><span className="font-medium text-white">{supplier.name}</span></div></td>
                <td className="p-4 font-mono text-gray-400">{supplier.phone}</td>
                <td className="p-4"><span className={`font-bold font-mono ${supplier.balance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{supplier.balance.toLocaleString()} ج.م</span></td>
                <td className="p-4">
                   <div className="flex gap-2 items-center">
                     <button onClick={() => setSelectedStatementSupplier(supplier)} className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded text-xs transition-colors"><FileText size={14} /> كشف حساب</button>
                     <button onClick={() => handleOpenEdit(supplier)} className="flex items-center gap-1 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 rounded text-xs transition-colors"><Edit2 size={14} /> تعديل</button>
                     {onDeleteSupplier && (
                        <button onClick={() => onDeleteSupplier(supplier.id)} className="p-1.5 hover:bg-red-900/20 text-gray-500 hover:text-red-500 rounded opacity-50 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                     )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSupplier ? "تعديل بيانات مورد" : "إضافة مورد جديد"}>
         <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="block text-sm text-gray-400 mb-1">اسم المورد</label><input required type="text" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label><input required type="text" className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">الرصيد الافتتاحي</label><input type="number" disabled={!!editingSupplier} className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg disabled:opacity-50" value={formData.balance} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} /></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold mt-4">{editingSupplier ? 'حفظ التعديلات' : 'حفظ المورد'}</button>
         </form>
      </Modal>

      {/* Account Statement Modal */}
      {selectedStatementSupplier && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
             <div className="bg-dark-950 border border-dark-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:shadow-none print:border-none print:bg-white print:text-black">
                 <div className="relative">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-dark-800 bg-dark-900/50 no-print">
                       <h3 className="text-lg font-bold text-white">كشف حساب مورد: {selectedStatementSupplier.name}</h3>
                       <button onClick={() => setSelectedStatementSupplier(null)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                    </div>

                    {/* Print Header */}
                    <div className="hidden print:block text-center border-b-2 border-gray-800 pb-4 mb-6 pt-4 px-4">
                       {settings?.logoUrl && <img src={settings.logoUrl} className="h-16 mx-auto mb-2 object-contain" alt="Logo" />}
                       <h1 className="text-2xl font-bold uppercase">{settings?.companyName}</h1>
                       <h2 className="text-xl text-gray-700">كشف حساب مورد</h2>
                       <div className="text-right text-sm mt-4 border border-gray-300 p-2 rounded">
                          <p><strong>المورد:</strong> {selectedStatementSupplier.name}</p>
                          <p><strong>الهاتف:</strong> {selectedStatementSupplier.phone}</p>
                          <p><strong>تاريخ الطباعة:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                       </div>
                    </div>

                    <div className="p-4 overflow-y-auto max-h-[60vh] print:max-h-none print:overflow-visible">
                       <div className="bg-dark-900 p-3 rounded-lg flex justify-between items-center border border-dark-800 mb-4 print:bg-gray-100 print:border-gray-300">
                          <span className="text-gray-400 print:text-black">الرصيد الحالي</span>
                          <span className={`font-bold text-lg font-mono ${selectedStatementSupplier.balance > 0 ? 'text-red-400 print:text-red-600' : 'text-emerald-400 print:text-green-600'}`}>
                            {selectedStatementSupplier.balance.toLocaleString()} ج.م
                          </span>
                       </div>
                       
                       <table className="w-full text-right text-sm border-collapse">
                          <thead className="bg-dark-900 text-gray-400 print:bg-gray-200 print:text-black">
                             <tr><th className="p-2 border border-dark-800 print:border-gray-300">التاريخ</th><th className="p-2 border border-dark-800 print:border-gray-300">البيان</th><th className="p-2 border border-dark-800 print:border-gray-300">المبلغ</th></tr>
                          </thead>
                          <tbody className="divide-y divide-dark-800 print:divide-gray-300">
                             {getSupplierTransactions(selectedStatementSupplier.id).map(t => (
                                <tr key={t.id} className="hover:bg-dark-900/50">
                                   <td className="p-2 border border-dark-800 print:border-gray-300 print:text-black">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                   <td className="p-2 border border-dark-800 print:border-gray-300 print:text-black">{t.description}</td>
                                   <td className="p-2 border border-dark-800 print:border-gray-300 font-bold font-mono text-red-400 print:text-black">{t.amount.toLocaleString()}</td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>

                    <div className="bg-dark-900 p-4 border-t border-dark-800 flex justify-center no-print">
                       <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">
                          <Printer size={18} /> طباعة
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

export default Suppliers;
