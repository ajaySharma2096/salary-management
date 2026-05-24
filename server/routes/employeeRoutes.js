'use strict';

const { Router } = require('express');
const {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { createEmployeeValidators, updateEmployeeValidators } = require('../validators/employeeValidators');
const validate = require('../middlewares/validate');
const isAuthenticated = require('../middlewares/isAuthenticated');
const isAuthorized = require('../middlewares/isAuthorized');

const router = Router();

router.get('/', isAuthenticated, listEmployees);
router.get('/:id', isAuthenticated, getEmployee);
router.post('/', isAuthenticated, createEmployeeValidators, validate, createEmployee);
router.put('/:id', isAuthenticated, updateEmployeeValidators, validate, updateEmployee);
router.delete('/:id', isAuthenticated, isAuthorized('admin', 'hr_manager'), deleteEmployee);

module.exports = router;
