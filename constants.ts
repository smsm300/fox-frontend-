
import { Product, ProductUnit, Customer, Supplier, Transaction, TransactionType, PaymentMethod, AppSettings, User } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: 'CRN-001',
    name: 'كرنيشة فيوتك مودرن 10سم',
    category: 'كرانيش',
    quantity: 150,
    costPrice: 45,
    sellPrice: 65,
    unit: ProductUnit.METER,
    minStockAlert: 50,
    image: 'https://picsum.photos/200/200?random=1'
  },
  {
    id: 2,
    sku: 'LGT-005',
    name: 'أباليك كلاسيك نحاسي',
    category: 'إضاءة',
    quantity: 20,
    costPrice: 150,
    sellPrice: 350,
    unit: ProductUnit.PIECE,
    minStockAlert: 10,
    image: 'https://picsum.photos/200/200?random=2'
  },
  {
    id: 3,
    sku: 'WPN-012',
    name: 'بانوهات 4سم سادة',
    category: 'بانوهات',
    quantity: 300,
    costPrice: 20,
    sellPrice: 35,
    unit: ProductUnit.METER,
    minStockAlert: 100,
    image: 'https://picsum.photos/200/200?random=3'
  },
  {
    id: 4,
    sku: 'GLU-001',
    name: 'معجون لاصق فيوتك',
    category: 'لوازم',
    quantity: 5,
    costPrice: 25,
    sellPrice: 40,
    unit: ProductUnit.BOX,
    minStockAlert: 20,
    image: 'https://picsum.photos/200/200?random=4'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 1, name: 'عميل نقدي', phone: '0000000000', type: 'consumer', balance: 0, creditLimit: 0 },
  { id: 2, name: 'مكتب الهندسية للديكور', phone: '01012345678', type: 'business', balance: -5000, creditLimit: 10000 },
  { id: 3, name: 'أحمد للمقاولات', phone: '01122334455', type: 'business', balance: 0, creditLimit: 20000 },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 1, name: 'مصنع فيوتك', phone: '0223456789', balance: 12000 },
  { id: 2, name: 'الشركة الدولية للإضاءة', phone: '0229876543', balance: 0 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1001',
    type: TransactionType.SALE,
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    amount: 1500,
    paymentMethod: PaymentMethod.CASH,
    description: 'فاتورة مبيعات #1001',
    relatedId: 1,
    status: 'completed'
  },
  {
    id: 'EXP-501',
    type: TransactionType.EXPENSE,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    amount: 200,
    paymentMethod: PaymentMethod.CASH,
    category: 'نقل ومشال',
    description: 'نقل بضاعة',
    status: 'completed'
  },
  {
    id: 'PUR-2001',
    type: TransactionType.PURCHASE,
    date: new Date().toISOString(),
    amount: 5000,
    paymentMethod: PaymentMethod.WALLET,
    description: 'فاتورة شراء من مصنع فيوتك',
    relatedId: 1,
    status: 'completed'
  },
  {
    id: 'EXP-DEMO',
    type: TransactionType.EXPENSE,
    date: new Date().toISOString(),
    amount: 5000,
    paymentMethod: PaymentMethod.CASH,
    category: 'دعاية وإعلان',
    description: 'حملة إعلانية فيسبوك',
    status: 'pending'
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  companyName: 'FOX GROUP',
  companyPhone: '01112223334',
  companyAddress: 'القاهرة - مصر',
  logoUrl: 'https://foxgroup-egy.com/wp-content/uploads/2022/03/logo.png', // Official Logo
  autoPrint: false,
  nextInvoiceNumber: 1002,
  openingBalance: 50000,
  taxRate: 14, // Default VAT 14%
  currentShiftId: undefined,
  preventNegativeStock: false,
  invoiceTerms: 'البضاعة المباعة ترد وتستبدل خلال 14 يوماً بحالتها الأصلية. تطبق الشروط والأحكام.'
};

export const INITIAL_USERS: User[] = [
  { id: 1, username: 'admin', role: 'admin', name: 'المدير العام', password: 'admin' },
  { id: 2, username: 'cashier', role: 'cashier', name: 'كاشير 1', password: '123' },
];

export const APP_SECTIONS = {
  DASHBOARD: 'dashboard',
  SALES: 'sales',
  PURCHASES: 'purchases',
  INVENTORY: 'inventory',
  QUOTATIONS: 'quotations',
  CUSTOMERS: 'customers',
  SUPPLIERS: 'suppliers',
  TREASURY: 'treasury',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  USERS: 'users'
};
