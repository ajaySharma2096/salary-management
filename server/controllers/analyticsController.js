'use strict';

const { fn, col, literal, Op } = require('sequelize');
const { Employee } = require('../models');

// Helper: compute median from a sorted numeric array
function computeMedian(sortedValues) {
  const n = sortedValues.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  return n % 2 === 0
    ? (parseFloat(sortedValues[mid - 1]) + parseFloat(sortedValues[mid])) / 2
    : parseFloat(sortedValues[mid]);
}

async function salaryByCountry(req, res, next) {
  try {
    const where = {};
    if (req.query.country) where.country = req.query.country;

    // Aggregate stats per country
    const rows = await Employee.findAll({
      attributes: [
        'country',
        [fn('MIN', col('salary')), 'minSalary'],
        [fn('MAX', col('salary')), 'maxSalary'],
        [fn('AVG', col('salary')), 'avgSalary'],
        [fn('COUNT', col('id')), 'employeeCount'],
      ],
      where,
      group: ['country'],
      order: [['country', 'ASC']],
      raw: true,
    });

    // Fetch all (country, salary) pairs sorted for median computation
    const allSalaries = await Employee.findAll({
      attributes: ['country', 'salary'],
      where,
      order: [
        ['country', 'ASC'],
        ['salary', 'ASC'],
      ],
      raw: true,
    });

    // Group salaries by country
    const salariesByCountry = {};
    for (const row of allSalaries) {
      if (!salariesByCountry[row.country]) salariesByCountry[row.country] = [];
      salariesByCountry[row.country].push(row.salary);
    }

    const result = rows.map((row) => ({
      country: row.country,
      minSalary: parseFloat(row.minSalary),
      maxSalary: parseFloat(row.maxSalary),
      avgSalary: parseFloat(parseFloat(row.avgSalary).toFixed(2)),
      medianSalary: computeMedian(salariesByCountry[row.country] || []),
      employeeCount: parseInt(row.employeeCount, 10),
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function salaryByJobTitle(req, res, next) {
  try {
    const { country, jobTitle } = req.query;

    const where = { country };
    if (jobTitle) where.jobTitle = jobTitle;

    const rows = await Employee.findAll({
      attributes: [
        'jobTitle',
        'country',
        [fn('MIN', col('salary')), 'minSalary'],
        [fn('MAX', col('salary')), 'maxSalary'],
        [fn('AVG', col('salary')), 'avgSalary'],
        [fn('COUNT', col('id')), 'employeeCount'],
      ],
      where,
      group: ['jobTitle', 'country'],
      order: [[literal('avgSalary'), 'DESC']],
      raw: true,
    });

    const result = rows.map((row) => ({
      jobTitle: row.jobTitle,
      country: row.country,
      minSalary: parseFloat(row.minSalary),
      maxSalary: parseFloat(row.maxSalary),
      avgSalary: parseFloat(parseFloat(row.avgSalary).toFixed(2)),
      employeeCount: parseInt(row.employeeCount, 10),
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function salaryDistribution(req, res, next) {
  try {
    const where = {};
    if (req.query.country) where.country = req.query.country;

    const employees = await Employee.findAll({
      attributes: ['salary'],
      where,
      raw: true,
    });

    const buckets = [
      { range: '0-30000', min: 0, max: 30000, count: 0 },
      { range: '30000-60000', min: 30000, max: 60000, count: 0 },
      { range: '60000-100000', min: 60000, max: 100000, count: 0 },
      { range: '100000-150000', min: 100000, max: 150000, count: 0 },
      { range: '150000+', min: 150000, max: Infinity, count: 0 },
    ];

    const total = employees.length;

    for (const emp of employees) {
      const salary = parseFloat(emp.salary);
      for (const bucket of buckets) {
        if (salary >= bucket.min && salary < bucket.max) {
          bucket.count++;
          break;
        }
      }
    }

    const result = buckets.map(({ range, count }) => ({
      range,
      count,
      percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(2)) : 0,
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function topEarners(req, res, next) {
  try {
    let limit = parseInt(req.query.limit, 10) || 10;
    if (limit > 50) limit = 50;

    const where = {};
    if (req.query.country) where.country = req.query.country;
    if (req.query.department) where.department = req.query.department;

    const employees = await Employee.findAll({
      attributes: ['id', 'firstName', 'lastName', 'jobTitle', 'department', 'country', 'salary', 'currency'],
      where,
      order: [['salary', 'DESC']],
      limit,
      raw: true,
    });

    const result = employees.map((emp) => ({
      id: emp.id,
      fullName: `${emp.firstName} ${emp.lastName}`,
      jobTitle: emp.jobTitle,
      department: emp.department,
      country: emp.country,
      salary: parseFloat(emp.salary),
      currency: emp.currency,
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

async function departmentSummary(req, res, next) {
  try {
    const rows = await Employee.findAll({
      attributes: [
        'department',
        [fn('COUNT', col('id')), 'employeeCount'],
        [fn('AVG', col('salary')), 'avgSalary'],
        [fn('SUM', col('salary')), 'totalPayroll'],
      ],
      where: { status: 'active' },
      group: ['department'],
      order: [[literal('totalPayroll'), 'DESC']],
      raw: true,
    });

    const result = rows.map((row) => ({
      department: row.department,
      employeeCount: parseInt(row.employeeCount, 10),
      avgSalary: parseFloat(parseFloat(row.avgSalary).toFixed(2)),
      totalPayroll: parseFloat(row.totalPayroll),
    }));

    return res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  salaryByCountry,
  salaryByJobTitle,
  salaryDistribution,
  topEarners,
  departmentSummary,
};
