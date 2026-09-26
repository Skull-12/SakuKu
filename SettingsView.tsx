import React, { useRef, useState } from 'react';
import {
  User,
  Sun,
  Moon,
  Bell,
  Download,
  Upload,
  Trash2,
  Database,
  Check,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { CurrencyCode } from '../types/finance';
import { ConfirmDialog } from './ConfirmDialog';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    exportAllData,
    importAllData,
    loadSampleTransactions,
    transactions,
    goals,
    addToast,
  } = useFinance();

  const [nameInput, setNameInput] = useState(settings.name);
  const [currencyInput, setCurrencyInput] = useState<CurrencyCode>(settings.currency);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name: nameInput.trim() || 'Pengguna SakuKu',
      currency: currencyInput,
    });
  };

  const handleExportJSON = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.download = `SakuKu_Backup_Data_${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      type: 'success',
      title: 'Seluruh data berhasil diekspor',
      description: 'File cadangan JSON telah diunduh ke perangkat Anda.',
    });
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        importAllData(content);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Profil & Pengaturan
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Sesuaikan profil, mata uang, preferensi tampilan, dan pencadangan data lokal Anda
        </p>
      </div>

      {/* Profil & Mata Uang */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-5">
          <User className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Profil Pengguna & Mata Uang
          </h3>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Nama Pengguna
              </label>
              <input
                id="settings-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Masukkan nama Anda"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label
                htmlFor="settings-currency"
                className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
              >
                Mata Uang Utama (Default: IDR / Rupiah)
              </label>
              <select
                id="settings-currency"
                value={currencyInput}
                onChange={(e) => setCurrencyInput(e.target.value as CurrencyCode)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#2563EB]"
              >
                <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                <option value="USD">USD — US Dollar ($)</option>
                <option value="SGD">SGD — Singapore Dollar (S$)</option>
                <option value="MYR">MYR — Malaysian Ringgit (RM)</option>
                <option value="EUR">EUR — Euro (€)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Profil</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tema Tampilan (Light / Dark Mode) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Tema Tampilan Aplikasi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Pilih antara mode terang (Light) atau mode gelap (Dark) sesuai kenyamanan mata Anda
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'light' })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                settings.theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Light Mode</span>
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                settings.theme === 'dark'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-blue-400" />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preferensi Notifikasi */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-4">
          <Bell className="w-5 h-5 text-[#2563EB]" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Preferensi Notifikasi
          </h3>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Peringatan Batas Anggaran (Budget Alert)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tampilkan notifikasi otomatis saat pengeluaran kategori mencapai 80% atau melebihi 100%
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.budgetAlert}
              onChange={(e) =>
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    budgetAlert: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
            />
          </label>

          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Pengingat Target Keuangan (Financial Goals)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tampilkan indikator progres dan target tabungan prioritas
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.goalReminder}
              onChange={(e) =>
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    goalReminder: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
            />
          </label>

          <label className="py-3.5 flex items-center justify-between gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Pengingat Pencatatan Harian
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bantu jaga konsistensi mencatat transaksi setiap hari
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.notifications.dailyReminder}
              onChange={(e) =>
                updateSettings({
                  notifications: {
                    ...settings.notifications,
                    dailyReminder: e.target.checked,
                  },
                })
              }
              className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
            />
          </label>
        </div>
      </div>

      {/* Manajemen Data (Export, Import, Sample Data, Reset) */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Manajemen & Pencadangan Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Data disimpan secara aman di browser Anda (localStorage). Tersimpan:{' '}
                <strong className="font-mono-num">{transactions.length}</strong> transaksi &{' '}
                <strong className="font-mono-num">{goals.length}</strong> target.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export Data */}
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] bg-slate-50/60 dark:bg-slate-800/40 text-left transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Export Seluruh Data
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Unduh file cadangan (.json) ke perangkat
              </p>
            </div>
            <Download className="w-5 h-5 text-[#2563EB] shrink-0" />
          </button>

          {/* Import Data */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] bg-slate-50/60 dark:bg-slate-800/40 text-left transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Import Data
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pulihkan data dari file cadangan (.json)
              </p>
            </div>
            <Upload className="w-5 h-5 text-[#16A34A] shrink-0" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportFileChange}
            className="hidden"
          />

          {/* Muat Contoh Data Simulasi */}
          <button
            type="button"
            onClick={loadSampleTransactions}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] bg-slate-50/60 dark:bg-slate-800/40 text-left transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Muat Data Contoh Simulasi
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Isi dengan transaksi simulasi untuk mencoba grafik
              </p>
            </div>
            <Database className="w-5 h-5 text-amber-500 shrink-0" />
          </button>

          {/* Reset Seluruh Data */}
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center justify-between p-4 rounded-xl border border-red-200 dark:border-red-900/60 hover:bg-red-50/60 dark:hover:bg-red-950/30 text-left transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-[#DC2626]">
                Reset Seluruh Data
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">
                Hapus permanen semua transaksi & kembalikan awal
              </p>
            </div>
            <Trash2 className="w-5 h-5 text-[#DC2626] shrink-0" />
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Resetting Data */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Seluruh Data?"
        description="Seluruh catatan transaksi, target keuangan, dan konfigurasi yang tersimpan di browser ini akan dihapus secara permanen. Pastikan Anda sudah melakukan Export Data jika masih memerlukannya."
        confirmLabel="Ya, Reset Semua Data"
        cancelLabel="Batal"
        variant="danger"
        onConfirm={() => {
          resetAllData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
};
