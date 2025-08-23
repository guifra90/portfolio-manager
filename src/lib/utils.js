// src/lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Formattazione valute per il mercato italiano
export function formatCurrency(amount, options = {}) {
  const {
    currency = 'EUR',
    locale = 'it-IT',
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showCurrency = true,
    compact = false
  } = options;

  // Gestisci valori null, undefined o NaN
  if (amount == null || isNaN(amount)) {
    return showCurrency ? '€0,00' : '0,00';
  }

  const numericAmount = Number(amount);

  // Formattazione compatta per numeri grandi
  if (compact && Math.abs(numericAmount) >= 1000) {
    if (Math.abs(numericAmount) >= 1000000) {
      const millions = numericAmount / 1000000;
      const formatted = millions.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return showCurrency ? `€${formatted}M` : `${formatted}M`;
    } else if (Math.abs(numericAmount) >= 1000) {
      const thousands = numericAmount / 1000;
      const formatted = thousands.toLocaleString(locale, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
      });
      return showCurrency ? `€${formatted}K` : `${formatted}K`;
    }
  }

  // Formattazione standard
  const formatted = numericAmount.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
    currency,
    ...(showCurrency && { style: 'currency' })
  });

  return formatted;
}

// Formattazione percentuali
export function formatPercentage(value, options = {}) {
  const {
    locale = 'it-IT',
    minimumFractionDigits = 1,
    maximumFractionDigits = 2,
    showSign = false
  } = options;

  if (value == null || isNaN(value)) {
    return '0,0%';
  }

  const numericValue = Number(value);
  const percentage = numericValue * 100;

  const formatted = percentage.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });

  const sign = showSign && numericValue > 0 ? '+' : '';
  return `${sign}${formatted}%`;
}

// Formattazione numeri senza valuta
export function formatNumber(value, options = {}) {
  const {
    locale = 'it-IT',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (value == null || isNaN(value)) {
    return '0';
  }

  return Number(value).toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  });
}

// Helper per determinare il colore basato sul valore (positivo/negativo)
export function getValueColor(value, options = {}) {
  const { neutralColor = 'text-gray-900', positiveColor = 'text-green-600', negativeColor = 'text-red-600' } = options;
  
  if (value == null || value === 0) {
    return neutralColor;
  }
  
  return Number(value) >= 0 ? positiveColor : negativeColor;
}

// Componente per visualizzare valute con colore automatico
export function CurrencyDisplay({ value, className = '', compact = false, showSign = false, ...props }) {
  const colorClass = getValueColor(value);
  const sign = showSign && value > 0 ? '+' : '';
  
  return (
    <span className={cn(colorClass, className)} {...props}>
      {sign}{formatCurrency(value, { compact })}
    </span>
  );
}

// Componente per visualizzare percentuali con colore automatico
export function PercentageDisplay({ value, className = '', showSign = true, ...props }) {
  const colorClass = getValueColor(value);
  
  return (
    <span className={cn(colorClass, className)} {...props}>
      {formatPercentage(value, { showSign })}
    </span>
  );
}