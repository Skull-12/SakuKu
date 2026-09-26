import React, { useEffect, useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  PaymentMethod,
  TransactionType,
} from '../types/finance';
import {
  formatCurrency,
  formatNumberInput,
  getTodayDateString,
  parseNumberInput,
} from '../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    isTxModalOpen,
    txModalData,
    closeTransactionModal,
    addTransaction,
    updateTransaction,
    settings,
  } = useFinance();

  const editingTx = txModalData?.transaction || null;

  const [type, setType] = useState<TransactionType>('expense');
  const [amountInput, setAmountInput] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{
    amount?: string;
    category?: string;
    date?: string;
  }>({});

  useEffect(() => {
    if (!isTxModalOpen) return;
    if (editingTx) {
      setType(editingTx.type);
      setAmountInput(formatNumberInput(Math.abs(editingTx.amount)));
      setCategory(editingTx.category);
      setDate(editingTx.date);
      setPaymentMethod(editingTx.paymentMethod);
      setNote(editingTx.note || '');
    } else {
      const initialType = txModalData?.defaultType || 'expense';
      setType(initialType);
      setAmountInput('');
      setCategory(initialType === 'expense' ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
      setDate(txModalData?.defaultDate || getTodayDateString());
      setPaymentMethod('Cash');
      setNote('');
    }
    setErrors({});
  }, [isTxModalOpen, editingTx, txModalData]);

  if (!isTxModalOpen) return null;

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const numericAmount = parseNumberInput(amountInput);
  const signedAmount = type === 'expense' ? -numericAmount : numericAmount;

  const handleTypeSwitch = (newType: TransactionType) => {
    setType(newType);
    const nextList = newType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    if (!nextList.includes(category as never)) {
      setCategory(nextList[0]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberInput(e.target.value);
    setAmountInput(formatted);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { amount?: string; category?: string; date?: string } = {};
    if (!amountInput.trim()) {
      newErrors.amount = 'Nominal wajib diisi.';
    } else if (numericAmount <= 0) {
      newErrors.amount = 'Nominal harus lebih dari 0.';
    }
    if (!category.trim()) {
      newErrors.category = 'Kategori wajib dipilih.';
    }
    if (!date.trim()) {
      newErrors.date = 'Tanggal wajib diisi.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      type,
      amount: numericAmount,
      category,
      date,
      paymentMethod,
      note: note.trim(),
    };

    if (editingTx) {
      updateTransaction(editingTx.id, payload);
    } else {
      addTransaction(payload);
    }
    closeTransactionModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2
            id="tx-modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            {editingTx ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
          </h2>
          <button
            type="button"
            onClick={closeTransactionModal}
            aria-label="Tutup form transaksi"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
          {/* Jenis Transaksi Toggle */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeSwitch('expense')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  type === 'expense'
                    ? 'bg-white dark:bg-slate-900 text-[#DC2626] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Pengeluaran</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch('income')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  type === 'income'
                    ? 'bg-white dark:bg-slate-900 text-[#16A34A] shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Pemasukan</span>
              </button>
            </div>
          </div>

          {/* Nominal Input + Internal Signed Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="tx-amount"
                className="text-xs font-medium text-slate-600 dark:text-slate-400"
              >
                Nominal ({settings.currency}) <span className="text-[#DC2626]">*</span>
              </label>
              <span
                className={`text-xs font-mono-num font-semibold ${
                  type === 'expense' ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                Nilai Internal:{' '}
                {numericAmount > 0
                  ? formatCurrency(signedAmount, settings.currency, {
                      showPositiveSign: true,
                    })
                  : type === 'expense'
                    ? '-Rp 0'
                    : '+Rp 0'}
              </span>
            </div>
            <div className="relative">
              <span
                className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono-num font-semibold select-none ${
                  type === 'expense' ? 'text-[#DC2626]' : 'text-[#16A34A]'
                }`}
              >
                {type === 'expense' ? '-Rp' : '+Rp'}
              </span>
              <input
                id="tx-amount"
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={handleAmountChange}
                placeholder="0"
                className={`w-full pl-14 pr-4 py-2.5 rounded-xl border text-base font-mono-num font-semibold bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  errors.amount
                    ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#DC2626]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.amount}</span>
              </p>
            )}
          </div>

          {/* Kategori & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-category"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Kategori <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  errors.category
                    ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                }`}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#DC2626]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.category}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Tanggal <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono-num bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 transition-all ${
                  errors.date
                    ? 'border-[#DC2626] focus:ring-[#DC2626]/20'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#2563EB] focus:ring-[#2563EB]/20'
                }`}
              />
              {errors.date && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#DC2626]">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.date}</span>
                </p>
              )}
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Metode Pembayaran
            </label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                    paymentMethod === method
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
            >
              Catatan
            </label>
            <input
              id="tx-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                type === 'expense'
                  ? 'Contoh: Makan siang bersama rekan kerja'
                  : 'Contoh: Gaji bulanan September'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={closeTransactionModal}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl shadow-xs transition-colors whitespace-nowrap"
            >
              {editingTx ? 'Simpan Perubahan' : 'Simpan Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
