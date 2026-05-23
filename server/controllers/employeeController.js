'use strict';

const { Op } = require('sequelize');
const { Employee } = require('../models');

const ALLOWED_SORT_FIELDS = new Set([
  'id', 'firstName', 'lastName', 'email', 'jobTitle', 'department',
  'country', 'salary', 'hireDate', 'createdAt', 'updatedAt', 'status',
]);

async function listEmployees(req, res, next) {
  try {
    let page = parseInt(req.query.page, 10) || 1;
    if (page < 1) {
      return res.status(400).json({ error: 'page must be >= 1' });
    }
    let limit = parseInt(req.query.limit, 10) || 20;
    if (limit > 100) limit = 100;

    const { search, country, department, jobTitle, status } = req.query;
    let sortBy = req.query.sortBy || 'createdAt';
    if (!ALLOWED_SORT_FIELDS.has(sortBy)) sortBy = 'createdAt';
    const sortOrder = req.query.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (country) where.country = country;
    if (department) where.department = department;
    if (jobTitle) where.jobTitle = jobTitle;
    if (status) where.status = status;

    const offset = (page - 1) * limit;

    const { count, rows } = await Employee.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    const data = rows.map((emp) => ({
      ...emp.toJSON(),
      fullName: emp.fullName,
    }));

    return res.json({
      data,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function getEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID must be an integer' });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    return res.json({ ...employee.toJSON(), fullName: employee.fullName });
  } catch (err) {
    next(err);
  }
}

async function createEmployee(req, res, next) {
  try {
    const employee = await Employee.create(req.body);
    return res.status(201).json({ ...employee.toJSON(), fullName: employee.fullName });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }
    next(err);
  }
}

async function updateEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID must be an integer' });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.update(req.body);
    return res.json({ ...employee.toJSON(), fullName: employee.fullName });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'An employee with this email already exists' });
    }
    next(err);
  }
}

async function deleteEmployee(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'ID must be an integer' });
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.destroy();
    return res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee };
