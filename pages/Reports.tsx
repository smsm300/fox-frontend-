
import React, { useState } from 'react';
import { Transaction, TransactionType, ActivityLogEntry, Customer, Supplier, Product, PaymentMethod, User, Shift, AppSettings } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, Activity, Wallet, ArrowRight, Package, Printer, X, AlertOctagon, Trophy, ShoppingBag, Clock, History } from 'lucide-react';

interface ReportsProps {
  transactions: Transaction[];
  logs?: ActivityLogEntry[];
  shifts?: Shift[];
  customers?: Customer[];
  suppliers?: Supplier[];
  products?: Product[];
  currentUser: User;
  settings?: AppSettings;
}

const Reports: React.FC<ReportsProps> = ({ transactions, logs = [], shifts = [], customers = [], suppliers = [], products = [], currentUser, settings }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'financial' | 'debts' | 'activity' | 'shifts'>('sales');
  
  // Date Filtering State
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Print Preview State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Selected Shift for Print
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Filter transactions by date
  const filteredTransactions = transactions.filter(t => {
    const tDate = t.date.split('T')[0];
    return tDate >= startDate && tDate <= endDate;
  });

  // Helper to aggregate data by date
  const getDailyData = () => {
    const data: any = {};
    filteredTransactions.forEach(t => {
       const date = new Date(t.date).toLocaleDateString('ar-EG');
       if (!data[date]) data[date] = { date, sales: 0, expenses: 0, purchases: 0 };
       if (t.type === TransactionType.SALE) data[date].sales += t.amount;
       if (t.type === TransactionType.EXPENSE) data[date].expenses += t.amount;
       if (t.type === TransactionType.PURCHASE) data[date].purchases += t.amount;
    });
    return Object.values(data);
  };

  const chartData = getDailyData();

  // Financial Calculations
  const isSalesReturn = (t: Transaction) => t.type === TransactionType.RETURN && customers.some(c => c.id === t.relatedId);

  const totalSales = filteredTransactions.filter(t => t.type === TransactionType.SALE).reduce((a, b) => a + b.amount, 0);
  const totalReturns = filteredTransactions.filter(t => isSalesReturn(t)).reduce((a, b) => a + b.amount, 0);
  const netSales = totalSales - totalReturns;
  
  const totalExpenses = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE && t.category !== 'تكلفة بضاعة مباعة (Direct)')
    .reduce((a, b) => a + b.amount, 0);
  
  // Expenses Breakdown
  const expenseBreakdown = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => {
       const cat = curr.category || 'غير مصنف';
       acc[cat] = (acc[cat] || 0) + curr.amount;
       return acc;
    }, {} as {[key: string]: number});
  
  const expensePieData = Object.keys(expenseBreakdown).map(key => ({ name: key, value: expenseBreakdown[key] }));
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#06b6d4', '#8b5cf6'];

  // Calculate COGS
  let cogs = 0;
  filteredTransactions.forEach(t => {
    if (t.type === TransactionType.SALE && t.items) {
      t.items.forEach(item => cogs += (item.costPrice * item.cartQuantity));
    }
    if (isSalesReturn(t) && t.items) {
      t.items.forEach(item => cogs -= (item.costPrice * item.cartQuantity));
    }
  });
  
  const grossProfit = netSales - cogs;
  const netIncome = grossProfit - totalExpenses;

  // Debts Calculation
  const customersWithDebt = customers.filter(c => c.balance < 0);
  const totalReceivables = customersWithDebt.reduce((acc, c) => acc + Math.abs(c.balance), 0);

  const suppliersWithCredit = suppliers.filter(s => s.balance > 0);
  const totalPayables = suppliersWithCredit.reduce((acc, s) => acc + s.balance, 0);

  // Overdue Invoices
  const getOverdueInvoices = () => {
    const today = new Date().toISOString().split('T')[0];
    return transactions.filter(t => 
       t.paymentMethod === PaymentMethod.DEFERRED && 
       t.dueDate && 
       t.dueDate < today
    ).map(t => {
       const isSale = t.type === TransactionType.SALE;
       const relatedName = isSale 
          ? customers.find(c => c.id === t.relatedId)?.name 
          : suppliers.find(s => s.id === t.relatedId)?.name;
       return { ...t, relatedName, isSale };
    });
  };
  const overdueInvoices = getOverdueInvoices();

  // Inventory Analysis
  const totalInventoryCost = products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);
  const totalInventoryValue = products.reduce((acc, p) => acc + (p.quantity * p.sellPrice), 0);
  const potentialProfit = totalInventoryValue - totalInventoryCost;

  // Top Selling Products
  const topSelling = React.useMemo(() => {
    const productSales: {[id: number]: {name: string, qty: number, revenue: number}} = {};
    
    transactions.forEach(t => {
      if (t.type === TransactionType.SALE && t.items) {
        t.items.forEach(item => {
          if (!productSales[item.id]) productSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
          productSales[item.id].qty += item.cartQuantity;
          productSales[item.id].revenue += (item.cartQuantity * item.sellPrice);
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [transactions]);

  // Top Customers (By Sales Volume)
  const topCustomers = React.useMemo(() => {
     const custMap: {[id: number]: number} = {};
     transactions.filter(t => t.type === TransactionType.SALE).forEach(t => {
        if(t.relatedId) custMap[t.relatedId] = (custMap[t.relatedId] || 0) + t.amount;
     });
     return Object.entries(custMap)
        .map(([id, amount]) => ({
           name: customers.find(c => c.id === Number(id))?.name || 'Unknown',
           amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
  }, [transactions, customers]);

  // Top Suppliers (By Purchase Volume)
  const topSuppliers = React.useMemo(() => {
     const suppMap: {[id: number]: number} = {};
     transactions.filter(t => t.type === TransactionType.PURCHASE).forEach(t => {
        if(t.relatedId) suppMap[t.relatedId] = (suppMap[t.relatedId] || 0) + t.amount;
     });
     return Object.entries(suppMap)
        .map(([id, amount]) => ({
           name: suppliers.find(s => s.id === Number(id))?.name || 'Unknown',
           amount
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);
  }, [transactions, suppliers]);

  const SummaryCard = ({ title, value, color }: { title: string, value: string, color: string }) => (
    <div className="bg-dark-900 p-4 rounded-lg border border-dark-800">
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );

  const handleExportCSV = () => {
     const headers = ['ID', 'التاريخ', 'النوع', 'المبلغ', 'الوصف', 'طريقة الدفع'];
     const csvContent = [
        headers.join(','),
        ...filteredTransactions.map(t => [
           t.id, t.date, t.type, t.amount, `"${t.description}"`, t.paymentMethod
        ].join(','))
     ].join('\n');

     const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement("a");
     link.href = url;
     link.download = `sales_report_${startDate}_to_${endDate}.csv`;
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintZReport = () => {
     window.print();
  };

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-dark-950 p-4 rounded-xl border border-dark-800 gap-4">
        {/* Tabs */}
        <div className="flex bg-dark-900 p-1 rounded-lg border border-dark-700 overflow-x-auto max-w-full">
          {[
            { id: 'sales', label: 'المبيعات' },
            { id: 'inventory', label: 'المخزون' },
            { id: 'financial', label: 'المالية' },
            { id: 'debts', label: 'الديون' },
            { id: 'shifts', label: 'أرشيف الورديات' },
            { id: 'activity', label: 'سجل النشاط' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                ? 'bg-fox-600 text-white shadow-sm' 
                : 'text-gray-400 hover:text-white hover:bg-dark-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative group flex-1">
             <Calendar className="absolute right-3 top-2.5 text-gray-500" size={16} />
             <input 
               type="date" 
               className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 pr-10 rounded-lg text-sm focus:border-fox-500 outline-none"
               value={startDate}
               onChange={e => setStartDate(e.target.value)}
             />
          </div>
          <ArrowRight size={16} className="text-gray-600" />
          <div className="relative group flex-1">
             <Calendar className="absolute right-3 top-2.5 text-gray-500" size={16} />
             <input 
               type="date" 
               className="w-full bg-dark-900 border border-dark-700 text-white px-3 py-2 pr-10 rounded-lg text-sm focus:border-fox-500 outline-none"
               value={endDate}
               onChange={e => setEndDate(e.target.value)}
             />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-dark-950 rounded-xl border border-dark-800 p-6 min-h-[500px]">
        <div className="flex justify-between items-center mb-6 border-b border-dark-800 pb-4">
           <h2 className="text-xl font-bold text-white flex items-center gap-2">
             {activeTab === 'activity' ? <Activity className="text-fox-500" /> : 
              activeTab === 'debts' ? <Wallet className="text-fox-500" /> :
              activeTab === 'inventory' ? <Package className="text-fox-500" /> :
              activeTab === 'shifts' ? <History className="text-fox-500" /> :
              <FileText className="text-fox-500" />}
             {activeTab === 'sales' ? 'تحليل المبيعات' : 
              activeTab === 'inventory' ? 'تحليل وقيمة المخزون' : 
              activeTab === 'financial' ? 'القوائم المالية' : 
              activeTab === 'debts' ? 'الديون والمستحقات' : 
              activeTab === 'shifts' ? 'سجل الورديات (Z-Reports)' : 'سجل نشاط المستخدمين'}
           </h2>
           <div className="flex gap-2">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-1.5 bg-dark-900 text-gray-300 border border-dark-700 rounded text-sm hover:bg-dark-800"
              >
                <Download size={16} />
                تصدير (CSV)
              </button>
              <button 
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-fox-500/10 text-fox-500 border border-fox-500/30 rounded text-sm hover:bg-fox-500/20"
              >
                <Printer size={16} />
                طباعة التقرير
              </button>
           </div>
        </div>

        {activeTab === 'sales' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <SummaryCard 
                 title="صافي المبيعات" 
                 value={`${netSales.toLocaleString()} ج.م`}
                 color="text-emerald-400"
               />
               <SummaryCard 
                 title="إجمالي المرتجعات" 
                 value={`${totalReturns.toLocaleString()} ج.م`}
                 color="text-red-400"
               />
               <SummaryCard 
                 title="عدد الفواتير" 
                 value={filteredTransactions.filter(t => t.type === TransactionType.SALE).length.toString()}
                 color="text-blue-400"
               />
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Chart */}
                <div className="lg:col-span-2 h-80 bg-dark-900/50 rounded-lg p-4 border border-dark-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip 
                          contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff'}}
                          cursor={{fill: '#334155', opacity: 0.2}}
                        />
                        <Legend />
                        <Bar name="المبيعات" dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar name="المصروفات" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Top Customers (New) */}
                <div className="bg-dark-900/50 rounded-lg p-4 border border-dark-800 overflow-hidden">
                   <h3 className="font-bold text-gray-300 mb-4 flex items-center gap-2">
                      <Trophy size={18} className="text-yellow-500" />
                      كبار العملاء (Top Customers)
                   </h3>
                   <div className="space-y-3">
                      {topCustomers.map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-dark-800 pb-2 last:border-0">
                           <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-dark-800 flex items-center justify-center text-xs text-gray-400">{i+1}</span>
                              <span className="text-gray-200">{c.name}</span>
                           </div>
                           <span className="font-bold text-emerald-400">{c.amount.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <SummaryCard 
                   title="تكلفة المخزون الحالية" 
                   value={`${totalInventoryCost.toLocaleString()} ج.م`}
                   color="text-blue-400"
                 />
                 <SummaryCard 
                   title="القيمة البيعية المتوقعة" 
                   value={`${totalInventoryValue.toLocaleString()} ج.م`}
                   color="text-emerald-400"
                 />
                 <SummaryCard 
                   title="الربح المتوقع" 
                   value={`${potentialProfit.toLocaleString()} ج.م`}
                   color="text-fox-500"
                 />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-dark-900 rounded-lg p-5 border border-dark-800">
                  <h3 className="font-bold text-gray-200 mb-4 border-b border-dark-700 pb-2">أعلى 5 منتجات مبيعاً (كمية)</h3>
                  <div className="space-y-3">
                     {topSelling.length === 0 ? <p className="text-gray-500 text-center">لا توجد مبيعات حتى الآن</p> : 
                        topSelling.map((item, index) => (
                           <div key={index} className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                 <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                    index === 0 ? 'bg-yellow-500 text-black' : 
                                    index === 1 ? 'bg-gray-400 text-black' : 
                                    'bg-orange-700 text-white'
                                 }`}>{index + 1}</span>
                                 <span className="text-gray-300">{item.name}</span>
                              </div>
                              <span className="font-mono font-bold text-fox-400">{item.qty} قطعة</span>
                           </div>
                        ))
                     }
                  </div>
                </div>
                
                <div className="bg-dark-900 rounded-lg p-5 border border-dark-800">
                  <h3 className="font-bold text-gray-200 mb-4 border-b border-dark-700 pb-2">توزيع المخزون</h3>
                  <div className="h-64 flex items-center justify-center">
                     {products.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={products.slice(0, 5).map(p => ({name: p.name, value: p.quantity}))}
                                 dataKey="value"
                                 nameKey="name"
                                 cx="50%"
                                 cy="50%"
                                 outerRadius={80}
                                 fill="#8884d8"
                                 label
                              >
                                 {products.slice(0, 5).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} />
                           </PieChart>
                        </ResponsiveContainer>
                     ) : (
                        <p className="text-gray-500">لا توجد منتجات</p>
                     )}
                  </div>
                </div>
              </div>
           </div>
        )}

        {activeTab === 'financial' && (
           <div className="animate-in fade-in">
             <div className="bg-gradient-to-r from-dark-900 to-dark-900/50 border border-dark-800 rounded-lg p-8 text-center mb-6">
                <p className="text-gray-400 mb-2">صافي الربح الفعلي (Net Income)</p>
                <h1 className="text-5xl font-bold text-white neon-text mb-4">{netIncome.toLocaleString()} <span className="text-2xl text-gray-500">ج.م</span></h1>
                <p className={`text-sm ${netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netIncome >= 0 ? 'ربح صافي' : 'خسارة'}
                </p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-dark-800 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm border-b border-dark-800 pb-2 mb-2">قائمة الدخل المختصرة</h4>
                  <div className="flex justify-between mb-2 text-sm text-gray-300">
                    <span>إجمالي المبيعات</span> 
                    <span className="font-mono">{totalSales.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-red-400">
                    <span>- مرتجعات مبيعات</span> 
                    <span className="font-mono">{totalReturns.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-red-400">
                    <span>- تكلفة البضاعة (COGS)</span> 
                    <span className="font-mono">{cogs.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dark-800 text-sm font-bold text-white">
                    <span>= مجمل الربح</span> 
                    <span className="font-mono">{grossProfit.toLocaleString()}</span>
                  </div>
                </div>
                <div className="border border-dark-800 rounded-lg p-4">
                  <h4 className="text-gray-400 text-sm border-b border-dark-800 pb-2 mb-2">تفاصيل المصروفات</h4>
                  <div className="flex gap-4">
                     <div className="w-32 h-32 relative">
                         <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expensePieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={25}
                              outerRadius={50}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {expensePieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff'}} />
                          </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="flex-1 space-y-1 overflow-y-auto max-h-32 custom-scrollbar">
                        {expensePieData.map((entry, index) => (
                           <div key={index} className="flex justify-between text-xs items-center">
                              <div className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                                <span className="text-gray-300">{entry.name}</span>
                              </div>
                              <span className="font-mono text-gray-400">{entry.value.toLocaleString()}</span>
                           </div>
                        ))}
                     </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-dark-800 flex justify-between font-bold text-sm text-red-400">
                     <span>إجمالي المصروفات</span>
                     <span>{Object.values(expenseBreakdown).reduce((a: number, b: number)=>a+b, 0).toLocaleString()}</span>
                  </div>
                </div>
             </div>
           </div>
        )}

        {activeTab === 'debts' && (
           <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Customers Debts */}
                <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden lg:col-span-1">
                   <div className="p-4 bg-dark-800 border-b border-dark-700 flex justify-between items-center">
                      <h3 className="font-bold text-blue-400">مستحقات عند العملاء</h3>
                      <span className="text-xl font-bold text-white">{totalReceivables.toLocaleString()} ج.م</span>
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-right text-sm">
                         <thead className="bg-dark-950 text-gray-500">
                            <tr>
                               <th className="p-3">العميل</th>
                               <th className="p-3">المبلغ</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-dark-800">
                            {customersWithDebt.length === 0 ? (
                              <tr><td colSpan={2} className="p-4 text-center text-gray-500">لا توجد ديون</td></tr>
                            ) : (
                              customersWithDebt.map(c => (
                                <tr key={c.id}>
                                  <td className="p-3 text-gray-300">{c.name}</td>
                                  <td className="p-3 font-bold text-blue-400 font-mono">{Math.abs(c.balance).toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Suppliers Debts */}
                <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden lg:col-span-1">
                   <div className="p-4 bg-dark-800 border-b border-dark-700 flex justify-between items-center">
                      <h3 className="font-bold text-red-400">ديون للموردين</h3>
                      <span className="text-xl font-bold text-white">{totalPayables.toLocaleString()} ج.م</span>
                   </div>
                   <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-right text-sm">
                         <thead className="bg-dark-950 text-gray-500">
                            <tr>
                               <th className="p-3">المورد</th>
                               <th className="p-3">المبلغ</th>
                            </tr>
                         </thead>
                         <tbody className="divide-y divide-dark-800">
                            {suppliersWithCredit.length === 0 ? (
                              <tr><td colSpan={2} className="p-4 text-center text-gray-500">لا توجد مستحقات</td></tr>
                            ) : (
                              suppliersWithCredit.map(s => (
                                <tr key={s.id}>
                                  <td className="p-3 text-gray-300">{s.name}</td>
                                  <td className="p-3 font-bold text-red-400 font-mono">{s.balance.toLocaleString()}</td>
                                </tr>
                              ))
                            )}
                         </tbody>
                      </table>
                   </div>
                </div>

                {/* Top Suppliers List (New) */}
                <div className="bg-dark-900 rounded-lg border border-dark-800 overflow-hidden lg:col-span-1">
                   <div className="p-4 bg-dark-800 border-b border-dark-700 flex items-center gap-2">
                      <ShoppingBag size={18} className="text-purple-400" />
                      <h3 className="font-bold text-gray-200">أكثر الموردين تعاملاً</h3>
                   </div>
                   <div className="max-h-64 overflow-y-auto p-4 space-y-3">
                      {topSuppliers.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b border-dark-800 pb-2 last:border-0">
                           <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-dark-950 flex items-center justify-center text-xs text-gray-400">{i+1}</span>
                              <span className="text-gray-300">{s.name}</span>
                           </div>
                           <span className="font-bold text-purple-400">{s.amount.toLocaleString()}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>

              {/* Overdue Invoices Table */}
              <div className="bg-dark-900 rounded-lg border border-red-900/30 overflow-hidden">
                 <div className="p-4 bg-red-900/10 border-b border-red-900/30 flex items-center gap-2">
                    <AlertOctagon size={20} className="text-red-500" />
                    <h3 className="font-bold text-red-400">الفواتير المستحقة والمتأخرة (Overdue)</h3>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                       <thead className="bg-dark-950 text-gray-500">
                          <tr>
                             <th className="p-3">رقم الفاتورة</th>
                             <th className="p-3">تاريخ الاستحقاق</th>
                             <th className="p-3">الطرف</th>
                             <th className="p-3">النوع</th>
                             <th className="p-3">القيمة</th>
                             <th className="p-3">الحالة</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-dark-800">
                          {overdueInvoices.length === 0 ? (
                             <tr><td colSpan={6} className="p-6 text-center text-gray-500">سجل نظيف! لا توجد فواتير متأخرة.</td></tr>
                          ) : (
                             overdueInvoices.map(t => (
                                <tr key={t.id} className="hover:bg-dark-800/50">
                                   <td className="p-3 font-mono text-gray-400">{t.id}</td>
                                   <td className="p-3 font-mono text-red-400 font-bold">{t.dueDate}</td>
                                   <td className="p-3 text-gray-300">{t.relatedName}</td>
                                   <td className="p-3">
                                      <span className={`px-2 py-1 text-xs rounded border ${t.isSale ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                                         {t.isSale ? 'لنا (بيع)' : 'علينا (شراء)'}
                                      </span>
                                   </td>
                                   <td className="p-3 font-bold text-gray-200">{t.amount.toLocaleString()}</td>
                                   <td className="p-3">
                                      <span className="text-xs bg-red-600 text-white px-2 py-1 rounded">متأخر</span>
                                   </td>
                                </tr>
                             ))
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'shifts' && (
           <div className="animate-in fade-in">
              <div className="overflow-x-auto rounded-lg border border-dark-800">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-dark-900 text-gray-400">
                       <tr>
                          <th className="p-3">ID</th>
                          <th className="p-3">الكاشير</th>
                          <th className="p-3">البداية</th>
                          <th className="p-3">النهاية</th>
                          <th className="p-3">المبيعات</th>
                          <th className="p-3">العجز/الزيادة</th>
                          <th className="p-3 text-center">طباعة</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800 text-gray-300">
                       {shifts.length === 0 ? (
                         <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا يوجد سجل للورديات</td></tr>
                       ) : (
                         [...shifts].reverse().map(shift => (
                           <tr key={shift.id} className="hover:bg-dark-900/50">
                              <td className="p-3 font-mono text-gray-500">{shift.id.toString().slice(-4)}</td>
                              <td className="p-3 text-white font-bold">{shift.userName}</td>
                              <td className="p-3 text-xs text-gray-400">{new Date(shift.startTime).toLocaleString('ar-EG')}</td>
                              <td className="p-3 text-xs text-gray-400">{shift.endTime ? new Date(shift.endTime).toLocaleString('ar-EG') : 'مفتوحة'}</td>
                              <td className="p-3 font-bold text-emerald-400">{shift.totalSales?.toLocaleString() || 0}</td>
                              <td className="p-3">
                                {shift.status === 'closed' ? (
                                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                                      (shift.endCash! - shift.expectedCash!) < 0 ? 'bg-red-500/20 text-red-500' :
                                      (shift.endCash! - shift.expectedCash!) > 0 ? 'bg-emerald-500/20 text-emerald-500' :
                                      'bg-gray-700 text-gray-400'
                                   }`}>
                                      {(shift.endCash! - shift.expectedCash!).toLocaleString()}
                                   </span>
                                ) : (
                                   <span className="text-yellow-500 text-xs">جاري العمل...</span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                 {shift.status === 'closed' && (
                                    <button 
                                      onClick={() => setSelectedShift(shift)}
                                      className="p-1.5 bg-dark-800 hover:bg-white hover:text-black rounded text-gray-400 transition-colors"
                                      title="إعادة طباعة Z-Report"
                                    >
                                       <Printer size={16} />
                                    </button>
                                 )}
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {activeTab === 'activity' && (
           <div className="animate-in fade-in">
              <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-dark-900 text-gray-400">
                       <tr>
                          <th className="p-3">الوقت</th>
                          <th className="p-3">المستخدم</th>
                          <th className="p-3">الإجراء</th>
                          <th className="p-3">التفاصيل</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-800 text-gray-300">
                       {logs.length === 0 ? (
                         <tr><td colSpan={4} className="p-4 text-center text-gray-500">لا يوجد نشاط مسجل</td></tr>
                       ) : (
                         [...logs].reverse().slice(0, 50).map(log => (
                           <tr key={log.id} className="hover:bg-dark-900/50">
                             <td className="p-3 font-mono text-gray-500">{new Date(log.date).toLocaleString('ar-EG')}</td>
                             <td className="p-3">
                               <span className="flex items-center gap-2">
                                 <span className="w-6 h-6 rounded-full bg-dark-800 flex items-center justify-center text-xs">{log.userName.charAt(0)}</span>
                                 {log.userName}
                               </span>
                             </td>
                             <td className="p-3">
                               <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs">
                                 {log.action}
                               </span>
                             </td>
                             <td className="p-3 text-gray-400">{log.details}</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {isPrintModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white text-black w-full max-w-4xl rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:h-full print:rounded-none">
               <div className="p-8 relative">
                   {/* Header */}
                   <button onClick={() => setIsPrintModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-red-500 no-print">
                      <X size={24} />
                   </button>
                   
                   <div className="text-center border-b-2 border-black pb-4 mb-6">
                      <h1 className="text-3xl font-bold mb-2">FOX GROUP</h1>
                      <h2 className="text-xl text-gray-700">تقرير {
                         activeTab === 'sales' ? 'المبيعات' : 
                         activeTab === 'inventory' ? 'المخزون' : 
                         activeTab === 'financial' ? 'القوائم المالية' : 
                         activeTab === 'debts' ? 'الديون والمستحقات' : 
                         activeTab === 'shifts' ? 'سجل الورديات' : 'النشاط'
                      }</h2>
                      <p className="text-sm text-gray-500 mt-2">عن الفترة من {startDate} إلى {endDate}</p>
                   </div>

                   {/* Print Content Body */}
                   <div className="space-y-6">
                      {activeTab === 'financial' && (
                         <div className="grid grid-cols-2 gap-8">
                            <div className="border border-gray-300 p-4 rounded">
                               <h3 className="font-bold border-b border-gray-300 pb-2 mb-2">ملخص الدخل</h3>
                               <div className="flex justify-between py-1"><span>المبيعات:</span> <span>{totalSales.toLocaleString()}</span></div>
                               <div className="flex justify-between py-1 text-red-600"><span>المرتجعات:</span> <span>({totalReturns.toLocaleString()})</span></div>
                               <div className="flex justify-between py-1 text-red-600"><span>التكلفة (COGS):</span> <span>({cogs.toLocaleString()})</span></div>
                               <div className="flex justify-between py-1 text-red-600"><span>المصروفات:</span> <span>({totalExpenses.toLocaleString()})</span></div>
                               <div className="flex justify-between py-2 border-t border-black font-bold text-lg mt-2">
                                  <span>صافي الربح:</span> 
                                  <span>{netIncome.toLocaleString()} ج.م</span>
                               </div>
                            </div>
                         </div>
                      )}

                      {/* Generic Table for Data */}
                      {activeTab === 'sales' && (
                         <table className="w-full text-right text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                               <tr>
                                  <th className="p-2 border border-gray-300">التاريخ</th>
                                  <th className="p-2 border border-gray-300">رقم العملية</th>
                                  <th className="p-2 border border-gray-300">الوصف</th>
                                  <th className="p-2 border border-gray-300">المبلغ</th>
                               </tr>
                            </thead>
                            <tbody>
                               {filteredTransactions.map(t => (
                                  <tr key={t.id}>
                                     <td className="p-2 border border-gray-300">{new Date(t.date).toLocaleDateString('ar-EG')}</td>
                                     <td className="p-2 border border-gray-300">{t.id}</td>
                                     <td className="p-2 border border-gray-300">{t.description}</td>
                                     <td className="p-2 border border-gray-300 font-bold">{t.amount.toLocaleString()}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      )}
                      
                      {activeTab === 'inventory' && (
                         <table className="w-full text-right text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                               <tr>
                                  <th className="p-2 border border-gray-300">المنتج</th>
                                  <th className="p-2 border border-gray-300">الكمية</th>
                                  <th className="p-2 border border-gray-300">التكلفة</th>
                                  <th className="p-2 border border-gray-300">سعر البيع</th>
                                  <th className="p-2 border border-gray-300">إجمالي القيمة</th>
                               </tr>
                            </thead>
                            <tbody>
                               {products.map(p => (
                                  <tr key={p.id}>
                                     <td className="p-2 border border-gray-300">{p.name}</td>
                                     <td className="p-2 border border-gray-300">{p.quantity}</td>
                                     <td className="p-2 border border-gray-300">{p.costPrice}</td>
                                     <td className="p-2 border border-gray-300">{p.sellPrice}</td>
                                     <td className="p-2 border border-gray-300 font-bold">{(p.quantity * p.sellPrice).toLocaleString()}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      )}

                      {activeTab === 'debts' && (
                         <div className="space-y-4">
                            <div>
                               <h3 className="font-bold mb-2">مستحقات عند العملاء</h3>
                               <table className="w-full text-right text-sm border-collapse border border-gray-300">
                                  <thead className="bg-gray-100">
                                     <tr>
                                        <th className="p-2 border border-gray-300">العميل</th>
                                        <th className="p-2 border border-gray-300">المبلغ المستحق</th>
                                        <th className="p-2 border border-gray-300">الهاتف</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {customersWithDebt.map(c => (
                                        <tr key={c.id}>
                                           <td className="p-2 border border-gray-300">{c.name}</td>
                                           <td className="p-2 border border-gray-300 font-bold">{Math.abs(c.balance).toLocaleString()}</td>
                                           <td className="p-2 border border-gray-300">{c.phone}</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                            <div>
                               <h3 className="font-bold mb-2">مستحقات للموردين</h3>
                               <table className="w-full text-right text-sm border-collapse border border-gray-300">
                                  <thead className="bg-gray-100">
                                     <tr>
                                        <th className="p-2 border border-gray-300">المورد</th>
                                        <th className="p-2 border border-gray-300">المبلغ المستحق</th>
                                        <th className="p-2 border border-gray-300">الهاتف</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                     {suppliersWithCredit.map(s => (
                                        <tr key={s.id}>
                                           <td className="p-2 border border-gray-300">{s.name}</td>
                                           <td className="p-2 border border-gray-300 font-bold">{s.balance.toLocaleString()}</td>
                                           <td className="p-2 border border-gray-300">{s.phone}</td>
                                        </tr>
                                     ))}
                                  </tbody>
                               </table>
                            </div>
                         </div>
                      )}

                      {activeTab === 'activity' && (
                         <table className="w-full text-right text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                               <tr>
                                  <th className="p-2 border border-gray-300">الوقت</th>
                                  <th className="p-2 border border-gray-300">المستخدم</th>
                                  <th className="p-2 border border-gray-300">الإجراء</th>
                                  <th className="p-2 border border-gray-300">التفاصيل</th>
                               </tr>
                            </thead>
                            <tbody>
                               {[...logs].reverse().slice(0, 50).map(log => (
                                  <tr key={log.id}>
                                     <td className="p-2 border border-gray-300">{new Date(log.date).toLocaleString('ar-EG')}</td>
                                     <td className="p-2 border border-gray-300">{log.userName}</td>
                                     <td className="p-2 border border-gray-300">{log.action}</td>
                                     <td className="p-2 border border-gray-300">{log.details}</td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      )}
                      
                      {activeTab === 'shifts' && (
                         <table className="w-full text-right text-sm border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                               <tr>
                                  <th className="p-2 border border-gray-300">الكاشير</th>
                                  <th className="p-2 border border-gray-300">البداية</th>
                                  <th className="p-2 border border-gray-300">النهاية</th>
                                  <th className="p-2 border border-gray-300">المبيعات</th>
                                  <th className="p-2 border border-gray-300">العجز/الزيادة</th>
                               </tr>
                            </thead>
                            <tbody>
                               {[...shifts].reverse().map(shift => (
                                  <tr key={shift.id}>
                                     <td className="p-2 border border-gray-300">{shift.userName}</td>
                                     <td className="p-2 border border-gray-300">{new Date(shift.startTime).toLocaleString('ar-EG')}</td>
                                     <td className="p-2 border border-gray-300">{shift.endTime ? new Date(shift.endTime).toLocaleString('ar-EG') : 'مفتوحة'}</td>
                                     <td className="p-2 border border-gray-300">{shift.totalSales?.toLocaleString()}</td>
                                     <td className="p-2 border border-gray-300">
                                        {shift.status === 'closed' ? (shift.endCash! - shift.expectedCash!).toLocaleString() : '-'}
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      )}
                   </div>

                   {/* Footer */}
                   <div className="mt-12 text-center text-xs text-gray-500 border-t border-gray-300 pt-4">
                      <p>تم استخراج التقرير بتاريخ {new Date().toLocaleString('ar-EG')}</p>
                   </div>
               </div>
               
               {/* Controls */}
               <div className="bg-gray-100 p-4 flex gap-3 no-print">
                  <button onClick={handlePrint} className="flex-1 bg-fox-600 text-white py-2 rounded font-bold hover:bg-fox-500 flex items-center justify-center gap-2">
                     <Printer size={18} />
                     طباعة التقرير
                  </button>
                  <button onClick={() => setIsPrintModalOpen(false)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-bold hover:bg-gray-300">
                     إغلاق
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* Z-Report Reprint Modal */}
      {selectedShift && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:bg-white print:p-0">
            <div className="bg-white text-black w-full max-w-md rounded-xl p-8 shadow-2xl print:w-full print:h-full print:rounded-none">
               <div className="text-center border-b-2 border-black pb-4 mb-4">
                  <h1 className="text-2xl font-bold">تقرير إغلاق وردية (Z-Report)</h1>
                  <p className="text-sm">نسخة طبق الأصل</p>
                  <p className="text-xs text-gray-500">التاريخ: {new Date(selectedShift.endTime!).toLocaleDateString('ar-EG')}</p>
               </div>
               
               <div className="space-y-2 text-sm text-right mb-6">
                  <div className="flex justify-between"><span>الكاشير:</span> <span className="font-bold">{selectedShift.userName}</span></div>
                  <div className="flex justify-between"><span>وقت البدء:</span> <span>{new Date(selectedShift.startTime).toLocaleTimeString()}</span></div>
                  <div className="flex justify-between"><span>وقت الإغلاق:</span> <span>{new Date(selectedShift.endTime!).toLocaleTimeString()}</span></div>
                  <div className="border-t border-dashed border-gray-400 my-2"></div>
                  
                  {/* Detailed Sales Breakdown */}
                  {selectedShift.salesByMethod && (
                    <>
                       <div className="font-bold mb-1">تفاصيل المبيعات:</div>
                       <div className="flex justify-between text-xs"><span>كاش:</span> <span>{selectedShift.salesByMethod[PaymentMethod.CASH]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>محفظة:</span> <span>{selectedShift.salesByMethod[PaymentMethod.WALLET]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>Instapay:</span> <span>{selectedShift.salesByMethod[PaymentMethod.INSTAPAY]?.toLocaleString() || 0}</span></div>
                       <div className="flex justify-between text-xs"><span>آجل:</span> <span>{selectedShift.salesByMethod[PaymentMethod.DEFERRED]?.toLocaleString() || 0}</span></div>
                       <div className="border-t border-dashed border-gray-400 my-2"></div>
                    </>
                  )}

                  <div className="flex justify-between"><span>بداية الدرج:</span> <span>{selectedShift.startCash.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg border-t border-black pt-2"><span>المتوقع في الدرج (كاش):</span> <span>{selectedShift.expectedCash!.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>الفعلي (العد):</span> <span>{selectedShift.endCash!.toLocaleString()}</span></div>
                  
                  <div className={`flex justify-between font-bold p-2 mt-2 rounded ${
                     (selectedShift.endCash! - selectedShift.expectedCash!) < 0 ? 'bg-red-100 text-red-600' : 
                     (selectedShift.endCash! - selectedShift.expectedCash!) > 0 ? 'bg-green-100 text-green-600' : 
                     'bg-gray-100 text-gray-800'
                  }`}>
                     <span>العجز / الزيادة:</span> 
                     <span>{(selectedShift.endCash! - selectedShift.expectedCash!).toLocaleString()}</span>
                  </div>
               </div>

               <div className="no-print flex gap-3">
                  <button onClick={handlePrintZReport} className="flex-1 bg-black text-white py-2 rounded font-bold flex items-center justify-center gap-2"><Printer size={16}/> طباعة</button>
                  <button onClick={() => setSelectedShift(null)} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded font-bold">إغلاق</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Reports;
