import React, { useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
} from '../types/finance';
import {
  formatCurrency,
  formatDateID,
  getTodayDateString,
} from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateFilterPreset = 'all' | 'today' | 'week' | 'month' | 'custom';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    settings,
    openTransactionModal,
    deleteTransaction,
  } = useFinance();

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DateFilterPreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Delete Confirmation State
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const allCategories = useMemo(() => {
    if (typeFilter === 'expense') return EXPENSE_CATEGORIES;
    if (typeFilter === 'income') return INCOME_CATEGORIES;
    return Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));
  }, [typeFilter]);

  const todayStr = getTodayDateString();

  // Filtered and Sorted Transactions
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const todayDate = new Date(ty, tm - 1, td);

    return transactions
      .filter((tx) => {
        // 1. Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

        // 2. Category filter
        if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;

        // 3. Date filter
        if (datePreset === 'today') {
          if (tx.date !== todayStr) return false;
        } else if (datePreset === 'week') {
          const [y, m, d] = tx.date.split('-').map(Number);
          const txDate = new Date(y, m - 1, d);
          const diffDays =
            (todayDate.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        } else if (datePreset === 'month') {
          if (tx.date.slice(0, 7) !== todayStr.slice(0, 7)) return false;
        } else if (datePreset === 'custom') {
          if (customStartDate && tx.date < customStartDate) return false;
          if (customEndDate && tx.date > customEndDate) return false;
        }

        // 4. Search query
        if (query) {
          const matchNote = (tx.note || '').toLowerCase().includes(query);
          const matchCategory = tx.category.toLowerCase().includes(query);
          const matchMethod = tx.paymentMethod.toLowerCase().includes(query);
          const matchAmount = String(tx.amount).includes(query);
          if (!matchNote && !matchCategory && !matchMethod && !matchAmount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.date.localeCompare(a.date);
        if (sortBy === 'date-asc') return a.date.localeCompare(b.date);
        if (sortBy === 'amount-desc') return Math.abs(b.amount) - Math.abs(a.amount);
        if (sortBy === 'amount-asc') return Math.abs(a.amount) - Math.abs(b.amount);
        return 0;
      });
  }, [
    transactions,
    typeFilter,
    categoryFilter,
    datePreset,
    customStartDate,
    customEndDate,
    searchQuery,
    sortBy,
    todayStr,
  ]);

  // Summary of currently filtered transactions
  const filteredTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const tx of filteredTransactions) {
      if (tx.type === 'income') income += Math.abs(tx.amount);
      else expense += Math.abs(tx.amount);
    }
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, safeCurrentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date-desc');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    datePreset !== 'all' ||
    sortBy !== 'date-desc';

  return (
    <div className="space-y-6">
      {/* Header & Summary Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Daftar Transaksi
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kelola, cari, dan saring seluruh catatan pemasukan serta pengeluaran Anda
          </p>
        </div>
        <button
          type="button"
          onClick={() => openTransactionModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filtered Totals Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Pemasukan (Filter)
          </p>
          <p className="mt-1 text-lg font-bold font-mono-num text-[#16A34A]">
            {formatCurrency(filteredTotals.income, settings.currency)}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Total Pengeluaran (Filter)
          </p>
          <p className="mt-1 text-lg font-bold font-mono-num text-[#DC2626]">
            {formatCurrency(filteredTotals.expense, settings.currency)}
          </p>
        </div>
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selisih Bersih ({filteredTransactions.length} transaksi)
          </p>
          <p
            className={`mt-1 text-lg font-bold font-mono-num ${
              filteredTotals.net >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-[#DC2626]'
            }`}
          >
            {formatCurrency(filteredTotals.net, settings.currency)}
          </p>
        </div>
      </div>

      {/* Filter & Search Controls Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari catatan, kategori, nominal..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          {/* Type Filter Segmented Buttons */}
          <div className="md:col-span-3 flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'income', label: 'Pemasukan' },
                { id: 'expense', label: 'Pengeluaran' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setTypeFilter(tab.id);
                  setCategoryFilter('all');
                  setCurrentPage(1);
                }}
                className={`flex-1 py-1.5 px-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  typeFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter Kategori"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2563EB]"
            >
              <option value="all">Semua Kategori</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Option */}
          <div className="md:col-span-3 flex items-center gap-2">
            <div className="relative flex-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                aria-label="Urutkan transaksi"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="date-desc">Tanggal: Terbaru</option>
                <option value="date-asc">Tanggal: Terlama</option>
                <option value="amount-desc">Nominal: Tertinggi</option>
                <option value="amount-asc">Nominal: Terendah</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
              Periode:
            </span>
            {(
              [
                { id: 'all', label: 'Semua Tanggal' },
                { id: 'today', label: 'Hari Ini' },
                { id: 'week', label: '7 Hari Terakhir' },
                { id: 'month', label: 'Bulan Ini' },
                { id: 'custom', label: 'Rentang Tanggal' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setDatePreset(p.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  datePreset === p.id
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Custom Date Range Inputs */}
        {datePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Dari:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono-num bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-500">Sampai:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono-num bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions List / Table */}
      {filteredTransactions.length > 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Desktop Table View (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-5">Tanggal</th>
                  <th className="py-3.5 px-5">Catatan & Detail</th>
                  <th className="py-3.5 px-5">Kategori</th>
                  <th className="py-3.5 px-5">Metode</th>
                  <th className="py-3.5 px-5 text-right">Nominal</th>
                  <th className="py-3.5 px-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {paginatedTransactions.map((tx) => {
                  const signedVal = tx.type === 'expense' ? -tx.amount : tx.amount;
                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-5 font-mono-num text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDateID(tx.date)}
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">
                          {tx.note || tx.category}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                        </p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {tx.category}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                        {tx.paymentMethod}
                      </td>
                      <td
                        className={`py-3.5 px-5 text-right font-mono-num font-semibold whitespace-nowrap ${
                          tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                        }`}
                      >
                        {formatCurrency(signedVal, settings.currency, {
                          showPositiveSign: true,
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openTransactionModal({ transaction: tx })}
                            aria-label={`Edit transaksi ${tx.note || tx.category}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTxToDelete(tx)}
                            aria-label={`Hapus transaksi ${tx.note || tx.category}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card/List Layout (hidden on desktop) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedTransactions.map((tx) => {
              const signedVal = tx.type === 'expense' ? -tx.amount : tx.amount;
              return (
                <div key={tx.id} className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.note || tx.category}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{formatDateID(tx.date)}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-mono-num font-bold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      {formatCurrency(signedVal, settings.currency, {
                        showPositiveSign: true,
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openTransactionModal({ transaction: tx })}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:text-[#2563EB]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTxToDelete(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[#DC2626] bg-red-50 dark:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/40 dark:bg-slate-800/20">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan{' '}
                <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                  {(safeCurrentPage - 1) * pageSize + 1}
                </strong>
                –
                <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                  {Math.min(safeCurrentPage * pageSize, filteredTransactions.length)}
                </strong>{' '}
                dari{' '}
                <strong className="font-mono-num text-slate-800 dark:text-slate-200">
                  {filteredTransactions.length}
                </strong>{' '}
                transaksi
              </span>
              <select
                aria-label="Jumlah baris per halaman"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono-num"
              >
                <option value={8}>8 / hal</option>
                <option value={15}>15 / hal</option>
                <option value={30}>30 / hal</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, safeCurrentPage - 3), Math.min(totalPages, safeCurrentPage + 2))
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-mono-num font-semibold transition-colors ${
                      page === safeCurrentPage
                        ? 'bg-[#2563EB] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {transactions.length === 0
              ? 'Belum ada data transaksi'
              : 'Tidak ada transaksi yang sesuai filter'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {transactions.length === 0
              ? 'Mulai catat pemasukan dan pengeluaran harian Anda untuk memantau kondisi keuangan secara akurat.'
              : 'Coba ubah kata kunci pencarian atau reset filter untuk melihat seluruh transaksi.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Reset Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openTransactionModal()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Transaksi Pertama</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deleting Transaction */}
      <ConfirmDialog
        isOpen={Boolean(txToDelete)}
        title="Hapus Transaksi?"
        description={
          txToDelete
            ? `Apakah Anda yakin ingin menghapus transaksi "${txToDelete.note || txToDelete.category}" sebesar ${formatCurrency(txToDelete.amount, settings.currency)}? Tindakan ini tidak dapat dibatalkan.`
            : ''
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (txToDelete) {
            deleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }
        }}
        onCancel={() => setTxToDelete(null)}
      />
    </div>
  );
};
