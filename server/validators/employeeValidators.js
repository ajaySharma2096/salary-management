'use strict';

const { body, query } = require('express-validator');

const ALLOWED_EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const ALLOWED_STATUSES = ['active', 'inactive', 'on_leave'];

const createEmployeeValidators = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 100 }).withMessage('First name must be at most 100 characters')
    .trim(),
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters')
    .trim(),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),
  body('jobTitle')
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 150 }).withMessage('Job title must be at most 150 characters')
    .trim(),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isLength({ max: 100 }).withMessage('Department must be at most 100 characters')
    .trim(),
  body('country')
    .notEmpty().withMessage('Country is required')
    .isLength({ max: 100 }).withMessage('Country must be at most 100 characters')
    .trim(),
  body('salary')
    .notEmpty().withMessage('Salary is required')
    .isFloat({ min: 0 }).withMessage('Salary must be a non-negative number'),
  body('currency')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO 4217 code'),
  body('hireDate')
    .notEmpty().withMessage('Hire date is required')
    .isISO8601().withMessage('Hire date must be a valid date in YYYY-MM-DD format'),
  body('employmentType')
    .notEmpty().withMessage('Employment type is required')
    .isIn(ALLOWED_EMPLOYMENT_TYPES).withMessage(`Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}`),
  body('status')
    .optional({ nullable: true, checkFalsy: true })
    .isIn(ALLOWED_STATUSES).withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
];

const updateEmployeeValidators = [
  body('firstName')
    .optional()
    .notEmpty().withMessage('First name cannot be empty')
    .isLength({ max: 100 }).withMessage('First name must be at most 100 characters')
    .trim(),
  body('lastName')
    .optional()
    .notEmpty().withMessage('Last name cannot be empty')
    .isLength({ max: 100 }).withMessage('Last name must be at most 100 characters')
    .trim(),
  body('email')
    .optional({ nullable: true, checkFalsy: true })
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Invalid phone number format'),
  body('jobTitle')
    .optional()
    .notEmpty().withMessage('Job title cannot be empty')
    .isLength({ max: 150 })
    .trim(),
  body('department')
    .optional()
    .notEmpty().withMessage('Department cannot be empty')
    .isLength({ max: 100 })
    .trim(),
  body('country')
    .optional()
    .notEmpty().withMessage('Country cannot be empty')
    .isLength({ max: 100 })
    .trim(),
  body('salary')
    .optional()
    .isFloat({ min: 0 }).withMessage('Salary must be a non-negative number'),
  body('currency')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 3, max: 3 }).withMessage('Currency must be a 3-letter ISO 4217 code'),
  body('hireDate')
    .optional()
    .isISO8601().withMessage('Hire date must be a valid date in YYYY-MM-DD format'),
  body('employmentType')
    .optional()
    .isIn(ALLOWED_EMPLOYMENT_TYPES).withMessage(`Employment type must be one of: ${ALLOWED_EMPLOYMENT_TYPES.join(', ')}`),
  body('status')
    .optional()
    .isIn(ALLOWED_STATUSES).withMessage(`Status must be one of: ${ALLOWED_STATUSES.join(', ')}`),
  body().custom((value, { req }) => {
    const allowed = [
      'firstName', 'lastName', 'email', 'phone', 'jobTitle', 'department',
      'country', 'city', 'salary', 'currency', 'hireDate', 'employmentType', 'status',
    ];
    const provided = Object.keys(req.body).filter((k) => allowed.includes(k));
    if (provided.length === 0) {
      throw new Error('At least one field must be provided for update');
    }
    return true;
  }),
];

module.exports = { createEmployeeValidators, updateEmployeeValidators };
