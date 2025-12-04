
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, AlertTriangle, Package, DollarSign, ArrowDownRight, ArrowUpRight, CalendarClock, ShieldCheck, AlertOctagon, Printer, X, Calendar } from 'lucide-react';
import { Product, Transaction, TransactionType, Customer, User, PaymentMethod, AppSettings } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  customers: Customer[];
  currentUser: User;
  settings?: AppSettings;
}

const Dashboard: React.FC<DashboardProps> = ({ products, transactions, customers, currentUser, settings }) => {
  // Date Filtering
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Filter transactions based on date range for Stats
  const filteredTransactions = transactions.filter(t => {
     const tDate = t.date.split('T')[0];
     return tDate >= startDate && tDate <= endDate;
  });

  // Calculations based on filtered transactions
  const lowStockProducts = products.filter(p => p.quantity <= p.minStockAlert);
  
  const isSalesReturn = (t: Transaction) => t.type === TransactionType.RETURN && customers.some(c => c.id === t.relatedId);

  const totalSales = filteredTransactions
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSalesReturns = filteredTransactions
    .filter(t => isSalesReturn(t))
    .reduce((sum, t) => sum + t.amount, 0);

  const netRevenue = totalSales - totalSalesReturns;
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE && t.category !== 'تكلفة بضاعة مباعة (Direct)')
    .reduce((sum, t) => sum + t.amount, 0);

  const calculateCOGS = () => {
    let cogs = 0;
    filteredTransactions.forEach(t => {
      if (t.type === TransactionType.SALE && t.items) {
        t.items.forEach(item => {
          cogs += (item.costPrice * item.cartQuantity);
        });
      }
      if (isSalesReturn(t) && t.items && !t.isDirectSale) {
        t.items.forEach(item => {
          cogs -= (item.costPrice * item.cartQuantity);
        });
      }
    });
    return cogs;
  };

  const cogs = calculateCOGS();
  const grossProfit = netRevenue - cogs;
  const netIncome = grossProfit - totalExpenses;

  // Alerts logic (Always real-time, not filtered by date)
  const pendingApprovalsCount = transactions.filter(t => t.status === 'pending').length;
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeek = new Date();
  nextWeek.setDate(new Date().getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  const upcomingDues = transactions.filter(t => {
     if (t.paymentMethod !== PaymentMethod.DEFERRED || !t.dueDate) return false;
     return t.dueDate >= todayStr && t.dueDate <= nextWeekStr;
  });

  const upcomingReceivables = upcomingDues
    .filter(t => t.type === TransactionType.SALE)
    .reduce((sum, t) => sum + t.amount, 0);

  const upcomingPayables = upcomingDues
    .filter(t => t.type === TransactionType.PURCHASE)
    .reduce((sum, t) => sum + t.amount, 0);

  const overdueInvoices = transactions.filter(t => {
     if (t.paymentMethod !== PaymentMethod.DEFERRED || !t.dueDate) return false;
     return t.dueDate < todayStr;
  });
  const overdueCount = overdueInvoices.length;
  const overdueAmount = overdueInvoices.reduce((sum, t) => sum + t.amount, 0);

  // Charts Data
  const getLast7DaysSales = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayName = d.toLocaleDateString('ar-EG', { weekday: 'long' });
      const dateStr = d.toISOString().split('T')[0];
      
      const salesForDay = transactions
        .filter(t => t.type === TransactionType.SALE && t.date.startsWith(dateStr))
        .reduce((sum, t) => sum + t.amount, 0);
        
      days.push({ name: dayName, sales: salesForDay });
    }
    return days;
  };

  const salesData = getLast7DaysSales();

  const getCategoryData = () => {
    const cats: {[key: string]: number} = {};
    products.forEach(p => {
       if (!cats[p.category]) cats[p.category] = 0;
       cats[p.category] += (p.sellPrice * p.quantity); 
    });
    return Object.keys(cats).map(key => ({ name: key, value: cats[key] }));
  };

  const categoryData = getCategoryData();
  const COLORS = ['#f97316', '#06b6d4', '#8b5cf6', '#10b981', '#f43f5e'];

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-dark-950 p-6 rounded-xl border border-dark-800 shadow-lg relative overflow-hidden group hover:border-fox-500/50 transition-all duration-300">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg bg-dark-900 ${color.replace('bg-', 'text-')} bg-opacity-20`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-xs text-gray-500">{subtext}</p>
      <div className={`absolute -bottom-4 -right-4 w-24 h-24 ${color.replace('bg-', 'bg-')} opacity-10 blur-2xl rounded-full group-hover:opacity-20 transition-opacity`}></div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Filter Bar */}
       <div className="flex flex-col sm:flex-row justify-between items-center bg-dark-950 p-4 rounded-xl border border-dark-800 gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <div className="relative group">
                <Calendar className="absolute right-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="date" 
                  className="bg-dark-900 border border-dark-700 text-white px-3 py-2 pr-10 rounded-lg text-sm focus:border-fox-500 outline-none"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
             </div>
             <span className="text-gray-500 text-sm">إلى</span>
             <div className="relative group">
                <Calendar className="absolute right-3 top-2.5 text-gray-500" size={16} />
                <input 
                  type="date" 
                  className="bg-dark-900 border border-dark-700 text-white px-3 py-2 pr-10 rounded-lg text-sm focus:border-fox-500 outline-none"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
             </div>
          </div>
          <button 
             onClick={() => setShowPrintModal(true)}
             className="flex items-center gap-2 px-4 py-2 bg-fox-600 text-white rounded-lg hover:bg-fox-500 text-sm font-bold shadow-lg shadow-fox-500/20"
          >
             <Printer size={16} />
             طباعة تقرير
          </button>
       </div>

      {/* --- Alerts Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
         {currentUser.role === 'admin' && pendingApprovalsCount > 0 && (
            <div className="bg-yellow-900/10 border border-yellow-500/30 rounded-xl p-4 flex items-center justify-between animate-pulse">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-yellow-500/20 text-yellow-500 rounded-full"><ShieldCheck size={20} /></div>
                 <div>
                   <h4 className="font-bold text-yellow-500 text-sm">طلبات معلقة</h4>
                   <p className="text-[10px] text-gray-400">{pendingApprovalsCount} معاملة بانتظار الموافقة</p>
                 </div>
               </div>
               <span className="text-xl font-bold text-white">{pendingApprovalsCount}</span>
            </div>
         )}
         {overdueCount > 0 && (
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-red-500/20 text-red-500 rounded-full"><AlertOctagon size={20} /></div>
                 <div>
                   <h4 className="font-bold text-red-500 text-sm">فواتير متأخرة</h4>
                   <p className="text-[10px] text-gray-400">{overdueCount} فاتورة</p>
                 </div>
               </div>
               <div className="text-right">
                  <span className="text-lg font-bold text-white block">{overdueAmount.toLocaleString()}</span>
               </div>
            </div>
         )}
         {upcomingReceivables > 0 && (
            <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/20 text-blue-500 rounded-full"><CalendarClock size={20} /></div>
                 <div>
                   <h4 className="font-bold text-blue-500 text-sm">تحصيل متوقع</h4>
                   <p className="text-[10px] text-gray-400">خلال 7 أيام</p>
                 </div>
               </div>
               <div className="text-right">
                  <span className="text-lg font-bold text-white block">{upcomingReceivables.toLocaleString()}</span>
               </div>
            </div>
         )}
         {upcomingPayables > 0 && (
            <div className="bg-orange-900/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-500/20 text-orange-500 rounded-full"><CalendarClock size={20} /></div>
                 <div>
                   <h4 className="font-bold text-orange-500 text-sm">سداد مطلوب</h4>
                   <p className="text-[10px] text-gray-400">للموردين خلال 7 أيام</p>
                 </div>
               </div>
               <div className="text-right">
                  <span className="text-lg font-bold text-white block">{upcomingPayables.toLocaleString()}</span>
               </div>
            </div>
         )}
      </div>

      {/* --- Main Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="صافي الإيرادات" 
          value={`${netRevenue.toLocaleString()} ج.م`} 
          subtext={`إجمالي المبيعات - ${totalSalesReturns.toLocaleString()} مرتجعات`}
          icon={TrendingUp}
          color="bg-emerald-500"
        />
        <StatCard 
          title="صافي الربح" 
          value={`${netIncome.toLocaleString()} ج.م`} 
          subtext="الإيرادات - التكلفة - المصروفات"
          icon={DollarSign}
          color="bg-fox-500"
        />
        <StatCard 
          title="إجمالي المنتجات" 
          value={products.length} 
          subtext={`${products.reduce((acc, curr) => acc + curr.quantity, 0)} قطعة في المخزن`}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard 
          title="نواقص المخزون" 
          value={lowStockProducts.length} 
          subtext="منتجات وصلت للحد الأدنى"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-dark-950 p-6 rounded-xl border border-dark-800">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-dark-800 pb-3">تحليل المبيعات (آخر 7 أيام)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChartComponent data={salesData} />
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-dark-950 p-6 rounded-xl border border-dark-800">
          <h3 className="text-lg font-bold text-white mb-6 border-b border-dark-800 pb-3">توزيع قيمة المخزون</h3>
          <div className="h-80 w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- Mini Financial Report --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-gray-400 text-sm">تكلفة البضاعة المباعة (COGS)</p>
             <p className="text-xl font-bold text-white">{cogs.toLocaleString()} ج.م</p>
           </div>
           <ArrowDownRight className="text-red-500" />
         </div>
         <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-gray-400 text-sm">مجمل الربح (Gross Profit)</p>
             <p className="text-xl font-bold text-emerald-400">{grossProfit.toLocaleString()} ج.م</p>
           </div>
           <ArrowUpRight className="text-emerald-500" />
         </div>
         <div className="bg-dark-900 p-4 rounded-xl border border-dark-800 flex items-center justify-between">
           <div>
             <p className="text-gray-400 text-sm">المصروفات التشغيلية</p>
             <p className="text-xl font-bold text-red-400">{totalExpenses.toLocaleString()} ج.م</p>
           </div>
           <ArrowDownRight className="text-red-500" />
         </div>
      </div>

      {/* Print Report Modal */}
      {showPrintModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white text-black w-full max-w-2xl rounded-xl p-8 shadow-2xl print:w-full print:h-full print:rounded-none">
               <div className="relative">
                  <button onClick={() => setShowPrintModal(false)} className="absolute top-0 right-0 text-gray-500 hover:text-red-500 no-print">
                     <X size={24} />
                  </button>
                  
                  {/* Print Header */}
                  <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                     {settings?.logoUrl && <img src={settings.logoUrl} className="h-16 mx-auto mb-2" alt="Logo" />}
                     <h1 className="text-2xl font-bold uppercase">{settings?.companyName || 'Fox Group'}</h1>
                     <h2 className="text-xl text-gray-700">تقرير الأداء المالي</h2>
                     <p className="text-sm text-gray-500 mt-1">عن الفترة من {startDate} إلى {endDate}</p>
                  </div>

                  <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="border p-3 rounded">
                           <p className="text-gray-500 text-sm">إجمالي المبيعات</p>
                           <p className="font-bold text-xl">{totalSales.toLocaleString()}</p>
                        </div>
                        <div className="border p-3 rounded">
                           <p className="text-gray-500 text-sm">المرتجعات</p>
                           <p className="font-bold text-xl text-red-600">{totalSalesReturns.toLocaleString()}</p>
                        </div>
                        <div className="border p-3 rounded">
                           <p className="text-gray-500 text-sm">صافي الإيرادات</p>
                           <p className="font-bold text-xl text-green-700">{netRevenue.toLocaleString()}</p>
                        </div>
                        <div className="border p-3 rounded">
                           <p className="text-gray-500 text-sm">التكلفة (COGS)</p>
                           <p className="font-bold text-xl">{cogs.toLocaleString()}</p>
                        </div>
                     </div>
                     
                     <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between font-bold text-lg mb-2">
                           <span>مجمل الربح:</span>
                           <span>{grossProfit.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-red-600 mb-2">
                           <span>المصروفات:</span>
                           <span>- {totalExpenses.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between font-bold text-2xl border-t border-black pt-2">
                           <span>صافي الربح:</span>
                           <span>{netIncome.toLocaleString()} ج.م</span>
                        </div>
                     </div>
                  </div>

                  <div className="mt-8 text-center text-xs text-gray-500">
                     <p>{settings?.companyAddress} - {settings?.companyPhone}</p>
                     <p>تم استخراج التقرير بتاريخ {new Date().toLocaleDateString('ar-EG')}</p>
                  </div>
               </div>

               <div className="no-print mt-6 flex justify-center gap-4">
                  <button onClick={() => window.print()} className="bg-black text-white px-6 py-2 rounded font-bold flex items-center gap-2">
                     <Printer size={18} /> طباعة
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

// Wrapper for Recharts
const AreaChartComponent = ({ data }: { data: any[] }) => (
  <BarChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
    <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
    <YAxis stroke="#94a3b8" tick={{fontSize: 12}} />
    <RechartsTooltip 
      cursor={{fill: '#334155', opacity: 0.2}}
      contentStyle={{backgroundColor: '#0f172a', borderColor: '#f97316', borderRadius: '8px', color: '#fff'}} 
      formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'المبيعات']}
    />
    <Bar dataKey="sales" fill="#f97316" radius={[4, 4, 0, 0]} barSize={40} />
  </BarChart>
);

export default Dashboard;
