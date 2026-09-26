export type TransactionType = 'income' | 'expense';

export type PaymentMethod =
  | 'Cash'
  | 'Bank'
  | 'E-Wallet'
  | 'Kartu Debit'
  | 'Kartu Kredit';

export type ExpenseCategory =
  | 'Makanan'
  | 'Transportasi'
  | 'Belanja'
  | 'Tagihan'
  | 'Hiburan'
  | 'Kesehatan'
  | 'Pendidikan'
  | 'Rumah'
  | 'Lainnya';

export type IncomeCategory =
  | 'Gaji'
  | 'Bonus'
  | 'Freelance'
  | 'Bisnis'
  | 'Investasi'
  | 'Hadiah'
  | 'Lainnya';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Makanan',
  'Transportasi',
  'Belanja',
  'Tagihan',
  'Hiburan',
  'Kesehatan',
  'Pendidikan',
  'Rumah',
  'Lainnya',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Gaji',
  'Bonus',
  'Freelance',
  'Bisnis',
  'Investasi',
  'Hadiah',
  'Lainnya',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank',
  'E-Wallet',
  'Kartu Debit',
  'Kartu Kredit',
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // Positive absolute value; signed value is -amount for expense, +amount for income
  category: string;
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  note: string;
}

export interface BudgetItem {
  category: ExpenseCategory;
  amount: number; // Monthly budget limit
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // YYYY-MM-DD
  note?: string;
}

export type CurrencyCode = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR';

export interface UserSettings {
  name: string;
  currency: CurrencyCode;
  theme: 'light' | 'dark';
  notifications: {
    budgetAlert: boolean;
    goalReminder: boolean;
    dailyReminder: boolean;
  };
}

export type NavigationTab =
  | 'dashboard'
  | 'transactions'
  | 'budget'
  | 'reports'
  | 'goals'
  | 'calendar'
  | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}
