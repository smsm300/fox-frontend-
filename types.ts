
export enum ProductUnit {
  PIECE = 'قطعة',
  METER = 'متر',
  BOX = 'كرتونة'
}

export enum TransactionType {
  SALE = 'بيع',
  PURCHASE = 'شراء',
  EXPENSE = 'مصروف',
  RETURN = 'مرتجع',
  ADJUSTMENT = 'تسوية مخزون',
  SHIFT_OPEN = 'فتح وردية',
  SHIFT_CLOSE = 'إغلاق وردية',
  CAPITAL = 'إيداع رأس مال',
  WITHDRAWAL = 'مسحوبات شخصية'
}

export enum PaymentMethod {
  CASH = 'كاش',
  WALLET = 'محفظة',
  INSTAPAY = 'Instapay',
  DEFERRED = 'آجل'
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  unit: ProductUnit;
  minStockAlert: number;
  image?: string;
}

export interface CartItem extends Product {
  cartQuantity: number;
  discount: number; // Percentage
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  type: 'consumer' | 'business'; // consumer (cash only) or business (credit allowed)
  balance: number;
  creditLimit: number; // Maximum allowed debt
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  balance: number;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string; // ISO date
  amount: number;
  paymentMethod: PaymentMethod;
  description: string;
  category?: string; // Expense Category (e.g. Rent, Wages)
  relatedId?: number; // Customer ID or Supplier ID
  items?: CartItem[];
  status?: 'pending' | 'completed' | 'rejected'; // Approval Workflow
  dueDate?: string; // For Deferred payments
  isDirectSale?: boolean; // To handle returns correctly (don't add stock back)
  shiftId?: number; // Link transaction to a shift
}

export interface Shift {
  id: number;
  userId: number;
  userName: string;
  startTime: string;
  endTime?: string;
  startCash: number;
  endCash?: number;
  expectedCash?: number;
  totalSales?: number;
  salesByMethod?: {
    [key in PaymentMethod]?: number;
  };
  status: 'open' | 'closed';
}

export interface Quotation {
  id: string;
  date: string;
  customerId: number;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'converted';
}

export interface KPI {
  totalSales: number;
  totalPurchases: number;
  netIncome: number;
  lowStockCount: number;
}

export interface AppSettings {
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  logoUrl?: string;
  autoPrint: boolean;
  nextInvoiceNumber: number;
  openingBalance: number;
  taxRate: number; // VAT Percentage
  currentShiftId?: number; // ID of the currently open shift
  preventNegativeStock: boolean; // Strict Mode
  invoiceTerms: string; // Footer text for invoices
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'accountant' | 'cashier' | 'stock_keeper';
  name: string;
  password?: string;
}

export interface ActivityLogEntry {
  id: number;
  date: string;
  userId: number;
  userName: string;
  action: string;
  details: string;
}
