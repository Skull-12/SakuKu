import React, { useMemo, useState } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import {
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  PieChart,
  Scale,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatCurrency,
  formatDateID,
  formatPercent,
  getTodayDateString,
} from '../utils/formatters';

type ReportPeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'custom';

export const ReportsView: React.FC = () => {
  const { transactions, settings, addToast } = useFinance();
  const isDark = settings.theme === 'dark';
  const todayStr = getTodayDateString();

  const [period, setPeriod] = useState<ReportPeriod>('this_month');
  const [customStart, setCustomStart] = useState<string>(() => {
    return `${todayStr.slice(0, 7)}-01`;
  });
  const [customEnd, setCustomEnd] = useState<string>(todayStr);

  // Compute start and end date strings (YYYY-MM-DD) for the active period
  const dateBounds = useMemo(() => {
    const [y, m, d] = todayStr.split('-').map(Number);
    const today = new Date(y, m - 1, d);

    const fmt = (dt: Date) => {
      const yy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };

    if (period === 'today') {
      return { start: todayStr, end: todayStr, label: 'Hari Ini' };
    }
    if (period === 'this_week') {
      const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
      const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - diffToMonday);
      return { start: fmt(monday), end: todayStr, label: 'Minggu Ini' };
    }
    if (period === 'this_month') {
      const firstDay = `${y}-${String(m).padStart(2, '0')}-01`;
      const lastDayDate = new Date(y, m, 0);
      return { start: firstDay, end: fmt(lastDayDate), label: 'Bulan Ini' };
    }
    if (period === 'last_month') {
      const firstLastMonth = new Date(y, m - 2, 1);
      const endLastMonth = new Date(y, m - 1, 0);
      return {
        start: fmt(firstLastMonth),
        end: fmt(endLastMonth),
        label: 'Bulan Lalu',
      };
    }
    if (period === 'this_year') {
      return { start: `${y}-01-01`, end: `${y}-12-31`, label: `Tahun ${y}` };
    }
    return {
      start: customStart || '1970-01-01',
      end: customEnd || '2099-12-31',
      label: 'Periode Kustom',
    };
  }, [period, todayStr, customStart, customEnd]);

  // Filter transactions in the selected period
  const periodTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.date >= dateBounds.start && tx.date <= dateBounds.end)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, dateBounds]);

  // Compute summary metrics
  const reportSummary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};

    for (const tx of periodTransactions) {
      const amt = Math.abs(tx.amount);
      if (tx.type === 'income') {
        totalIncome += amt;
        incomeByCategory[tx.category] = (incomeByCategory[tx.category] || 0) + amt;
      } else {
        totalExpense += amt;
        expenseByCategory[tx.category] = (expenseByCategory[tx.category] || 0) + amt;
      }
    }

    const netCashFlow = totalIncome - totalExpense;
    const sortedExpenses = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);
    const sortedIncomes = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
    const topExpenseCategory =
      sortedExpenses.length > 0
        ? {
            name: sortedExpenses[0][0],
            amount: sortedExpenses[0][1],
            percent: totalExpense > 0 ? (sortedExpenses[0][1] / totalExpense) * 100 : 0,
          }
        : null;

    return {
      totalIncome,
      totalExpense,
      netCashFlow,
      topExpenseCategory,
      sortedExpenses,
      sortedIncomes,
    };
  }, [periodTransactions]);

  // Chart 1: Grafik Pemasukan (Berdasarkan Kategori)
  const incomeChartData = useMemo(() => {
    const labels =
      reportSummary.sortedIncomes.length > 0
        ? reportSummary.sortedIncomes.map(([cat]) => cat)
        : ['Belum Ada Data'];
    const data =
      reportSummary.sortedIncomes.length > 0
        ? reportSummary.sortedIncomes.map(([, val]) => val)
        : [0];

    return {
      labels,
      datasets: [
        {
          label: 'Pemasukan per Kategori',
          data,
          backgroundColor: '#16A34A',
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    };
  }, [reportSummary.sortedIncomes]);

  // Chart 2: Grafik Pengeluaran (Berdasarkan Kategori)
  const expenseChartData = useMemo(() => {
    const labels =
      reportSummary.sortedExpenses.length > 0
        ? reportSummary.sortedExpenses.map(([cat]) => cat)
        : ['Belum Ada Data'];
    const data =
      reportSummary.sortedExpenses.length > 0
        ? reportSummary.sortedExpenses.map(([, val]) => val)
        : [0];

    return {
      labels,
      datasets: [
        {
          label: 'Pengeluaran per Kategori',
          data,
          backgroundColor: '#DC2626',
          borderRadius: 6,
          maxBarThickness: 36,
        },
      ],
    };
  }, [reportSummary.sortedExpenses]);

  // Chart 3: Grafik Cash Flow (Pergerakan Arus Kas Bersih & Kumulatif per Tanggal/Bulan)
  const cashFlowChartData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    for (const tx of periodTransactions) {
      const key = period === 'this_year' ? tx.date.slice(0, 7) : tx.date;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      if (tx.type === 'income') grouped[key].income += Math.abs(tx.amount);
      else grouped[key].expense += Math.abs(tx.amount);
    }

    const keys = Object.keys(grouped).sort();
    const labels =
      keys.length > 0
        ? keys.map((k) => (k.length === 7 ? k : formatDateID(k)))
        : ['Tidak Ada Transaksi'];

    return {
      labels,
      datasets: [
        {
          label: 'Net Cash Flow',
          data:
            keys.length > 0
              ? keys.map((k) => grouped[k].income - grouped[k].expense)
              : [0],
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.14)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        },
        {
          label: 'Pemasukan',
          data: keys.length > 0 ? keys.map((k) => grouped[k].income) : [0],
          borderColor: '#16A34A',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: 'Pengeluaran',
          data: keys.length > 0 ? keys.map((k) => grouped[k].expense) : [0],
          borderColor: '#DC2626',
          backgroundColor: 'transparent',
          borderDash: [4, 4],
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    };
  }, [periodTransactions, period]);

  const chartOptions = useMemo(
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
            font: { size: 12 },
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
              if (Math.abs(num) >= 1000000)
                return `${(num / 1000000).toFixed(1).replace('.0', '')}jt`;
              if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(0)}rb`;
              return String(val);
            },
          },
        },
      },
    }),
    [isDark, settings.currency]
  );

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Tanggal',
      'Jenis',
      'Kategori',
      'Metode Pembayaran',
      'Nominal Bertanda',
      'Catatan',
    ];
    const rows = periodTransactions.map((tx) => {
      const signed = tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount);
      const safeNote = `"${(tx.note || '').replace(/"/g, '""')}"`;
      return [
        tx.id,
        tx.date,
        tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        tx.category,
        tx.paymentMethod,
        signed,
        safeNote,
      ].join(',');
    });

    const summaryRows = [
      '',
      'RINGKASAN LAPORAN KEUANGAN',
      `Periode,${dateBounds.start} s/d ${dateBounds.end}`,
      `Total Pemasukan,${reportSummary.totalIncome}`,
      `Total Pengeluaran,${reportSummary.totalExpense}`,
      `Net Cash Flow,${reportSummary.netCashFlow}`,
    ];

    const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Keuangan_SakuKu_${dateBounds.start}_${dateBounds.end}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Laporan CSV berhasil diunduh',
      description: `${periodTransactions.length} baris transaksi diekspor ke CSV.`,
    });
  };

  // Print Report Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Export/Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Laporan Keuangan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Periode analisis: {formatDateID(dateBounds.start, 'long')} –{' '}
            {formatDateID(dateBounds.end, 'long')}
          </p>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#2563EB]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>Print Laporan</span>
          </button>
        </div>
      </div>

      {/* Period Filter Controls */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 no-print">
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'today', label: 'Hari ini' },
              { id: 'this_week', label: 'Minggu ini' },
              { id: 'this_month', label: 'Bulan ini' },
              { id: 'last_month', label: 'Bulan lalu' },
              { id: 'this_year', label: 'Tahun ini' },
              { id: 'custom', label: 'Custom range' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPeriod(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                period === item.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Mulai:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono-num"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-500">Selesai:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono-num"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4 Report Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Pemasukan</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono-num text-[#16A34A]">
            {formatCurrency(reportSummary.totalIncome, settings.currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-[#DC2626]" />
          </div>
          <p className="mt-2 text-2xl font-bold font-mono-num text-[#DC2626]">
            {formatCurrency(reportSummary.totalExpense, settings.currency)}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Net Cash Flow</span>
            <Scale className="w-4 h-4 text-[#2563EB]" />
          </div>
          <p
            className={`mt-2 text-2xl font-bold font-mono-num ${
              reportSummary.netCashFlow >= 0
                ? 'text-slate-900 dark:text-slate-100'
                : 'text-[#DC2626]'
            }`}
          >
            {formatCurrency(reportSummary.netCashFlow, settings.currency, {
              showPositiveSign: true,
            })}
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Kategori Pengeluaran Terbesar</span>
            <PieChart className="w-4 h-4 text-amber-500" />
          </div>
          {reportSummary.topExpenseCategory ? (
            <div className="mt-2">
              <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                {reportSummary.topExpenseCategory.name}
              </p>
              <p className="text-xs font-mono-num text-[#DC2626] mt-0.5">
                {formatCurrency(reportSummary.topExpenseCategory.amount, settings.currency)}{' '}
                ({formatPercent(reportSummary.topExpenseCategory.percent, 1)})
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-400">
              Belum ada pengeluaran
            </p>
          )}
        </div>
      </div>

      {/* Grafik Cash Flow */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Grafik Cash Flow ({dateBounds.label})
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tren selisih bersih (Net Cash Flow), pemasukan, dan pengeluaran pada periode terpilih
          </p>
        </div>
        <div className="h-64">
          <Line data={cashFlowChartData} options={chartOptions} />
        </div>
      </div>

      {/* Grafik Pemasukan & Grafik Pengeluaran */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Grafik Pemasukan Berdasarkan Kategori
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rincian sumber pendapatan pada periode terpilih
            </p>
          </div>
          <div className="h-60">
            <Bar data={incomeChartData} options={chartOptions} />
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Grafik Pengeluaran Berdasarkan Kategori
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Distribusi beban pengeluaran pada periode terpilih
            </p>
          </div>
          <div className="h-60">
            <Bar data={expenseChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Rincian Tabel Kategori Pengeluaran & Pemasukan */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Rincian Pengeluaran per Kategori
        </h3>
        {reportSummary.sortedExpenses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-4">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Total Nominal</th>
                  <th className="py-2.5 pl-4 text-right">Proporsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reportSummary.sortedExpenses.map(([cat, amt]) => {
                  const pct =
                    reportSummary.totalExpense > 0
                      ? (amt / reportSummary.totalExpense) * 100
                      : 0;
                  return (
                    <tr key={cat}>
                      <td className="py-3 pr-4 font-medium text-slate-800 dark:text-slate-200">
                        {cat}
                      </td>
                      <td className="py-3 px-4 text-right font-mono-num font-semibold text-[#DC2626]">
                        {formatCurrency(amt, settings.currency)}
                      </td>
                      <td className="py-3 pl-4 text-right font-mono-num text-xs text-slate-600 dark:text-slate-400">
                        {formatPercent(pct, 1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 py-4">
            Tidak ada transaksi pengeluaran pada periode ini.
          </p>
        )}
      </div>
    </div>
  );
};
