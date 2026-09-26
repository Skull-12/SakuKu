import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Plus,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  formatDateID,
  formatPercent,
  getTodayDateString,
} from '../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CATEGORY_COLORS = [
  '#2563EB', // Blue
  '#DC2626', // Red
  '#D97706', // Amber
  '#16A34A', // Green
  '#7C3AED', // Violet
  '#0891B2', // Cyan
  '#DB2777', // Pink
  '#4F46E5', // Indigo
  '#64748B', // Slate
];

export const DashboardView: React.FC = () => {
  const {
    transactions,
    budgets,
    settings,
    openTransactionModal,
    setActiveTab,
    loadSampleTransactions,
  } = useFinance();

  const isDark = settings.theme === 'dark';
  const todayStr = getTodayDateString();
  const currentMonthPrefix = todayStr.slice(0, 7); // YYYY-MM

  // Compute previous month YYYY-MM
  const prevMonthPrefix = useMemo(() => {
    const [y, m] = currentMonthPrefix.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, [currentMonthPrefix]);

  // Core Financial Calculations (Always derived from transactions)
  const metrics = useMemo(() => {
    let totalIncomeAll = 0;
    let totalExpenseAll = 0;

    let currentMonthIncome = 0;
    let currentMonthExpense = 0;

    let prevMonthIncome = 0;
    let prevMonthExpense = 0;

    for (const tx of transactions) {
      const amt = Math.abs(Number(tx.amount) || 0);
      const ym = tx.date.slice(0, 7);

      if (tx.type === 'income') {
        totalIncomeAll += amt;
        if (ym === currentMonthPrefix) currentMonthIncome += amt;
        if (ym === prevMonthPrefix) prevMonthIncome += amt;
      } else {
        totalExpenseAll += amt;
        if (ym === currentMonthPrefix) currentMonthExpense += amt;
        if (ym === prevMonthPrefix) prevMonthExpense += amt;
      }
    }

    const totalBalance = totalIncomeAll - totalExpenseAll;
    const currentMonthRemaining = currentMonthIncome - currentMonthExpense;
    const prevMonthRemaining = prevMonthIncome - prevMonthExpense;

    const calcChangePercent = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : null;
      return ((curr - prev) / Math.abs(prev)) * 100;
    };

    return {
      totalBalance,
      currentMonthIncome,
      currentMonthExpense,
      currentMonthRemaining,
      incomeChange: calcChangePercent(currentMonthIncome, prevMonthIncome),
      expenseChange: calcChangePercent(currentMonthExpense, prevMonthExpense),
      remainingChange: calcChangePercent(currentMonthRemaining, prevMonthRemaining),
    };
  }, [transactions, currentMonthPrefix, prevMonthPrefix]);

  // 1. Line Chart Data: 30 Hari Terakhir
  const last30DaysChartData = useMemo(() => {
    const [ty, tm, td] = todayStr.split('-').map(Number);
    const endDate = new Date(ty, tm - 1, td);
    const labels: string[] = [];
    const dateKeys: string[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dateKeys.push(`${yyyy}-${mm}-${dd}`);
      labels.push(
        new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d)
      );
    }

    const incomeByDay: Record<string, number> = {};
    const expenseByDay: Record<string, number> = {};

    for (const tx of transactions) {
      if (tx.type === 'income') {
        incomeByDay[tx.date] = (incomeByDay[tx.date] || 0) + Math.abs(tx.amount);
      } else {
        expenseByDay[tx.date] = (expenseByDay[tx.date] || 0) + Math.abs(tx.amount);
      }
    }

    return {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: dateKeys.map((k) => incomeByDay[k] || 0),
          borderColor: '#16A34A',
          backgroundColor: 'rgba(22, 163, 74, 0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Pengeluaran',
          data: dateKeys.map((k) => expenseByDay[k] || 0),
          borderColor: '#DC2626',
          backgroundColor: 'rgba(220, 38, 38, 0.10)',
          tension: 0.35,
          fill: true,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    };
  }, [transactions, todayStr]);

  // 2. Doughnut Chart Data: Distribusi Pengeluaran Berdasarkan Kategori
  const categoryDoughnutData = useMemo(() => {
    const totals: Record<string, number> = {};
    // Filter current month expenses first; if empty, fallback to all expenses
    const currentMonthExpenses = transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 7) === currentMonthPrefix
    );
    const source =
      currentMonthExpenses.length > 0
        ? currentMonthExpenses
        : transactions.filter((t) => t.type === 'expense');

    for (const tx of source) {
      totals[tx.category] = (totals[tx.category] || 0) + Math.abs(tx.amount);
    }

    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    return {
      hasData: entries.length > 0,
      entries,
      chart: {
        labels: entries.map(([cat]) => cat),
        datasets: [
          {
            data: entries.map(([, val]) => val),
            backgroundColor: entries.map(
              (_, idx) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
            ),
            borderColor: isDark ? '#0F172A' : '#FFFFFF',
            borderWidth: 2,
          },
        ],
      },
    };
  }, [transactions, currentMonthPrefix, isDark]);

  // 3. Bar Chart Data: Perbandingan Pemasukan dan Pengeluaran Setiap Bulan (6 Bulan Terakhir)
  const monthlyBarChartData = useMemo(() => {
    const [ty, tm] = currentMonthPrefix.split('-').map(Number);
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(ty, tm - 1 - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = new Intl.DateTimeFormat('id-ID', {
        month: 'short',
        year: '2-digit',
      }).format(d);
      months.push({ key, label });
    }

    const incomeMap: Record<string, number> = {};
    const expenseMap: Record<string, number> = {};

    for (const tx of transactions) {
      const ym = tx.date.slice(0, 7);
      if (tx.type === 'income') {
        incomeMap[ym] = (incomeMap[ym] || 0) + Math.abs(tx.amount);
      } else {
        expenseMap[ym] = (expenseMap[ym] || 0) + Math.abs(tx.amount);
      }
    }

    return {
      labels: months.map((m) => m.label),
      datasets: [
        {
          label: 'Pemasukan',
          data: months.map((m) => incomeMap[m.key] || 0),
          backgroundColor: '#16A34A',
          borderRadius: 6,
          maxBarThickness: 28,
        },
        {
          label: 'Pengeluaran',
          data: months.map((m) => expenseMap[m.key] || 0),
          backgroundColor: '#DC2626',
          borderRadius: 6,
          maxBarThickness: 28,
        },
      ],
    };
  }, [transactions, currentMonthPrefix]);

  // Recent Transactions (top 6 sorted by date desc)
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [transactions]);

  // Budget Summary for Current Month
  const budgetSummary = useMemo(() => {
    const spentByCategory: Record<string, number> = {};
    for (const tx of transactions) {
      if (tx.type === 'expense' && tx.date.slice(0, 7) === currentMonthPrefix) {
        spentByCategory[tx.category] =
          (spentByCategory[tx.category] || 0) + Math.abs(tx.amount);
      }
    }

    return budgets
      .filter((b) => b.amount > 0)
      .map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const remaining = b.amount - spent;
        const percent = (spent / b.amount) * 100;
        return {
          ...b,
          spent,
          remaining,
          percent,
        };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 5);
  }, [budgets, transactions, currentMonthPrefix]);

  const commonAxisOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            color: isDark ? '#CBD5E1' : '#475569',
            usePointStyle: true,
            boxWidth: 8,
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
              const val = ctx.parsed.y ?? 0;
              return `${ctx.dataset.label || ''}: ${formatCurrency(val, settings.currency)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: { size: 11 },
            maxTicksLimit: 10,
          },
        },
        y: {
          grid: {
            color: isDark ? 'rgba(148, 163, 184, 0.1)' : 'rgba(148, 163, 184, 0.2)',
          },
          ticks: {
            color: isDark ? '#94A3B8' : '#64748B',
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            callback: (val: string | number) => {
              const num = Number(val);
              if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
              if (num >= 1000) return `${(num / 1000).toFixed(0)}rb`;
              return String(val);
            },
          },
        },
      },
    }),
    [isDark, settings.currency]
  );

  return (
    <div className="space-y-6">
      {/* Onboarding Banner when user has no transactions yet */}
      {transactions.length === 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-[#2563EB] tracking-wide mb-2">
              Selamat Datang di SakuKu
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight text-balance">
              Kelola keuanganmu dengan lebih mudah.
            </h2>
            <p className="mt-2.5 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Catat setiap pemasukan dan pengeluaran harian, pantau anggaran bulanan per kategori,
              dan wujudkan target finansialmu secara terukur.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openTransactionModal()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Mulai Mencatat</span>
              </button>
              <button
                type="button"
                onClick={loadSampleTransactions}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Muat Contoh Data Simulasi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Total Saldo */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Saldo</p>
            <p className="mt-2 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
              {formatCurrency(metrics.totalBalance, settings.currency)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Akumulasi seluruh transaksi</span>
            <span className="font-mono-num font-medium text-[#2563EB]">
              {transactions.length} catatan
            </span>
          </div>
        </div>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pemasukan
            </p>
            <p className="mt-2 text-2xl font-bold font-mono-num text-[#16A34A]">
              {formatCurrency(metrics.currentMonthIncome, settings.currency)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bulan ini vs bulan lalu</span>
            {metrics.incomeChange !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-mono-num font-semibold ${
                  metrics.incomeChange >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {metrics.incomeChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {metrics.incomeChange >= 0 ? '+' : ''}
                {formatPercent(metrics.incomeChange, 1)}
              </span>
            ) : (
              <span className="text-slate-400 font-mono-num">0%</span>
            )}
          </div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Pengeluaran
            </p>
            <p className="mt-2 text-2xl font-bold font-mono-num text-[#DC2626]">
              {formatCurrency(metrics.currentMonthExpense, settings.currency)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Bulan ini vs bulan lalu</span>
            {metrics.expenseChange !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-mono-num font-semibold ${
                  metrics.expenseChange <= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {metrics.expenseChange >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {metrics.expenseChange >= 0 ? '+' : ''}
                {formatPercent(metrics.expenseChange, 1)}
              </span>
            ) : (
              <span className="text-slate-400 font-mono-num">0%</span>
            )}
          </div>
        </div>

        {/* Card 4: Sisa Uang Bulan Ini */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Sisa</p>
            <p
              className={`mt-2 text-2xl font-bold font-mono-num ${
                metrics.currentMonthRemaining >= 0
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-[#DC2626]'
              }`}
            >
              {formatCurrency(metrics.currentMonthRemaining, settings.currency)}
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Selisih bulan berjalan</span>
            {metrics.remainingChange !== null ? (
              <span
                className={`inline-flex items-center gap-1 font-mono-num font-semibold ${
                  metrics.remainingChange >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'
                }`}
              >
                {metrics.remainingChange >= 0 ? '+' : ''}
                {formatPercent(metrics.remainingChange, 1)}
              </span>
            ) : (
              <span className="text-slate-400 font-mono-num">0%</span>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 1: Line Chart (30 Days) & Doughnut Chart (Category Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart: 30 Hari Terakhir */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Grafik Pemasukan vs Pengeluaran (30 Hari Terakhir)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pergerakan arus kas harian selama 30 hari terakhir
              </p>
            </div>
          </div>
          <div className="h-72">
            <Line data={last30DaysChartData} options={commonAxisOptions} />
          </div>
        </div>

        {/* Doughnut Chart: Pengeluaran per Kategori */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Distribusi Pengeluaran Kategori
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Proporsi pengeluaran berdasarkan kategori
            </p>
          </div>

          {categoryDoughnutData.hasData ? (
            <>
              <div className="h-52 my-4 flex items-center justify-center">
                <Doughnut
                  data={categoryDoughnutData.chart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '66%',
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => {
                            const val = Number(ctx.parsed || 0);
                            return `${ctx.label}: ${formatCurrency(val, settings.currency)}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                {categoryDoughnutData.entries.slice(0, 4).map(([cat, val], idx) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
                        }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 truncate">
                        {cat}
                      </span>
                    </div>
                    <span className="font-mono-num font-medium text-slate-900 dark:text-slate-100">
                      {formatCurrency(val, settings.currency)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Belum ada data pengeluaran
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Tambahkan transaksi pengeluaran untuk melihat grafik proporsi kategori.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart: Perbandingan Bulanan */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Perbandingan Pemasukan & Pengeluaran Bulanan
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Evaluasi tren pemasukan dan pengeluaran selama 6 bulan terakhir
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
          >
            <span>Lihat Laporan Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="h-64">
          <Bar data={monthlyBarChartData} options={commonAxisOptions} />
        </div>
      </div>

      {/* Bottom Grid: Transaksi Terbaru & Ringkasan Budget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaksi Terbaru */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Transaksi Terbaru
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Catatan aktivitas finansial terakhir Anda
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('transactions')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
              >
                <span>Semua Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => openTransactionModal({ transaction: tx })}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {tx.note || tx.category}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.paymentMethod}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-num">{formatDateID(tx.date)}</span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-mono-num font-semibold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-[#16A34A]' : 'text-[#DC2626]'
                      }`}
                    >
                      {formatCurrency(
                        tx.type === 'expense' ? -tx.amount : tx.amount,
                        settings.currency,
                        { showPositiveSign: true }
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Belum ada catatan transaksi
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Catat transaksi pertama Anda untuk memantau arus kas.
                </p>
                <button
                  type="button"
                  onClick={() => openTransactionModal()}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Transaksi</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Ringkasan Budget */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Ringkasan Budget Bulan Ini
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Status pemakaian anggaran per kategori pengeluaran
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('budget')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap"
              >
                <span>Kelola Anggaran</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {budgetSummary.length > 0 ? (
              <div className="space-y-4">
                {budgetSummary.map((item) => {
                  const isExceeded = item.percent >= 100;
                  const isWarning = item.percent >= 80 && item.percent < 100;
                  const barColor = isExceeded
                    ? 'bg-[#DC2626]'
                    : isWarning
                      ? 'bg-amber-500'
                      : 'bg-[#2563EB]';

                  return (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.category}
                        </span>
                        <span className="font-mono-num text-slate-600 dark:text-slate-400">
                          {formatCurrency(item.spent, settings.currency)} /{' '}
                          {formatCurrency(item.amount, settings.currency)} (
                          <strong
                            className={
                              isExceeded
                                ? 'text-[#DC2626]'
                                : isWarning
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            {formatPercent(item.percent, 1)}
                          </strong>
                          )
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                      {(isExceeded || isWarning) && (
                        <p
                          className={`flex items-center gap-1.5 text-[11px] font-medium ${
                            isExceeded
                              ? 'text-[#DC2626]'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>
                            {isExceeded
                              ? `Melebihi budget sebesar ${formatCurrency(Math.abs(item.remaining), settings.currency)}`
                              : `Mendekati batas budget (Sisa ${formatCurrency(item.remaining, settings.currency)})`}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Belum ada anggaran aktif
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('budget')}
                  className="mt-3 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  Atur Anggaran Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
