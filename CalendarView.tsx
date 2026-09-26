import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Edit3,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import {
  formatCurrency,
  formatDateID,
  getTodayDateString,
} from '../utils/formatters';

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export const CalendarView: React.FC = () => {
  const { transactions, settings, openTransactionModal } = useFinance();

  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [viewYear, setViewYear] = useState<number>(() =>
    Number(todayStr.split('-')[0])
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    Number(todayStr.split('-')[1]) - 1 // 0-indexed
  );

  // Group transactions by date YYYY-MM-DD
  const txByDate = useMemo(() => {
    const map: Record<
      string,
      { income: number; expense: number; items: Transaction[] }
    > = {};

    for (const tx of transactions) {
      if (!map[tx.date]) {
        map[tx.date] = { income: 0, expense: 0, items: [] };
      }
      if (tx.type === 'income') {
        map[tx.date].income += Math.abs(tx.amount);
      } else {
        map[tx.date].expense += Math.abs(tx.amount);
      }
      map[tx.date].items.push(tx);
    }

    return map;
  }, [transactions]);

  // Build calendar cells for viewYear & viewMonth (Monday-start week)
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Convert Sunday (0) to 6, Monday (1) to 0
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{
      dateStr: string | null;
      dayNumber: number | null;
    }> = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ dateStr: null, dayNumber: null });
    }

    const mm = String(viewMonth + 1).padStart(2, '0');
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      cells.push({
        dateStr: `${viewYear}-${mm}-${dd}`,
        dayNumber: d,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const monthTitle = useMemo(() => {
    const dt = new Date(viewYear, viewMonth, 1);
    return new Intl.DateTimeFormat('id-ID', {
      month: 'long',
      year: 'numeric',
    }).format(dt);
  }, [viewYear, viewMonth]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const [y, m] = todayStr.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setSelectedDate(todayStr);
  };

  const selectedDayData = txByDate[selectedDate] || {
    income: 0,
    expense: 0,
    items: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Kalender Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pilih tanggal untuk memantau pemasukan (hijau), pengeluaran (merah), dan daftar transaksi harian
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleGoToday}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => openTransactionModal({ defaultDate: selectedDate })}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Catat di Tanggal Ini</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Calendar Grid (Left 8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          {/* Calendar Toolbar */}
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 capitalize">
              {monthTitle}
            </h3>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
                  <span>Pemasukan</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span>Pengeluaran</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  aria-label="Bulan sebelumnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  aria-label="Bulan berikutnya"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-2 text-center">
            {DAY_NAMES.map((day) => (
              <div
                key={day}
                className="py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              if (!cell.dateStr || cell.dayNumber === null) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="h-20 sm:h-24 rounded-xl bg-slate-50/40 dark:bg-slate-800/20"
                  />
                );
              }

              const dayInfo = txByDate[cell.dateStr];
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(cell.dateStr!)}
                  className={`h-20 sm:h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#2563EB]/20'
                      : 'border-slate-200/70 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono-num font-semibold w-6 h-6 rounded-lg flex items-center justify-center ${
                        isToday
                          ? 'bg-[#2563EB] text-white'
                          : isSelected
                            ? 'text-[#2563EB] dark:text-blue-400'
                            : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {dayInfo && (
                      <div className="flex items-center gap-1">
                        {dayInfo.income > 0 && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#16A34A]"
                            title="Ada Pemasukan"
                          />
                        )}
                        {dayInfo.expense > 0 && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#DC2626]"
                            title="Ada Pengeluaran"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Daily Totals Preview */}
                  {dayInfo && (
                    <div className="w-full space-y-0.5 overflow-hidden">
                      {dayInfo.income > 0 && (
                        <p className="text-[10px] font-mono-num font-semibold text-[#16A34A] truncate">
                          +{dayInfo.income >= 1000000
                            ? `${(dayInfo.income / 1000000).toFixed(1).replace('.0', '')}jt`
                            : `${Math.round(dayInfo.income / 1000)}rb`}
                        </p>
                      )}
                      {dayInfo.expense > 0 && (
                        <p className="text-[10px] font-mono-num font-semibold text-[#DC2626] truncate">
                          -{dayInfo.expense >= 1000000
                            ? `${(dayInfo.expense / 1000000).toFixed(1).replace('.0', '')}jt`
                            : `${Math.round(dayInfo.expense / 1000)}rb`}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Detail Panel (Right 4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rincian Tanggal Terpilih
                </p>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  {formatDateID(selectedDate, 'long')}
                </h3>
              </div>
              <CalendarIcon className="w-5 h-5 text-[#2563EB]" />
            </div>

            {/* Pemasukan & Pengeluaran Hari Tersebut */}
            <div className="grid grid-cols-2 gap-3 my-4">
              <div className="p-3.5 rounded-xl bg-green-50/70 dark:bg-green-950/30 border border-green-200/60 dark:border-green-900/50">
                <p className="text-[11px] font-medium text-green-800 dark:text-green-300">
                  Pemasukan Hari Ini
                </p>
                <p className="mt-1 text-sm font-bold font-mono-num text-[#16A34A]">
                  {formatCurrency(selectedDayData.income, settings.currency)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/60 dark:border-red-900/50">
                <p className="text-[11px] font-medium text-red-800 dark:text-red-300">
                  Pengeluaran Hari Ini
                </p>
                <p className="mt-1 text-sm font-bold font-mono-num text-[#DC2626]">
                  {formatCurrency(selectedDayData.expense, settings.currency)}
                </p>
              </div>
            </div>

            {/* Daftar Transaksi */}
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
                Daftar Transaksi ({selectedDayData.items.length})
              </h4>

              {selectedDayData.items.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
                  {selectedDayData.items.map((tx) => (
                    <div
                      key={tx.id}
                      onClick={() => openTransactionModal({ transaction: tx })}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              tx.type === 'income' ? 'bg-[#16A34A]' : 'bg-[#DC2626]'
                            }`}
                          />
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {tx.note || tx.category}
                          </p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 pl-4">
                          {tx.category} · {tx.paymentMethod}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-mono-num font-bold ${
                            tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                          }`}
                        >
                          {formatCurrency(
                            tx.type === 'expense' ? -tx.amount : tx.amount,
                            settings.currency,
                            { showPositiveSign: true }
                          )}
                        </span>
                        <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Tidak ada transaksi pada tanggal ini
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Tekan tombol di bawah untuk mencatat transaksi pada tanggal{' '}
                    {formatDateID(selectedDate)}.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openTransactionModal({ defaultDate: selectedDate })}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi ({formatDateID(selectedDate)})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
