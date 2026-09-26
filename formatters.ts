import { CurrencyCode, Transaction } from '../types/finance';

const CURRENCY_CONFIG: Record<
  CurrencyCode,
  { symbol: string; locale: string; fractionDigits: number }
> = {
  IDR: { symbol: 'Rp', locale: 'id-ID', fractionDigits: 0 },
  USD: { symbol: '$', locale: 'en-US', fractionDigits: 2 },
  EUR: { symbol: '€', locale: 'de-DE', fractionDigits: 2 },
  SGD: { symbol: 'S$', locale: 'en-SG', fractionDigits: 2 },
  MYR: { symbol: 'RM', locale: 'ms-MY', fractionDigits: 2 },
};

/**
 * Formats a number in Indonesian currency format, e.g. "Rp 8.500.000" or "-Rp 3.500.000"
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'IDR',
  options?: { showPositiveSign?: boolean; forceSigned?: boolean }
): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.IDR;
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));

  const formattedNumber = new Intl.NumberFormat(config.locale, {
    minimumFractionDigits: config.fractionDigits,
    maximumFractionDigits: config.fractionDigits,
  }).format(absVal);

  const prefix = isNegative
    ? `-${config.symbol} `
    : options?.showPositiveSign && absVal > 0
      ? `+${config.symbol} `
      : `${config.symbol} `;

  return `${prefix}${formattedNumber}`;
}

/**
 * Returns the internal signed value of a transaction:
 * expense -> negative (-amount)
 * income -> positive (+amount)
 */
export function getSignedTransactionAmount(tx: Pick<Transaction, 'type' | 'amount'>): number {
  const cleanAmount = Math.abs(Number(tx.amount) || 0);
  return tx.type === 'expense' ? -cleanAmount : cleanAmount;
}

/**
 * Formats percentage using Indonesian comma notation, e.g., 67.5 -> "67,5%"
 */
export function formatPercent(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return '0%';
  const rounded = Number(value.toFixed(decimals));
  return `${rounded.toString().replace('.', ',')}%`;
}

/**
 * Formats YYYY-MM-DD date string to readable Indonesian date, e.g. "26 Sep 2026"
 */
export function formatDateID(dateStr: string, style: 'short' | 'long' = 'short'): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Returns today's date in YYYY-MM-DD local format
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats integer string with dot thousand separators for input display
 */
export function formatNumberInput(value: string | number): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(Number(digits));
}

export function parseNumberInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
