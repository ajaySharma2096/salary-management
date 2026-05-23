'use strict';

const { Router } = require('express');
const { signup, login, logout, me } = require('../controllers/authController');
const { signupValidators, loginValidators } = require('../validators/authValidators');
const validate = require('../middlewares/validate');
const isAuthenticated = require('../middlewares/isAuthenticated');

const router = Router();

router.post('/signup', signupValidators, validate, signup);
router.post('/login', loginValidators, validate, login);
router.post('/logout', isAuthenticated, logout);
router.get('/me', isAuthenticated, me);

module.exports = router;
