/**
 * Formats a salary amount with currency symbol using Intl.NumberFormat.
 * @param {number} amount
 * @param {string} currency - ISO 4217 currency code, e.g. 'USD'
 * @returns {string}
 */
export const formatSalary = (amount, currency = 'USD') => {
  if (amount == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

/**
 * Formats a YYYY-MM-DD date string to locale date string.
 * Parses as local date to avoid UTC timezone offset issues.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return dateStr;
  const [year, month, day] = parts;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
