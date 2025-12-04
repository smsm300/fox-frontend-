
import React, { useState, useEffect } from 'react';
import { Save, Printer, Globe, Database, Download, Upload, Trash2, Hash, DollarSign, RotateCcw, Percent, Lock, FileText } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onBackup: () => void;
  onRestore: (file: File) => void;
  onFactoryReset?: () => void;
  onClearTransactions?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onBackup, onRestore, onFactoryReset, onClearTransactions }) => {
  const [formData, setFormData] = useState<AppSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = () => {
    onUpdateSettings(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (window.confirm('سيتم استبدال جميع البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد؟')) {
        onRestore(e.target.files[0]);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in pb-10">
       <h2 className="text-2xl font-bold text-white mb-6">إعدادات النظام</h2>
       
       <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
         <h3 className="text-lg font-bold text-fox-500 mb-4 flex items-center gap-2">
           <Globe size={20} />
           بيانات الشركة
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">اسم الشركة</label>
              <input 
                type="text" 
                value={formData.companyName}
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">رقم الهاتف</label>
              <input 
                type="text" 
                value={formData.companyPhone}
                onChange={e => setFormData({...formData, companyPhone: e.target.value})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">العنوان (يظهر في الفاتورة)</label>
              <input 
                type="text" 
                value={formData.companyAddress}
                onChange={e => setFormData({...formData, companyAddress: e.target.value})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none" 
              />
            </div>
         </div>
       </div>

       <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
         <h3 className="text-lg font-bold text-blue-500 mb-4 flex items-center gap-2">
           <Printer size={20} />
           إعدادات الطباعة والفواتير
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                <span className="text-gray-300">طباعة تلقائية بعد الحفظ</span>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.autoPrint ? 'bg-fox-600' : 'bg-gray-600'}`}
                  onClick={() => setFormData({...formData, autoPrint: !formData.autoPrint})}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.autoPrint ? 'right-1' : 'left-1'}`}></div>
                </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                 <Hash size={14} />
                 بداية تسلسل الفواتير
              </label>
              <input 
                type="number" 
                value={formData.nextInvoiceNumber}
                onChange={e => setFormData({...formData, nextInvoiceNumber: Number(e.target.value)})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono" 
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                 <Percent size={14} />
                 نسبة ضريبة القيمة المضافة (VAT %)
              </label>
              <input 
                type="number" 
                value={formData.taxRate}
                onChange={e => setFormData({...formData, taxRate: Number(e.target.value)})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-mono font-bold" 
                placeholder="14"
              />
            </div>
            
            <div className="md:col-span-2">
               <label className="block text-sm text-gray-400 mb-1 flex items-center gap-1">
                 <FileText size={14} />
                 شروط الفاتورة (تذييل الفاتورة)
               </label>
               <textarea 
                 rows={3}
                 value={formData.invoiceTerms}
                 onChange={e => setFormData({...formData, invoiceTerms: e.target.value})}
                 className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none text-sm"
                 placeholder="مثال: البضاعة المباعة ترد وتستبدل خلال 14 يوم..."
               />
            </div>
         </div>
       </div>

       <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
         <h3 className="text-lg font-bold text-emerald-500 mb-4 flex items-center gap-2">
           <DollarSign size={20} />
           إعدادات الخزينة والمخزون
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">رصيد أول المدة (Opening Balance)</label>
              <input 
                type="number" 
                value={formData.openingBalance}
                onChange={e => setFormData({...formData, openingBalance: Number(e.target.value)})}
                className="w-full bg-dark-900 border border-dark-700 text-white px-4 py-2 rounded-lg focus:border-fox-500 focus:outline-none font-bold font-mono text-lg text-emerald-400" 
              />
              <p className="text-xs text-gray-500 mt-1">المبلغ الذي بدأت به الخزينة عند استخدام النظام لأول مرة.</p>
            </div>
            
            {/* Strict Stock Mode */}
            <div className="flex items-center justify-between p-3 bg-dark-900 rounded-lg">
                <div>
                   <span className="text-gray-300 block mb-1">منع البيع بالسالب (Strict Mode)</span>
                   <p className="text-xs text-gray-500">لا يسمح بإتمام الفاتورة إذا كان الرصيد غير كافٍ</p>
                </div>
                <div 
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${formData.preventNegativeStock ? 'bg-red-600' : 'bg-gray-600'}`}
                  onClick={() => setFormData({...formData, preventNegativeStock: !formData.preventNegativeStock})}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.preventNegativeStock ? 'right-1' : 'left-1'}`}></div>
                </div>
            </div>
         </div>
       </div>

       <div className="bg-dark-950 rounded-xl border border-dark-800 p-6">
         <h3 className="text-lg font-bold text-purple-500 mb-4 flex items-center gap-2">
           <Database size={20} />
           النسخ الاحتياطي والاستعادة
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-dark-900 p-4 rounded-lg border border-dark-700 flex flex-col items-center text-center gap-3">
               <Download size={32} className="text-purple-500" />
               <div>
                 <h4 className="text-white font-bold">تصدير نسخة احتياطية</h4>
                 <p className="text-xs text-gray-500">حفظ جميع البيانات كملف JSON</p>
               </div>
               <button 
                 onClick={onBackup}
                 className="w-full py-2 bg-purple-600/20 text-purple-500 border border-purple-500/30 rounded hover:bg-purple-600/30 transition-colors font-bold text-sm"
               >
                 تحميل النسخة
               </button>
            </div>
            
            <div className="bg-dark-900 p-4 rounded-lg border border-dark-700 flex flex-col items-center text-center gap-3">
               <Upload size={32} className="text-blue-500" />
               <div>
                 <h4 className="text-white font-bold">استعادة نسخة</h4>
                 <p className="text-xs text-gray-500">رفع ملف JSON لاسترجاع البيانات</p>
               </div>
               <div className="w-full relative">
                 <input 
                   type="file" 
                   accept=".json"
                   onChange={handleFileChange}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <button className="w-full py-2 bg-blue-600/20 text-blue-500 border border-blue-500/30 rounded hover:bg-blue-600/30 transition-colors font-bold text-sm pointer-events-none">
                   اختيار الملف
                 </button>
               </div>
            </div>
         </div>
       </div>

       {/* Factory Reset Zone */}
       <div className="bg-red-950/20 rounded-xl border border-red-900/50 p-6">
          <h3 className="text-lg font-bold text-red-500 mb-4 flex items-center gap-2">
             <Trash2 size={20} />
             منطقة الخطر
          </h3>
          <div className="space-y-4">
             {/* Clear Transactions Only */}
             <div className="flex justify-between items-center bg-red-950/30 p-4 rounded-lg border border-red-900/30">
                <div>
                   <h4 className="text-red-400 font-bold flex items-center gap-2">
                     <RotateCcw size={16} />
                     مسح سجل المعاملات (بدء دورة جديدة)
                   </h4>
                   <p className="text-xs text-gray-500 mt-1">يؤدي هذا إلى مسح المبيعات والمشتريات وتصفية أرصدة العملاء والموردين. <br/> ستبقى المنتجات والمستخدمين كما هم.</p>
                </div>
                <button 
                  onClick={() => {
                    if(window.confirm('تحذير! سيتم مسح سجل المعاملات بالكامل وتصفير الحسابات. هل أنت متأكد؟')) {
                      onClearTransactions?.();
                    }
                  }}
                  className="px-4 py-2 bg-red-800 text-white rounded font-bold hover:bg-red-700 shadow-lg shadow-red-900/20"
                >
                  مسح المعاملات
                </button>
             </div>

             {/* Full Factory Reset */}
             <div className="flex justify-between items-center bg-red-950/30 p-4 rounded-lg border border-red-900/30">
                <div>
                   <h4 className="text-red-400 font-bold">ضبط المصنع الكامل (Factory Reset)</h4>
                   <p className="text-xs text-gray-500 mt-1">سيقوم هذا بحذف جميع البيانات المخزنة محلياً وإعادة النظام لحالته الأصلية.</p>
                </div>
                <button 
                  onClick={() => {
                    if(window.confirm('تحذير! سيتم حذف كافة البيانات والعودة للوضع الافتراضي. هل أنت متأكد؟')) {
                      onFactoryReset?.();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-500 shadow-lg shadow-red-600/20"
                >
                  حذف كل البيانات
                </button>
             </div>
          </div>
       </div>

       <div className="flex justify-end pt-4 pb-8">
         <button 
           onClick={handleSubmit}
           className="px-8 py-3 bg-fox-600 hover:bg-fox-500 text-white font-bold rounded-lg shadow-lg shadow-fox-500/20 flex items-center gap-2"
         >
           <Save size={20} />
           حفظ الإعدادات
         </button>
       </div>
    </div>
  );
};

export default Settings;
