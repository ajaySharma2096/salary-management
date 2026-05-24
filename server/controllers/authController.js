'use strict';

const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');

async function signup(req, res, next) {
  try {
    const { email, password, firstName, lastName } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    await User.create({ email, password, firstName, lastName });

    return res.status(201).json({ message: 'Account created successfully' });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email, isActive: true } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
}

async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

module.exports = { signup, login, logout, me };
