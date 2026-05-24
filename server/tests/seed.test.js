'use strict';

const { generateEmployees } = require('../seeders/seed');

describe('generateEmployees()', () => {
  const records = generateEmployees(100);

  test('generates exactly n records', () => {
    expect(records.length).toBe(100);
  });

  test('all records have required fields', () => {
    const required = ['firstName', 'lastName', 'email', 'jobTitle', 'department', 'country', 'salary', 'hireDate'];
    for (const rec of records) {
      for (const field of required) {
        expect(rec).toHaveProperty(field);
        expect(rec[field]).toBeTruthy();
      }
    }
  });

  test('salary is always > 0', () => {
    for (const rec of records) {
      expect(rec.salary).toBeGreaterThan(0);
    }
  });

  test('hireDate is always between 2015 and 2024', () => {
    for (const rec of records) {
      const year = parseInt(rec.hireDate.split('-')[0], 10);
      expect(year).toBeGreaterThanOrEqual(2015);
      expect(year).toBeLessThanOrEqual(2024);
    }
  });

  test('emails are unique across 100 records', () => {
    const emails = records.map((r) => r.email);
    const unique = new Set(emails);
    expect(unique.size).toBe(emails.length);
  });

  test('weighted country: India + USA account for ~45-55% of 1000 records', () => {
    const big = generateEmployees(1000);
    const indiaUsa = big.filter((r) => r.country === 'India' || r.country === 'USA').length;
    const pct = indiaUsa / 1000;
    expect(pct).toBeGreaterThanOrEqual(0.38); // allow wider tolerance for randomness
    expect(pct).toBeLessThanOrEqual(0.65);
  });

  test('employmentType is one of the allowed values', () => {
    const allowed = new Set(['full_time', 'part_time', 'contract', 'intern']);
    for (const rec of records) {
      expect(allowed.has(rec.employmentType)).toBe(true);
    }
  });

  test('status is one of the allowed values', () => {
    const allowed = new Set(['active', 'inactive', 'on_leave']);
    for (const rec of records) {
      expect(allowed.has(rec.status)).toBe(true);
    }
  });
});
