import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ExpenseCategory } from '../types/finance';
import {
  formatCurrency,
  formatNumberInput,
  formatPercent,
  getTodayDateString,
  parseNumberInput,
} from '../utils/formatters';

export const BudgetView: React.FC = () => {
  const { transactions, budgets, settings, updateBudget, openTransactionModal } =
    useFinance();

  const todayStr = getTodayDateString();
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7));

  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [editAmountStr, setEditAmountStr] = useState<string>('');

  const budgetCards = useMemo(() => {
    const spentMap: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.slice(0, 7) === selectedMonth) {
        spentMap[tx.category] = (spentMap[tx.category] || 0) + Math.abs(tx.amount);
      }
    }

    return budgets.map((b) => {
      const spent = spentMap[b.category] || 0;
      const remaining = b.amount - spent;
      const progress = b.amount > 0 ? (spent / b.amount) * 100 : spent > 0 ? 100 : 0;
      return {
        category: b.category,
        budget: b.amount,
        spent,
        remaining,
        progress,
      };
    });
  }, [budgets, transactions, selectedMonth]);

  const overallSummary = useMemo(() => {
    const totalBudget = budgetCards.reduce((acc, c) => acc + c.budget, 0);
    const totalSpent = budgetCards.reduce((acc, c) => acc + c.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const totalProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const exceededCategories = budgetCards.filter(
      (c) => c.budget > 0 && c.progress >= 100
    );
    const warningCategories = budgetCards.filter(
      (c) => c.budget > 0 && c.progress >= 80 && c.progress < 100
    );

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      totalProgress,
      exceededCategories,
      warningCategories,
    };
  }, [budgetCards]);

  const startEditing = (category: ExpenseCategory, currentBudget: number) => {
    setEditingCategory(category);
    setEditAmountStr(formatNumberInput(currentBudget));
  };

  const saveEdit = (category: ExpenseCategory) => {
    const num = parseNumberInput(editAmountStr);
    updateBudget(category, num);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Anggaran Bulanan (Budget)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tetapkan batas pengeluaran per kategori dan pantau realisasi bulanan Anda
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="budget-month-picker"
              className="text-xs font-medium text-slate-600 dark:text-slate-400"
            >
              Periode:
            </label>
            <input
              id="budget-month-picker"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-num font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
          <button
            type="button"
            onClick={() => openTransactionModal({ defaultType: 'expense' })}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Global Alerts if any category approaches or exceeds budget */}
      {(overallSummary.exceededCategories.length > 0 ||
        overallSummary.warningCategories.length > 0) && (
        <div className="space-y-3">
          {overallSummary.exceededCategories.length > 0 && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-[#DC2626]">
                  Peringatan: Anggaran Melebihi Batas!
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5 leading-relaxed">
                  Kategori{' '}
                  <strong>
                    {overallSummary.exceededCategories.map((c) => c.category).join(', ')}
                  </strong>{' '}
                  telah melampaui anggaran yang ditetapkan pada bulan ini. Segera evaluasi
                  pengeluaran Anda.
                </p>
              </div>
            </div>
          )}

          {overallSummary.warningCategories.length > 0 && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Perhatian: Pengeluaran Mendekati Batas Anggaran
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  Kategori{' '}
                  <strong>
                    {overallSummary.warningCategories.map((c) => c.category).join(', ')}
                  </strong>{' '}
                  telah menggunakan lebih dari 80% kuota anggaran bulanan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overall Monthly Budget Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-5">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Anggaran Bulanan
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
              {formatCurrency(overallSummary.totalBudget, settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Terpakai
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-num text-[#DC2626]">
              {formatCurrency(overallSummary.totalSpent, settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Sisa Anggaran
            </p>
            <p
              className={`mt-1 text-2xl font-bold font-mono-num ${
                overallSummary.totalRemaining >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
              }`}
            >
              {formatCurrency(overallSummary.totalRemaining, settings.currency)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400">
              Progress Keseluruhan Bulan Ini
            </span>
            <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
              {formatPercent(overallSummary.totalProgress, 1)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                overallSummary.totalProgress >= 100
                  ? 'bg-[#DC2626]'
                  : overallSummary.totalProgress >= 80
                    ? 'bg-amber-500'
                    : 'bg-[#2563EB]'
              }`}
              style={{ width: `${Math.min(100, overallSummary.totalProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Category Budget Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetCards.map((item) => {
          const isEditing = editingCategory === item.category;
          const isExceeded = item.budget > 0 && item.progress >= 100;
          const isWarning = item.budget > 0 && item.progress >= 80 && item.progress < 100;

          const barColor = isExceeded
            ? 'bg-[#DC2626]'
            : isWarning
              ? 'bg-amber-500'
              : 'bg-[#16A34A]';

          const borderClass = isExceeded
            ? 'border-red-300 dark:border-red-900/80'
            : isWarning
              ? 'border-amber-300 dark:border-amber-900/80'
              : 'border-slate-200 dark:border-slate-800';

          return (
            <div
              key={item.category}
              className={`rounded-2xl bg-white dark:bg-slate-900 border ${borderClass} p-5 shadow-xs flex flex-col justify-between transition-all`}
            >
              <div>
                {/* Top Row: Category Title & Edit Budget Action */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {item.category}
                  </h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditing(item.category, item.budget)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Atur Budget</span>
                    </button>
                  )}
                </div>

                {/* Inline Edit Form if active */}
                {isEditing ? (
                  <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 space-y-2.5">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                      Nominal Budget Bulanan ({settings.currency})
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={editAmountStr}
                        onChange={(e) => setEditAmountStr(formatNumberInput(e.target.value))}
                        placeholder="0"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono-num font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveEdit(item.category)}
                        aria-label="Simpan budget"
                        className="p-2 rounded-lg bg-[#16A34A] text-white hover:bg-green-700 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        aria-label="Batal edit budget"
                        className="p-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Structured Details Matching Prompt Format */
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Budget:</span>
                      <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.budget, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Terpakai:</span>
                      <span className="font-mono-num font-semibold text-[#DC2626]">
                        {formatCurrency(item.spent, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Sisa:</span>
                      <span
                        className={`font-mono-num font-semibold ${
                          item.remaining >= 0
                            ? 'text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {formatCurrency(item.remaining, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress:</span>
                      <span
                        className={`font-mono-num font-bold ${
                          isExceeded
                            ? 'text-[#DC2626]'
                            : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {formatPercent(item.progress, 1)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar & Status Indicator */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.min(100, item.progress)}%` }}
                  />
                </div>

                {isExceeded ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#DC2626]">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Over budget {formatCurrency(Math.abs(item.remaining), settings.currency)}
                    </span>
                  </div>
                ) : isWarning ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Hampir habis, tersisa {formatPercent(100 - item.progress, 1)}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                    <span>Anggaran masih aman terkendali</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
