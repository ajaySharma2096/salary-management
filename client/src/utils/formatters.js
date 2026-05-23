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
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`;
  }
};

/**
 * Formats a YYYY-MM-DD date string to locale date string.
 * @param {string} dateStr
 * @returns {string}
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};
