import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  BudgetItem,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  FinancialGoal,
  NavigationTab,
  ToastMessage,
  Transaction,
  UserSettings,
} from '../types/finance';
import { getTodayDateString } from '../utils/formatters';

const STORAGE_KEYS = {
  TRANSACTIONS: 'sakuku_transactions_v1',
  BUDGETS: 'sakuku_budgets_v1',
  GOALS: 'sakuku_goals_v1',
  SETTINGS: 'sakuku_settings_v1',
};

const DEFAULT_BUDGETS: BudgetItem[] = [
  { category: 'Makanan', amount: 2000000 },
  { category: 'Transportasi', amount: 800000 },
  { category: 'Belanja', amount: 1000000 },
  { category: 'Tagihan', amount: 1200000 },
  { category: 'Hiburan', amount: 500000 },
  { category: 'Kesehatan', amount: 500000 },
  { category: 'Pendidikan', amount: 600000 },
  { category: 'Rumah', amount: 1500000 },
  { category: 'Lainnya', amount: 400000 },
];

const DEFAULT_GOALS: FinancialGoal[] = [
  {
    id: 'goal-1',
    name: 'Dana Darurat',
    targetAmount: 20000000,
    currentAmount: 12500000,
    deadline: '2026-12-31',
    note: 'Cadangan biaya hidup 6 bulan untuk keamanan finansial.',
  },
  {
    id: 'goal-2',
    name: 'Membeli Laptop',
    targetAmount: 15000000,
    currentAmount: 9000000,
    deadline: '2026-11-30',
    note: 'Upgrade perangkat kerja untuk produktivitas harian.',
  },
  {
    id: 'goal-3',
    name: 'Liburan Keluarga',
    targetAmount: 10000000,
    currentAmount: 4500000,
    deadline: '2027-03-15',
    note: 'Tabungan perjalanan liburan ke Yogyakarta & Bali.',
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  name: 'Pengguna SakuKu',
  currency: 'IDR',
  theme: 'light',
  notifications: {
    budgetAlert: true,
    goalReminder: true,
    dailyReminder: true,
  },
};

export interface TransactionModalInitial {
  transaction?: Transaction | null;
  defaultDate?: string;
  defaultType?: 'income' | 'expense';
}

interface FinanceContextType {
  transactions: Transaction[];
  budgets: BudgetItem[];
  goals: FinancialGoal[];
  settings: UserSettings;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  // Transaction CRUD
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  // Budget management
  updateBudget: (category: ExpenseCategory, amount: number) => void;
  updateAllBudgets: (items: BudgetItem[]) => void;
  // Goal CRUD
  addGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  updateGoal: (id: string, goal: Omit<FinancialGoal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  addGoalProgress: (id: string, deltaAmount: number) => void;
  // Settings & Data Management
  updateSettings: (partial: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  resetAllData: () => void;
  exportAllData: () => string;
  importAllData: (jsonString: string) => boolean;
  loadSampleTransactions: () => void;
  // Global Transaction Modal
  isTxModalOpen: boolean;
  txModalData: TransactionModalInitial | null;
  openTransactionModal: (initial?: TransactionModalInitial) => void;
  closeTransactionModal: () => void;
  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

function safeLoad<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    safeLoad<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, [])
  );

  const [budgets, setBudgets] = useState<BudgetItem[]>(() => {
    const loaded = safeLoad<BudgetItem[]>(STORAGE_KEYS.BUDGETS, DEFAULT_BUDGETS);
    // Ensure all expense categories exist
    return EXPENSE_CATEGORIES.map((cat) => {
      const found = loaded.find((b) => b.category === cat);
      return found ? found : { category: cat, amount: 0 };
    });
  });

  const [goals, setGoals] = useState<FinancialGoal[]>(() =>
    safeLoad<FinancialGoal[]>(STORAGE_KEYS.GOALS, DEFAULT_GOALS)
  );

  const [settings, setSettings] = useState<UserSettings>(() =>
    safeLoad<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalData, setTxModalData] = useState<TransactionModalInitial | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed saving transactions:', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed saving budgets:', e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed saving goals:', e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed saving settings:', e);
    }
  }, [settings]);

  // Apply Dark Mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const checkBudgetWarning = useCallback(
    (newTx: Omit<Transaction, 'id'>, allTransactions: Transaction[]) => {
      if (!settings.notifications.budgetAlert || newTx.type !== 'expense') return;
      const txMonth = newTx.date.slice(0, 7);
      const budgetObj = budgets.find((b) => b.category === newTx.category);
      if (!budgetObj || budgetObj.amount <= 0) return;

      const spentInMonth = allTransactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            t.category === newTx.category &&
            t.date.slice(0, 7) === txMonth
        )
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

      const ratio = (spentInMonth / budgetObj.amount) * 100;
      if (ratio >= 100) {
        addToast({
          type: 'error',
          title: `Anggaran ${newTx.category} Terlampaui!`,
          description: `Pengeluaran kategori ${newTx.category} telah mencapai ${ratio.toFixed(1).replace('.', ',')}% dari budget bulanan.`,
        });
      } else if (ratio >= 80) {
        addToast({
          type: 'warning',
          title: `Peringatan Anggaran ${newTx.category}`,
          description: `Pengeluaran kategori ${newTx.category} telah mencapai ${ratio.toFixed(1).replace('.', ',')}% dari batas anggaran.`,
        });
      }
    },
    [budgets, settings.notifications.budgetAlert, addToast]
  );

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id'>) => {
      const cleanTx: Transaction = {
        ...tx,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        amount: Math.abs(Number(tx.amount)),
      };
      setTransactions((prev) => {
        const updated = [cleanTx, ...prev];
        setTimeout(() => checkBudgetWarning(cleanTx, updated), 150);
        return updated;
      });
      addToast({
        type: 'success',
        title: 'Transaksi berhasil disimpan',
        description: `${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} kategori ${tx.category} telah dicatat.`,
      });
    },
    [addToast, checkBudgetWarning]
  );

  const updateTransaction = useCallback(
    (id: string, tx: Omit<Transaction, 'id'>) => {
      const cleanTx: Transaction = {
        ...tx,
        id,
        amount: Math.abs(Number(tx.amount)),
      };
      setTransactions((prev) => {
        const updated = prev.map((item) => (item.id === id ? cleanTx : item));
        setTimeout(() => checkBudgetWarning(cleanTx, updated), 150);
        return updated;
      });
      addToast({
        type: 'success',
        title: 'Transaksi diperbarui',
        description: `Perubahan transaksi ${tx.category} berhasil disimpan.`,
      });
    },
    [addToast, checkBudgetWarning]
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((item) => item.id !== id));
      addToast({
        type: 'info',
        title: 'Transaksi dihapus',
        description: 'Data transaksi dan saldo telah diperbarui secara otomatis.',
      });
    },
    [addToast]
  );

  const updateBudget = useCallback(
    (category: ExpenseCategory, amount: number) => {
      setBudgets((prev) =>
        prev.map((b) =>
          b.category === category ? { ...b, amount: Math.max(0, Math.round(amount)) } : b
        )
      );
      addToast({
        type: 'success',
        title: 'Anggaran diperbarui',
        description: `Batas anggaran untuk kategori ${category} berhasil disimpan.`,
      });
    },
    [addToast]
  );

  const updateAllBudgets = useCallback(
    (items: BudgetItem[]) => {
      setBudgets(items);
      addToast({
        type: 'success',
        title: 'Seluruh anggaran disimpan',
        description: 'Konfigurasi anggaran bulanan telah diperbarui.',
      });
    },
    [addToast]
  );

  const addGoal = useCallback(
    (goal: Omit<FinancialGoal, 'id'>) => {
      const newGoal: FinancialGoal = {
        ...goal,
        id: `goal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      setGoals((prev) => [...prev, newGoal]);
      addToast({
        type: 'success',
        title: 'Target keuangan dibuat',
        description: `Target "${goal.name}" berhasil ditambahkan.`,
      });
    },
    [addToast]
  );

  const updateGoal = useCallback(
    (id: string, goal: Omit<FinancialGoal, 'id'>) => {
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...goal, id } : g)));
      addToast({
        type: 'success',
        title: 'Target diperbarui',
        description: `Target "${goal.name}" berhasil disimpan.`,
      });
    },
    [addToast]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      addToast({
        type: 'info',
        title: 'Target keuangan dihapus',
      });
    },
    [addToast]
  );

  const addGoalProgress = useCallback(
    (id: string, deltaAmount: number) => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== id) return g;
          const nextAmount = Math.max(0, g.currentAmount + deltaAmount);
          return { ...g, currentAmount: nextAmount };
        })
      );
      addToast({
        type: 'success',
        title: 'Tabungan target diperbarui',
        description: 'Saldo terkumpul pada target keuangan telah diperbarui.',
      });
    },
    [addToast]
  );

  const updateSettings = useCallback(
    (partial: Partial<UserSettings>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
      addToast({
        type: 'success',
        title: 'Pengaturan disimpan',
      });
    },
    [addToast]
  );

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, []);

  const resetAllData = useCallback(() => {
    setTransactions([]);
    setBudgets(DEFAULT_BUDGETS);
    setGoals([]);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    addToast({
      type: 'info',
      title: 'Seluruh data direset',
      description: 'Aplikasi telah dikembalikan ke pengaturan awal.',
    });
  }, [addToast]);

  const exportAllData = useCallback(() => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions,
      budgets,
      goals,
      settings,
    };
    return JSON.stringify(payload, null, 2);
  }, [transactions, budgets, goals, settings]);

  const importAllData = useCallback(
    (jsonString: string): boolean => {
      try {
        const parsed = JSON.parse(jsonString);
        if (!parsed || !Array.isArray(parsed.transactions)) {
          addToast({
            type: 'error',
            title: 'Format file tidak valid',
            description: 'Pastikan file JSON berasal dari fitur Export SakuKu.',
          });
          return false;
        }
        setTransactions(parsed.transactions);
        if (Array.isArray(parsed.budgets)) setBudgets(parsed.budgets);
        if (Array.isArray(parsed.goals)) setGoals(parsed.goals);
        if (parsed.settings && typeof parsed.settings === 'object') {
          setSettings((prev) => ({ ...prev, ...parsed.settings }));
        }
        addToast({
          type: 'success',
          title: 'Data berhasil diimpor',
          description: `${parsed.transactions.length} transaksi berhasil dimuat.`,
        });
        return true;
      } catch {
        addToast({
          type: 'error',
          title: 'Gagal mengimpor data',
          description: 'File JSON rusak atau tidak dapat dibaca.',
        });
        return false;
      }
    },
    [addToast]
  );

  const loadSampleTransactions = useCallback(() => {
    const today = getTodayDateString();
    const [yyyy, mm] = today.split('-').map(Number);
    const currentYM = `${yyyy}-${String(mm).padStart(2, '0')}`;
    const prevDate = new Date(yyyy, mm - 2, 15);
    const prevYM = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Build realistic transactions for current month so that:
    // Current month Income = Rp 12.000.000
    // Current month Expense = Rp 3.500.000 (with Makanan = Rp 1.350.000 as in prompt example!)
    // Net / Sisa bulan ini = Rp 8.500.000
    const sampleTxs: Transaction[] = [
      {
        id: 'sample-1',
        type: 'income',
        amount: 9500000,
        category: 'Gaji',
        date: `${currentYM}-01`,
        paymentMethod: 'Bank',
        note: 'Gaji bulanan utama',
      },
      {
        id: 'sample-2',
        type: 'income',
        amount: 2500000,
        category: 'Freelance',
        date: `${currentYM}-10`,
        paymentMethod: 'Bank',
        note: 'Proyek desain UI/UX aplikasi web',
      },
      {
        id: 'sample-3',
        type: 'expense',
        amount: 650000,
        category: 'Makanan',
        date: `${currentYM}-03`,
        paymentMethod: 'Kartu Debit',
        note: 'Belanja bahan makanan mingguan di supermarket',
      },
      {
        id: 'sample-4',
        type: 'expense',
        amount: 450000,
        category: 'Makanan',
        date: `${currentYM}-12`,
        paymentMethod: 'E-Wallet',
        note: 'Makan siang kantor & katering sehat',
      },
      {
        id: 'sample-5',
        type: 'expense',
        amount: 250000,
        category: 'Makanan',
        date: `${currentYM}-20`,
        paymentMethod: 'Cash',
        note: 'Makan malam bersama keluarga',
      },
      {
        id: 'sample-6',
        type: 'expense',
        amount: 750000,
        category: 'Tagihan',
        date: `${currentYM}-05`,
        paymentMethod: 'Bank',
        note: 'Tagihan listrik PLN, air PDAM & internet fiber',
      },
      {
        id: 'sample-7',
        type: 'expense',
        amount: 450000,
        category: 'Transportasi',
        date: `${currentYM}-08`,
        paymentMethod: 'E-Wallet',
        note: 'Pengisian BBM, MRT & tol dalam kota',
      },
      {
        id: 'sample-8',
        type: 'expense',
        amount: 600000,
        category: 'Belanja',
        date: `${currentYM}-15`,
        paymentMethod: 'Kartu Debit',
        note: 'Kebutuhan rumah tangga bulanan',
      },
      {
        id: 'sample-9',
        type: 'expense',
        amount: 350000,
        category: 'Hiburan',
        date: `${currentYM}-18`,
        paymentMethod: 'Kartu Kredit',
        note: 'Langganan streaming, buku & olahraga akhir pekan',
      },
      // Previous month balanced records for MoM comparison chart while keeping total saldo Rp 8.500.000
      {
        id: 'sample-10',
        type: 'income',
        amount: 10500000,
        category: 'Gaji',
        date: `${prevYM}-01`,
        paymentMethod: 'Bank',
        note: 'Gaji bulanan periode sebelumnya',
      },
      {
        id: 'sample-11',
        type: 'expense',
        amount: 10500000,
        category: 'Rumah',
        date: `${prevYM}-15`,
        paymentMethod: 'Bank',
        note: 'Pembayaran sewa tahunan & perawatan hunian',
      },
    ];

    setTransactions(sampleTxs);
    setBudgets(DEFAULT_BUDGETS);
    setGoals(DEFAULT_GOALS);
    addToast({
      type: 'success',
      title: 'Data contoh berhasil dimuat',
      description: 'Transaksi, anggaran, dan laporan kini terisi dengan data simulasi.',
    });
  }, [addToast]);

  const openTransactionModal = useCallback((initial?: TransactionModalInitial) => {
    setTxModalData(initial || null);
    setIsTxModalOpen(true);
  }, []);

  const closeTransactionModal = useCallback(() => {
    setIsTxModalOpen(false);
    setTxModalData(null);
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        budgets,
        goals,
        settings,
        activeTab,
        setActiveTab,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudget,
        updateAllBudgets,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalProgress,
        updateSettings,
        toggleTheme,
        resetAllData,
        exportAllData,
        importAllData,
        loadSampleTransactions,
        isTxModalOpen,
        txModalData,
        openTransactionModal,
        closeTransactionModal,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance(): FinanceContextType {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
}
