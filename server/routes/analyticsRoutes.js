'use strict';

const { Router } = require('express');
const {
  salaryByCountry,
  salaryByJobTitle,
  salaryDistribution,
  topEarners,
  departmentSummary,
} = require('../controllers/analyticsController');
const { salaryByJobTitleValidators, topEarnersValidators } = require('../validators/analyticsValidators');
const validate = require('../middlewares/validate');
const isAuthenticated = require('../middlewares/isAuthenticated');

const router = Router();

router.get('/salary-by-country', isAuthenticated, salaryByCountry);
router.get('/salary-by-job-title', isAuthenticated, salaryByJobTitleValidators, validate, salaryByJobTitle);
router.get('/salary-distribution', isAuthenticated, salaryDistribution);
router.get('/top-earners', isAuthenticated, topEarnersValidators, validate, topEarners);
router.get('/department-summary', isAuthenticated, departmentSummary);

module.exports = router;
