import { formatSalary, formatDate } from '../utils/formatters';

describe('formatSalary', () => {
  it('formats USD amount with two decimal places', () => {
    expect(formatSalary(50000, 'USD')).toBe('$50,000.00');
  });

  it('formats GBP amount with currency symbol', () => {
    expect(formatSalary(75000, 'GBP')).toBe('£75,000.00');
  });

  it('defaults to USD when currency is omitted', () => {
    expect(formatSalary(10000)).toBe('$10,000.00');
  });

  it('returns — for null', () => {
    expect(formatSalary(null)).toBe('—');
  });

  it('returns — for undefined', () => {
    expect(formatSalary(undefined)).toBe('—');
  });
});

describe('formatDate', () => {
  it('formats a YYYY-MM-DD string to "MMM D, YYYY" format', () => {
    expect(formatDate('2023-04-15')).toBe('Apr 15, 2023');
  });

  it('does not shift date due to UTC timezone offset', () => {
    // Date parsed as local, not UTC midnight → no off-by-one-day error
    expect(formatDate('2020-01-01')).toBe('Jan 1, 2020');
  });

  it('returns — for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns — for empty string', () => {
    expect(formatDate('')).toBe('—');
  });
});
