import React, { useMemo, useState } from 'react';
import {
  Plus,
  Target,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { FinancialGoal } from '../types/finance';
import {
  formatCurrency,
  formatDateID,
  formatNumberInput,
  formatPercent,
  getTodayDateString,
  parseNumberInput,
} from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

const GOAL_PRESETS = [
  'Dana Darurat',
  'Liburan',
  'Membeli Laptop',
  'Membeli Kendaraan',
  'Tabungan Rumah',
];

export const GoalsView: React.FC = () => {
  const {
    goals,
    settings,
    addGoal,
    updateGoal,
    deleteGoal,
    addGoalProgress,
    addTransaction,
  } = useFinance();

  // Add/Edit Goal Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [name, setName] = useState('');
  const [targetStr, setTargetStr] = useState('');
  const [currentStr, setCurrentStr] = useState('');
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  // Quick Top-up Modal State
  const [topUpGoal, setTopUpGoal] = useState<FinancialGoal | null>(null);
  const [topUpAmountStr, setTopUpAmountStr] = useState('');
  const [recordAsTx, setRecordAsTx] = useState(false);

  // Delete Confirmation State
  const [goalToDelete, setGoalToDelete] = useState<FinancialGoal | null>(null);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;
    const completedCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;
    return { totalTarget, totalSaved, overallProgress, completedCount };
  }, [goals]);

  const openCreateModal = (presetName?: string) => {
    setEditingGoal(null);
    setName(presetName || '');
    setTargetStr('');
    setCurrentStr('0');
    setDeadline('2026-12-31');
    setNote('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (goal: FinancialGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetStr(formatNumberInput(goal.targetAmount));
    setCurrentStr(formatNumberInput(goal.currentAmount));
    setDeadline(goal.deadline);
    setNote(goal.note || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmount = parseNumberInput(targetStr);
    const currentAmount = parseNumberInput(currentStr);

    if (!name.trim()) {
      setFormError('Nama target wajib diisi.');
      return;
    }
    if (targetAmount <= 0) {
      setFormError('Target nominal harus lebih dari 0.');
      return;
    }
    if (!deadline) {
      setFormError('Tanggal deadline wajib diisi.');
      return;
    }

    const payload = {
      name: name.trim(),
      targetAmount,
      currentAmount,
      deadline,
      note: note.trim(),
    };

    if (editingGoal) {
      updateGoal(editingGoal.id, payload);
    } else {
      addGoal(payload);
    }
    setIsModalOpen(false);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topUpGoal) return;
    const delta = parseNumberInput(topUpAmountStr);
    if (delta <= 0) return;

    addGoalProgress(topUpGoal.id, delta);

    if (recordAsTx) {
      addTransaction({
        type: 'expense',
        amount: delta,
        category: 'Lainnya',
        date: getTodayDateString(),
        paymentMethod: 'Bank',
        note: `Tabungan Target: ${topUpGoal.name}`,
      });
    }

    setTopUpGoal(null);
    setTopUpAmountStr('');
    setRecordAsTx(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Target Keuangan (Financial Goals)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Rencanakan dan pantau progres tabungan untuk impian serta dana darurat Anda
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Target Baru</span>
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
          Ide Target Cepat:
        </span>
        {GOAL_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => openCreateModal(preset)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors whitespace-nowrap"
          >
            + {preset}
          </button>
        ))}
      </div>

      {/* Overall Goals Summary Banner */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Nominal Terkumpul
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-num text-[#16A34A]">
              {formatCurrency(summary.totalSaved, settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Target Keseluruhan
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-num text-slate-900 dark:text-slate-100">
              {formatCurrency(summary.totalTarget, settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Target Tercapai
            </p>
            <p className="mt-1 text-2xl font-bold font-mono-num text-[#2563EB]">
              {summary.completedCount} / {goals.length} Target
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Akumulasi Pencapaian Seluruh Target
            </span>
            <span className="font-mono-num font-bold text-slate-900 dark:text-slate-100">
              {formatPercent(summary.overallProgress, 1)}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[#2563EB] transition-all duration-300"
              style={{ width: `${Math.min(100, summary.overallProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const pct =
              goal.targetAmount > 0
                ? (goal.currentAmount / goal.targetAmount) * 100
                : 0;
            const isCompleted = pct >= 100;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {goal.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target waktu: <span className="font-mono-num">{formatDateID(goal.deadline)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditModal(goal)}
                        aria-label={`Edit target ${goal.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        aria-label={`Hapus target ${goal.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {goal.note && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                      {goal.note}
                    </p>
                  )}

                  {/* Details Matching Prompt Example */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Target:</span>
                      <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                        {formatCurrency(goal.targetAmount, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Terkumpul:</span>
                      <span className="font-mono-num font-semibold text-[#16A34A]">
                        {formatCurrency(goal.currentAmount, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Kekurangan:</span>
                      <span className="font-mono-num font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(remaining, settings.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-slate-500 dark:text-slate-400">Progress:</span>
                      <span
                        className={`font-mono-num font-bold ${
                          isCompleted ? 'text-[#16A34A]' : 'text-[#2563EB]'
                        }`}
                      >
                        {formatPercent(pct, 1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Action */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? 'bg-[#16A34A]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16A34A]">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Target Tercapai!</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Terus menabung secara konsisten
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setTopUpGoal(goal);
                        setTopUpAmountStr('');
                        setRecordAsTx(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[#2563EB] dark:text-blue-400 text-xs font-semibold transition-colors whitespace-nowrap"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Tambah Dana</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Target className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Belum ada target keuangan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Mulai rencanakan Dana Darurat, Liburan, atau pembelian aset impian Anda dengan target yang terukur.
          </p>
          <button
            type="button"
            onClick={() => openCreateModal('Dana Darurat')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Target Pertama</span>
          </button>
        </div>
      )}

      {/* Modal Add / Edit Goal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {editingGoal ? 'Edit Target Keuangan' : 'Buat Target Keuangan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#DC2626] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nama Target <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Dana Darurat, Membeli Laptop"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Target Nominal ({settings.currency}) <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={targetStr}
                    onChange={(e) => setTargetStr(formatNumberInput(e.target.value))}
                    placeholder="20.000.000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono-num font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Nominal Terkumpul ({settings.currency})
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={currentStr}
                    onChange={(e) => setCurrentStr(formatNumberInput(e.target.value))}
                    placeholder="0"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono-num font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Target Tanggal Tercapai (Deadline) <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-mono-num bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Keterangan singkat target Anda"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Top-Up Modal */}
      {topUpGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Tambah Tabungan: {topUpGoal.name}
              </h3>
              <button
                type="button"
                onClick={() => setTopUpGoal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Terkumpul saat ini:</span>
                  <span className="font-mono-num font-semibold text-[#16A34A]">
                    {formatCurrency(topUpGoal.currentAmount, settings.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target nominal:</span>
                  <span className="font-mono-num font-semibold text-slate-900 dark:text-slate-100">
                    {formatCurrency(topUpGoal.targetAmount, settings.currency)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                  Nominal Tambahan Tabungan ({settings.currency})
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={topUpAmountStr}
                  onChange={(e) => setTopUpAmountStr(formatNumberInput(e.target.value))}
                  placeholder="Contoh: 500.000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-base font-mono-num font-semibold bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
                  autoFocus
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={recordAsTx}
                  onChange={(e) => setRecordAsTx(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span>Catat juga sebagai transaksi pengeluaran hari ini</span>
              </label>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTopUpGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16A34A] hover:bg-green-700"
                >
                  Tambahkan Dana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Goal Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(goalToDelete)}
        title="Hapus Target Keuangan?"
        description={
          goalToDelete
            ? `Apakah Anda yakin ingin menghapus target "${goalToDelete.name}"?`
            : ''
        }
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          if (goalToDelete) {
            deleteGoal(goalToDelete.id);
            setGoalToDelete(null);
          }
        }}
        onCancel={() => setGoalToDelete(null)}
      />
    </div>
  );
};
