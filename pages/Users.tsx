import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Trash2, Shield, User as UserIcon, Lock } from 'lucide-react';
import { Modal } from '../components/Modal';

interface UsersProps {
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onDeleteUser: (id: number) => void;
}

const Users: React.FC<UsersProps> = ({ users, onAddUser, onDeleteUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    role: 'cashier' as 'admin' | 'accountant' | 'cashier' | 'stock_keeper'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddUser(formData);
    setFormData({ name: '', username: '', role: 'cashier' });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-dark-950 p-4 rounded-xl border border-dark-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="text-fox-500" />
            إدارة المستخدمين والصلاحيات
          </h2>
          <p className="text-gray-400 text-sm mt-1">إضافة وحذف مستخدمي النظام</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-2 bg-fox-600 text-white rounded-lg hover:bg-fox-500 font-bold shadow-lg shadow-fox-500/20"
        >
          <Plus size={18} />
          <span>مستخدم جديد</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-dark-950 border border-dark-800 rounded-xl p-6 relative group">
             <div className="flex items-center gap-4 mb-4">
               <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold ${
                 user.role === 'admin' ? 'bg-red-500/20 text-red-500' : 
                 user.role === 'accountant' ? 'bg-blue-500/20 text-blue-500' : 
                 'bg-emerald-500/20 text-emerald-500'
               }`}>
                 {user.username.charAt(0).toUpperCase()}
               </div>
               <div>
                 <h3 className="font-bold text-white text-lg">{user.name}</h3>
                 <span className={`px-2 py-0.5 rounded text-xs border ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                    user.role === 'accountant' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                 }`}>
                    {user.role}
                 </span>
               </div>
             </div>
             
             <div className="bg-dark-900 rounded p-3 text-sm text-gray-400 mb-4 flex items-center gap-2">
               <UserIcon size={14} />
               اسم الدخول: <span className="text-white font-mono">{user.username}</span>
             </div>

             {user.username !== 'admin' && (
               <button 
                 onClick={() => {
                   if (window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) onDeleteUser(user.id);
                 }}
                 className="w-full py-2 bg-dark-900 text-red-400 hover:bg-red-900/20 rounded border border-dark-700 hover:border-red-900/30 flex items-center justify-center gap-2 transition-colors"
               >
                 <Trash2 size={16} />
                 حذف المستخدم
               </button>
             )}
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="إضافة مستخدم جديد">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">الاسم بالكامل</label>
            <input 
              required
              type="text" 
              className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">اسم الدخول (Username)</label>
            <div className="relative">
               <UserIcon className="absolute right-3 top-2.5 text-gray-500" size={16} />
               <input 
                 required
                 type="text" 
                 className="w-full bg-dark-900 border border-dark-700 text-white pr-10 pl-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono"
                 value={formData.username}
                 onChange={e => setFormData({...formData, username: e.target.value})}
               />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">كلمة المرور الافتراضية</label>
            <div className="relative">
               <Lock className="absolute right-3 top-2.5 text-gray-500" size={16} />
               <input 
                 disabled
                 type="text" 
                 value="123456"
                 className="w-full bg-dark-800 border border-dark-700 text-gray-400 pr-10 pl-3 py-2 rounded-lg cursor-not-allowed"
               />
            </div>
            <p className="text-xs text-gray-500 mt-1">* يمكن تغيير كلمة المرور لاحقاً</p>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">الصلاحية (Role)</label>
            <select 
              className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 rounded-lg focus:border-fox-500 focus:outline-none"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value as any})}
            >
              <option value="admin">مدير نظام (Admin)</option>
              <option value="accountant">محاسب</option>
              <option value="cashier">كاشير</option>
              <option value="stock_keeper">أمين مخزن</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-fox-600 hover:bg-fox-500 text-white py-2.5 rounded-lg font-bold mt-2 shadow-lg shadow-fox-500/20">
            إضافة المستخدم
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Users;