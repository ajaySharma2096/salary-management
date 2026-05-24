'use strict';

const { query } = require('express-validator');

const salaryByJobTitleValidators = [
  query('country')
    .notEmpty()
    .withMessage('country query parameter is required')
    .trim(),
];

const topEarnersValidators = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be an integer between 1 and 50'),
];

module.exports = { salaryByJobTitleValidators, topEarnersValidators };
